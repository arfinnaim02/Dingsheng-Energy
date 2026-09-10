import {
  prisma,
} from "@/lib/prisma";

import {
  MAX_TREE_DEPTH,
  buildTree,
  getNodeDepth,
  validateParentChange,
} from "@/lib/categoryTree";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;

  shortName: string | null;
  summary: string | null;
  description: string | null;

  image: string | null;
  imagePublicId: string | null;

  heroImage: string | null;
  heroImagePublicId: string | null;

  parentId: string | null;
  position: number;
  isActive: boolean;

  productCount: number;
  childCount: number;
};

export type CategoryInput = {
  name?: string;
  slug?: string;

  shortName?: string | null;
  summary?: string | null;
  description?: string | null;

  image?: string | null;
  imagePublicId?: string | null;

  heroImage?: string | null;
  heroImagePublicId?: string | null;

  parentId?: string | null;
  position?: number;
  isActive?: boolean;
};

export type CategoryMediaState = {
  imagePublicId: string | null;
  heroImagePublicId: string | null;
};

export type CategoryUpdateResult = {
  before: CategoryMediaState;
  after: CategoryMediaState;
};

export function slugifyTaxonomy(
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

function cleanNullable(
  value:
    | string
    | null
    | undefined,
) {
  if (value === undefined) {
    return undefined;
  }

  const cleaned =
    value?.trim() ?? "";

  return cleaned || null;
}

export async function getAdminCategories(): Promise<
  AdminCategory[]
> {
  const categories =
    await prisma.productCategory.findMany({
      orderBy: [
        {
          position: "asc",
        },
        {
          name: "asc",
        },
      ],

      include: {
        _count: {
          select: {
            assignments: true,
            children: true,
          },
        },
      },
    });

  return categories.map(
    (category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,

      shortName:
        category.shortName,

      summary:
        category.summary,

      description:
        category.description,

      image:
        category.image,

      imagePublicId:
        category.imagePublicId,

      heroImage:
        category.heroImage,

      heroImagePublicId:
        category.heroImagePublicId,

      parentId:
        category.parentId,

      position:
        category.position,

      isActive:
        category.isActive,

      productCount:
        category._count.assignments,

      childCount:
        category._count.children,
    }),
  );
}

export async function getPublicCategories() {
  return prisma.productCategory.findMany({
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

      /*
       * Public pages only need the
       * Cloudinary secure URLs.
       *
       * Public IDs remain private to
       * administration/media management.
       */
      image: true,
      heroImage: true,

      parentId: true,
      position: true,
      isActive: true,
    },
  });
}

export async function getPublicCategoryTree() {
  return buildTree(
    await getPublicCategories(),
  );
}

async function nextPosition(
  parentId: string | null,
) {
  const aggregate =
    await prisma.productCategory.aggregate({
      where: {
        parentId,
      },

      _max: {
        position: true,
      },
    });

  return (
    (aggregate._max.position ?? -1) +
    1
  );
}

