import "server-only";

import {
  v2 as cloudinary,
  type UploadApiResponse,
} from "cloudinary";

const DEFAULT_PRODUCT_FOLDER =
  "dingsheng-energy/products";

function requiredEnvironmentVariable(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: requiredEnvironmentVariable(
      "CLOUDINARY_CLOUD_NAME",
    ),
    api_key: requiredEnvironmentVariable(
      "CLOUDINARY_API_KEY",
    ),
    api_secret: requiredEnvironmentVariable(
      "CLOUDINARY_API_SECRET",
    ),
    secure: true,
  });
}

export function getCloudinaryProductFolder() {
  return (
    process.env.CLOUDINARY_PRODUCT_FOLDER?.trim() ||
    DEFAULT_PRODUCT_FOLDER
  )
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

export function sanitizeCloudinaryFolderPart(
  value: string,
) {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

  return sanitized || "unassigned";
}

export function productImageFolder(
  productSlug?: string,
) {
  const baseFolder = getCloudinaryProductFolder();

  if (!productSlug?.trim()) {
    return `${baseFolder}/unassigned`;
  }

  return `${baseFolder}/${sanitizeCloudinaryFolderPart(
    productSlug,
  )}`;
}

export function uploadProductImage({
  buffer,
  filename,
  productSlug,
}: {
  buffer: Buffer;
  filename: string;
  productSlug?: string;
}) {
  configureCloudinary();

  return new Promise<UploadApiResponse>(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            resource_type: "image",
            folder: productImageFolder(productSlug),

            use_filename: true,
            unique_filename: true,
            overwrite: false,

            filename_override: filename,
            allowed_formats: [
              "jpg",
              "jpeg",
              "png",
              "webp",
              "avif",
            ],

            transformation: [
              {
                width: 2400,
                height: 2400,
                crop: "limit",
                quality: "auto",
              },
            ],
          },
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            if (!result) {
              reject(
                new Error(
                  "Cloudinary returned no upload result.",
                ),
              );
              return;
            }

            resolve(result);
          },
        );

      uploadStream.end(buffer);
    },
  );
}

export async function deleteProductImage(
  publicId: string,
) {
  configureCloudinary();

  const productFolder =
    getCloudinaryProductFolder();

  /*
   * Prevent this API from deleting images outside
   * the configured product folder.
   */
  if (
    publicId !== productFolder &&
    !publicId.startsWith(`${productFolder}/`)
  ) {
    throw new Error(
      "This image does not belong to the product folder.",
    );
  }

  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
}