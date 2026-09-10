import "server-only";

import {
  ResourceAccess,
  ResourceType,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

export type ResourceInput = {
  title: string;
  slug: string;

  summary?: string | null;
  description?: string | null;

  type?: ResourceType;
  access?: ResourceAccess;

  image?: string | null;
  imagePublicId?: string | null;

  fileUrl?: string | null;
  filePublicId?: string | null;
  originalFileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;

  externalUrl?: string | null;

  position?: number;

  featured?: boolean;
  isActive?: boolean;
};

function cleanText(
  value?: string | null,
) {
  const cleaned =
    value?.trim();

  return cleaned || null;
}

function cleanSlug(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );
}

export async function getAdminResources() {
  return prisma.resource.findMany({
    orderBy: [
      {
        position:
          "asc",
      },
      {
        createdAt:
          "desc",
      },
    ],
  });
}

export async function getResourceById(
  id: string,
) {
  return prisma.resource.findUnique({
    where: {
      id,
    },
  });
}

export async function createResource(
  input: ResourceInput,
) {
  const title =
    input.title.trim();

  if (!title) {
    throw new Error(
      "Resource title is required.",
    );
  }

  const slug =
    cleanSlug(
      input.slug ||
        title,
    );

  if (!slug) {
    throw new Error(
      "A valid resource slug is required.",
    );
  }

  const existing =
    await prisma.resource.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

  if (existing) {
    throw new Error(
      "A resource with this slug already exists.",
    );
  }

  return prisma.resource.create({
    data: {
      title,
      slug,

      summary:
        cleanText(
          input.summary,
        ),

      description:
        cleanText(
          input.description,
        ),

      type:
        input.type ??
        ResourceType.OTHER,

      access:
        input.access ??
        ResourceAccess.PUBLIC,

      image:
        cleanText(
          input.image,
        ),

      imagePublicId:
        cleanText(
          input.imagePublicId,
        ),

      fileUrl:
        cleanText(
          input.fileUrl,
        ),

      filePublicId:
        cleanText(
          input.filePublicId,
        ),

      originalFileName:
        cleanText(
          input.originalFileName,
        ),

      fileSize:
        input.fileSize ??
        null,

      mimeType:
        cleanText(
          input.mimeType,
        ),

      externalUrl:
        cleanText(
          input.externalUrl,
        ),

      position:
        Number.isFinite(
          input.position,
        )
          ? Math.max(
              0,
              Math.trunc(
                input.position!,
              ),
            )
          : 0,

      featured:
        Boolean(
          input.featured,
        ),

      isActive:
        input.isActive ??
        true,
    },
  });
}

export async function updateResource(
  id: string,
  input: ResourceInput,
) {
  const current =
    await prisma.resource.findUnique({
      where: {
        id,
      },
    });

  if (!current) {
    throw new Error(
      "Resource not found.",
    );
  }

  const title =
    input.title.trim();

  if (!title) {
    throw new Error(
      "Resource title is required.",
    );
  }

  const slug =
    cleanSlug(
      input.slug ||
        title,
    );

  if (!slug) {
    throw new Error(
      "A valid resource slug is required.",
    );
  }

  const duplicate =
    await prisma.resource.findFirst({
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

  if (duplicate) {
    throw new Error(
      "Another resource already uses this slug.",
    );
  }

  const resource =
    await prisma.resource.update({
      where: {
        id,
      },

      data: {
        title,
        slug,

        summary:
          cleanText(
            input.summary,
          ),

        description:
          cleanText(
            input.description,
          ),

        type:
          input.type ??
          ResourceType.OTHER,

        access:
          input.access ??
          ResourceAccess.PUBLIC,

        image:
          cleanText(
            input.image,
          ),

        imagePublicId:
          cleanText(
            input.imagePublicId,
          ),

        fileUrl:
          cleanText(
            input.fileUrl,
          ),

        filePublicId:
          cleanText(
            input.filePublicId,
          ),

        originalFileName:
          cleanText(
            input.originalFileName,
          ),

        fileSize:
          input.fileSize ??
          null,

        mimeType:
          cleanText(
            input.mimeType,
          ),

        externalUrl:
          cleanText(
            input.externalUrl,
          ),

        position:
          Number.isFinite(
            input.position,
          )
            ? Math.max(
                0,
                Math.trunc(
                  input.position!,
                ),
              )
            : 0,

        featured:
          Boolean(
            input.featured,
          ),

        isActive:
          input.isActive ??
          true,
      },
    });

  return {
    resource,

    previousImagePublicId:
      current.imagePublicId,

    previousFilePublicId:
      current.filePublicId,
  };
}

export async function deleteResource(
  id: string,
) {
  const current =
    await prisma.resource.findUnique({
      where: {
        id,
      },
    });

  if (!current) {
    throw new Error(
      "Resource not found.",
    );
  }

  await prisma.resource.delete({
    where: {
      id,
    },
  });

  return {
    imagePublicId:
      current.imagePublicId,

    filePublicId:
      current.filePublicId,
  };
}