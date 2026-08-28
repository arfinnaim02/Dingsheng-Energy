import "server-only";

import type {
  ManagedProductImage,
  Product,
} from "@/data/site";

import {
  readCatalog,
  writeCatalog,
} from "@/lib/catalog";

import {
  replaceProductImages,
} from "@/lib/databaseProductImages";

import { prisma } from "@/lib/prisma";

export type ProductBulkAction =
  | "activate"
  | "hide"
  | "feature"
  | "unfeature"
  | "delete";

type BulkResult = {
  action: ProductBulkAction;
  affected: number;
  slugs: string[];
};

type SaveDatabaseProductOptions = {
  originalSlug?: string;
  managedImages?: ManagedProductImage[];
};

function uniqueStrings(values: string[]) {
  return [
    ...new Set(
      values
        .filter(
          (value) =>
            typeof value === "string",
        )
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

function cleanOptional(
  value: string | undefined,
) {
  const cleaned = value?.trim() ?? "";

  return cleaned || null;
}

function commercialMode(
  mode: Product["commercialMode"],
) {
  switch (mode) {
    case "information":
      return "INFORMATION_ONLY" as const;

    case "dealer-purchase":
      return "DEALER_PURCHASE" as const;

    case "dealer-purchase-rfq":
      return "DEALER_PURCHASE_AND_RFQ" as const;

    case "rfq":
    default:
      return "RFQ_ONLY" as const;
  }
}

function documentTitle(
  filePath: string,
) {
  try {
    const pathname = new URL(
      filePath,
      "http://localhost",
    ).pathname;

    const filename =
      pathname.split("/").pop() ||
      "Product document";

    return decodeURIComponent(filename)
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim();
  } catch {
    return "Product document";
  }
}

function validDealerPrices(
  product: Product,
) {
  return (
    product.dealerPrices ?? []
  ).filter(
    (price) =>
      typeof price.amount === "number" &&
      Number.isFinite(price.amount) &&
      price.amount >= 0,
  );
}

export async function saveDatabaseProduct(
  product: Product,
  options: SaveDatabaseProductOptions = {},
) {
  const categorySlugs =
    uniqueStrings(
      product.categorySlugs,
    );

  if (!categorySlugs.length) {
    throw new Error(
      "Select at least one product category.",
    );
  }

  const categories =
    await prisma.productCategory.findMany({
      where: {
        slug: {
          in: categorySlugs,
        },
      },

      select: {
        id: true,
        slug: true,
      },
    });

  const foundCategorySlugs =
    new Set(
      categories.map(
        (category) =>
          category.slug,
      ),
    );

  const missingCategorySlugs =
    categorySlugs.filter(
      (slug) =>
        !foundCategorySlugs.has(slug),
    );

  if (missingCategorySlugs.length) {
    throw new Error(
      `The following categories do not exist in Neon: ${missingCategorySlugs.join(
        ", ",
      )}.`,
    );
  }

  const requestedPrices =
    validDealerPrices(product);

  const requestedPriceGroupSlugs =
    uniqueStrings(
      requestedPrices.map(
        (price) =>
          price.priceGroupSlug,
      ),
    );

  const priceGroups =
    requestedPriceGroupSlugs.length
      ? await prisma.priceGroup.findMany({
          where: {
            slug: {
              in: requestedPriceGroupSlugs,
            },
          },

          select: {
            id: true,
            slug: true,
          },
        })
      : [];

  const priceGroupBySlug =
    new Map(
      priceGroups.map((group) => [
        group.slug,
        group,
      ]),
    );

  const originalSlug =
    options.originalSlug?.trim();

  const existingProduct =
    originalSlug
      ? await prisma.product.findUnique({
          where: {
            slug: originalSlug,
          },

          select: {
            id: true,
            slug: true,
          },
        })
      : await prisma.product.findUnique({
          where: {
            slug: product.slug,
          },

          select: {
            id: true,
            slug: true,
          },
        });

  if (
    originalSlug &&
    originalSlug !== product.slug
  ) {
    const slugCollision =
      await prisma.product.findUnique({
        where: {
          slug: product.slug,
        },

        select: {
          id: true,
        },
      });

    if (
      slugCollision &&
      slugCollision.id !==
        existingProduct?.id
    ) {
      throw new Error(
        `A database product with slug "${product.slug}" already exists.`,
      );
    }
  }

  const scalarData = {
    name: product.name.trim(),
    slug: product.slug,

    sku:
      cleanOptional(product.sku),

    subcategory:
      cleanOptional(
        product.subcategory,
      ),

    eyebrow:
      cleanOptional(product.eyebrow),

    summary:
      cleanOptional(product.summary),

    description:
      cleanOptional(
        product.description,
      ),

    primaryCategorySlug:
      cleanOptional(
        product.primaryCategorySlug,
      ),

    commercialMode:
      commercialMode(
        product.commercialMode,
      ),

    dealerPriceProtected:
      product.dealerPriceProtected,

    featured:
      product.featured === true,

    availability:
      cleanOptional(
        product.availability,
      ),

    unitLabel:
      cleanOptional(
        product.unitLabel,
      ) || "Unit",

    dealerCommercialDetails:
      cleanOptional(
        product.dealerCommercialDetails,
      ),

    relatedProductsJson:
      product.relatedProducts ?? [],

    isActive:
      product.active !== false,
  };

  const savedProduct =
    await prisma.$transaction(
      async (transaction) => {
        const databaseProduct =
          existingProduct
            ? await transaction.product.update({
                where: {
                  id: existingProduct.id,
                },

                data: scalarData,
              })
            : await transaction.product.create({
                data: scalarData,
              });

        /*
         * Clear replaceable child records before
         * recreating them from the submitted form.
         */
        await transaction.productCategoryAssignment.deleteMany(
          {
            where: {
              productId:
                databaseProduct.id,
            },
          },
        );

        await transaction.productSpecification.deleteMany(
          {
            where: {
              productId:
                databaseProduct.id,
            },
          },
        );

        await transaction.productApplication.deleteMany(
          {
            where: {
              productId:
                databaseProduct.id,
            },
          },
        );

        await transaction.productStandard.deleteMany(
          {
            where: {
              productId:
                databaseProduct.id,
            },
          },
        );

        await transaction.productDocument.deleteMany(
          {
            where: {
              productId:
                databaseProduct.id,
            },
          },
        );

        await transaction.productPrice.deleteMany(
          {
            where: {
              productId:
                databaseProduct.id,
            },
          },
        );

        /*
         * Category assignments
         */
        await transaction.productCategoryAssignment.createMany(
          {
            data: categories.map(
              (category) => ({
                productId:
                  databaseProduct.id,

                categoryId:
                  category.id,

                groupName:
                  cleanOptional(
                    product.categoryGroups?.[
                      category.slug
                    ],
                  ) ||
                  cleanOptional(
                    product.subcategory,
                  ),
              }),
            ),
          },
        );

        /*
         * Specifications
         */
        const specifications =
          product.specs
            .map(
              ([label, value]) => ({
                label:
                  label.trim(),

                value:
                  value.trim(),
              }),
            )
            .filter(
              (specification) =>
                specification.label ||
                specification.value,
            );

        if (specifications.length) {
          await transaction.productSpecification.createMany(
            {
              data: specifications.map(
                (
                  specification,
                  position,
                ) => ({
                  productId:
                    databaseProduct.id,

                  label:
                    specification.label,

                  value:
                    specification.value,

                  position,
                }),
              ),
            },
          );
        }

        /*
         * Applications
         */
        const applications =
          uniqueStrings(
            product.applications ?? [],
          );

        if (applications.length) {
          await transaction.productApplication.createMany(
            {
              data: applications.map(
                (label, position) => ({
                  productId:
                    databaseProduct.id,

                  label,
                  position,
                }),
              ),
            },
          );
        }

        /*
         * Standards
         */
        const standards =
          uniqueStrings(
            product.standards ?? [],
          );

        if (standards.length) {
          await transaction.productStandard.createMany(
            {
              data: standards.map(
                (label, position) => ({
                  productId:
                    databaseProduct.id,

                  label,
                  position,
                }),
              ),
            },
          );
        }

        /*
         * Public and dealer documents
         */
        const documents = [
          ...(
            product.publicDownloads ?? []
          )
            .map((filePath) =>
              filePath.trim(),
            )
            .filter(Boolean)
            .map((filePath) => ({
              filePath,
              dealerOnly: false,
            })),

          ...(
            product.dealerDownloads ?? []
          )
            .map((filePath) =>
              filePath.trim(),
            )
            .filter(Boolean)
            .map((filePath) => ({
              filePath,
              dealerOnly: true,
            })),
        ];

        if (documents.length) {
          await transaction.productDocument.createMany(
            {
              data: documents.map(
                (document) => ({
                  productId:
                    databaseProduct.id,

                  title:
                    documentTitle(
                      document.filePath,
                    ),

                  filePath:
                    document.filePath,

                  dealerOnly:
                    document.dealerOnly,
                }),
              ),
            },
          );
        }

        /*
         * Dealer pricing
         */
        const priceRows =
          requestedPrices.flatMap(
            (price) => {
              const priceGroup =
                priceGroupBySlug.get(
                  price.priceGroupSlug,
                );

              if (!priceGroup) {
                return [];
              }

              return [
                {
                  productId:
                    databaseProduct.id,

                  priceGroupId:
                    priceGroup.id,

                  currency:
                    price.currency
                      ?.trim()
                      .toUpperCase()
                      .slice(0, 10) ||
                    "USD",

                  amount:
                    price.amount!,

                  minimumQty:
                    typeof price.minimumQty ===
                      "number" &&
                    Number.isInteger(
                      price.minimumQty,
                    ) &&
                    price.minimumQty > 0
                      ? price.minimumQty
                      : null,

                  leadTimeText:
                    cleanOptional(
                      price.leadTimeText,
                    ),

                  note:
                    cleanOptional(
                      price.note,
                    ),
                },
              ];
            },
          );

        if (priceRows.length) {
          await transaction.productPrice.createMany(
            {
              data: priceRows,
            },
          );
        }

        return databaseProduct;
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );

  let imageResult:
    | Awaited<
        ReturnType<
          typeof replaceProductImages
        >
      >
    | undefined;

  /*
   * Images are replaced only when the new
   * managed-image interface submits an array.
   *
   * This prevents the older product editor from
   * destroying existing Cloudinary metadata.
   */
  if (
    Array.isArray(
      options.managedImages,
    )
  ) {
    imageResult =
      await replaceProductImages(
        savedProduct.id,
        options.managedImages,
      );
  }

  return {
    product: savedProduct,

    removedCloudinaryPublicIds:
      imageResult
        ?.removedCloudinaryPublicIds ??
      [],
  };
}

export async function deleteDatabaseProduct(
  slug: string,
) {
  const product =
    await prisma.product.findUnique({
      where: {
        slug,
      },

      select: {
        id: true,
        name: true,

        images: {
          select: {
            cloudinaryPublicId: true,
          },
        },

        _count: {
          select: {
            orderItems: true,
            rfqItems: true,
          },
        },
      },
    });

  if (!product) {
    return {
      deleted: false,

      cloudinaryPublicIds:
        [] as string[],
    };
  }

  if (
    product._count.orderItems > 0 ||
    product._count.rfqItems > 0
  ) {
    throw new Error(
      `Cannot permanently delete "${product.name}" because it is referenced by an order or RFQ. Hide the product instead.`,
    );
  }

  const cloudinaryPublicIds = [
    ...new Set(
      product.images
        .map(
          (image) =>
            image.cloudinaryPublicId,
        )
        .filter(
          (
            publicId,
          ): publicId is string =>
            Boolean(publicId),
        ),
    ),
  ];

  await prisma.product.delete({
    where: {
      id: product.id,
    },
  });

  return {
    deleted: true,
    cloudinaryPublicIds,
  };
}

export async function applyProductBulkAction(
  requestedSlugs: string[],
  action: ProductBulkAction,
): Promise<BulkResult> {
  const slugs =
    uniqueStrings(
      requestedSlugs,
    );

  if (!slugs.length) {
    throw new Error(
      "Select at least one product.",
    );
  }

  if (slugs.length > 200) {
    throw new Error(
      "A maximum of 200 products can be updated at once.",
    );
  }

  const catalog =
    await readCatalog();

  const catalogueProducts =
    catalog.products.filter(
      (product) =>
        slugs.includes(
          product.slug,
        ),
    );

  if (!catalogueProducts.length) {
    throw new Error(
      "None of the selected products were found.",
    );
  }

  const foundSlugs =
    catalogueProducts.map(
      (product) =>
        product.slug,
    );

  if (action === "delete") {
    const databaseProducts =
      await prisma.product.findMany({
        where: {
          slug: {
            in: foundSlugs,
          },
        },

        select: {
          id: true,
          slug: true,
          name: true,

          _count: {
            select: {
              orderItems: true,
              rfqItems: true,
            },
          },
        },
      });

    const referencedProducts =
      databaseProducts.filter(
        (product) =>
          product._count.orderItems > 0 ||
          product._count.rfqItems > 0,
      );

    if (referencedProducts.length) {
      const names =
        referencedProducts
          .map(
            (product) =>
              product.name,
          )
          .join(", ");

      throw new Error(
        `Cannot permanently delete referenced products: ${names}. Hide these products instead to preserve order and RFQ history.`,
      );
    }

    await prisma.$transaction(
      async (transaction) => {
        await transaction.product.deleteMany({
          where: {
            slug: {
              in: foundSlugs,
            },
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

    catalog.products =
      catalog.products.filter(
        (product) =>
          !foundSlugs.includes(
            product.slug,
          ),
      );

    for (
      const product of
      catalog.products
    ) {
      product.relatedProducts = (
        product.relatedProducts ?? []
      ).filter(
        (relatedSlug) =>
          !foundSlugs.includes(
            relatedSlug,
          ),
      );
    }

    await writeCatalog(catalog);

    return {
      action,
      affected:
        foundSlugs.length,
      slugs: foundSlugs,
    };
  }

  const databaseUpdate =
    action === "activate"
      ? {
          isActive: true,
        }
      : action === "hide"
        ? {
            isActive: false,
          }
        : action === "feature"
          ? {
              featured: true,
            }
          : {
              featured: false,
            };

  await prisma.product.updateMany({
    where: {
      slug: {
        in: foundSlugs,
      },
    },

    data: databaseUpdate,
  });

  catalog.products =
    catalog.products.map(
      (product) => {
        if (
          !foundSlugs.includes(
            product.slug,
          )
        ) {
          return product;
        }

        switch (action) {
          case "activate":
            return {
              ...product,
              active: true,
            };

          case "hide":
            return {
              ...product,
              active: false,
            };

          case "feature":
            return {
              ...product,
              featured: true,
            };

          case "unfeature":
            return {
              ...product,
              featured: false,
            };
        }
      },
    );

  await writeCatalog(catalog);

  return {
    action,
    affected:
      foundSlugs.length,
    slugs: foundSlugs,
  };
}