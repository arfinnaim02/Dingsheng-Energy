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

export async function GET(
  request: Request,
  context: {
    params:
      Promise<{
        id: string;
      }>;
  },
) {
  const {
    id,
  } =
    await context.params;

  const resource =
    await prisma.resource.findFirst({
      where: {
        id,
        isActive:
          true,
      },

      select: {
        id: true,

        access: true,

        filePublicId:
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
        `/api/resources/${resource.id}/download`,
      );

      return NextResponse.redirect(
        loginUrl,
      );
    }
  }

  if (
    resource.filePublicId
  ) {
    const signedUrl =
      createResourceFileDownloadUrl({
        publicId:
          resource.filePublicId,
      });

    return NextResponse.redirect(
      signedUrl,
    );
  }

  if (
    resource.externalUrl
  ) {
    try {
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
        throw new Error();
      }

      return NextResponse.redirect(
        target,
      );
    } catch {
      return NextResponse.json(
        {
          error:
            "The resource URL is invalid.",
        },
        {
          status: 400,
        },
      );
    }
  }

  return NextResponse.json(
    {
      error:
        "No downloadable file is configured for this resource.",
    },
    {
      status: 404,
    },
  );
}