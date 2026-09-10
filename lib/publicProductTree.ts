import "server-only";

import {
  unstable_noStore as noStore,
} from "next/cache";

import type {
  Product,
} from "@/data/site";

import {
  getProducts,
} from "@/lib/catalog";

import {
  buildTree,
  getBreadcrumbs,
  getDescendantIds,
} from "@/lib/categoryTree";

import {
  prisma,
} from "@/lib/prisma";

export type PublicProductCategory = {
  id: string;
  name: string;
  slug: string;

  shortName: string | null;
  summary: string | null;
  description: string | null;

  image: string | null;
  heroImage: string | null;

  parentId: string | null;
  position: number;
  isActive: boolean;
};

const PRODUCT_CATEGORY_FALLBACK_IMAGE =
  "/media/products/hero-products.jpg";

function cleanImageUrl(
  value:
    | string
    | null
    | undefined,
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const cleaned =
    value.trim();

  return cleaned || null;
}

/**
 * Resolve the most appropriate image for a
 * product category.
 *
 * card:
 *   Prefer the regular category image.
 *
 * hero:
 *   Prefer the dedicated hero image.
 *
 * This keeps the same category data usable
 * consistently across the products landing
 * page and recursive category pages.
 */
export function getPublicCategoryImage(
  category:
    Pick<
      PublicProductCategory,
      "image" | "heroImage"
    >,
  variant:
    | "card"
    | "hero" = "card",
): string {
  const image =
    cleanImageUrl(
      category.image,
    );

  const heroImage =
    cleanImageUrl(
      category.heroImage,
    );

  if (
    variant === "hero"
  ) {
    return (
      heroImage ||
      image ||
      PRODUCT_CATEGORY_FALLBACK_IMAGE
    );
  }

  return (
    image ||
    heroImage ||
    PRODUCT_CATEGORY_FALLBACK_IMAGE
  );
}

export async function getPublicProductCategories(): Promise<
  PublicProductCategory[]
> {
  /*
   * Product categories are managed from
   * the admin panel and must be reflected
   * immediately on the public site.
   *
   * This prevents Next.js from serving
   * a cached category-tree result.
   */

  noStore();

  const categories =
    await prisma.productCategory.findMany({
      where: {
        isActive: true,
      },

      orderBy: [
        {
          position: "asc",
        },
        {
          name: "asc",
        },
      ],

      select: {
        id: true,
        name: true,
        slug: true,

        shortName: true,
        summary: true,
        description: true,

        image: true,
        heroImage: true,

        parentId: true,
        position: true,
        isActive: true,
      },
    });

  /*
   * Normalize image fields before exposing
   * them to public rendering.
   *
   * This protects next/image from receiving
   * values containing accidental whitespace.
   */

  return categories.map(
    (category) => ({
      ...category,

      image:
        cleanImageUrl(
          category.image,
        ),

      heroImage:
        cleanImageUrl(
          category.heroImage,
        ),
    }),
  );
}

export async function getPublicProductCategoryTree() {
  noStore();

  const categories =
    await getPublicProductCategories();

  return buildTree(
    categories,
  );
}

export function buildCategoryHref(
  categories:
    PublicProductCategory[],
  categoryId: string,
): string {
  const breadcrumbs =
    getBreadcrumbs(
      categories,
      categoryId,
    );

  if (
    !breadcrumbs.length
  ) {
    return "/products";
  }

  return `/products/category/${breadcrumbs
    .map(
      (category) =>
        encodeURIComponent(
          category.slug,
        ),
    )
    .join("/")}`;
}

export function resolveCategoryPath(
  categories:
    PublicProductCategory[],
  rawSegments: string[],
): PublicProductCategory | null {
  if (
    !rawSegments.length
  ) {
    return null;
  }

  let parentId:
    | string
    | null = null;

  let current:
    | PublicProductCategory
    | undefined;

  for (
    const rawSegment of
    rawSegments
  ) {
    let segment:
      string;

    try {
      segment =
        decodeURIComponent(
          rawSegment,
        );
    } catch {
      return null;
    }

    current =
      categories.find(
        (category) =>
          category.slug ===
            segment &&
          category.parentId ===
            parentId,
      );

    if (!current) {
      return null;
    }

    parentId =
      current.id;
  }

  return current ?? null;
}

export async function getPublicCategoryPageData(
  segments: string[],
) {
  noStore();

  const categories =
    await getPublicProductCategories();

  const category =
    resolveCategoryPath(
      categories,
      segments,
    );

  if (!category) {
    return null;
  }

  const breadcrumbs =
    getBreadcrumbs(
      categories,
      category.id,
    );

  const children =
    categories
      .filter(
        (item) =>
          item.parentId ===
          category.id,
      )
      .sort(
        (a, b) =>
          a.position -
            b.position ||
          a.name.localeCompare(
            b.name,
          ),
      );

  const descendantIds =
    getDescendantIds(
      categories,
      category.id,
    );

  const relevantCategoryIds = [
    category.id,
    ...descendantIds,
  ];

  const relevantCategories =
    categories.filter(
      (item) =>
        relevantCategoryIds.includes(
          item.id,
        ),
    );

  const relevantCategorySlugs =
    new Set(
      relevantCategories.map(
        (item) =>
          item.slug,
      ),
    );

  /*
   * Database category assignments remain
   * the primary source of category/product
   * relationships.
   */

  const databaseAssignments =
    await prisma.productCategoryAssignment.findMany({
      where: {
        categoryId: {
          in:
            relevantCategoryIds,
        },

        product: {
          isActive: true,
        },
      },

      select: {
        product: {
          select: {
            slug: true,
          },
        },
      },
    });

  const databaseProductSlugs =
    new Set(
      databaseAssignments.map(
        (assignment) =>
          assignment.product.slug,
      ),
    );

  /*
   * Product content is still partially
   * served through the legacy catalog
   * layer.
   *
   * During migration we therefore combine:
   *
   * 1. Neon category assignments
   * 2. Existing categorySlugs compatibility
   */

  const catalogueProducts =
    await getProducts();

  const products =
    catalogueProducts.filter(
      (product) =>
        databaseProductSlugs.has(
          product.slug,
        ) ||
        product.categorySlugs.some(
          (slug) =>
            relevantCategorySlugs.has(
              slug,
            ),
        ),
    );

  const sortedProducts =
    [...products].sort(
      (a, b) =>
        a.name.localeCompare(
          b.name,
        ),
    );

  return {
    category,
    categories,
    breadcrumbs,
    children,

    products:
      sortedProducts,
  };
}

export function getSafeProductCategorySlug(
  product: Product,
): string {
  if (
    product.primaryCategorySlug &&
    product.categorySlugs.includes(
      product.primaryCategorySlug,
    )
  ) {
    return (
      product.primaryCategorySlug
    );
  }

  return (
    product.categorySlugs[0] ??
    ""
  );
}