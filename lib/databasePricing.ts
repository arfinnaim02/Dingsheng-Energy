import { Prisma } from "@prisma/client";

import type {
  DealerPortalSettings,
  DealerPrice,
  PriceGroup,
  Product,
} from "@/data/site";

import { prisma } from "@/lib/prisma";

export type ProductBasePricingInput = {
  basePrice?: number;
  baseCurrency?: string;
  minimumQty?: number;
  leadTimeText?: string;
  pricingNote?: string;
};

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

function normalizeCurrency(value?: string) {
  const currency = value?.trim().toUpperCase();

  return currency &&
    /^[A-Z]{3}$/.test(currency)
    ? currency
    : "USD";
}

function validOptionalNumber(
  value: unknown,
): number | undefined {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : undefined;
}

function normalizeDiscount(
  value: unknown,
): number {
  const discount =
    typeof value === "number"
      ? value
      : Number(value ?? 0);

  if (
    !Number.isFinite(discount) ||
    discount < 0 ||
    discount > 100
  ) {
    throw new Error(
      "Dealer discount must be between 0% and 100%.",
    );
  }

  return Math.round(discount * 100) / 100;
}

function calculateDealerPrice(
  basePrice: Prisma.Decimal,
  discountPercent: Prisma.Decimal,
) {
  return basePrice
    .mul(
      new Prisma.Decimal(100).minus(
        discountPercent,
      ),
    )
    .div(100)
    .toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP,
    );
}

export async function enrichProductsWithDatabasePricing(
  products: Product[],
): Promise<Product[]> {
  if (!products.length) {
    return products;
  }

  const [databaseProducts, priceGroups] =
    await Promise.all([
      prisma.product.findMany({
        where: {
          slug: {
            in: products.map(
              (product) => product.slug,
            ),
          },
        },

        select: {
          slug: true,

          basePrice: true,
          baseCurrency: true,
          minimumQty: true,
          leadTimeText: true,
          pricingNote: true,

          /*
           * Legacy ProductPrice rows remain available
           * during the migration period.
           *
           * They are used only when the product does
           * not yet have a base price.
           */
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
      }),

      prisma.priceGroup.findMany({
        orderBy: {
          name: "asc",
        },

        select: {
          slug: true,
          discountPercent: true,
          active: true,
        },
      }),
    ]);

  const databaseProductsBySlug =
    new Map(
      databaseProducts.map(
        (product) => [
          product.slug,
          product,
        ],
      ),
    );

  return products.map((product) => {
    const databaseProduct =
      databaseProductsBySlug.get(
        product.slug,
      );

    if (!databaseProduct) {
      return product;
    }

    let dealerPrices: DealerPrice[] = [];

    /*
     * NEW PRICING ENGINE
     *
     * Once a product has basePrice, its dealer
     * prices are calculated dynamically.
     */
    if (
      databaseProduct.basePrice !== null
    ) {
      dealerPrices = priceGroups.map(
        (group) => ({
          priceGroupSlug: group.slug,

          currency:
            databaseProduct.baseCurrency ||
            "USD",

          amount: calculateDealerPrice(
            databaseProduct.basePrice!,
            group.discountPercent,
          ).toNumber(),

          minimumQty:
            databaseProduct.minimumQty ??
            undefined,

          leadTimeText:
            databaseProduct.leadTimeText ??
            undefined,

          note:
            databaseProduct.pricingNote ??
            undefined,
        }),
      );
    } else {
      /*
       * LEGACY FALLBACK
       *
       * Existing dealer pricing continues working
       * until a base price is entered for this
       * product.
       */
      dealerPrices =
        databaseProduct.prices.map(
          (price) => ({
            priceGroupSlug:
              price.priceGroup.slug,

            currency: price.currency,

            amount:
              Number(price.amount),

            minimumQty:
              price.minimumQty ??
              undefined,

            leadTimeText:
              price.leadTimeText ??
              undefined,

            note:
              price.note ??
              undefined,
          }),
        );
    }

    return {
      ...product,

      basePrice:
        databaseProduct.basePrice !== null
          ? Number(
              databaseProduct.basePrice,
            )
          : undefined,

      baseCurrency:
        databaseProduct.baseCurrency ||
        "USD",

      minimumQty:
        databaseProduct.minimumQty ??
        undefined,

      leadTimeText:
        databaseProduct.leadTimeText ??
        undefined,

      pricingNote:
        databaseProduct.pricingNote ??
        undefined,

      dealerPrices,
    };
  });
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
      group.description ??
      undefined,

    discountPercent:
      Number(
        group.discountPercent,
      ),

    active: group.active,
  }));
}

