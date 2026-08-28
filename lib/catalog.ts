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
  enrichProductsWithDatabasePricing,
  getDatabasePriceGroups,
  updateDatabasePricing,
} from "@/lib/databasePricing";

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

const DEFAULT_PRICE_GROUPS: PriceGroup[] = [
  {
    slug: "standard",
    name: "Standard",
    description:
      "Default approved dealer pricing",
    active: true,
  },
  {
    slug: "tier-a",
    name: "Tier A",
    description:
      "Preferred dealer pricing",
    active: true,
  },
  {
    slug: "tier-b",
    name: "Tier B",
    description:
      "Volume dealer pricing",
    active: true,
  },
  {
    slug: "vip",
    name: "VIP / Custom",
    description:
      "Strategic-account pricing",
    active: true,
  },
];

const DEFAULT_DEALER_PORTAL: DealerPortalSettings =
  {
    demoPriceGroupSlug: "standard",
    demoCompanyName: "Demo Dealer Company",
    demoContactName: "Demo User",
  };

function normalizeCatalog(
  value: CatalogContent,
): CatalogContent {
  const priceGroups =
    Array.isArray(value.priceGroups) &&
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

    categories: Array.isArray(
      value.categories,
    )
      ? value.categories
      : [],

    products: Array.isArray(value.products)
      ? value.products.map((product) => ({
          ...product,

          dealerPrices: Array.isArray(
            product.dealerPrices,
          )
            ? product.dealerPrices
            : [],

          sku: product.sku ?? "",

          unitLabel:
            product.unitLabel ?? "Unit",

          dealerCommercialDetails:
            product.dealerCommercialDetails ??
            "",
        }))
      : [],

    services: Array.isArray(value.services)
      ? value.services
      : [],

    priceGroups,

    dealerPortal: {
      ...DEFAULT_DEALER_PORTAL,
      ...dealerPortal,
    },
  };
}

export async function readCatalog(): Promise<CatalogContent> {
  const raw = await fs.readFile(
    CATALOG_PATH,
    "utf8",
  );

  return normalizeCatalog(
    JSON.parse(raw) as CatalogContent,
  );
}

export async function writeCatalog(
  next: CatalogContent,
): Promise<void> {
  const payload: CatalogContent = {
    ...next,
    updatedAt: new Date().toISOString(),
  };

  writeQueue = writeQueue
    .catch(() => undefined)
    .then(async () => {
      const directory =
        path.dirname(CATALOG_PATH);

      await fs.mkdir(directory, {
        recursive: true,
      });

      await fs.writeFile(
        CATALOG_PATH,
        JSON.stringify(payload, null, 2),
        "utf8",
      );
    });

  return writeQueue;
}

export async function getCategories(): Promise<
  ProductCategory[]
> {
  return (await readCatalog()).categories;
}

export async function getCategory(
  slug: string,
): Promise<ProductCategory | undefined> {
  return (await getCategories()).find(
    (category) => category.slug === slug,
  );
}

function publicProduct(
  product: Product,
): Product {
  return {
    ...product,
    dealerPrices: [],
    dealerCommercialDetails: "",
    dealerDownloads: [],
  };
}

export async function getProducts(options?: {
  activeOnly?: boolean;
  categorySlug?: string;
  featuredOnly?: boolean;
  includeProtected?: boolean;
}): Promise<Product[]> {
  let products =
    (await readCatalog()).products;

  if (options?.activeOnly !== false) {
    products = products.filter(
      (product) =>
        product.active !== false,
    );
  }

  if (options?.categorySlug) {
    products = products.filter((product) =>
      product.categorySlugs.includes(
        options.categorySlug!,
      ),
    );
  }

  if (options?.featuredOnly) {
    products = products.filter(
      (product) =>
        product.featured === true,
    );
  }

  if (options?.includeProtected) {
    return enrichProductsWithDatabasePricing(
      products,
    );
  }

  return products.map(publicProduct);
}

export async function getProduct(
  slug: string,
  options?: {
    includeProtected?: boolean;
  },
): Promise<Product | undefined> {
  const product = (
    await readCatalog()
  ).products.find(
    (item) => item.slug === slug,
  );

  if (!product) return undefined;

  if (options?.includeProtected) {
    const [enrichedProduct] =
      await enrichProductsWithDatabasePricing([
        product,
      ]);

    return enrichedProduct;
  }

  return publicProduct(product);
}

export async function getRelatedProducts(
  product: Product,
): Promise<Product[]> {
  const products = await getProducts();

  const productsBySlug = new Map(
    products.map((item) => [
      item.slug,
      item,
    ]),
  );

  const explicitlyRelated = (
    product.relatedProducts ?? []
  )
    .map((slug) =>
      productsBySlug.get(slug),
    )
    .filter(
      (item): item is Product =>
        Boolean(item),
    );

  if (explicitlyRelated.length) {
    return explicitlyRelated;
  }

  return products.filter(
    (item) =>
      item.slug !== product.slug &&
      item.categorySlugs.some(
        (slug) =>
          product.categorySlugs.includes(
            slug,
          ),
      ),
  );
}

export async function getServices(options?: {
  activeOnly?: boolean;
}): Promise<Service[]> {
  let services =
    (await readCatalog()).services;

  if (options?.activeOnly !== false) {
    services = services.filter(
      (service) =>
        service.active !== false,
    );
  }

  return services;
}

export async function getService(
  slug: string,
): Promise<Service | undefined> {
  return (
    await readCatalog()
  ).services.find(
    (service) => service.slug === slug,
  );
}

