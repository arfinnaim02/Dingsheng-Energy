import "server-only";

import type {
  ManagedProductDocument,
} from "@/data/site";

import {
  prisma,
} from "@/lib/prisma";

function cleanOptional(
  value:
    | string
    | null
    | undefined,
) {
  const cleaned =
    value?.trim() ?? "";

  return cleaned || null;
}

function normalizeDocuments(
  documents:
    ManagedProductDocument[],
) {
  return documents
    .map(
      (
        document,
        index,
      ) => ({
        title:
          document.title.trim() ||
          document.originalFileName?.trim() ||
          `Product document ${index + 1}`,

        filePath:
          document.filePath.trim(),

        cloudinaryPublicId:
          cleanOptional(
            document.cloudinaryPublicId,
          ),

        originalFileName:
          cleanOptional(
            document.originalFileName,
          ),

        mimeType:
          cleanOptional(
            document.mimeType,
          ),

        dealerOnly:
          Boolean(
            document.dealerOnly,
          ),

        position:
          index,
      }),
    )
    .filter(
      (document) =>
        Boolean(
          document.filePath,
        ),
    );
}

export async function getProductDocuments(
  productSlug: string,
): Promise<
  ManagedProductDocument[]
> {
  const documents =
    await prisma.productDocument.findMany(
      {
        where: {
          product: {
            slug:
              productSlug,
          },
        },

        orderBy: [
          {
            dealerOnly:
              "asc",
          },

          {
            position:
              "asc",
          },

          {
            createdAt:
              "asc",
          },
        ],

        select: {
          id: true,
          title: true,
          filePath: true,

          cloudinaryPublicId:
            true,

          originalFileName:
            true,

          mimeType:
            true,

          dealerOnly:
            true,

          position:
            true,
        },
      },
    );

  return documents.map(
    (document) => ({
      id:
        document.id,

      title:
        document.title,

      filePath:
        document.filePath,

      cloudinaryPublicId:
        document.cloudinaryPublicId,

      originalFileName:
        document.originalFileName,

      mimeType:
        document.mimeType,

      dealerOnly:
        document.dealerOnly,

      position:
        document.position,
    }),
  );
}

export async function getPublicProductDocuments(
  productSlug: string,
) {
  return prisma.productDocument.findMany(
    {
      where: {
        dealerOnly:
          false,

        product: {
          slug:
            productSlug,

          isActive:
            true,
        },
      },

      orderBy: [
        {
          position:
            "asc",
        },

        {
          createdAt:
            "asc",
        },
      ],

      select: {
        id: true,
        title: true,

        originalFileName:
          true,

        mimeType:
          true,
      },
    },
  );
}

export async function replaceProductDocuments(
  productId: string,
  documents:
    ManagedProductDocument[],
) {
  const normalized =
    normalizeDocuments(
      documents,
    );

  const existing =
    await prisma.productDocument.findMany(
      {
        where: {
          productId,
        },

        select: {
          cloudinaryPublicId:
            true,
        },
      },
    );

  const previousPublicIds =
    new Set(
      existing
        .map(
          (document) =>
            document.cloudinaryPublicId,
        )
        .filter(
          (
            publicId,
          ): publicId is string =>
            Boolean(
              publicId,
            ),
        ),
    );

  const nextPublicIds =
    new Set(
      normalized
        .map(
          (document) =>
            document.cloudinaryPublicId,
        )
        .filter(
          (
            publicId,
          ): publicId is string =>
            Boolean(
              publicId,
            ),
        ),
    );

  await prisma.$transaction(
    async (
      transaction,
    ) => {
      await transaction.productDocument.deleteMany(
        {
          where: {
            productId,
          },
        },
      );

      if (
        normalized.length
      ) {
        await transaction.productDocument.createMany(
          {
            data:
              normalized.map(
                (
                  document,
                ) => ({
                  productId,

                  title:
                    document.title,

                  filePath:
                    document.filePath,

                  cloudinaryPublicId:
                    document.cloudinaryPublicId,

                  originalFileName:
                    document.originalFileName,

                  mimeType:
                    document.mimeType,

                  dealerOnly:
                    document.dealerOnly,

                  position:
                    document.position,
                }),
              ),
          },
        );
      }
    },
  );

  const removedCloudinaryPublicIds =
    [
      ...previousPublicIds,
    ].filter(
      (publicId) =>
        !nextPublicIds.has(
          publicId,
        ),
    );

  return {
    removedCloudinaryPublicIds,
  };
}

export function legacyProductDocuments({
  publicDownloads,
  dealerDownloads,
}: {
  publicDownloads?:
    string[];

  dealerDownloads?:
    string[];
}): ManagedProductDocument[] {
  const publicDocuments =
    (
      publicDownloads ??
      []
    ).map(
      (
        filePath,
        position,
      ) => ({
        title:
          `Public document ${position + 1}`,

        filePath,

        cloudinaryPublicId:
          null,

        originalFileName:
          null,

        mimeType:
          null,

        dealerOnly:
          false,

        position,
      }),
    );

  const dealerDocuments =
    (
      dealerDownloads ??
      []
    ).map(
      (
        filePath,
        position,
      ) => ({
        title:
          `Dealer document ${position + 1}`,

        filePath,

        cloudinaryPublicId:
          null,

        originalFileName:
          null,

        mimeType:
          null,

        dealerOnly:
          true,

        position,
      }),
    );

  return [
    ...publicDocuments,
    ...dealerDocuments,
  ];
}