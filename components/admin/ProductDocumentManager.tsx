"use client";

import {
  useState,
} from "react";

import type {
  ManagedProductDocument,
} from "@/data/site";

type Props = {
  productSlug: string;

  documents:
    ManagedProductDocument[];

  onChange: (
    documents:
      ManagedProductDocument[],
  ) => void;
};

function documentName(
  document:
    ManagedProductDocument,
) {
  return (
    document.originalFileName ||
    document.title ||
    "Product document"
  );
}

export function ProductDocumentManager({
  productSlug,
  documents,
  onChange,
}: Props) {
  const [
    uploading,
    setUploading,
  ] =
    useState<
      "public" |
      "dealer" |
      null
    >(null);

  const [
    error,
    setError,
  ] =
    useState("");

  async function upload(
    file:
      | File
      | undefined,

    dealerOnly:
      boolean,
  ) {
    if (!file) {
      return;
    }

    setError("");

    setUploading(
      dealerOnly
        ? "dealer"
        : "public",
    );

    try {
      const formData =
        new FormData();

      formData.set(
        "file",
        file,
      );

      formData.set(
        "kind",
        "product-document",
      );

      formData.set(
        "productSlug",
        productSlug ||
          "unassigned",
      );

      const response =
        await fetch(
          "/api/admin/cloudinary/upload",
          {
            method:
              "POST",

            body:
              formData,
          },
        );

      const result =
        (await response
          .json()
          .catch(
            () => ({}),
          )) as {
          file?: {
            url?: string;

            secureUrl?:
              string;

            cloudinaryPublicId?:
              string;

            originalFilename?:
              string;

            mimeType?:
              string;
          };

          error?: string;
        };

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Document upload failed.",
        );
      }

      const fileUrl =
        result.file
          ?.secureUrl ||
        result.file?.url;

      const publicId =
        result.file
          ?.cloudinaryPublicId;

      if (
        !fileUrl ||
        !publicId
      ) {
        throw new Error(
          "Cloudinary did not return complete document metadata.",
        );
      }

      const sameAccessDocuments =
        documents.filter(
          (document) =>
            document.dealerOnly ===
            dealerOnly,
        );

      const next:
        ManagedProductDocument =
        {
          title:
            file.name.replace(
              /\.[^/.]+$/,
              "",
            ),

          filePath:
            fileUrl,

          cloudinaryPublicId:
            publicId,

          originalFileName:
            result.file
              ?.originalFilename ||
            file.name,

          mimeType:
            result.file
              ?.mimeType ||
            file.type ||
            "application/pdf",

          dealerOnly,

          position:
            sameAccessDocuments.length,

          uploadedNow:
            true,
        };

      onChange([
        ...documents,
        next,
      ]);
    } catch (
      uploadError
    ) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Document upload failed.",
      );
    } finally {
      setUploading(
        null,
      );
    }
  }

  async function remove(
    index: number,
  ) {
    const document =
      documents[index];

    if (!document) {
      return;
    }

    if (
      document.uploadedNow &&
      document.cloudinaryPublicId
    ) {
      try {
        const response =
          await fetch(
            "/api/admin/cloudinary/delete",
            {
              method:
                "DELETE",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  publicId:
                    document.cloudinaryPublicId,

                  kind:
                    "product-document",
                }),
            },
          );

        if (
          !response.ok
        ) {
          const result =
            await response
              .json()
              .catch(
                () => ({}),
              );

          throw new Error(
            result.error ||
              "Unable to remove uploaded document.",
          );
        }
      } catch (
        removeError
      ) {
        setError(
          removeError instanceof Error
            ? removeError.message
            : "Unable to remove uploaded document.",
        );

        return;
      }
    }

    onChange(
      documents.filter(
        (
          _document,
          documentIndex,
        ) =>
          documentIndex !==
          index,
      ),
    );
  }

  function updateTitle(
    index: number,
    title: string,
  ) {
    onChange(
      documents.map(
        (
          document,
          documentIndex,
        ) =>
          documentIndex ===
          index
            ? {
                ...document,
                title,
              }
            : document,
      ),
    );
  }

  const publicDocuments =
    documents
      .map(
        (
          document,
          index,
        ) => ({
          document,
          index,
        }),
      )
      .filter(
        ({
          document,
        }) =>
          !document.dealerOnly,
      );

  const dealerDocuments =
    documents
      .map(
        (
          document,
          index,
        ) => ({
          document,
          index,
        }),
      )
      .filter(
        ({
          document,
        }) =>
          document.dealerOnly,
      );

  function documentSection(
    dealerOnly:
      boolean,
  ) {
    const items =
      dealerOnly
        ? dealerDocuments
        : publicDocuments;

    return (
      <div className="field">
        <label>
          {dealerOnly
            ? "Dealer-only documents"
            : "Public documents"}
        </label>

        <div className="grid gap-3">
          {items.length ? (
            items.map(
              ({
                document,
                index,
              }) => (
                <div
                  key={
                    document.id ||
                    document.cloudinaryPublicId ||
                    `${document.filePath}-${index}`
                  }
                  className="rounded-lg border border-[#dfe8e4] bg-[#f8fbf9] p-4"
                >
                  <div className="text-[11px] font-black text-[#173a48]">
                    {documentName(
                      document,
                    )}
                  </div>

                  <input
                    className="mt-3"
                    value={
                      document.title
                    }
                    onChange={(
                      event,
                    ) =>
                      updateTitle(
                        index,
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Document title"
                  />

                  <div className="mt-2 break-all text-[10px] text-[#71838b]">
                    {document.mimeType ||
                      "Document"}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void remove(
                        index,
                      )
                    }
                    className="mt-3 text-[10px] font-black uppercase text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ),
            )
          ) : (
            <div className="rounded-lg border border-dashed border-[#ccd9d3] bg-[#fafcfb] p-4 text-[11px] text-[#71838b]">
              No{" "}
              {dealerOnly
                ? "dealer-only"
                : "public"}{" "}
              documents added.
            </div>
          )}
        </div>

        <label className="btn btn-secondary mt-3 w-full cursor-pointer">
          <input
            className="hidden"
            type="file"
            accept="application/pdf,.pdf"
            disabled={
              uploading !==
              null
            }
            onChange={(
              event,
            ) => {
              const input =
                event.currentTarget;

              void upload(
                input.files?.[0],
                dealerOnly,
              ).finally(
                () => {
                  input.value =
                    "";
                },
              );
            }}
          />

          {uploading ===
          (dealerOnly
            ? "dealer"
            : "public")
            ? "Uploading..."
            : dealerOnly
              ? "Upload Dealer PDF"
              : "Upload Public PDF"}
        </label>
      </div>
    );
  }

  return (
    <div>
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <div className="form-grid">
        {documentSection(
          false,
        )}

        {documentSection(
          true,
        )}
      </div>
    </div>
  );
}