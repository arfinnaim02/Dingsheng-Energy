import {
  revalidatePath,
} from "next/cache";

import {
  NextResponse,
} from "next/server";

import type {
  ManagedProductImage,
  Product,
} from "@/data/site";

import {
  isAdminSession,
} from "@/lib/adminAuth";

import {
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
  };

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

  /*
   * TEMPORARY LEGACY READ
   *
   * Reading catalog.json is allowed on Vercel.
   * Only runtime writes are forbidden.
   *
   * We will migrate product reads to Neon
   * separately after CRUD is stable.
   */
  return NextResponse.json({
    products:
      await getProducts({
        activeOnly: false,
        includeProtected: true,
      }),
  });
}

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

    if (!body.name?.trim()) {
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

    if (
      !body.categorySlugs
        ?.length
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

    const {
      managedImages,
      ...productInput
    } = body;

    /*
     * IMPORTANT:
     *
     * Save directly to Neon.
     *
     * Do NOT call:
     *
     * upsertProduct()
     * writeCatalog()
     *
     * Those write catalog.json and fail on Vercel.
     */

    const databaseResult =
      await saveDatabaseProduct(
        productInput as Product,
        {
          managedImages:
            Array.isArray(
              managedImages,
            )
              ? managedImages
              : undefined,
        },
      );

    /*
     * Any old Cloudinary images that were replaced
     * can now be safely deleted.
     */

    await cleanupCloudinaryImages(
      databaseResult
        .removedCloudinaryPublicIds,
    );

    const savedProduct =
      databaseResult.product;

    /*
     * Refresh pages that may show product data.
     */

    revalidatePath("/");
    revalidatePath(
      "/products",
    );
    revalidatePath(
      "/admin/products",
    );

    if (
      productInput
        .primaryCategorySlug
    ) {
      revalidatePath(
        `/products/${productInput.primaryCategorySlug}`,
      );

      revalidatePath(
        `/products/${productInput.primaryCategorySlug}/${savedProduct.slug}`,
      );
    }

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