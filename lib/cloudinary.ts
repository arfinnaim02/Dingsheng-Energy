import "server-only";

import {
  v2 as cloudinary,
  type UploadApiResponse,
} from "cloudinary";

/* =========================================
   DEFAULT CLOUDINARY FOLDERS
========================================= */

const DEFAULT_PRODUCT_FOLDER =
  "dingsheng-energy/products";

const DEFAULT_CATEGORY_FOLDER =
  "dingsheng-energy/categories";

const DEFAULT_SERVICE_FOLDER =
  "dingsheng-energy/services";

const DEFAULT_RESOURCE_FOLDER =
  "dingsheng-energy/resources";

/* =========================================
   ENVIRONMENT
========================================= */

function requiredEnvironmentVariable(
  name: string,
) {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name:
      requiredEnvironmentVariable(
        "CLOUDINARY_CLOUD_NAME",
      ),

    api_key:
      requiredEnvironmentVariable(
        "CLOUDINARY_API_KEY",
      ),

    api_secret:
      requiredEnvironmentVariable(
        "CLOUDINARY_API_SECRET",
      ),

    secure: true,
  });
}

/* =========================================
   COMMON HELPERS
========================================= */

function cleanFolder(
  value: string,
) {
  return value
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function cleanFormat(
  value?: string | null,
) {
  const cleaned =
    value
      ?.trim()
      .toLowerCase()
      .replace(/^\./, "")
      .replace(
        /[^a-z0-9]+/g,
        "",
      );

  return (
    cleaned ||
    "pdf"
  );
}

/* =========================================
   BASE FOLDERS
========================================= */

export function getCloudinaryProductFolder() {
  return cleanFolder(
    process.env
      .CLOUDINARY_PRODUCT_FOLDER
      ?.trim() ||
      DEFAULT_PRODUCT_FOLDER,
  );
}

export function getCloudinaryCategoryFolder() {
  return cleanFolder(
    process.env
      .CLOUDINARY_CATEGORY_FOLDER
      ?.trim() ||
      DEFAULT_CATEGORY_FOLDER,
  );
}

export function getCloudinaryServiceFolder() {
  return cleanFolder(
    process.env
      .CLOUDINARY_SERVICE_FOLDER
      ?.trim() ||
      DEFAULT_SERVICE_FOLDER,
  );
}

export function getCloudinaryResourceFolder() {
  return cleanFolder(
    process.env
      .CLOUDINARY_RESOURCE_FOLDER
      ?.trim() ||
      DEFAULT_RESOURCE_FOLDER,
  );
}

/* =========================================
   SANITIZING
========================================= */

export function sanitizeCloudinaryFolderPart(
  value: string,
) {
  const sanitized =
    value
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9-_]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      )
      .slice(
        0,
        100,
      );

  return (
    sanitized ||
    "unassigned"
  );
}

/* =========================================
   PRODUCT / CATEGORY / SERVICE FOLDERS
========================================= */

export function productImageFolder(
  productSlug?: string,
) {
  return `${getCloudinaryProductFolder()}/${sanitizeCloudinaryFolderPart(
    productSlug ||
      "unassigned",
  )}`;
}

export function productDocumentFolder(
  productSlug?: string,
) {
  return `${getCloudinaryProductFolder()}/${sanitizeCloudinaryFolderPart(
    productSlug ||
      "unassigned",
  )}/documents`;
}

export function categoryImageFolder(
  categorySlug?: string,
) {
  return `${getCloudinaryCategoryFolder()}/${sanitizeCloudinaryFolderPart(
    categorySlug ||
      "unassigned",
  )}`;
}

export function serviceImageFolder(
  serviceSlug?: string,
) {
  return `${getCloudinaryServiceFolder()}/${sanitizeCloudinaryFolderPart(
    serviceSlug ||
      "unassigned",
  )}`;
}

/* =========================================
   RESOURCE FOLDERS
========================================= */

export function resourceFolder(
  resourceSlug?: string,
) {
  return `${getCloudinaryResourceFolder()}/${sanitizeCloudinaryFolderPart(
    resourceSlug ||
      "unassigned",
  )}`;
}

export function resourceImageFolder(
  resourceSlug?: string,
) {
  return `${resourceFolder(
    resourceSlug,
  )}/images`;
}

export function resourceFileFolder(
  resourceSlug?: string,
) {
  return `${resourceFolder(
    resourceSlug,
  )}/files`;
}

/* =========================================
   CLOUDINARY FOLDER OWNERSHIP
========================================= */

function publicIdBelongsToFolder(
  publicId: string,
  folder: string,
) {
  return (
    publicId ===
      folder ||
    publicId.startsWith(
      `${folder}/`,
    )
  );
}

/* =========================================
   IMAGE UPLOAD
========================================= */