export async function updateDatabasePricing(
  input: {
    priceGroups: PriceGroup[];

    dealerPortal:
      DealerPortalSettings;

    productBasePrices: Record<
      string,
      ProductBasePricingInput
    >;
  },
) {
  const groups = input.priceGroups
    .map((group) => ({
      slug: slugify(
        group.slug ||
          group.name,
      ),

      name:
        group.name.trim(),

      description:
        optionalString(
          group.description,
        ),

      discountPercent:
        normalizeDiscount(
          group.discountPercent,
        ),

      active:
        group.active !== false,
    }))
    .filter(
      (group) =>
        group.slug &&
        group.name,
    );

  if (!groups.length) {
    throw new Error(
      "At least one price group is required.",
    );
  }

  const uniqueSlugs =
    new Set(
      groups.map(
        (group) =>
          group.slug,
      ),
    );

  if (
    uniqueSlugs.size !==
    groups.length
  ) {
    throw new Error(
      "Price group slugs must be unique.",
    );
  }

  const normalizedNames =
    groups.map(
      (group) =>
        group.name.toLowerCase(),
    );

  if (
    new Set(
      normalizedNames,
    ).size !==
    normalizedNames.length
  ) {
    throw new Error(
      "Price group names must be unique.",
    );
  }

  if (
    !groups.some(
      (group) =>
        group.active,
    )
  ) {
    throw new Error(
      "At least one active price group is required.",
    );
  }

  await prisma.$transaction(
    async (transaction) => {
      const submittedGroupSlugs =
        groups.map(
          (group) =>
            group.slug,
        );

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
            group._count.dealers >
            0,
        );

      if (
        assignedRemovedGroup
      ) {
        throw new Error(
          `Cannot delete "${assignedRemovedGroup.name}" because ${assignedRemovedGroup._count.dealers} dealer account(s) are assigned to it. Reassign those dealers first.`,
        );
      }

      if (
        removedGroups.length
      ) {
        await transaction.priceGroup.deleteMany(
          {
            where: {
              id: {
                in: removedGroups.map(
                  (group) =>
                    group.id,
                ),
              },
            },
          },
        );
      }

      /*
       * Keep existing behaviour:
       * groups not submitted are not silently
       * left active.
       */
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

      for (
        const group of groups
      ) {
        await transaction.priceGroup.upsert({
          where: {
            slug:
              group.slug,
          },

          update: {
            name:
              group.name,

            description:
              group.description,

            discountPercent:
              group.discountPercent,

            active:
              group.active,
          },

          create: {
            slug:
              group.slug,

            name:
              group.name,

            description:
              group.description,

            discountPercent:
              group.discountPercent,

            active:
              group.active,
          },
        });
      }

      /*
       * BASE PRODUCT PRICES
       *
       * No ProductPrice matrix is rebuilt here.
       */
      for (
        const [
          productSlug,
          pricing,
        ] of Object.entries(
          input.productBasePrices ??
            {},
        )
      ) {
        const rawBasePrice =
          validOptionalNumber(
            pricing.basePrice,
          );

        if (
          rawBasePrice !==
            undefined &&
          rawBasePrice < 0
        ) {
          throw new Error(
            `Base price for "${productSlug}" cannot be negative.`,
          );
        }

        const rawMinimumQty =
          validOptionalNumber(
            pricing.minimumQty,
          );

        if (
          rawMinimumQty !==
            undefined &&
          rawMinimumQty < 1
        ) {
          throw new Error(
            `Minimum quantity for "${productSlug}" must be at least 1.`,
          );
        }

        await transaction.product.updateMany({
          where: {
            slug:
              productSlug,
          },

          data: {
            basePrice:
              rawBasePrice ===
              undefined
                ? null
                : new Prisma.Decimal(
                    rawBasePrice,
                  ),

            baseCurrency:
              normalizeCurrency(
                pricing.baseCurrency,
              ),

            minimumQty:
              rawMinimumQty ===
              undefined
                ? null
                : Math.floor(
                    rawMinimumQty,
                  ),

            leadTimeText:
              optionalString(
                pricing.leadTimeText,
              ),

            pricingNote:
              optionalString(
                pricing.pricingNote,
              ),
          },
        });
      }

      const activeGroup =
        groups.find(
          (group) =>
            group.active &&
            group.slug ===
              input.dealerPortal
                .demoPriceGroupSlug,
        ) ??
        groups.find(
          (group) =>
            group.active,
        )!;

      await transaction.dealerPortalSetting.upsert({
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
      });
    },

    {
      maxWait: 10000,
      timeout: 20000,
    },
  );
}