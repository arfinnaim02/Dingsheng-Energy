import type {
  DealerPortalSettings,
  DealerPrice,
  PriceGroup,
  Product,
} from "@/data/site";
import { prisma } from "@/lib/prisma";

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function optionalString(value?: string) {
  const normalized = value?.trim();
  return normalized || null;
}

export async function enrichProductsWithDatabasePricing(
  products: Product[],
): Promise<Product[]> {
  if (!products.length) return products;

  const databaseProducts =
    await prisma.product.findMany({
      where: {
        slug: {
          in: products.map(
            (product) => product.slug,
          ),
        },
      },

      select: {
        slug: true,

        prices: {
          include: {
            priceGroup: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });

  const pricesByProduct = new Map<
    string,
    DealerPrice[]
  >();

  for (const product of databaseProducts) {
    pricesByProduct.set(
      product.slug,
      product.prices.map((price) => ({
        priceGroupSlug: price.priceGroup.slug,
        currency: price.currency,
        amount: Number(price.amount),
        minimumQty:
          price.minimumQty ?? undefined,
        leadTimeText:
          price.leadTimeText ?? undefined,
        note: price.note ?? undefined,
      })),
    );
  }

  return products.map((product) => ({
    ...product,
    dealerPrices:
      pricesByProduct.get(product.slug) ?? [],
  }));
}

export async function getDatabasePriceGroups(
  activeOnly: boolean,
): Promise<PriceGroup[]> {
  const groups =
    await prisma.priceGroup.findMany({
      where: activeOnly
        ? {
            active: true,
          }
        : undefined,

      orderBy: {
        name: "asc",
      },
    });

  return groups.map((group) => ({
    slug: group.slug,
    name: group.name,
    description:
      group.description ?? undefined,
    active: group.active,
  }));
}

export async function updateDatabasePricing(
  input: {
    priceGroups: PriceGroup[];

    dealerPortal:
      DealerPortalSettings;

    productPrices: Record<
      string,
      DealerPrice[]
    >;
  },
) {
  const groups = input.priceGroups
    .map((group) => ({
      slug: slugify(
        group.slug || group.name,
      ),

      name: group.name.trim(),

      description: optionalString(
        group.description,
      ),

      active: group.active !== false,
    }))
    .filter(
      (group) => group.slug && group.name,
    );

  if (!groups.length) {
    throw new Error(
      "At least one price group is required.",
    );
  }

  const uniqueSlugs = new Set(
    groups.map((group) => group.slug),
  );

  if (uniqueSlugs.size !== groups.length) {
    throw new Error(
      "Price group slugs must be unique.",
    );
  }

  const normalizedNames = groups.map(
    (group) => group.name.toLowerCase(),
  );

  if (
    new Set(normalizedNames).size !==
    normalizedNames.length
  ) {
    throw new Error(
      "Price group names must be unique.",
    );
  }

  if (!groups.some((group) => group.active)) {
    throw new Error(
      "At least one active price group is required.",
    );
  }

  await prisma.$transaction(
    async (transaction) => {
      const submittedGroupSlugs =
        groups.map((group) => group.slug);

      const existingGroups =
        await transaction.priceGroup.findMany({
          include: {
            _count: {
              select: {
                dealers: true,
              },
            },
          },
        });

      const removedGroups =
        existingGroups.filter(
          (group) =>
            !submittedGroupSlugs.includes(
              group.slug,
            ),
        );

      const assignedRemovedGroup =
        removedGroups.find(
          (group) =>
            group._count.dealers > 0,
        );

      if (assignedRemovedGroup) {
        throw new Error(
          `Cannot delete "${assignedRemovedGroup.name}" because ${assignedRemovedGroup._count.dealers} dealer account(s) are assigned to it. Reassign those dealers first.`,
        );
      }

      if (removedGroups.length) {
        await transaction.priceGroup.deleteMany({
          where: {
            id: {
              in: removedGroups.map(
                (group) => group.id,
              ),
            },
          },
        });
      }

      await transaction.priceGroup.updateMany({
        where: {
          slug: {
            in: submittedGroupSlugs,
          },
        },

        data: {
          active: false,
        },
      });

      for (const group of groups) {
        await transaction.priceGroup.upsert({
          where: {
            slug: group.slug,
          },

          update: {
            name: group.name,
            description:
              group.description,
            active: group.active,
          },

          create: {
            slug: group.slug,
            name: group.name,
            description:
              group.description,
            active: group.active,
          },
        });
      }

      const [
        databaseGroups,
        databaseProducts,
      ] = await Promise.all([
        transaction.priceGroup.findMany({
          where: {
            slug: {
              in: groups.map(
                (group) => group.slug,
              ),
            },
          },

          select: {
            id: true,
            slug: true,
          },
        }),

        transaction.product.findMany({
          where: {
            slug: {
              in: Object.keys(
                input.productPrices,
              ),
            },
          },

          select: {
            id: true,
            slug: true,
          },
        }),
      ]);

      const groupIds = new Map(
        databaseGroups.map((group) => [
          group.slug,
          group.id,
        ]),
      );

      const productIds = new Map(
        databaseProducts.map(
          (product) => [
            product.slug,
            product.id,
          ],
        ),
      );

      /*
       * Rebuild the complete active price matrix. Existing
       * orders retain their captured OrderItem.unitPrice.
       */
      await transaction.productPrice.deleteMany(
        {},
      );

      const priceRecords: Array<{
        productId: string;
        priceGroupId: string;
        currency: string;
        amount: number;
        minimumQty: number | null;
        leadTimeText: string | null;
        note: string | null;
      }> = [];

      for (const [
        productSlug,
        prices,
      ] of Object.entries(
        input.productPrices,
      )) {
        const productId =
          productIds.get(productSlug);

        if (!productId) continue;

        for (const price of prices ?? []) {
          const priceGroupId = groupIds.get(
            price.priceGroupSlug,
          );

          if (!priceGroupId) continue;

          if (
            typeof price.amount !== "number" ||
            !Number.isFinite(price.amount) ||
            price.amount < 0
          ) {
            continue;
          }

          priceRecords.push({
            productId,
            priceGroupId,

            currency:
              typeof price.currency ===
                "string" &&
              /^[A-Za-z]{3}$/.test(
                price.currency,
              )
                ? price.currency.toUpperCase()
                : "USD",

            amount: price.amount,

            minimumQty:
              typeof price.minimumQty ===
                "number" &&
              Number.isFinite(
                price.minimumQty,
              ) &&
              price.minimumQty >= 1
                ? Math.floor(
                    price.minimumQty,
                  )
                : null,

            leadTimeText: optionalString(
              price.leadTimeText,
            ),

            note: optionalString(
              price.note,
            ),
          });
        }
      }

      if (priceRecords.length) {
        await transaction.productPrice.createMany(
          {
            data: priceRecords,
          },
        );
      }

      const activeGroup =
        groups.find(
          (group) =>
            group.active &&
            group.slug ===
              input.dealerPortal
                .demoPriceGroupSlug,
        ) ||
        groups.find(
          (group) => group.active,
        )!;

      await transaction.dealerPortalSetting.upsert(
        {
          where: {
            id: "default",
          },

          update: {
            demoPriceGroupSlug:
              activeGroup.slug,

            demoCompanyName:
              input.dealerPortal
                .demoCompanyName ||
              "Demo Dealer Company",

            demoContactName:
              input.dealerPortal
                .demoContactName ||
              "Demo User",
          },

          create: {
            id: "default",

            demoPriceGroupSlug:
              activeGroup.slug,

            demoCompanyName:
              input.dealerPortal
                .demoCompanyName ||
              "Demo Dealer Company",

            demoContactName:
              input.dealerPortal
                .demoContactName ||
              "Demo User",
          },
        },
      );
    },

    {
      maxWait: 10000,
      timeout: 20000,
    },
  );
}