function uploadImage({
  buffer,
  filename,
  folder,
}: {
  buffer: Buffer;
  filename: string;
  folder: string;
}) {
  configureCloudinary();

  return new Promise<UploadApiResponse>(
    (
      resolve,
      reject,
    ) => {
      const stream =
        cloudinary.uploader.upload_stream(
          {
            resource_type:
              "image",

            folder,

            use_filename:
              true,

            unique_filename:
              true,

            overwrite:
              false,

            filename_override:
              filename,

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

          (
            error,
            result,
          ) => {
            if (error) {
              reject(
                error,
              );

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

            resolve(
              result,
            );
          },
        );

      stream.end(
        buffer,
      );
    },
  );
}

/* =========================================
   PRODUCT IMAGE UPLOAD
========================================= */

export function uploadProductImage({
  buffer,
  filename,
  productSlug,
}: {
  buffer: Buffer;
  filename: string;
  productSlug?: string;
}) {
  return uploadImage({
    buffer,
    filename,

    folder:
      productImageFolder(
        productSlug,
      ),
  });
}

/* =========================================
   CATEGORY IMAGE UPLOAD
========================================= */

export function uploadCategoryImage({
  buffer,
  filename,
  categorySlug,
}: {
  buffer: Buffer;
  filename: string;
  categorySlug?: string;
}) {
  return uploadImage({
    buffer,
    filename,

    folder:
      categoryImageFolder(
        categorySlug,
      ),
  });
}

/* =========================================
   SERVICE IMAGE UPLOAD
========================================= */

export function uploadServiceImage({
  buffer,
  filename,
  serviceSlug,
}: {
  buffer: Buffer;
  filename: string;
  serviceSlug?: string;
}) {
  return uploadImage({
    buffer,
    filename,

    folder:
      serviceImageFolder(
        serviceSlug,
      ),
  });
}

/* =========================================
   RESOURCE IMAGE UPLOAD
========================================= */

export function uploadResourceImage({
  buffer,
  filename,
  resourceSlug,
}: {
  buffer: Buffer;
  filename: string;
  resourceSlug?: string;
}) {
  return uploadImage({
    buffer,
    filename,

    folder:
      resourceImageFolder(
        resourceSlug,
      ),
  });
}

/* =========================================
   RESOURCE FILE UPLOAD

   Protected Cloudinary raw asset.
   The real document URL should not be
   exposed directly to the public client.
========================================= */

export function uploadResourceFile({
  buffer,
  filename,
  resourceSlug,
}: {
  buffer: Buffer;
  filename: string;
  resourceSlug?: string;
}) {
  configureCloudinary();

  return new Promise<UploadApiResponse>(
    (
      resolve,
      reject,
    ) => {
      const stream =
        cloudinary.uploader.upload_stream(
          {
            resource_type:
              "raw",

            type:
              "authenticated",

            folder:
              resourceFileFolder(
                resourceSlug,
              ),

            use_filename:
              true,

            unique_filename:
              true,

            overwrite:
              false,

            filename_override:
              filename,
          },

          (
            error,
            result,
          ) => {
            if (error) {
              reject(
                error,
              );

              return;
            }

            if (!result) {
              reject(
                new Error(
                  "Cloudinary returned no resource file upload result.",
                ),
              );

              return;
            }

            resolve(
              result,
            );
          },
        );

      stream.end(
        buffer,
      );
    },
  );
}

/* =========================================
   PRODUCT DOCUMENT UPLOAD

   Product documents use authenticated
   delivery as well. This is especially
   important for dealer-only documents.
========================================= */

export function uploadProductDocument({
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
    (
      resolve,
      reject,
    ) => {
      const stream =
        cloudinary.uploader.upload_stream(
          {
            resource_type:
              "raw",

            type:
              "authenticated",

            folder:
              productDocumentFolder(
                productSlug,
              ),

            use_filename:
              true,

            unique_filename:
              true,

            overwrite:
              false,

            filename_override:
              filename,
          },

          (
            error,
            result,
          ) => {
            if (error) {
              reject(
                error,
              );

              return;
            }

            if (!result) {
              reject(
                new Error(
                  "Cloudinary returned no product document upload result.",
                ),
              );

              return;
            }

            resolve(
              result,
            );
          },
        );

      stream.end(
        buffer,
      );
    },
  );
}

/* =========================================
   RESOURCE FILE SIGNED DOWNLOAD URL
========================================= */

export function createResourceFileDownloadUrl({
  publicId,
  format,
}: {
  publicId: string;
  format?: string | null;
}) {
  configureCloudinary();

  const cleanedPublicId =
    publicId.trim();

  if (!cleanedPublicId) {
    throw new Error(
      "Cloudinary resource public ID is required.",
    );
  }

  if (
    !publicIdBelongsToFolder(
      cleanedPublicId,
      getCloudinaryResourceFolder(),
    )
  ) {
    throw new Error(
      "This file does not belong to the Resources Cloudinary folder.",
    );
  }

  return cloudinary.utils.private_download_url(
    cleanedPublicId,

    cleanFormat(
      format,
    ),

    {
      resource_type:
        "raw",

      type:
        "authenticated",

      attachment:
        false,

      expires_at:
        Math.floor(
          Date.now() / 1000,
        ) + 300,
    },
  );
}

/* =========================================
   PRODUCT DOCUMENT SIGNED DOWNLOAD URL
========================================= */

export function createProductDocumentDownloadUrl({
  publicId,
  format,
}: {
  publicId: string;
  format?: string | null;
}) {
  configureCloudinary();

  const cleanedPublicId =
    publicId.trim();

  if (!cleanedPublicId) {
    throw new Error(
      "Cloudinary product document public ID is required.",
    );
  }

  if (
    !publicIdBelongsToFolder(
      cleanedPublicId,
      getCloudinaryProductFolder(),
    )
  ) {
    throw new Error(
      "This document does not belong to the Products Cloudinary folder.",
    );
  }

  return cloudinary.utils.private_download_url(
    cleanedPublicId,

    cleanFormat(
      format,
    ),

    {
      resource_type:
        "raw",

      type:
        "authenticated",

      attachment:
        false,

      expires_at:
        Math.floor(
          Date.now() / 1000,
        ) + 300,
    },
  );
}

/* =========================================
   GENERIC IMAGE DELETE
========================================= */

async function deleteImageFromFolder(
  publicId: string,
  folder: string,
) {
  configureCloudinary();

  const cleanedPublicId =
    publicId.trim();

  if (!cleanedPublicId) {
    throw new Error(
      "Cloudinary public ID is required.",
    );
  }

  if (
    !publicIdBelongsToFolder(
      cleanedPublicId,
      folder,
    )
  ) {
    throw new Error(
      "This image does not belong to the expected Cloudinary folder.",
    );
  }

  return cloudinary.uploader.destroy(
    cleanedPublicId,
    {
      resource_type:
        "image",

      invalidate:
        true,
    },
  );
}

/* =========================================
   PRODUCT IMAGE DELETE
========================================= */

export function deleteProductImage(
  publicId: string,
) {
  return deleteImageFromFolder(
    publicId,
    getCloudinaryProductFolder(),
  );
}

/* =========================================
   CATEGORY IMAGE DELETE
========================================= */

export function deleteCategoryImage(
  publicId: string,
) {
  return deleteImageFromFolder(
    publicId,
    getCloudinaryCategoryFolder(),
  );
}

/* =========================================
   SERVICE IMAGE DELETE
========================================= */

export function deleteServiceImage(
  publicId: string,
) {
  return deleteImageFromFolder(
    publicId,
    getCloudinaryServiceFolder(),
  );
}

/* =========================================
   RESOURCE IMAGE DELETE
========================================= */

export function deleteResourceImage(
  publicId: string,
) {
  return deleteImageFromFolder(
    publicId,
    getCloudinaryResourceFolder(),
  );
}

/* =========================================
   PRODUCT DOCUMENT DELETE
========================================= */

export async function deleteProductDocument(
  publicId: string,
) {
  configureCloudinary();

  const cleanedPublicId =
    publicId.trim();

  if (!cleanedPublicId) {
    throw new Error(
      "Cloudinary product document public ID is required.",
    );
  }

  if (
    !publicIdBelongsToFolder(
      cleanedPublicId,
      getCloudinaryProductFolder(),
    )
  ) {
    throw new Error(
      "This file does not belong to the Products Cloudinary folder.",
    );
  }

  return cloudinary.uploader.destroy(
    cleanedPublicId,
    {
      resource_type:
        "raw",

      type:
        "authenticated",

      invalidate:
        true,
    },
  );
}

/* =========================================
   RESOURCE FILE DELETE
========================================= */

export async function deleteResourceFile(
  publicId: string,
) {
  configureCloudinary();

  const cleanedPublicId =
    publicId.trim();

  if (!cleanedPublicId) {
    throw new Error(
      "Cloudinary resource public ID is required.",
    );
  }

  if (
    !publicIdBelongsToFolder(
      cleanedPublicId,
      getCloudinaryResourceFolder(),
    )
  ) {
    throw new Error(
      "This file does not belong to the Resources Cloudinary folder.",
    );
  }

  return cloudinary.uploader.destroy(
    cleanedPublicId,
    {
      resource_type:
        "raw",

      type:
        "authenticated",

      invalidate:
        true,
    },
  );
}