export async function createCategory(
  input: CategoryInput,
): Promise<void> {
  const name =
    input.name?.trim();

  if (!name) {
    throw new Error(
      "Category name is required.",
    );
  }

  const all =
    await getAdminCategories();

  const parentId =
    input.parentId ?? null;

  validateParentChange(
    all,
    null,
    parentId,
  );

  const slug =
    slugifyTaxonomy(
      input.slug?.trim() ||
        name,
    );

  if (!slug) {
    throw new Error(
      "A valid category slug is required.",
    );
  }

  const existing =
    await prisma.productCategory.findUnique({
      where: {
        slug,
      },

      select: {
        id: true,
      },
    });

  if (existing) {
    throw new Error(
      `A category with slug "${slug}" already exists.`,
    );
  }

  const position =
    Number.isInteger(
      input.position,
    ) &&
    (input.position ?? 0) >= 0
      ? input.position!
      : await nextPosition(
          parentId,
        );

  await prisma.productCategory.create({
    data: {
      name,
      slug,

      shortName:
        cleanNullable(
          input.shortName,
        ),

      summary:
        cleanNullable(
          input.summary,
        ),

      description:
        cleanNullable(
          input.description,
        ),

      image:
        cleanNullable(
          input.image,
        ),

      imagePublicId:
        cleanNullable(
          input.imagePublicId,
        ),

      heroImage:
        cleanNullable(
          input.heroImage,
        ),

      heroImagePublicId:
        cleanNullable(
          input.heroImagePublicId,
        ),

      parentId,
      position,

      isActive:
        input.isActive !== false,
    },
  });
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<CategoryUpdateResult> {
  const current =
    await prisma.productCategory.findUnique({
      where: {
        id,
      },
    });

  if (!current) {
    throw new Error(
      "Category not found.",
    );
  }

  const all =
    await getAdminCategories();

  const parentId =
    input.parentId === undefined
      ? current.parentId
      : input.parentId;

  validateParentChange(
    all,
    id,
    parentId,
  );

  const name =
    input.name === undefined
      ? current.name
      : input.name.trim();

  if (!name) {
    throw new Error(
      "Category name is required.",
    );
  }

  const slug =
    input.slug === undefined
      ? current.slug
      : slugifyTaxonomy(
          input.slug.trim() ||
            name,
        );

  if (!slug) {
    throw new Error(
      "A valid category slug is required.",
    );
  }

  const collision =
    await prisma.productCategory.findFirst({
      where: {
        slug,

        NOT: {
          id,
        },
      },

      select: {
        id: true,
      },
    });

  if (collision) {
    throw new Error(
      `A category with slug "${slug}" already exists.`,
    );
  }

  const updated =
    await prisma.productCategory.update({
      where: {
        id,
      },

      data: {
        name,
        slug,

        shortName:
          cleanNullable(
            input.shortName,
          ),

        summary:
          cleanNullable(
            input.summary,
          ),

        description:
          cleanNullable(
            input.description,
          ),

        image:
          cleanNullable(
            input.image,
          ),

        imagePublicId:
          cleanNullable(
            input.imagePublicId,
          ),

        heroImage:
          cleanNullable(
            input.heroImage,
          ),

        heroImagePublicId:
          cleanNullable(
            input.heroImagePublicId,
          ),

        parentId,

        position:
          input.position === undefined
            ? current.position
            : Math.max(
                0,
                Math.trunc(
                  input.position,
                ),
              ),

        isActive:
          input.isActive === undefined
            ? current.isActive
            : input.isActive,
      },

      select: {
        imagePublicId:
          true,

        heroImagePublicId:
          true,
      },
    });

  return {
    before: {
      imagePublicId:
        current.imagePublicId,

      heroImagePublicId:
        current.heroImagePublicId,
    },

    after: {
      imagePublicId:
        updated.imagePublicId,

      heroImagePublicId:
        updated.heroImagePublicId,
    },
  };
}

export async function deleteCategory(
  id: string,
): Promise<CategoryMediaState> {
  const category =
    await prisma.productCategory.findUnique({
      where: {
        id,
      },

      include: {
        _count: {
          select: {
            assignments: true,
            children: true,
          },
        },
      },
    });

  if (!category) {
    throw new Error(
      "Category not found.",
    );
  }

  if (
    category._count.children >
    0
  ) {
    throw new Error(
      "This category has child categories. Move or delete those children first.",
    );
  }

  if (
    category._count.assignments >
    0
  ) {
    throw new Error(
      `This category is assigned to ${category._count.assignments} product(s). Reassign those products first.`,
    );
  }

  await prisma.productCategory.delete({
    where: {
      id,
    },
  });

  /*
   * Return media ownership information
   * after the DB deletion.
   *
   * The API will now safely remove these
   * Cloudinary assets.
   */
  return {
    imagePublicId:
      category.imagePublicId,

    heroImagePublicId:
      category.heroImagePublicId,
  };
}

export async function getCategoryDepth(
  id: string,
): Promise<number> {
  const all =
    await getAdminCategories();

  const depth =
    getNodeDepth(
      all,
      id,
    );

  if (
    depth >
    MAX_TREE_DEPTH
  ) {
    throw new Error(
      `Maximum tree depth is ${MAX_TREE_DEPTH} levels.`,
    );
  }

  return depth;
}