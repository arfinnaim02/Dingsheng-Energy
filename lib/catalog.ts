import { promises as fs } from "node:fs";
import path from "node:path";

import type {
  CatalogContent,
  DealerPortalSettings,
  PriceGroup,
  Product,
  ProductCategory,
  Service,
} from "@/data/site";

import {
  getDatabaseCatalogProduct,
  getDatabaseCatalogProducts,
} from "@/lib/databaseProductCatalog";

import {
  enrichProductsWithDatabasePricing,
  getDatabasePriceGroups,
  updateDatabasePricing,
} from "@/lib/databasePricing";

import {
  deleteDatabaseProduct,
  saveDatabaseProduct,
} from "@/lib/databaseProducts";

/*
 * ============================================
 * LEGACY JSON CATALOGUE
 * ============================================
 *
 * Products are now read from Neon.
 *
 * This JSON file remains temporarily because
 * some older service/category/settings code may
 * still depend on it.
 *
 * IMPORTANT:
 * Product runtime CRUD must never write here.
 */

const DEFAULT_PATH = path.join(
  process.cwd(),
  "data",
  "catalog.json",
);

const CATALOG_PATH =
  process.env.CATALOG_FILE_PATH
    ? path.resolve(
        process.env.CATALOG_FILE_PATH,
      )
    : DEFAULT_PATH;

let writeQueue: Promise<void> =
  Promise.resolve();

/*
 * ============================================
 * DEFAULT PRICE GROUPS
 * ============================================
 */

const DEFAULT_PRICE_GROUPS: PriceGroup[] = [
  {
    slug: "standard",

    name: "Standard",

    description:
      "Default approved dealer pricing",

    discountPercent: 0,

    active: true,
  },

  {
    slug: "tier-a",

    name: "Tier A",

    description:
      "Preferred dealer pricing",

    discountPercent: 5,

    active: true,
  },

  {
    slug: "tier-b",

    name: "Tier B",

    description:
      "Volume dealer pricing",

    discountPercent: 10,

    active: true,
  },

  {
    slug: "vip",

    name: "VIP / Custom",

    description:
      "Strategic-account pricing",

    discountPercent: 15,

    active: true,
  },
];

const DEFAULT_DEALER_PORTAL:
  DealerPortalSettings = {
  demoPriceGroupSlug:
    "standard",

  demoCompanyName:
    "Demo Dealer Company",

  demoContactName:
    "Demo User",
};

/*
 * ============================================
 * LEGACY JSON NORMALIZATION
 * ============================================
 */

function normalizeCatalog(
  value: CatalogContent,
): CatalogContent {
  const priceGroups =
    Array.isArray(
      value.priceGroups,
    ) &&
    value.priceGroups.length
      ? value.priceGroups
      : DEFAULT_PRICE_GROUPS;

  const dealerPortal =
    value.dealerPortal ??
    DEFAULT_DEALER_PORTAL;

  return {
    updatedAt:
      value.updatedAt ||
      new Date().toISOString(),

    categories:
      Array.isArray(
        value.categories,
      )
        ? value.categories
        : [],

    products:
      Array.isArray(
        value.products,
      )
        ? value.products.map(
            (
              product,
            ) => ({
              ...product,

              dealerPrices:
                Array.isArray(
                  product.dealerPrices,
                )
                  ? product.dealerPrices
                  : [],

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
            }),
          )
        : [],

    services:
      Array.isArray(
        value.services,
      )
        ? value.services
        : [],

    priceGroups,

    dealerPortal: {
      ...DEFAULT_DEALER_PORTAL,
      ...dealerPortal,
    },
  };
}

/*
 * ============================================
 * LEGACY JSON READ
 * ============================================
 *
 * Reading packaged files is allowed on Vercel.
 */

export async function readCatalog():
  Promise<CatalogContent> {
  const raw =
    await fs.readFile(
      CATALOG_PATH,
      "utf8",
    );

  return normalizeCatalog(
    JSON.parse(
      raw,
    ) as CatalogContent,
  );
}

/*
 * ============================================
 * LEGACY JSON WRITE
 * ============================================
 *
 * Do NOT use this for products.
 *
 * Vercel deployment filesystems are read-only
 * during runtime.
 *
 * This function remains temporarily only for
 * older non-product compatibility code.
 */

