import {
  revalidatePath,
} from "next/cache";

import {
  NextResponse,
} from "next/server";

import {
  isAdminSession,
} from "@/lib/adminAuth";

import {
  deleteProductImage,
} from "@/lib/cloudinary";

import {
  applyProductBulkAction,
  type ProductBulkAction,
} from "@/lib/databaseProducts";

import {
  prisma,
} from "@/lib/prisma";

const allowedActions:
  ProductBulkAction[] = [
    "activate",
    "hide",
    "feature",
    "unfeature",
    "delete",
  ];

type RequestBody = {
  slugs?: string[];
  action?: ProductBulkAction;
};

type CloudinaryCleanupResult = {
  requested: number;
  removed: number;
  failed: number;
};

function cleanSlugs(
  values: string[],
) {
  return [
    ...new Set(
      values
        .filter(
          (value) =>
            typeof value === "string",
        )
        .map((value) =>
          value.trim(),
        )
        .filter(Boolean),
    ),
  ];
}

async function getCloudinaryPublicIds(
  slugs: string[],
) {
  if (!slugs.length) {
    return [];
  }

  const images =
    await prisma.productImage.findMany({
      where: {
        product: {
          slug: {
            in: slugs,
          },
        },

        cloudinaryPublicId: {
          not: null,
        },
      },

      select: {
        cloudinaryPublicId: true,
      },
    });

  return [
    ...new Set(
      images
        .map(
          (image) =>
            image.cloudinaryPublicId,
        )
        .filter(
          (
            publicId,
          ): publicId is string =>
            Boolean(publicId),
        ),
    ),
  ];
}

async function cleanupCloudinaryImages(
  publicIds: string[],
): Promise<CloudinaryCleanupResult> {
  if (!publicIds.length) {
    return {
      requested: 0,
      removed: 0,
      failed: 0,
    };
  }

  const results =
    await Promise.allSettled(
      publicIds.map((publicId) =>
        deleteProductImage(publicId),
      ),
    );

  let removed = 0;
  let failed = 0;

  results.forEach(
    (result, index) => {
      if (
        result.status === "fulfilled"
      ) {
        const cloudinaryResult =
          result.value.result;

        if (
          cloudinaryResult === "ok" ||
          cloudinaryResult ===
            "not found"
        ) {
          removed += 1;
          return;
        }

        failed += 1;

        console.error(
          `Unexpected Cloudinary deletion result for ${publicIds[index]}:`,
          cloudinaryResult,
        );

        return;
      }

      failed += 1;

      console.error(
        `Unable to delete Cloudinary product image ${publicIds[index]}:`,
        result.reason,
      );
    },
  );

  return {
    requested:
      publicIds.length,

    removed,
    failed,
  };
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

  const body =
    (await request.json().catch(
      () => null,
    )) as RequestBody | null;

  if (
    !body?.action ||
    !allowedActions.includes(
      body.action,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Select a valid product action.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !Array.isArray(body.slugs) ||
    !body.slugs.length
  ) {
    return NextResponse.json(
      {
        error:
          "Select at least one product.",
      },
      {
        status: 400,
      },
    );
  }

  const slugs =
    cleanSlugs(body.slugs);

  if (!slugs.length) {
    return NextResponse.json(
      {
        error:
          "Select at least one valid product.",
      },
      {
        status: 400,
      },
    );
  }

  if (slugs.length > 200) {
    return NextResponse.json(
      {
        error:
          "A maximum of 200 products can be updated at once.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    /*
     * ProductImage rows are deleted automatically
     * with their Product rows. Therefore, collect
     * Cloudinary public IDs before bulk deletion.
     */
    const cloudinaryPublicIds =
      body.action === "delete"
        ? await getCloudinaryPublicIds(
            slugs,
          )
        : [];

    /*
     * This performs the protected Neon and JSON
     * catalogue operation. If it fails, no
     * Cloudinary files are deleted.
     */
    const result =
      await applyProductBulkAction(
        slugs,
        body.action,
      );

    /*
     * Cloudinary cleanup happens only after the
     * database/catalogue deletion succeeds.
     */
    const cloudinaryCleanup =
      body.action === "delete"
        ? await cleanupCloudinaryImages(
            cloudinaryPublicIds,
          )
        : {
            requested: 0,
            removed: 0,
            failed: 0,
          };

    revalidatePath(
      "/admin/products",
    );

    revalidatePath(
      "/admin/pricing",
    );

    revalidatePath(
      "/admin/operations",
    );

    revalidatePath("/");
    revalidatePath("/products");

    revalidatePath(
      "/dealer/products",
    );

    revalidatePath(
      "/dealer/cart",
    );

    revalidatePath(
      "/dealer/checkout",
    );

    revalidatePath(
      "/dealer/rfq",
    );

    return NextResponse.json({
      ok: true,
      result,
      cloudinaryCleanup,

      warning:
        cloudinaryCleanup.failed > 0
          ? `${cloudinaryCleanup.failed} Cloudinary image could not be removed. The product deletion succeeded, but the failed image cleanup was recorded in the server log.`
          : null,
    });
  } catch (error) {
    console.error(
      "Bulk product action failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update products.",
      },
      {
        status: 400,
      },
    );
  }
}