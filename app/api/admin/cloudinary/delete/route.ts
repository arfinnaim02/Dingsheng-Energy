import { NextResponse } from "next/server";

import { isAdminSession } from "@/lib/adminAuth";
import { deleteProductImage } from "@/lib/cloudinary";

export const runtime = "nodejs";

type DeleteImageBody = {
  publicId?: unknown;
};

export async function DELETE(
  request: Request,
) {
  if (!(await isAdminSession())) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const body =
      (await request.json()) as DeleteImageBody;

    const publicId =
      typeof body.publicId === "string"
        ? body.publicId.trim()
        : "";

    if (!publicId) {
      return NextResponse.json(
        {
          error:
            "Cloudinary public ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (publicId.length > 500) {
      return NextResponse.json(
        {
          error: "Invalid Cloudinary public ID.",
        },
        {
          status: 400,
        },
      );
    }

    const result =
      await deleteProductImage(publicId);

    if (
      result.result !== "ok" &&
      result.result !== "not found"
    ) {
      return NextResponse.json(
        {
          error:
            "Cloudinary could not delete the image.",
        },
        {
          status: 502,
        },
      );
    }

    return NextResponse.json({
      success: true,
      result: result.result,
    });
  } catch (error) {
    console.error(
      "Cloudinary product deletion failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete the image.",
      },
      {
        status: 500,
      },
    );
  }
}