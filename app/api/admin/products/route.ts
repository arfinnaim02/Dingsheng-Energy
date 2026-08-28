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
  deleteProduct,
  getProducts,
  upsertProduct,
} from "@/lib/catalog";

import {
  deleteProductImage,
} from "@/lib/cloudinary";

import {
  saveDatabaseProduct,
} from "@/lib/databaseProducts";

type ProductRequest = Product & {
  managedImages?: ManagedProductImage[];
};

async function cleanupCloudinaryImages(
  publicIds: string[],
) {
  const results =
    await Promise.allSettled(
      publicIds.map((publicId) =>
        deleteProductImage(publicId),
      ),
    );

  results.forEach(
    (result, index) => {
      if (result.status === "rejected") {
        console.error(
          `Unable to remove Cloudinary image ${publicIds[index]}:`,
          result.reason,
        );
      }
    },
  );
}

export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  return NextResponse.json({
    products: await getProducts({
      activeOnly: false,
      includeProtected: true,
    }),
  });
}

export async function POST(
  request: Request,
) {
  if (!(await isAdminSession())) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  let catalogProduct:
    | Product
    | undefined;

  try {
    const body =
      (await request.json()) as ProductRequest;

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

    if (!body.categorySlugs?.length) {
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

    catalogProduct =
      await upsertProduct(
        productInput as Product,
      );

    const databaseResult =
      await saveDatabaseProduct(
        catalogProduct,
        {
          managedImages:
            Array.isArray(managedImages)
              ? managedImages
              : undefined,
        },
      );

    await cleanupCloudinaryImages(
      databaseResult
        .removedCloudinaryPublicIds,
    );

    revalidatePath("/");
    revalidatePath("/products");

    revalidatePath(
      `/products/${catalogProduct.primaryCategorySlug}`,
    );

    revalidatePath(
      `/products/${catalogProduct.primaryCategorySlug}/${catalogProduct.slug}`,
    );

    revalidatePath("/admin/products");

    return NextResponse.json(
      {
        ok: true,
        product: catalogProduct,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    /*
     * If JSON was created but Neon failed,
     * remove the incomplete new catalogue entry.
     */
    if (catalogProduct) {
      await deleteProduct(
        catalogProduct.slug,
      ).catch((rollbackError) => {
        console.error(
          "Unable to roll back catalogue product:",
          rollbackError,
        );
      });
    }

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