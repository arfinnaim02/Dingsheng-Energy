import "server-only";

import type {
  ManagedProductImage,
} from "@/data/site";

import { prisma } from "@/lib/prisma";

export type SavedProductImage = {
  id: string;
  url: string;
  cloudinaryPublicId: string | null;
  alt: string;
  position: number;
};

function cleanText(
  value: unknown,
  maximumLength: number,
) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maximumLength);
}

function cleanNullableText(
  value: unknown,
  maximumLength: number,
) {
  const cleaned = cleanText(
    value,
    maximumLength,
  );

  return cleaned || null;
}

function normalizeImages(
  images: ManagedProductImage[],
) {
  const seenUrls = new Set<string>();
  const seenPublicIds = new Set<string>();

  const normalized: Array<{
    url: string;
    cloudinaryPublicId: string | null;
    alt: string | null;
    position: number;
  }> = [];

  for (const image of images) {
    const url = cleanText(
      image.url,
      2000,
    );

    const cloudinaryPublicId =
      cleanNullableText(
        image.cloudinaryPublicId,
        500,
      );

    const alt = cleanNullableText(
      image.alt,
      300,
    );

    if (!url) {
      continue;
    }

    if (seenUrls.has(url)) {
      continue;
    }

    if (
      cloudinaryPublicId &&
      seenPublicIds.has(cloudinaryPublicId)
    ) {
      continue;
    }

    seenUrls.add(url);

    if (cloudinaryPublicId) {
      seenPublicIds.add(
        cloudinaryPublicId,
      );
    }

    normalized.push({
      url,
      cloudinaryPublicId,
      alt,
      position: normalized.length,
    });
  }

  return normalized;
}

export async function getProductImages(
  productSlug: string,
): Promise<SavedProductImage[]> {
  const slug = productSlug.trim();

  if (!slug) {
    return [];
  }

  const product =
    await prisma.product.findUnique({
      where: {
        slug,
      },

      select: {
        images: {
          select: {
            id: true,
            url: true,
            cloudinaryPublicId: true,
            alt: true,
            position: true,
          },

          orderBy: [
            {
              position: "asc",
            },
            {
              id: "asc",
            },
          ],
        },
      },
    });

  if (!product) {
    return [];
  }

  return product.images.map(
    (image) => ({
      id: image.id,
      url: image.url,
      cloudinaryPublicId:
        image.cloudinaryPublicId,
      alt: image.alt ?? "",
      position: image.position,
    }),
  );
}

export async function replaceProductImages(
  productId: string,
  images: ManagedProductImage[],
) {
  const normalizedImages =
    normalizeImages(images);

  const existingImages =
    await prisma.productImage.findMany({
      where: {
        productId,
      },

      select: {
        cloudinaryPublicId: true,
      },
    });

  const retainedPublicIds = new Set(
    normalizedImages
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
  );

  const removedCloudinaryPublicIds =
    existingImages
      .map(
        (image) =>
          image.cloudinaryPublicId,
      )
      .filter(
        (
          publicId,
        ): publicId is string =>
          Boolean(publicId),
      )
      .filter(
        (publicId) =>
          !retainedPublicIds.has(
            publicId,
          ),
      );

  await prisma.$transaction(
    async (transaction) => {
      await transaction.productImage.deleteMany({
        where: {
          productId,
        },
      });

      if (normalizedImages.length) {
        await transaction.productImage.createMany({
          data: normalizedImages.map(
            (image) => ({
              productId,
              url: image.url,
              cloudinaryPublicId:
                image.cloudinaryPublicId,
              alt: image.alt,
              position: image.position,
            }),
          ),
        });
      }
    },
    {
      maxWait: 10000,
      timeout: 20000,
    },
  );

  return {
    images: normalizedImages,
    removedCloudinaryPublicIds: [
      ...new Set(
        removedCloudinaryPublicIds,
      ),
    ],
  };
}

export async function getProductImagePublicIds(
  productSlug: string,
) {
  const images =
    await prisma.productImage.findMany({
      where: {
        product: {
          slug: productSlug,
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

export function legacyProductImages({
  primaryImage,
  gallery,
  productName,
}: {
  primaryImage?: string;
  gallery?: string[];
  productName: string;
}): ManagedProductImage[] {
  const urls = [
    primaryImage,
    ...(gallery ?? []),
  ]
    .map((url) => url?.trim() ?? "")
    .filter(Boolean);

  return [
    ...new Set(urls),
  ].map((url, index) => ({
    url,
    cloudinaryPublicId: null,
    alt:
      index === 0
        ? productName
        : `${productName} image ${index + 1}`,
    position: index,
  }));
}