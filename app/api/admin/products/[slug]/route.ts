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

import {
  upsertProduct,
} from "@/lib/catalog";

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
 * UPDATE PRODUCT
 * ============================================
 */

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  /*
   * API routes must use isAdminSession().
   *
   * requireAdmin() is intended for protected
   * server pages/layouts and returns void.
   */
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
      );
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
     * managedImages and managedDocuments are not
     * part of the legacy Product object itself.
     *
     * Pass them separately to saveDatabaseProduct()
     * so the dedicated DB managers can replace the
     * relevant child records.
     */
    const {
      managedImages,
      managedDocuments,
      ...productInput
    } =
      body;

    /*
     * ============================================
     * SAVE NEON PRODUCT
     * ============================================
     */

    const databaseResult =
      await saveDatabaseProduct(
        productInput,
        {
          originalSlug,

          managedImages,

          /*
           * IMPORTANT:
           *
           * [] means:
           * delete all existing ProductDocument rows.
           *
           * undefined means:
           * don't touch existing documents.
           */
          managedDocuments,
        },
      );

    /*
     * ============================================
     * DELETE REMOVED CLOUDINARY PRODUCT IMAGES
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
     *
     * The DB rows have already been replaced by
     * replaceProductDocuments().
     *
     * Only after that succeeds do we remove the old
     * physical files from Cloudinary.
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

    /*
     * ============================================
     * LEGACY CATALOG COMPATIBILITY
     * ============================================
     *
     * Parts of the website still read catalog.json.
     * Keep this until the later Neon-only migration.
     */

    await upsertProduct(
      productInput,
      originalSlug,
    );

    return NextResponse.json(
      {
        ok: true,

        product:
          databaseResult.product,

        removedImages:
          removedImageIds.length,

        removedDocuments:
          removedDocumentIds.length,
      },
    );
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
      );
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

  try {
    /*
     * First read Cloudinary IDs and remove the
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
     * Keep legacy catalog.json synchronized until
     * we complete the Neon-only catalog migration.
     */

    return NextResponse.json(
      {
        ok: true,
      },
    );
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