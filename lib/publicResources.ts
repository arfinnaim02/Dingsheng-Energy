import "server-only";

import {
  prisma,
} from "@/lib/prisma";

export async function getPublicResources() {
  return prisma.resource.findMany({
    where: {
      isActive:
        true,
    },

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

    select: {
      id: true,
      title: true,
      slug: true,

      summary: true,
      description: true,

      type: true,
      access: true,

      image: true,

      originalFileName:
        true,

      mimeType: true,
      fileSize: true,

      externalUrl:
        true,

      featured: true,

      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getPublicResourceBySlug(
  slug: string,
) {
  return prisma.resource.findFirst({
    where: {
      slug,
      isActive:
        true,
    },

    select: {
      id: true,
      title: true,
      slug: true,

      summary: true,
      description: true,

      type: true,
      access: true,

      image: true,

      originalFileName:
        true,

      mimeType: true,
      fileSize: true,

      externalUrl:
        true,

      featured: true,

      createdAt: true,
      updatedAt: true,
    },
  });
}