export async function writeCatalog(
  next: CatalogContent,
): Promise<void> {
  const payload: CatalogContent = {
    ...next,

    updatedAt:
      new Date().toISOString(),
  };

  writeQueue =
    writeQueue
      .catch(
        () =>
          undefined,
      )
      .then(
        async () => {
          const directory =
            path.dirname(
              CATALOG_PATH,
            );

          await fs.mkdir(
            directory,
            {
              recursive:
                true,
            },
          );

          await fs.writeFile(
            CATALOG_PATH,

            JSON.stringify(
              payload,
              null,
              2,
            ),

            "utf8",
          );
        },
      );

  return writeQueue;
}

/*
 * ============================================
 * LEGACY CATEGORY READS
 * ============================================
 *
 * New category administration already uses
 * databaseCategories.ts.
 *
 * These remain for older compatibility paths.
 */

export async function getCategories():
  Promise<
    ProductCategory[]
  > {
  return (
    await readCatalog()
  ).categories;
}

export async function getCategory(
  slug: string,
): Promise<
  ProductCategory |
  undefined
> {
  return (
    await getCategories()
  ).find(
    (
      category,
    ) =>
      category.slug ===
      slug,
  );
}

/*
 * ============================================
 * PUBLIC PRODUCT SANITIZATION
 * ============================================
 */

function publicProduct(
  product: Product,
): Product {
  return {
    ...product,

    /*
     * Never expose protected dealer
     * commercial information publicly.
     */

    dealerPrices: [],

    dealerCommercialDetails:
      "",

    dealerDownloads:
      [],
  };
}

/*
 * ============================================
 * PRODUCTS — NEON AUTHORITATIVE
 * ============================================
 *
 * This replaces the old architecture:
 *
 * catalog.json
 *      ↓
 * partial Neon overlay
 *
 * with:
 *
 * Neon
 *      ↓
 * complete website Product
 */

/*
 * ============================================
 * GET PRODUCTS
 * ============================================
 */

export async function getProducts(
  options?: {
    activeOnly?: boolean;

    categorySlug?:
      string;

    featuredOnly?:
      boolean;

    includeProtected?:
      boolean;
  },
): Promise<Product[]> {
  /*
   * IMPORTANT:
   *
   * Product records are loaded directly
   * from Neon.
   *
   * Newly created products therefore appear
   * immediately without modifying catalog.json.
   */

  let products =
    await getDatabaseCatalogProducts();

  /*
   * Public catalogue:
   *
   * hide inactive products by default.
   *
   * Admin passes:
   *
   * activeOnly: false
   */

  if (
    options?.activeOnly !==
    false
  ) {
    products =
      products.filter(
        (
          product,
        ) =>
          product.active !==
          false,
      );
  }

  /*
   * Optional category filtering.
   */

  if (
    options?.categorySlug
  ) {
    const categorySlug =
      options.categorySlug;

    products =
      products.filter(
        (
          product,
        ) =>
          product.categorySlugs.includes(
            categorySlug,
          ),
      );
  }

  /*
   * Optional featured filtering.
   */

  if (
    options?.featuredOnly
  ) {
    products =
      products.filter(
        (
          product,
        ) =>
          product.featured ===
          true,
      );
  }

  /*
   * Admin/dealer paths can request
   * protected pricing.
   */

  if (
    options?.includeProtected
  ) {
    return enrichProductsWithDatabasePricing(
      products,
    );
  }

  /*
   * Public pages receive sanitized
   * product objects.
   */

  return products.map(
    publicProduct,
  );
}

/*
 * ============================================
 * GET ONE PRODUCT
 * ============================================
 */

export async function getProduct(
  slug: string,

  options?: {
    includeProtected?:
      boolean;

    activeOnly?:
      boolean;
  },
): Promise<
  Product |
  undefined
