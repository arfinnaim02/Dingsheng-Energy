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
  deleteProductDocument,
  deleteProductImage,
} from "@/lib/cloudinary";

import {
  deleteDatabaseProduct,
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

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

/*
 * ============================================
 * PRODUCT SLUG
 * ============================================
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

/*
 * ============================================
 * UPDATE PRODUCT
 * ============================================
 */
export async function PUT(
  request: Request,
  context: RouteContext,
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

  const {
    slug: rawSlug,
  } =
    await context.params;

  let originalSlug:
    string;

  try {
    originalSlug =
      decodeURIComponent(
        rawSlug,
      ).trim();
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid product slug.",
      },
      {
        status: 400,
      },
    );
  }

  if (!originalSlug) {
    return NextResponse.json(
      {
        error:
          "Invalid product slug.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const body =
      (await request.json()) as
        ProductRequest;

    if (
      !body ||
      typeof body !==
        "object"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid product data.",
        },
        {
          status: 400,
        },
      );
    }

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
     * CATEGORY VALIDATION
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
     * NORMALIZE SLUG
     * ----------------------------------------
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
     * ----------------------------------------
     * PRIMARY CATEGORY
     * ----------------------------------------
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
     * Images and documents are handled through
     * their dedicated DB managers.
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
     * SAVE PRODUCT ONCE
     * ============================================
     *
     * IMPORTANT:
     *
     * There must be only ONE saveDatabaseProduct()
     * operation.
     *
     * Do NOT call upsertProduct() afterwards.
     *
     * upsertProduct() now also saves to Neon,
     * which caused the product to be written twice
     * and caused slug-change errors.
     */
    const databaseResult =
      await saveDatabaseProduct(
        productInput,
        {
          originalSlug,

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
     * ============================================
     * DELETE REMOVED CLOUDINARY IMAGES
     * ============================================
     */
    const removedImageIds =
      databaseResult
        .removedCloudinaryPublicIds ??
      [];

    if (
      removedImageIds.length
    ) {
      await Promise.allSettled(
        removedImageIds.map(
          async (
            publicId,
          ) => {
            await deleteProductImage(
              publicId,
            );
          },
        ),
      );
    }

    /*
     * ============================================
     * DELETE REMOVED CLOUDINARY DOCUMENTS
     * ============================================
     */
    const removedDocumentIds =
      databaseResult
        .removedDocumentCloudinaryPublicIds ??
      [];

    if (
      removedDocumentIds.length
    ) {
      await Promise.allSettled(
        removedDocumentIds.map(
          async (
            publicId,
          ) => {
            await deleteProductDocument(
              publicId,
            );
          },
        ),
      );
    }

    const savedProduct =
      databaseResult.product;

    /*
     * ============================================
     * REFRESH PRODUCT PAGES
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

    /*
     * Refresh old URL too in case the product slug
     * or category was changed.
     */
    if (
      body.primaryCategorySlug
    ) {
      revalidatePath(
        `/products/${body.primaryCategorySlug}`,
      );

      revalidatePath(
        `/products/${body.primaryCategorySlug}/${originalSlug}`,
      );
    }

    revalidatePath(
      `/products/${primaryCategorySlug}`,
    );

    revalidatePath(
      `/products/${primaryCategorySlug}/${savedProduct.slug}`,
    );

    revalidatePath(
      `/admin/products/${originalSlug}`,
    );

    revalidatePath(
      `/admin/products/${savedProduct.slug}`,
    );

    return NextResponse.json({
      ok: true,

      product:
        savedProduct,

      removedImages:
        removedImageIds.length,

      removedDocuments:
        removedDocumentIds.length,
    });
  } catch (error) {
    console.error(
      "Admin product update failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update product.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * ============================================
 * DELETE PRODUCT
 * ============================================
 */
export async function DELETE(
  _request: Request,
  context: RouteContext,
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

  const {
    slug: rawSlug,
  } =
    await context.params;

  let slug:
    string;

  try {
    slug =
      decodeURIComponent(
        rawSlug,
      ).trim();
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid product slug.",
      },
      {
        status: 400,
      },
    );
  }

  if (!slug) {
    return NextResponse.json(
      {
        error:
          "Invalid product slug.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    /*
     * Read Cloudinary IDs and remove the
     * product from Neon.
     */
    const databaseResult =
      await deleteDatabaseProduct(
        slug,
      );

    if (
      !databaseResult.deleted
    ) {
      return NextResponse.json(
        {
          error:
            "Product not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * ============================================
     * DELETE PRODUCT IMAGES FROM CLOUDINARY
     * ============================================
     */
    if (
      databaseResult
        .cloudinaryPublicIds
        .length
    ) {
      await Promise.allSettled(
        databaseResult
          .cloudinaryPublicIds
          .map(
            async (
              publicId,
            ) => {
              await deleteProductImage(
                publicId,
              );
            },
          ),
      );
    }

    /*
     * ============================================
     * DELETE PRODUCT DOCUMENTS FROM CLOUDINARY
     * ============================================
     */
    if (
      databaseResult
        .documentCloudinaryPublicIds
        .length
    ) {
      await Promise.allSettled(
        databaseResult
          .documentCloudinaryPublicIds
          .map(
            async (
              publicId,
            ) => {
              await deleteProductDocument(
                publicId,
              );
            },
          ),
      );
    }

    /*
     * Refresh product surfaces after deletion.
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

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Admin product delete failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete product.",
      },
      {
        status: 500,
      },
    );
  }
}