import { NextResponse } from "next/server";

import { isAdminSession } from "@/lib/adminAuth";
import { uploadProductImage } from "@/lib/cloudinary";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function uploadErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to upload the image.";
}

export async function POST(request: Request) {
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
    const formData = await request.formData();

    const file = formData.get("file");
    const productSlugValue =
      formData.get("productSlug");

    const productSlug =
      typeof productSlugValue === "string"
        ? productSlugValue.trim()
        : "";

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Please select an image.",
        },
        {
          status: 400,
        },
      );
    }

    if (!allowedImageTypes.has(file.type)) {
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

    if (file.size <= 0) {
      return NextResponse.json(
        {
          error: "The selected image is empty.",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
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

    const arrayBuffer =
      await file.arrayBuffer();

    const result = await uploadProductImage({
      buffer: Buffer.from(arrayBuffer),
      filename: file.name,
      productSlug,
    });

    return NextResponse.json({
      image: {
        url: result.secure_url,
        secureUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        originalFilename:
          result.original_filename || file.name,
      },
    });
  } catch (error) {
    console.error(
      "Cloudinary product upload failed:",
      error,
    );

    return NextResponse.json(
      {
        error: uploadErrorMessage(error),
      },
      {
        status: 500,
      },
    );
  }
}