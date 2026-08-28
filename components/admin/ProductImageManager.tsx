"use client";

import {
  ChangeEvent,
  DragEvent,
  useRef,
  useState,
} from "react";

import type {
  ManagedProductImage,
} from "@/data/site";

type Props = {
  images: ManagedProductImage[];
  productName: string;
  productSlug: string;
  disabled?: boolean;
  onChange: (
    images: ManagedProductImage[],
  ) => void;
};

type UploadResponse = {
  image?: {
    url?: string;
    secureUrl?: string;
    cloudinaryPublicId?: string;
    width?: number;
    height?: number;
    format?: string;
    bytes?: number;
    originalFilename?: string;
  };
  error?: string;
};

const MAX_IMAGES = 12;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function filenameWithoutExtension(
  filename: string,
) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

function imageKey(
  image: ManagedProductImage,
  index: number,
) {
  return (
    image.id ||
    image.cloudinaryPublicId ||
    `${image.url}-${index}`
  );
}

export function ProductImageManager({
  images,
  productName,
  productSlug,
  disabled = false,
  onChange,
}: Props) {
  const inputReference =
    useRef<HTMLInputElement>(null);

  const [draggingFiles, setDraggingFiles] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [deletingPublicId, setDeletingPublicId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] =
    useState("");

  function normalizePositions(
    nextImages: ManagedProductImage[],
  ) {
    return nextImages.map(
      (image, index) => ({
        ...image,
        position: index,
      }),
    );
  }

  function updateImages(
    nextImages: ManagedProductImage[],
  ) {
    onChange(
      normalizePositions(nextImages),
    );
  }

  function validateFiles(files: File[]) {
    if (!files.length) {
      return "Please select at least one image.";
    }

    if (
      images.length + files.length >
      MAX_IMAGES
    ) {
      return `A product can have a maximum of ${MAX_IMAGES} images.`;
    }

    const invalidType = files.find(
      (file) =>
        !allowedTypes.has(file.type),
    );

    if (invalidType) {
      return `${invalidType.name}: only JPG, PNG, WebP and AVIF images are allowed.`;
    }

    const emptyFile = files.find(
      (file) => file.size <= 0,
    );

    if (emptyFile) {
      return `${emptyFile.name} is empty.`;
    }

    const oversizedFile = files.find(
      (file) =>
        file.size > MAX_FILE_SIZE,
    );

    if (oversizedFile) {
      return `${oversizedFile.name} is larger than 10 MB.`;
    }

    return "";
  }

  async function deleteCloudinaryAsset(
    publicId: string,
  ) {
    const response = await fetch(
      "/api/admin/cloudinary/delete",
      {
        method: "DELETE",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          publicId,
        }),
      },
    );

    const result = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.error ||
          "Unable to remove the uploaded image.",
      );
    }
  }

  async function rollbackUploads(
    uploadedImages: ManagedProductImage[],
  ) {
    await Promise.allSettled(
      uploadedImages.map((image) => {
        if (!image.cloudinaryPublicId) {
          return Promise.resolve();
        }

        return deleteCloudinaryAsset(
          image.cloudinaryPublicId,
        );
      }),
    );
  }

  async function uploadFiles(files: File[]) {
    if (disabled || uploading) {
      return;
    }

    setError("");
    setMessage("");

    const validationError =
      validateFiles(files);

    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);

    const uploadedImages:
      ManagedProductImage[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();

        formData.set("file", file);

        formData.set(
          "productSlug",
          productSlug.trim() ||
            productName.trim() ||
            "unassigned",
        );

        const response = await fetch(
          "/api/admin/cloudinary/upload",
          {
            method: "POST",
            body: formData,
          },
        );

        const result =
          (await response.json()) as UploadResponse;

        if (!response.ok) {
          throw new Error(
            result.error ||
              `Unable to upload ${file.name}.`,
          );
        }

        const url =
          result.image?.secureUrl ||
          result.image?.url;

        const cloudinaryPublicId =
          result.image?.cloudinaryPublicId;

        if (
          !url ||
          !cloudinaryPublicId
        ) {
          throw new Error(
            `Cloudinary returned incomplete information for ${file.name}.`,
          );
        }

        const defaultAlt =
          productName.trim() ||
          filenameWithoutExtension(
            file.name,
          ) ||
          "Product image";

        uploadedImages.push({
          url,
          cloudinaryPublicId,
          alt: defaultAlt,
          position:
            images.length +
            uploadedImages.length,
          uploadedNow: true,
        });
      }

      updateImages([
        ...images,
        ...uploadedImages,
      ]);

      setMessage(
        `${uploadedImages.length} image${
          uploadedImages.length === 1
            ? ""
            : "s"
        } uploaded successfully.`,
      );
    } catch (uploadError) {
      /*
       * If one image in this batch fails,
       * remove the successfully uploaded images
       * from this incomplete batch.
       */
      await rollbackUploads(
        uploadedImages,
      );

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload the images.",
      );
    } finally {
      setUploading(false);

      if (inputReference.current) {
        inputReference.current.value =
          "";
      }
    }
  }

  function handleFileInput(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(
      event.target.files ?? [],
    );

    void uploadFiles(files);
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();

    if (!disabled && !uploading) {
      setDraggingFiles(true);
    }
  }

  function handleDragLeave(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    setDraggingFiles(false);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    setDraggingFiles(false);

    if (disabled || uploading) {
      return;
    }

    const files = Array.from(
      event.dataTransfer.files,
    );

    void uploadFiles(files);
  }

  function updateAlt(
    index: number,
    alt: string,
  ) {
    updateImages(
      images.map((image, imageIndex) =>
        imageIndex === index
          ? {
              ...image,
              alt,
            }
          : image,
      ),
    );
  }

  function moveImage(
    index: number,
    direction: -1 | 1,
  ) {
    const destination =
      index + direction;

    if (
      destination < 0 ||
      destination >= images.length
    ) {
      return;
    }

    const nextImages = [...images];

    [
      nextImages[index],
      nextImages[destination],
    ] = [
      nextImages[destination],
      nextImages[index],
    ];

    updateImages(nextImages);
  }

  function makePrimary(index: number) {
    if (index === 0) {
      return;
    }

    const selectedImage =
      images[index];

    const nextImages =
      images.filter(
        (_, imageIndex) =>
          imageIndex !== index,
      );

    nextImages.unshift(selectedImage);

    updateImages(nextImages);

    setMessage(
      "Primary product image updated. Save the product to apply this change.",
    );
  }

  async function removeImage(
    index: number,
  ) {
    const image = images[index];

    setError("");
    setMessage("");

    /*
     * Existing database images are not deleted from
     * Cloudinary immediately. They are removed from
     * Cloudinary only after the product saves.
     *
     * Images uploaded during this unsaved editor
     * session can be deleted immediately.
     */
    if (
      image.uploadedNow &&
      image.cloudinaryPublicId
    ) {
      setDeletingPublicId(
        image.cloudinaryPublicId,
      );

      try {
        await deleteCloudinaryAsset(
          image.cloudinaryPublicId,
        );
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Unable to remove the image.",
        );

        setDeletingPublicId(null);
        return;
      } finally {
        setDeletingPublicId(null);
      }
    }

    updateImages(
      images.filter(
        (_, imageIndex) =>
          imageIndex !== index,
      ),
    );

    if (image.uploadedNow) {
      setMessage(
        "The unsaved uploaded image was removed.",
      );
    } else {
      setMessage(
        "Image marked for removal. Save the product to apply this change.",
      );
    }
  }

  return (
    <section className="card p-6 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow">
            Product media
          </div>

          <h2 className="mt-2 text-xl font-black">
            Product images
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71838b]">
            Upload up to {MAX_IMAGES} images.
            The first image is used as the primary
            catalogue image.
          </p>
        </div>

        <span className="status">
          {images.length}/{MAX_IMAGES}
        </span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-6 rounded-xl border-2 border-dashed p-7 text-center transition ${
          draggingFiles
            ? "border-[#0a9c63] bg-[#edf9f3]"
            : "border-[#cfded7] bg-[#fafcfb]"
        }`}
      >
        <input
          ref={inputReference}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={
            disabled ||
            uploading ||
            images.length >= MAX_IMAGES
          }
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="text-sm font-black text-[#17313d]">
          {uploading
            ? "Uploading images to Cloudinary..."
            : "Drag product images here"}
        </div>

        <p className="mt-2 text-xs leading-5 text-[#71838b]">
          JPG, PNG, WebP or AVIF · Maximum
          10 MB per image
        </p>

        <button
          type="button"
          disabled={
            disabled ||
            uploading ||
            images.length >= MAX_IMAGES
          }
          onClick={() =>
            inputReference.current?.click()
          }
          className="btn btn-secondary mt-4 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading
            ? "Uploading..."
            : "Choose Images"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {!images.length ? (
        <div className="mt-6 rounded-xl border border-[#e0e9e5] bg-white p-8 text-center text-sm text-[#71838b]">
          No images have been added to this
          product.
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => {
            const deleting =
              deletingPublicId !== null &&
              deletingPublicId ===
                image.cloudinaryPublicId;

            return (
              <article
                key={imageKey(image, index)}
                className={`overflow-hidden rounded-xl border bg-white ${
                  index === 0
                    ? "border-[#0a9c63] ring-2 ring-[#0a9c63]/10"
                    : "border-[#dfe8e4]"
                }`}
              >
                <div className="relative bg-[#f5f8f6] p-3">
                  <img
                    src={image.url}
                    alt={
                      image.alt ||
                      productName ||
                      "Product image"
                    }
                    className="h-48 w-full rounded-lg bg-white object-contain p-3"
                  />

                  {index === 0 && (
                    <span className="absolute left-5 top-5 rounded-full bg-[#0a9c63] px-3 py-1 text-[10px] font-black uppercase tracking-[.08em] text-white">
                      Primary
                    </span>
                  )}

                  {image.uploadedNow && (
                    <span className="absolute right-5 top-5 rounded-full bg-[#17313d] px-3 py-1 text-[10px] font-black uppercase tracking-[.08em] text-white">
                      New
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="field">
                    <label>
                      Alternative text
                    </label>

                    <input
                      value={image.alt}
                      disabled={
                        disabled || deleting
                      }
                      onChange={(event) =>
                        updateAlt(
                          index,
                          event.target.value,
                        )
                      }
                      placeholder="Describe this product image"
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={
                        disabled ||
                        deleting ||
                        index === 0
                      }
                      onClick={() =>
                        makePrimary(index)
                      }
                      className="rounded-md border border-[#cfe2da] px-3 py-2 text-[11px] font-black text-[#08774f] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Set Primary
                    </button>

                    <button
                      type="button"
                      disabled={
                        disabled || deleting
                      }
                      onClick={() =>
                        void removeImage(index)
                      }
                      className="rounded-md border border-red-200 px-3 py-2 text-[11px] font-black text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {deleting
                        ? "Removing..."
                        : "Remove"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        disabled ||
                        deleting ||
                        index === 0
                      }
                      onClick={() =>
                        moveImage(index, -1)
                      }
                      className="rounded-md border border-[#d8e4df] px-3 py-2 text-[11px] font-black text-[#526872] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ← Move Left
                    </button>

                    <button
                      type="button"
                      disabled={
                        disabled ||
                        deleting ||
                        index ===
                          images.length - 1
                      }
                      onClick={() =>
                        moveImage(index, 1)
                      }
                      className="rounded-md border border-[#d8e4df] px-3 py-2 text-[11px] font-black text-[#526872] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Move Right →
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}