export function slugify(
  value: string,
): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export async function upsertProduct(
  product: Product,
  originalSlug?: string,
): Promise<Product> {
  const catalog = await readCatalog();

  const slug = slugify(
    product.slug || product.name,
  );

  const normalized: Product = {
    ...product,
    slug,

    categorySlugs: [
      ...new Set(
        product.categorySlugs.filter(
          Boolean,
        ),
      ),
    ],

    primaryCategorySlug:
      product.primaryCategorySlug ||
      product.categorySlugs[0] ||
      catalog.categories[0]?.slug ||
      "",

    categoryGroups:
      product.categoryGroups ??
      Object.fromEntries(
        product.categorySlugs.map(
          (categorySlug) => [
            categorySlug,
            product.subcategory,
          ],
        ),
      ),

    gallery: product.gallery ?? [],
    specs: product.specs ?? [],
    standards: product.standards ?? [],
    applications:
      product.applications ?? [],
    publicDownloads:
      product.publicDownloads ?? [],
    dealerDownloads:
      product.dealerDownloads ?? [],
    relatedProducts:
      product.relatedProducts ?? [],

    /*
     * Product pricing is now stored in Neon. This JSON
     * value is retained only for temporary compatibility.
     */
    dealerPrices:
      product.dealerPrices ?? [],

    sku: product.sku ?? "",
    unitLabel:
      product.unitLabel ?? "Unit",

    dealerCommercialDetails:
      product.dealerCommercialDetails ?? "",

    active: product.active !== false,
  };

  const collision =
    catalog.products.find(
      (item) =>
        item.slug === normalized.slug &&
        item.slug !== originalSlug,
    );

  if (collision) {
    throw new Error(
      `A product with slug "${normalized.slug}" already exists.`,
    );
  }

  const index = originalSlug
    ? catalog.products.findIndex(
        (item) =>
          item.slug === originalSlug,
      )
    : catalog.products.findIndex(
        (item) =>
          item.slug ===
          normalized.slug,
      );

  if (index >= 0) {
    catalog.products[index] = normalized;
  } else {
    catalog.products.unshift(normalized);
  }

  await writeCatalog(catalog);

  return normalized;
}

export async function deleteProduct(
  slug: string,
): Promise<void> {
  const catalog = await readCatalog();

  catalog.products =
    catalog.products.filter(
      (product) =>
        product.slug !== slug,
    );

  for (const product of catalog.products) {
    product.relatedProducts = (
      product.relatedProducts ?? []
    ).filter(
      (relatedSlug) =>
        relatedSlug !== slug,
    );
  }

  await writeCatalog(catalog);
}

export async function upsertService(
  service: Service,
  originalSlug?: string,
): Promise<Service> {
  const catalog = await readCatalog();

  const slug = slugify(
    service.slug || service.name,
  );

  const normalized: Service = {
    ...service,
    slug,
    scope: service.scope ?? [],
    process: service.process ?? [],
    applications:
      service.applications ?? [],
    active: service.active !== false,
  };

  const collision =
    catalog.services.find(
      (item) =>
        item.slug === normalized.slug &&
        item.slug !== originalSlug,
    );

  if (collision) {
    throw new Error(
      `A service with slug "${normalized.slug}" already exists.`,
    );
  }

  const index = originalSlug
    ? catalog.services.findIndex(
        (item) =>
          item.slug === originalSlug,
      )
    : catalog.services.findIndex(
        (item) =>
          item.slug ===
          normalized.slug,
      );

  if (index >= 0) {
    catalog.services[index] =
      normalized;
  } else {
    catalog.services.unshift(
      normalized,
    );
  }

  await writeCatalog(catalog);
  return normalized;
}

export async function deleteService(
  slug: string,
): Promise<void> {
  const catalog = await readCatalog();

  catalog.services =
    catalog.services.filter(
      (service) =>
        service.slug !== slug,
    );

  await writeCatalog(catalog);
}

export async function updateCategories(
  categories: ProductCategory[],
): Promise<void> {
  const catalog = await readCatalog();

  const normalized = categories.map(
    (category) => ({
      ...category,

      slug: slugify(
        category.slug ||
          category.name,
      ),

      groups: category.groups ?? [],
    }),
  );

  const uniqueSlugs = new Set(
    normalized.map(
      (category) => category.slug,
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

  catalog.categories = normalized;

  await writeCatalog(catalog);
}

export async function getPriceGroups(): Promise<
  PriceGroup[]
> {
  return getDatabasePriceGroups(true);
}

export async function getAllPriceGroups(): Promise<
  PriceGroup[]
> {
  return getDatabasePriceGroups(false);
}

export async function getDealerPortalSettings(): Promise<DealerPortalSettings> {
  const setting =
    await import("@/lib/prisma").then(
      ({ prisma }) =>
        prisma.dealerPortalSetting.findUnique(
          {
            where: {
              id: "default",
            },
          },
        ),
    );

  if (!setting) {
    return (
      await readCatalog()
    ).dealerPortal;
  }

  return {
    demoPriceGroupSlug:
      setting.demoPriceGroupSlug,

    demoCompanyName:
      setting.demoCompanyName,

    demoContactName:
      setting.demoContactName,
  };
}

export async function updatePricingConfiguration(
  input: {
    priceGroups: PriceGroup[];

    dealerPortal: DealerPortalSettings;

    productPrices: Record<
      string,
      import("@/data/site").DealerPrice[]
    >;
  },
): Promise<void> {
  await updateDatabasePricing(input);
}