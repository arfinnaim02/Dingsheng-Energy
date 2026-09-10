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
  deleteCategoryImage,
} from "@/lib/cloudinary";

import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
  type CategoryInput,
  type CategoryMediaState,
} from "@/lib/databaseCategories";

async function unauthorized() {
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

function refreshCategoryPaths() {
  /*
   * Home may contain category-related
   * navigation or catalogue data.
   */
  revalidatePath(
    "/",
  );

  /*
   * Main products landing page.
   */
  revalidatePath(
    "/products",
  );

  /*
   * All recursive product-category pages.
   */
  revalidatePath(
    "/products/category/[...segments]",
    "page",
  );

  /*
   * Admin category manager.
   */
  revalidatePath(
    "/admin/categories",
  );
}

async function result() {
  return NextResponse.json({
    ok: true,

    categories:
      await getAdminCategories(),
  });
}

function replacedOrRemovedPublicIds(
  before: CategoryMediaState,
  after: CategoryMediaState,
): string[] {
  const publicIds:
    string[] = [];

  /*
   * Card image:
   *
   * If the old persisted asset differs
   * from the new persisted asset, the DB
   * no longer references the old one.
   */

  if (
    before.imagePublicId &&
    before.imagePublicId !==
      after.imagePublicId
  ) {
    publicIds.push(
      before.imagePublicId,
    );
  }

  /*
   * Hero image.
   */

  if (
    before.heroImagePublicId &&
    before.heroImagePublicId !==
      after.heroImagePublicId
  ) {
    publicIds.push(
      before.heroImagePublicId,
    );
  }

  return [
    ...new Set(
      publicIds,
    ),
  ];
}

async function cleanupCategoryImages(
  publicIds: Array<
    | string
    | null
    | undefined
  >,
) {
  const cleanedPublicIds = [
    ...new Set(
      publicIds
        .map(
          (value) =>
            value?.trim() ??
            "",
        )
        .filter(Boolean),
    ),
  ];

  if (
    !cleanedPublicIds.length
  ) {
    return;
  }

  /*
   * Database work has already succeeded
   * before this function is called.
   *
   * A Cloudinary cleanup failure must not
   * falsely report that the category save
   * itself failed.
   */

  await Promise.allSettled(
    cleanedPublicIds.map(
      async (
        publicId,
      ) => {
        try {
          const response =
            await deleteCategoryImage(
              publicId,
            );

          if (
            response.result !==
              "ok" &&
            response.result !==
              "not found"
          ) {
            console.error(
              `Cloudinary returned "${response.result}" while deleting category image "${publicId}".`,
            );
          }
        } catch (
          error
        ) {
          console.error(
            `Unable to clean up category image "${publicId}":`,
            error,
          );
        }
      },
    ),
  );
}

export async function GET() {
  if (
    !(await isAdminSession())
  ) {
    return unauthorized();
  }

  return NextResponse.json({
    categories:
      await getAdminCategories(),
  });
}

export async function POST(
  request: Request,
) {
  if (
    !(await isAdminSession())
  ) {
    return unauthorized();
  }

  try {
    const body =
      (await request.json()) as
        CategoryInput;

    await createCategory(
      body,
    );

    refreshCategoryPaths();

    return result();
  } catch (
    error
  ) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create category.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function PUT(
  request: Request,
) {
  if (
    !(await isAdminSession())
  ) {
    return unauthorized();
  }

  try {
    const body =
      (await request.json()) as
        CategoryInput & {
          id?: string;
        };

    if (!body.id) {
      return NextResponse.json(
        {
          error:
            "Category id is required.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      id,
      ...input
    } = body;

    /*
     * updateCategory performs the Neon
     * update first and returns both the
     * previous and current Cloudinary
     * public IDs.
     */
    const mediaChange =
      await updateCategory(
        id,
        input,
      );

    /*
     * IMPORTANT:
     *
     * Only after the DB points to the new
     * asset do we delete replaced/removed
     * Cloudinary images.
     *
     * This avoids breaking a persisted
     * category if the database update
     * fails.
     */
    await cleanupCategoryImages(
      replacedOrRemovedPublicIds(
        mediaChange.before,
        mediaChange.after,
      ),
    );

    refreshCategoryPaths();

    return result();
  } catch (
    error
  ) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update category.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function DELETE(
  request: Request,
) {
  if (
    !(await isAdminSession())
  ) {
    return unauthorized();
  }

  try {
    const id =
      new URL(
        request.url,
      ).searchParams.get(
        "id",
      );

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Category id is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * deleteCategory first verifies that:
     *
     * - no child category exists
     * - no product is assigned
     *
     * It then removes the category from
     * Neon and returns the Cloudinary
     * public IDs formerly owned by it.
     */
    const media =
      await deleteCategory(
        id,
      );

    /*
     * It is now safe to remove its
     * Cloudinary media.
     */
    await cleanupCategoryImages([
      media.imagePublicId,
      media.heroImagePublicId,
    ]);

    refreshCategoryPaths();

    return result();
  } catch (
    error
  ) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete category.",
      },
      {
        status: 400,
      },
    );
  }
}