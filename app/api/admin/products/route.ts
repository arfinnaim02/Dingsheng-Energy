import {
  revalidatePath,
} from "next/cache";

import {
  NextResponse,
} from "next/server";

import type {
  ManagedProductDocument,
  ManagedProductImage,
  Product,
} from "@/data/site";

import {
  isAdminSession,
} from "@/lib/adminAuth";

import {
  getProduct,
  getProducts,
} from "@/lib/catalog";

import {
  deleteProductImage,
} from "@/lib/cloudinary";

import {
  saveDatabaseProduct,
} from "@/lib/databaseProducts";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type ProductRequest =
  Product & {
    managedImages?:
      ManagedProductImage[];

    managedDocuments?:
      ManagedProductDocument[];
  };

/*
 * ============================================
 * PRODUCT SLUG
 * ============================================
 *
 * The old catalogue automatically generated
 * product slugs when the admin left the slug
 * field empty.
 *
 * Products now save directly to Neon, so that
 * behaviour needs to happen before the DB save.
 */
function slugifyProduct(
  value: string,
) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
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

async function cleanupCloudinaryImages(
  publicIds: string[],
) {
  const results =
    await Promise.allSettled(
      publicIds.map(
        (publicId) =>
          deleteProductImage(
            publicId,
          ),
      ),
    );

  results.forEach(
    (result, index) => {
      if (
        result.status ===
        "rejected"
      ) {
        console.error(
          `Unable to remove Cloudinary image ${publicIds[index]}:`,
          result.reason,
        );
      }
    },
  );
}

/*
 * ============================================
 * GET PRODUCTS
 * ============================================
 *
 * Admin receives all products including hidden
 * products and protected commercial data.
 */
export async function GET() {
  if (
    !(await isAdminSession())
  ) {
    return NextResponse.json(
      {
        error:
          "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  return NextResponse.json({
    products:
      await getProducts({
        activeOnly: false,
        includeProtected: true,
      }),
  });
}

/*
 * ============================================
 * CREATE PRODUCT
 * ============================================
 */
export async function POST(
  request: Request,
) {
  if (
    !(await isAdminSession())
  ) {
    return NextResponse.json(
      {
        error:
          "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const body =
      (await request.json()) as
        ProductRequest;

    /*
     * ----------------------------------------
     * PRODUCT NAME
     * ----------------------------------------
     */
    const name =
      body.name?.trim() ??
      "";

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Product name is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ----------------------------------------
     * CATEGORIES
     * ----------------------------------------
     */
    if (
      !Array.isArray(
        body.categorySlugs,
      ) ||
      !body.categorySlugs.length
    ) {
      return NextResponse.json(
        {
          error:
            "Select at least one product category.",
        },
        {
          status: 400,
        },
      );
    }

    const categorySlugs = [
      ...new Set(
        body.categorySlugs
          .map(
            (slug) =>
              slug.trim(),
          )
          .filter(Boolean),
      ),
    ];

    if (
      !categorySlugs.length
    ) {
      return NextResponse.json(
        {
          error:
            "Select at least one product category.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ----------------------------------------
     * SLUG
     * ----------------------------------------
     *
     * Admin can provide a slug manually.
     *
     * If empty:
     *
     * "LPG Storage Tank"
     *
     * becomes:
     *
     * "lpg-storage-tank"
     */
    const slug =
      slugifyProduct(
        body.slug?.trim() ||
          name,
      );

    if (!slug) {
      return NextResponse.json(
        {
          error:
            "Unable to generate a valid product slug. Please enter a slug manually.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Prevent the Add Product page from
     * accidentally overwriting another product
     * with the same slug.
     */
    const existingProduct =
      await getProduct(
        slug,
        {
          activeOnly: false,
        },
      );

    if (existingProduct) {
      return NextResponse.json(
        {
          error:
            `A product with slug "${slug}" already exists. Please use a different product name or slug.`,
        },
        {
          status: 409,
        },
      );
    }

    /*
     * ----------------------------------------
     * PRIMARY CATEGORY
     * ----------------------------------------
     *
     * A product must always have a valid primary
     * category because ProductCard uses it when
     * creating the public product link.
     */
    const requestedPrimary =
      body.primaryCategorySlug
        ?.trim() ?? "";

    const primaryCategorySlug =
      categorySlugs.includes(
        requestedPrimary,
      )
        ? requestedPrimary
        : categorySlugs[0];

    /*
     * managedImages and managedDocuments are
     * database-management fields rather than
     * fields on the base Product object.
     */
    const {
      managedImages,
      managedDocuments,
      ...rawProductInput
    } = body;

    const productInput:
      Product = {
        ...rawProductInput,

        name,

        slug,

        categorySlugs,

        primaryCategorySlug,
      };

    /*
     * ============================================
     * SAVE PRODUCT TO NEON
     * ============================================
     *
     * This is now the ONLY product catalogue
     * persistence source.
     */
    const databaseResult =
      await saveDatabaseProduct(
        productInput,
        {
          managedImages:
            Array.isArray(
              managedImages,
            )
              ? managedImages
              : undefined,

          managedDocuments:
            Array.isArray(
              managedDocuments,
            )
              ? managedDocuments
              : undefined,
        },
      );

    /*
     * Remove replaced physical Cloudinary images
     * only after the DB operation succeeded.
     */
    await cleanupCloudinaryImages(
      databaseResult
        .removedCloudinaryPublicIds,
    );

    const savedProduct =
      databaseResult.product;

    /*
     * ============================================
     * REFRESH PRODUCT SURFACES
     * ============================================
     */
    revalidatePath("/");

    revalidatePath(
      "/products",
    );

    revalidatePath(
      "/admin/products",
    );

    revalidatePath(
      "/dealer/products",
    );

    revalidatePath(
      `/products/${primaryCategorySlug}`,
    );

    revalidatePath(
      `/products/${primaryCategorySlug}/${savedProduct.slug}`,
    );

    return NextResponse.json(
      {
        ok: true,

        product:
          savedProduct,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Unable to create product:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save product.",
      },
      {
        status: 400,
      },
    );
  }
}