> {
  const cleanSlug =
    slug.trim();

  if (!cleanSlug) {
    return undefined;
  }

  /*
   * Read directly from Neon.
   */

  const product =
    await getDatabaseCatalogProduct(
      cleanSlug,
    );

  if (!product) {
    return undefined;
  }

  /*
   * Hidden products must not be directly
   * accessible through public URLs.
   *
   * Admin edit pages explicitly request:
   *
   * activeOnly: false
   */

  if (
    options?.activeOnly !==
      false &&
    product.active ===
      false
  ) {
    return undefined;
  }

  /*
   * Admin/dealer protected result.
   */

  if (
    options?.includeProtected
  ) {
    const [
      enrichedProduct,
    ] =
      await enrichProductsWithDatabasePricing(
        [
          product,
        ],
      );

    return enrichedProduct;
  }

  /*
   * Public result.
   */

  return publicProduct(
    product,
  );
}

/*
 * ============================================
 * RELATED PRODUCTS
 * ============================================
 */

export async function getRelatedProducts(
  product: Product,
): Promise<Product[]> {
  /*
   * getProducts() is now Neon-backed,
   * therefore related products are also
   * resolved from Neon.
   */

  const products =
    await getProducts();

  const productsBySlug =
    new Map(
      products.map(
        (
          item,
        ) => [
          item.slug,
          item,
        ],
      ),
    );

  const explicitlyRelated =
    (
      product.relatedProducts ??
      []
    )
      .map(
        (
          slug,
        ) =>
          productsBySlug.get(
            slug,
          ),
      )
      .filter(
        (
          item,
        ): item is Product =>
          Boolean(
            item,
          ),
      );

  if (
    explicitlyRelated.length
  ) {
    return explicitlyRelated;
  }

  /*
   * If no explicit related products exist,
   * fall back to products sharing categories.
   */

  return products.filter(
    (
      item,
    ) =>
      item.slug !==
        product.slug &&
      item.categorySlugs.some(
        (
          slug,
        ) =>
          product.categorySlugs.includes(
            slug,
          ),
      ),
  );
}

/*
 * ============================================
 * PRODUCT COMPATIBILITY WRITE
 * ============================================
 *
 * These two exports are retained so any old
 * code importing upsertProduct/deleteProduct
 * will not accidentally write catalog.json.
 *
 * They now delegate to Neon.
 */

/*
 * ============================================
 * UPSERT PRODUCT — NEON
 * ============================================
 */

export async function upsertProduct(
  product: Product,

  originalSlug?: string,
): Promise<Product> {
  const result =
    await saveDatabaseProduct(
      product,

      {
        originalSlug,
      },
    );

  /*
   * Convert the saved Prisma record back to the
   * website Product type through the standard
   * Neon catalogue mapper.
   */

  const savedProduct =
    await getDatabaseCatalogProduct(
      result.product.slug,
    );

  if (!savedProduct) {
    throw new Error(
      `Unable to reload saved product "${result.product.slug}" from Neon.`,
    );
  }

  return savedProduct;
}

/*
 * ============================================
 * DELETE PRODUCT — NEON
 * ============================================
 */

export async function deleteProduct(
  slug: string,
): Promise<void> {
  const cleanSlug =
    slug.trim();

  if (!cleanSlug) {
    return;
  }

  await deleteDatabaseProduct(
    cleanSlug,
  );
}

/*
 * ============================================
 * SERVICES
 * ============================================
 *
 * NOTE:
 *
 * These remain legacy JSON implementations.
 * Your current service administration uses
 * the database-specific service system.
 *
 * Do not move product logic back into these
 * JSON functions.
 */

export async function getServices(
  options?: {
    activeOnly?: boolean;
  },
): Promise<Service[]> {
  let services =
    (
      await readCatalog()
    ).services;

  if (
    options?.activeOnly !==
    false
  ) {
    services =
      services.filter(
        (
          service,
        ) =>
          service.active !==
          false,
      );
  }

  return services;
}

export async function getService(
  slug: string,
): Promise<
  Service |
  undefined
> {
  return (
    await readCatalog()
  ).services.find(
    (
      service,
    ) =>
      service.slug ===
      slug,
  );
}

/*
 * ============================================
 * LEGACY SLUG HELPER
 * ============================================
 */

export function slugify(
  value: string,
): string {
  return value
    .normalize(
      "NFKD",
    )
    .toLowerCase()
    .trim()
    .replace(
      /&/g,
      " and ",
    )
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    )
    .replace(
      /-{2,}/g,
      "-",
    );
}

/*
 * ============================================
 * LEGACY SERVICE WRITE
 * ============================================
 */

