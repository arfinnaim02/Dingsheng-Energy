import {
  NextResponse,
} from "next/server";

import {
  createProductDocumentDownloadUrl,
} from "@/lib/cloudinary";

import {
  getCurrentDealer,
} from "@/lib/dealerAuth";

import {
  prisma,
} from "@/lib/prisma";

export const runtime =
  "nodejs";

type RouteContext = {
  params: Promise<{
    product: string;
    index: string;
  }>;
};

function safeExternalUrl(
  value: string,
) {
  try {
    const url =
      new URL(
        value,
      );

    return (
      url.protocol ===
        "https:" ||
      url.protocol ===
        "http:"
    );
  } catch {
    return false;
  }
}

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const {
      product:
        rawProductSlug,

      index:
        rawDocumentId,
    } =
      await context.params;

    const productSlug =
      decodeURIComponent(
        rawProductSlug,
      );

    const documentId =
      decodeURIComponent(
        rawDocumentId,
      );

    const document =
      await prisma.productDocument.findFirst(
        {
          where: {
            id:
              documentId,

            product: {
              slug:
                productSlug,

              isActive:
                true,
            },
          },

          select: {
            id: true,

            filePath:
              true,

            cloudinaryPublicId:
              true,

            dealerOnly:
              true,
          },
        },
      );

    if (!document) {
      return NextResponse.json(
        {
          error:
            "Product document not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      document.dealerOnly
    ) {
      const dealer =
        await getCurrentDealer();

      if (!dealer) {
        const loginUrl =
          new URL(
            "/dealer/login",
            request.url,
          );

        loginUrl.searchParams.set(
          "next",
          `/api/products/${encodeURIComponent(
            productSlug,
          )}/documents/${encodeURIComponent(
            document.id,
          )}`,
        );

        return NextResponse.redirect(
          loginUrl,
          307,
        );
      }
    }

    if (
      document.cloudinaryPublicId
    ) {
      const downloadUrl =
        createProductDocumentDownloadUrl(
          {
            publicId:
              document.cloudinaryPublicId,
          },
        );

      return NextResponse.redirect(
        downloadUrl,
        307,
      );
    }

    /*
     * Legacy fallback.
     *
     * Old product documents may still only
     * contain a normal filePath.
     */
    if (
      document.filePath &&
      safeExternalUrl(
        document.filePath,
      )
    ) {
      return NextResponse.redirect(
        document.filePath,
        307,
      );
    }

    return NextResponse.json(
      {
        error:
          "This product document has no valid downloadable file.",
      },
      {
        status: 404,
      },
    );
  } catch (error) {
    console.error(
      "Product document download failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to open this product document.",
      },
      {
        status: 500,
      },
    );
  }
}