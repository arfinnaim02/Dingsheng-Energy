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
  getProduct,
  upsertProduct,
} from "@/lib/catalog";

import {
  deleteProductImage,
} from "@/lib/cloudinary";

import {
  deleteDatabaseProduct,
  saveDatabaseProduct,
} from "@/lib/databaseProducts";

type ProductRequest = Product & {
  managedImages?: ManagedProductImage[];
};

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
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

export async function GET(
  _request: Request,
  context: RouteContext,
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

  const { slug } =
    await context.params;

  const product = await getProduct(
    slug,
    {
      includeProtected: true,
    },
  );

  if (!product) {
    return NextResponse.json(
      {
        error: "Product not found.",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json({
    product,
  });
}

export async function PUT(
  request: Request,
  context: RouteContext,
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

  const { slug } =
    await context.params;

  const previousProduct =
    await getProduct(slug, {
      includeProtected: true,
    });

  if (!previousProduct) {
    return NextResponse.json(
      {
        error: "Product not found.",
      },
      {
        status: 404,
      },
    );
  }

  let savedCatalogProduct:
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

    savedCatalogProduct =
      await upsertProduct(
        productInput as Product,
        slug,
      );

    const databaseResult =
      await saveDatabaseProduct(
        savedCatalogProduct,
        {
          originalSlug: slug,

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
    revalidatePath("/admin/products");

    for (
      const categorySlug of
      savedCatalogProduct.categorySlugs
    ) {
      revalidatePath(
        `/products/${categorySlug}`,
      );
    }

    for (
      const categorySlug of
      previousProduct.categorySlugs
    ) {
      revalidatePath(
        `/products/${categorySlug}`,
      );
    }

    revalidatePath(
      `/products/${savedCatalogProduct.primaryCategorySlug}/${savedCatalogProduct.slug}`,
    );

    revalidatePath(
      `/products/${previousProduct.primaryCategorySlug}/${previousProduct.slug}`,
    );

    return NextResponse.json({
      ok: true,
      product: savedCatalogProduct,
    });
  } catch (error) {
    /*
     * Restore the previous JSON product if
     * database synchronization fails.
     */
    if (savedCatalogProduct) {
      await upsertProduct(
        previousProduct,
        savedCatalogProduct.slug,
      ).catch((rollbackError) => {
        console.error(
          "Unable to restore previous catalogue product:",
          rollbackError,
        );
      });
    }

    console.error(
      "Unable to update product:",
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
        status: 400,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
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

  const { slug } =
    await context.params;

  try {
    const databaseResult =
      await deleteDatabaseProduct(slug);

    await deleteProduct(slug);

    await cleanupCloudinaryImages(
      databaseResult.cloudinaryPublicIds,
    );

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/admin/products");

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Unable to delete product:",
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
        status: 400,
      },
    );
  }
}