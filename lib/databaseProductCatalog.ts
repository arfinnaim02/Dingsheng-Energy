import "server-only";

import type {
  Prisma,
} from "@prisma/client";

import type {
  Product,
} from "@/data/site";

import {
  prisma,
} from "@/lib/prisma";

/*
 * ============================================
 * PRODUCT INCLUDE
 * ============================================
 *
 * Neon is now the authoritative source for
 * product catalogue data.
 */

const productInclude = {
  categories: {
    include: {
      category: {
        select: {
          slug: true,
        },
      },
    },
  },

  specs: {
    orderBy: [
      {
        position:
          "asc" as const,
      },
      {
        id:
          "asc" as const,
      },
    ],
  },

  images: {
    orderBy: [
      {
        position:
          "asc" as const,
      },
      {
        id:
          "asc" as const,
      },
    ],
  },

  documents: {
    orderBy: [
      {
        dealerOnly:
          "asc" as const,
      },
      {
        position:
          "asc" as const,
      },
      {
        createdAt:
          "asc" as const,
      },
    ],
  },

  applications: {
    orderBy: [
      {
        position:
          "asc" as const,
      },
      {
        id:
          "asc" as const,
      },
    ],
  },

  standards: {
    orderBy: [
      {
        position:
          "asc" as const,
      },
      {
        id:
          "asc" as const,
      },
    ],
  },
} satisfies Prisma.ProductInclude;

type DatabaseProduct =
  Prisma.ProductGetPayload<{
    include:
      typeof productInclude;
  }>;

/*
 * ============================================
 * HELPERS
 * ============================================
 */

function commercialMode(
  mode:
    DatabaseProduct["commercialMode"],
): Product["commercialMode"] {
  switch (mode) {
    case "INFORMATION_ONLY":
      return "information";

    case "DEALER_PURCHASE":
      return "dealer-purchase";

    case "DEALER_PURCHASE_AND_RFQ":
      return "dealer-purchase-rfq";

    case "RFQ_ONLY":
    default:
      return "rfq";
  }
}

function stringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (
        item,
      ): item is string =>
        typeof item ===
          "string",
    )
    .map(
      (item) =>
        item.trim(),
    )
    .filter(Boolean);
}

/*
 * ============================================
 * MAP PRISMA PRODUCT → WEBSITE PRODUCT
 * ============================================
 */

function mapProduct(
  product: DatabaseProduct,
): Product {
  const categorySlugs =
    product.categories.map(
      (assignment) =>
        assignment.category.slug,
    );

  const categoryGroups =
    Object.fromEntries(
      product.categories.map(
        (assignment) => [
          assignment.category.slug,

          assignment.groupName ??
            product.subcategory ??
            "",
        ],
      ),
    );

  const image =
    product.images[0]?.url ??
    "";

  const gallery =
    product.images
      .slice(1)
      .map(
        (item) =>
          item.url,
      );

  const publicDownloads =
    product.documents
      .filter(
        (document) =>
          !document.dealerOnly,
      )
      .map(
        (document) =>
          document.filePath,
      );

  const dealerDownloads =
    product.documents
      .filter(
        (document) =>
          document.dealerOnly,
      )
      .map(
        (document) =>
          document.filePath,
      );

  return {
    slug:
      product.slug,

    name:
      product.name,

    categorySlugs,

    primaryCategorySlug:
      product.primaryCategorySlug ??
      categorySlugs[0] ??
      "",

    subcategory:
      product.subcategory ??
      "",

    categoryGroups,

    eyebrow:
      product.eyebrow ??
      "",

    summary:
      product.summary ??
      "",

    description:
      product.description ??
      undefined,

    image,

    gallery,

    specs:
      product.specs.map(
        (
          specification,
        ) => [
          specification.label,
          specification.value,
        ],
      ),

      standards:
        product.standards.map(
          (standard) =>
            standard.label,
        ),

      applications:
        product.applications.map(
          (application) =>
            application.label,
        ),

      showStandards:
        product.showStandards ===
        true,

      showApplications:
        product.showApplications ===
        true,

      commercialMode:
        commercialMode(
          product.commercialMode,
        ),

    dealerPriceProtected:
      product.dealerPriceProtected,

    featured:
      product.featured,

    availability:
      product.availability ??
      undefined,

    sku:
      product.sku ??
      "",

    unitLabel:
      product.unitLabel ??
      "Unit",

    dealerCommercialDetails:
      product
        .dealerCommercialDetails ??
      "",

    /*
     * Pricing will still be enriched by
     * databasePricing.ts so existing dealer
     * pricing logic remains unchanged.
     */
    dealerPrices: [],

    publicDownloads,

    dealerDownloads,

    relatedProducts:
      stringArray(
        product.relatedProductsJson,
      ),

    active:
      product.isActive,

    basePrice:
      product.basePrice !==
      null
        ? Number(
            product.basePrice,
          )
        : undefined,

    baseCurrency:
      product.baseCurrency ||
      "USD",

    minimumQty:
      product.minimumQty ??
      undefined,

    leadTimeText:
      product.leadTimeText ??
      undefined,

    pricingNote:
      product.pricingNote ??
      undefined,
  };
}

/*
 * ============================================
 * GET ALL PRODUCTS
 * ============================================
 */

export async function getDatabaseCatalogProducts(): Promise<
  Product[]
> {
  const products =
    await prisma.product.findMany({
      include:
        productInclude,

      orderBy: [
        {
          createdAt:
            "desc",
        },
        {
          name:
            "asc",
        },
      ],
    });

  return products.map(
    mapProduct,
  );
}

/*
 * ============================================
 * GET ONE PRODUCT
 * ============================================
 */

export async function getDatabaseCatalogProduct(
  slug: string,
): Promise<
  Product | undefined
> {
  const cleanSlug =
    slug.trim();

  if (!cleanSlug) {
    return undefined;
  }

  const product =
    await prisma.product.findUnique({
      where: {
        slug:
          cleanSlug,
      },

      include:
        productInclude,
    });

  if (!product) {
    return undefined;
  }

  return mapProduct(
    product,
  );
}