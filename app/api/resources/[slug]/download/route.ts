import {
  NextResponse,
} from "next/server";

import {
  prisma,
} from "@/lib/prisma";

import {
  getCurrentDealer,
} from "@/lib/dealerAuth";

import {
  createResourceFileDownloadUrl,
} from "@/lib/cloudinary";

export const runtime =
  "nodejs";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const {
      slug,
    } =
      await context.params;

    if (!slug) {
      return NextResponse.json(
        {
          error:
            "Resource slug is required.",
        },
        {
          status: 400,
        },
      );
    }

    const resource =
      await prisma.resource.findUnique({
        where: {
          slug,
        },

        select: {
          id: true,
          title: true,
          slug: true,

          isActive: true,
          access: true,

          fileUrl: true,
          filePublicId:
            true,

          originalFileName:
            true,

          externalUrl:
            true,
        },
      });

    if (!resource) {
      return NextResponse.json(
        {
          error:
            "Resource not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      !resource.isActive
    ) {
      return NextResponse.json(
        {
          error:
            "This resource is not currently available.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      resource.access ===
      "CONTROLLED"
    ) {
      return NextResponse.json(
        {
          error:
            "This resource requires controlled access.",
        },
        {
          status: 403,
        },
      );
    }

    if (
      resource.access ===
      "DEALER"
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
          `/api/resources/${resource.slug}/download`,
        );

        return NextResponse.redirect(
          loginUrl,
        );
      }
    }

    if (
      resource.filePublicId
    ) {
      const downloadUrl =
        createResourceFileDownloadUrl({
          publicId:
            resource.filePublicId,
        });

      return NextResponse.redirect(
        downloadUrl,
      );
    }

    if (
      resource.externalUrl
    ) {
      const target =
        new URL(
          resource.externalUrl,
        );

      if (
        target.protocol !==
          "https:" &&
        target.protocol !==
          "http:"
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid external resource URL.",
          },
          {
            status: 400,
          },
        );
      }

      return NextResponse.redirect(
        target,
      );
    }

    return NextResponse.json(
      {
        error:
          "This resource has no downloadable file attached.",
      },
      {
        status: 404,
      },
    );
  } catch (
    error
  ) {
    console.error(
      "Resource download failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to download this resource.",
      },
      {
        status: 500,
      },
    );
  }
}