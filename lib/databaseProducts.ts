import "server-only";

import type {
  ManagedProductDocument,
  ManagedProductImage,
  Product,
} from "@/data/site";

import {
  replaceProductDocuments,
} from "@/lib/databaseProductDocuments";


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

  managedImages?:
    ManagedProductImage[];

  managedDocuments?:
    ManagedProductDocument[];
};

function uniqueStrings(
  values: string[],
) {
  return [
    ...new Set(
      values
        .filter(
          (value) =>
            typeof value === "string",
        )
        .map(
          (value) =>
            value.trim(),
        )
        .filter(Boolean),
    ),
  ];
}

function cleanOptional(
  value: string | undefined,
) {
  const cleaned =
    value?.trim() ?? "";

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
        !foundCategorySlugs.has(
          slug,
        ),
    );

  if (
    missingCategorySlugs.length
  ) {
    throw new Error(
      `The following categories do not exist in Neon: ${missingCategorySlugs.join(
        ", ",
      )}.`,
    );
  }

  const originalSlug =
    options.originalSlug?.trim();

  const existingProduct =
    originalSlug
      ? await prisma.product.findUnique(
          {
            where: {
              slug:
                originalSlug,
            },

            select: {
              id: true,
              slug: true,
            },
          },
        )
      : await prisma.product.findUnique(
          {
            where: {
              slug:
                product.slug,
            },

            select: {
              id: true,
              slug: true,
            },
          },
        );

  if (
    originalSlug &&
    originalSlug !==
      product.slug
  ) {
    const slugCollision =
      await prisma.product.findUnique(
        {
          where: {
            slug:
              product.slug,
          },

          select: {
            id: true,
          },
        },
      );

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
    name:
      product.name.trim(),

    slug:
      product.slug,

    sku:
      cleanOptional(
        product.sku,
      ),

    subcategory:
      cleanOptional(
        product.subcategory,
      ),

    eyebrow:
      cleanOptional(
        product.eyebrow,
      ),

    summary:
      cleanOptional(
        product.summary,
      ),

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

      showApplications:
        product.showApplications ===
        true,

      showStandards:
        product.showStandards ===
        true,

      featured:
        product.featured ===
        true,

    availability:
      cleanOptional(
        product.availability,
      ),

    unitLabel:
      cleanOptional(
        product.unitLabel,
      ) || "Unit",

    /*
     * ========================================
     * NEW BASE PRICING SYSTEM
     * ========================================
     *
     * Products now store ONE base price.
     * Dealer-specific prices are calculated
     * dynamically using PriceGroup discounts.
     */

    basePrice:
      typeof product.basePrice ===
        "number" &&
      Number.isFinite(
        product.basePrice,
      ) &&
      product.basePrice >= 0
        ? product.basePrice
        : null,

    baseCurrency:
      typeof product.baseCurrency ===
        "string" &&
      /^[A-Za-z]{3}$/.test(
        product.baseCurrency.trim(),
      )
        ? product.baseCurrency
            .trim()
            .toUpperCase()
        : "USD",

    minimumQty:
      typeof product.minimumQty ===
        "number" &&
      Number.isFinite(
        product.minimumQty,
      ) &&
      product.minimumQty >= 1
        ? Math.floor(
            product.minimumQty,
          )
        : null,

    leadTimeText:
      cleanOptional(
        product.leadTimeText,
      ),

    pricingNote:
      cleanOptional(
        product.pricingNote,
      ),

    dealerCommercialDetails:
      cleanOptional(
        product.dealerCommercialDetails,
      ),

    relatedProductsJson:
      product.relatedProducts ??
      [],

    isActive:
      product.active !== false,
  };

  const savedProduct =
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        const databaseProduct =
          existingProduct
            ? await transaction.product.update(
                {
                  where: {
                    id:
                      existingProduct.id,
                  },

                  data:
                    scalarData,
                },
              )
            : await transaction.product.create(
                {
                  data:
                    scalarData,
                },
              );

        /*
         * ========================================
         * REPLACE EDITABLE CHILD RECORDS
         * ========================================
         *
         * These records represent the current
         * product configuration submitted by the
         * admin form.
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

        /*
         * IMPORTANT:
         *
         * Do NOT delete ProductPrice here.
         *
         * ProductPrice is now retained only as
         * legacy/fallback pricing while existing
         * products are migrated to basePrice.
         *
         * Once a product has basePrice,
         * databasePricing.ts ignores legacy
         * ProductPrice rows and calculates dealer
         * pricing dynamically.
         */

        /*
         * ========================================
         * CATEGORY ASSIGNMENTS
         * ========================================
         */

        await transaction.productCategoryAssignment.createMany(
          {
            data:
              categories.map(
                (
                  category,
                ) => ({
                  productId:
                    databaseProduct.id,

                  categoryId:
                    category.id,

                  groupName:
                    cleanOptional(
                      product
                        .categoryGroups?.[
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
         * ========================================
         * SPECIFICATIONS
         * ========================================
         */

        const specifications =
          product.specs
            .map(
              ([
                label,
                value,
              ]) => ({
                label:
                  label.trim(),

                value:
                  value.trim(),
              }),
            )
            .filter(
              (
                specification,
              ) =>
                specification.label ||
                specification.value,
            );

        if (
          specifications.length
        ) {
          await transaction.productSpecification.createMany(
            {
              data:
                specifications.map(
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
         * ========================================
         * APPLICATIONS
         * ========================================
         */

        const applications =
          uniqueStrings(
            product.applications ??
              [],
          );

        if (
          applications.length
        ) {
          await transaction.productApplication.createMany(
            {
              data:
                applications.map(
                  (
                    label,
                    position,
                  ) => ({
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
         * ========================================
         * STANDARDS
         * ========================================
         */

        const standards =
          uniqueStrings(
            product.standards ??
              [],
          );

        if (
          standards.length
        ) {
          await transaction.productStandard.createMany(
            {
              data:
                standards.map(
                  (
                    label,
                    position,
                  ) => ({
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
         * ========================================
         * PRICING
         * ========================================
         *
         * No ProductPrice records are created here.
         *
         * Pricing source:
         *
         * Product.basePrice
         * Product.baseCurrency
         * Product.minimumQty
         * Product.leadTimeText
         * Product.pricingNote
         *
         * +
         *
         * PriceGroup.discountPercent
         *
         * =
         *
         * dynamically calculated dealer price.
         */

        return databaseProduct;
      },

      {
        maxWait: 10000,
        timeout: 30000,
      },
    );

  /*
   * ========================================
   * PRODUCT IMAGES
   * ========================================
   */

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
   * This prevents older product-editor requests
   * from accidentally destroying existing
   * Cloudinary metadata.
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

  /*
   * ========================================
   * PRODUCT DOCUMENTS
   * ========================================
   *
   * Documents are replaced separately from
   * the main product transaction.
   *
   * Important behavior:
   *
   * undefined:
   * leave existing documents untouched
   *
   * []:
   * remove every existing document
   *
   * populated array:
   * replace existing documents with the
   * current admin submission
   */

  let documentResult:
    | Awaited<
        ReturnType<
          typeof replaceProductDocuments
        >
      >
    | undefined;

  if (
    Array.isArray(
      options.managedDocuments,
    )
  ) {
    documentResult =
      await replaceProductDocuments(
        savedProduct.id,
        options.managedDocuments,
      );
  }

  return {
    product:
      savedProduct,

    removedCloudinaryPublicIds:
      imageResult
        ?.removedCloudinaryPublicIds ??
      [],

    removedDocumentCloudinaryPublicIds:
      documentResult
        ?.removedCloudinaryPublicIds ??
      [],
  };
}

export async function deleteDatabaseProduct(
  slug: string,
) {
  const product =
    await prisma.product.findUnique(
      {
        where: {
          slug,
        },

        select: {
          id: true,
          name: true,

          images: {
            select: {
              cloudinaryPublicId:
                true,
            },
          },

          documents: {
            select: {
              cloudinaryPublicId:
                true,
            },
          },

          _count: {
            select: {
              orderItems:
                true,

              rfqItems:
                true,
            },
          },
        },
      },
    );

  if (!product) {
    return {
      deleted: false,

      cloudinaryPublicIds:
        [] as string[],

      documentCloudinaryPublicIds:
        [] as string[],
    };
  }

  if (
    product._count.orderItems >
      0 ||
    product._count.rfqItems >
      0
  ) {
    throw new Error(
      `Cannot permanently delete "${product.name}" because it is referenced by an order or RFQ. Hide the product instead.`,
    );
  }

  const cloudinaryPublicIds = [
    ...new Set(
      product.images
        .map(
          (
            image,
          ) =>
            image.cloudinaryPublicId,
        )
        .filter(
          (
            publicId,
          ): publicId is string =>
            Boolean(
              publicId,
            ),
        ),
    ),
  ];

  const documentCloudinaryPublicIds = [
    ...new Set(
      product.documents
        .map(
          (
            document,
          ) =>
            document.cloudinaryPublicId,
        )
        .filter(
          (
            publicId,
          ): publicId is string =>
            Boolean(
              publicId,
            ),
        ),
    ),
  ];

  await prisma.product.delete({
    where: {
      id:
        product.id,
    },
  });

  return {
    deleted: true,

    cloudinaryPublicIds,

    documentCloudinaryPublicIds,
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

  if (
    slugs.length >
    200
  ) {
    throw new Error(
      "A maximum of 200 products can be updated at once.",
    );
  }

  /*
   * ========================================
   * LOAD PRODUCTS DIRECTLY FROM NEON
   * ========================================
   *
   * Do not use catalog.json here.
   *
   * Vercel's deployed filesystem is
   * read-only at runtime.
   */

  const databaseProducts =
    await prisma.product.findMany({
      where: {
        slug: {
          in: slugs,
        },
      },

      select: {
        id: true,
        slug: true,
        name: true,

        _count: {
          select: {
            orderItems:
              true,

            rfqItems:
              true,
          },
        },
      },
    });

  if (
    !databaseProducts.length
  ) {
    throw new Error(
      "None of the selected products were found.",
    );
  }

  const foundSlugs =
    databaseProducts.map(
      (
        product,
      ) =>
        product.slug,
    );

  /*
   * ========================================
   * BULK DELETE
   * ========================================
   */

  if (
    action ===
    "delete"
  ) {
    /*
     * Do not permanently remove products
     * referenced by historical orders/RFQs.
     */

    const referencedProducts =
      databaseProducts.filter(
        (
          product,
        ) =>
          product._count
            .orderItems >
            0 ||
          product._count
            .rfqItems >
            0,
      );

    if (
      referencedProducts.length
    ) {
      const names =
        referencedProducts
          .map(
            (
              product,
            ) =>
              product.name,
          )
          .join(", ");

      throw new Error(
        `Cannot permanently delete referenced products: ${names}. Hide these products instead to preserve order and RFQ history.`,
      );
    }

    /*
     * Prisma cascading relations handle
     * ProductImage, ProductDocument,
     * category assignments, specifications,
     * applications, standards, etc. according
     * to the existing Prisma schema.
     */

    const deleteResult =
      await prisma.product.deleteMany({
        where: {
          slug: {
            in:
              foundSlugs,
          },
        },
      });

    return {
      action,

      affected:
        deleteResult.count,

      slugs:
        foundSlugs,
    };
  }

  /*
   * ========================================
   * BULK VISIBILITY / FEATURE UPDATE
   * ========================================
   */

  const databaseUpdate =
    action ===
    "activate"
      ? {
          isActive:
            true,
        }
      : action ===
          "hide"
        ? {
            isActive:
              false,
          }
        : action ===
            "feature"
          ? {
              featured:
                true,
            }
          : {
              featured:
                false,
            };

  const databaseUpdateResult =
    await prisma.product.updateMany({
      where: {
        slug: {
          in:
            foundSlugs,
        },
      },

      data:
        databaseUpdate,
    });

  return {
    action,

    affected:
      databaseUpdateResult.count,

    slugs:
      foundSlugs,
  };
}