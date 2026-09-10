import {
  NextResponse,
} from "next/server";

import {
  isAdminSession,
} from "@/lib/adminAuth";

import {
  uploadCategoryImage,
  uploadProductDocument,
  uploadProductImage,
  uploadResourceFile,
  uploadResourceImage,
  uploadServiceImage,
} from "@/lib/cloudinary";

export const runtime =
  "nodejs";

const MAX_IMAGE_SIZE =
  10 * 1024 * 1024;

const MAX_DOCUMENT_SIZE =
  25 * 1024 * 1024;

const allowedImageTypes =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
  ]);

const allowedDocumentTypes =
  new Set([
    "application/pdf",

    "application/msword",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "application/vnd.ms-excel",

    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    "application/vnd.ms-powerpoint",

    "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    "text/plain",
  ]);

type UploadKind =
  | "product"
  | "product-document"
  | "category"
  | "service"
  | "resource-image"
  | "resource-file";

function uploadErrorMessage(
  error: unknown,
) {
  return error instanceof Error
    ? error.message
    : "Unable to upload the file.";
}

export async function POST(
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
    const formData =
      await request.formData();

    const file =
      formData.get(
        "file",
      );

    const kindValue =
      formData.get(
        "kind",
      );

    const kind:
      UploadKind =
      kindValue ===
      "product-document"
        ? "product-document"
        : kindValue ===
            "category"
          ? "category"
          : kindValue ===
              "service"
            ? "service"
            : kindValue ===
                "resource-image"
              ? "resource-image"
              : kindValue ===
                  "resource-file"
                ? "resource-file"
                : "product";

    const productSlugValue =
      formData.get(
        "productSlug",
      );

    const categorySlugValue =
      formData.get(
        "categorySlug",
      );

    const serviceSlugValue =
      formData.get(
        "serviceSlug",
      );

    const resourceSlugValue =
      formData.get(
        "resourceSlug",
      );

    const productSlug =
      typeof productSlugValue ===
      "string"
        ? productSlugValue.trim()
        : "";

    const categorySlug =
      typeof categorySlugValue ===
      "string"
        ? categorySlugValue.trim()
        : "";

    const serviceSlug =
      typeof serviceSlugValue ===
      "string"
        ? serviceSlugValue.trim()
        : "";

    const resourceSlug =
      typeof resourceSlugValue ===
      "string"
        ? resourceSlugValue.trim()
        : "";

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            "Please select a file.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      file.size <=
      0
    ) {
      return NextResponse.json(
        {
          error:
            "The selected file is empty.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ========================================
     * RESOURCE DOCUMENT
     * ========================================
     */

    if (
      kind ===
      "resource-file"
    ) {
      if (
        !allowedDocumentTypes.has(
          file.type,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Only PDF, Word, Excel, PowerPoint and text files are allowed.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        file.size >
        MAX_DOCUMENT_SIZE
      ) {
        return NextResponse.json(
          {
            error:
              "Resource files must be 25 MB or smaller.",
          },
          {
            status: 400,
          },
        );
      }

      const buffer =
        Buffer.from(
          await file.arrayBuffer(),
        );

      const result =
        await uploadResourceFile({
          buffer,
          filename:
            file.name,
          resourceSlug,
        });

      return NextResponse.json({
        file: {
          url:
            result.secure_url,

          secureUrl:
            result.secure_url,

          cloudinaryPublicId:
            result.public_id,

          bytes:
            result.bytes,

          format:
            result.format,

          originalFilename:
            result.original_filename ||
            file.name,

          mimeType:
            file.type,

          kind,
        },
      });
    }

    /*
     * ========================================
     * PRODUCT DOCUMENT
     * ========================================
     */

    if (
      kind ===
      "product-document"
    ) {
      if (
        !allowedDocumentTypes.has(
          file.type,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Only PDF, Word, Excel, PowerPoint and text files are allowed.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        file.size >
        MAX_DOCUMENT_SIZE
      ) {
        return NextResponse.json(
          {
            error:
              "Product documents must be 25 MB or smaller.",
          },
          {
            status: 400,
          },
        );
      }

      const buffer =
        Buffer.from(
          await file.arrayBuffer(),
        );

      const result =
        await uploadProductDocument({
          buffer,

          filename:
            file.name,

          productSlug,
        });

      return NextResponse.json({
        file: {
          url:
            result.secure_url,

          secureUrl:
            result.secure_url,

          cloudinaryPublicId:
            result.public_id,

          bytes:
            result.bytes,

          format:
            result.format,

          originalFilename:
            result.original_filename ||
            file.name,

          mimeType:
            file.type,

          kind,
        },
      });
    }

    /*
     * ========================================
     * IMAGE
     * ========================================
     */

    if (
      !allowedImageTypes.has(
        file.type,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only JPG, PNG, WebP and AVIF images are allowed.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "The image must be 10 MB or smaller.",
        },
        {
          status: 400,
        },
      );
    }

    const buffer =
      Buffer.from(
        await file.arrayBuffer(),
      );

    const result =
      kind ===
      "category"
        ? await uploadCategoryImage({
            buffer,

            filename:
              file.name,

            categorySlug,
          })
        : kind ===
            "service"
          ? await uploadServiceImage({
              buffer,

              filename:
                file.name,

              serviceSlug,
            })
          : kind ===
              "resource-image"
            ? await uploadResourceImage({
                buffer,

                filename:
                  file.name,

                resourceSlug,
              })
            : await uploadProductImage({
                buffer,

                filename:
                  file.name,

                productSlug,
              });

    return NextResponse.json({
      image: {
        url:
          result.secure_url,

        secureUrl:
          result.secure_url,

        cloudinaryPublicId:
          result.public_id,

        width:
          result.width,

        height:
          result.height,

        format:
          result.format,

        bytes:
          result.bytes,

        originalFilename:
          result.original_filename ||
          file.name,

        mimeType:
          file.type,

        kind,
      },
    });
  } catch (error) {
    console.error(
      "Cloudinary upload failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          uploadErrorMessage(
            error,
          ),
      },
      {
        status: 500,
      },
    );
  }
}