export async function upsertService(
  service: Service,

  originalSlug?: string,
): Promise<Service> {
  const catalog =
    await readCatalog();

  const slug =
    slugify(
      service.slug ||
        service.name,
    );

  const normalized:
    Service = {
    ...service,

    slug,

    scope:
      service.scope ??
      [],

    process:
      service.process ??
      [],

    applications:
      service.applications ??
      [],

    active:
      service.active !==
      false,
  };

  const collision =
    catalog.services.find(
      (
        item,
      ) =>
        item.slug ===
          normalized.slug &&
        item.slug !==
          originalSlug,
    );

  if (collision) {
    throw new Error(
      `A service with slug "${normalized.slug}" already exists.`,
    );
  }

  const index =
    originalSlug
      ? catalog.services.findIndex(
          (
            item,
          ) =>
            item.slug ===
            originalSlug,
        )
      : catalog.services.findIndex(
          (
            item,
          ) =>
            item.slug ===
            normalized.slug,
        );

  if (index >= 0) {
    catalog.services[
      index
    ] =
      normalized;
  } else {
    catalog.services.unshift(
      normalized,
    );
  }

  await writeCatalog(
    catalog,
  );

  return normalized;
}

/*
 * ============================================
 * LEGACY SERVICE DELETE
 * ============================================
 */

export async function deleteService(
  slug: string,
): Promise<void> {
  const catalog =
    await readCatalog();

  catalog.services =
    catalog.services.filter(
      (
        service,
      ) =>
        service.slug !==
        slug,
    );

  await writeCatalog(
    catalog,
  );
}

/*
 * ============================================
 * LEGACY CATEGORY UPDATE
 * ============================================
 */

export async function updateCategories(
  categories:
    ProductCategory[],
): Promise<void> {
  const catalog =
    await readCatalog();

  const normalized =
    categories.map(
      (
        category,
      ) => ({
        ...category,

        slug:
          slugify(
            category.slug ||
              category.name,
          ),

        groups:
          category.groups ??
          [],
      }),
    );

  const uniqueSlugs =
    new Set(
      normalized.map(
        (
          category,
        ) =>
          category.slug,
      ),
    );

  if (
    uniqueSlugs.size !==
    normalized.length
  ) {
    throw new Error(
      "Category slugs must be unique.",
    );
  }

  catalog.categories =
    normalized;

  await writeCatalog(
    catalog,
  );
}

/*
 * ============================================
 * PRICE GROUPS
 * ============================================
 */

export async function getPriceGroups():
  Promise<
    PriceGroup[]
  > {
  return getDatabasePriceGroups(
    true,
  );
}

export async function getAllPriceGroups():
  Promise<
    PriceGroup[]
  > {
  return getDatabasePriceGroups(
    false,
  );
}

/*
 * ============================================
 * DEALER PORTAL SETTINGS
 * ============================================
 */

export async function getDealerPortalSettings():
  Promise<
    DealerPortalSettings
  > {
  const setting =
    await import(
      "@/lib/prisma"
    ).then(
      (
        {
          prisma,
        },
      ) =>
        prisma
          .dealerPortalSetting
          .findUnique(
            {
              where: {
                id:
                  "default",
              },
            },
          ),
    );

  /*
   * Keep JSON fallback temporarily for
   * installations where the DB setting has not
   * been initialized.
   */

  if (!setting) {
    return (
      await readCatalog()
    ).dealerPortal;
  }

  return {
    demoPriceGroupSlug:
      setting
        .demoPriceGroupSlug,

    demoCompanyName:
      setting
        .demoCompanyName,

    demoContactName:
      setting
        .demoContactName,
  };
}

/*
 * ============================================
 * PRICING CONFIGURATION
 * ============================================
 */

export async function updatePricingConfiguration(
  input: {
    priceGroups:
      PriceGroup[];

    dealerPortal:
      DealerPortalSettings;

    productBasePrices:
      Record<
        string,
        {
          basePrice?:
            number;

          baseCurrency?:
            string;

          minimumQty?:
            number;

          leadTimeText?:
            string;

          pricingNote?:
            string;
        }
      >;
  },
): Promise<void> {
  await updateDatabasePricing(
    input,
  );
}