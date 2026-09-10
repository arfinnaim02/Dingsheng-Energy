import {
  NextResponse,
} from "next/server";

import {
  isAdminSession,
} from "@/lib/adminAuth";

import {
  deleteCategoryImage,
  deleteProductDocument,
  deleteProductImage,
  deleteResourceFile,
  deleteResourceImage,
  deleteServiceImage,
} from "@/lib/cloudinary";

export const runtime =
  "nodejs";

type DeleteKind =
  | "product"
  | "product-document"
  | "category"
  | "service"
  | "resource-image"
  | "resource-file";

type DeleteBody = {
  publicId?: unknown;
  kind?: unknown;
};

export async function DELETE(
  request: Request,
) {
  if (
    !(await isAdminSession())
  ) {
    return NextResponse.json(
      {
        error:
          "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const body =
      (await request.json()) as DeleteBody;

    const publicId =
      typeof body.publicId ===
      "string"
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

    if (
      publicId.length >
      500
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid Cloudinary public ID.",
        },
        {
          status: 400,
        },
      );
    }

    const kind:
      DeleteKind =
      body.kind ===
      "product-document"
        ? "product-document"
        : body.kind ===
            "category"
          ? "category"
          : body.kind ===
              "service"
            ? "service"
            : body.kind ===
                "resource-image"
              ? "resource-image"
              : body.kind ===
                  "resource-file"
                ? "resource-file"
                : "product";

    const result =
      kind ===
      "product-document"
        ? await deleteProductDocument(
            publicId,
          )
        : kind ===
            "category"
          ? await deleteCategoryImage(
              publicId,
            )
          : kind ===
              "service"
            ? await deleteServiceImage(
                publicId,
              )
            : kind ===
                "resource-image"
              ? await deleteResourceImage(
                  publicId,
                )
              : kind ===
                  "resource-file"
                ? await deleteResourceFile(
                    publicId,
                  )
                : await deleteProductImage(
                    publicId,
                  );

    if (
      result.result !==
        "ok" &&
      result.result !==
        "not found"
    ) {
      return NextResponse.json(
        {
          error:
            "Cloudinary could not delete the asset.",
        },
        {
          status: 502,
        },
      );
    }

    return NextResponse.json({
      success: true,
      result:
        result.result,
    });
  } catch (error) {
    console.error(
      "Cloudinary asset deletion failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete the asset.",
      },
      {
        status: 500,
      },
    );
  }
}