"use client";

import {
  useMemo,
  useState,
} from "react";

type Resource = {
  id: string;

  title: string;
  slug: string;

  summary:
    | string
    | null;

  description:
    | string
    | null;

  type: string;
  access: string;

  image:
    | string
    | null;

  imagePublicId:
    | string
    | null;

  fileUrl:
    | string
    | null;

  filePublicId:
    | string
    | null;

  originalFileName:
    | string
    | null;

  fileSize:
    | number
    | null;

  mimeType:
    | string
    | null;

  externalUrl:
    | string
    | null;

  position: number;

  featured: boolean;
  isActive: boolean;
};

type FormState = {
  id?: string;

  title: string;
  slug: string;

  summary: string;
  description: string;

  type: string;
  access: string;

  image: string;
  imagePublicId: string;

  fileUrl: string;
  filePublicId: string;

  originalFileName:
    string;

  fileSize:
    number | null;

  mimeType: string;

  externalUrl: string;

  position: number;

  featured: boolean;
  isActive: boolean;
};

const emptyForm: FormState = {
  title: "",
  slug: "",

  summary: "",
  description: "",

  type: "OTHER",
  access: "PUBLIC",

  image: "",
  imagePublicId: "",

  fileUrl: "",
  filePublicId: "",

  originalFileName: "",
  fileSize: null,
  mimeType: "",

  externalUrl: "",

  position: 0,

  featured: false,
  isActive: true,
};

const resourceTypes = [
  {
    value: "COMPANY",
    label: "Company",
  },
  {
    value: "CATALOGUE",
    label: "Catalogue",
  },
  {
    value: "DATASHEET",
    label: "Datasheet",
  },
  {
    value: "TECHNICAL",
    label: "Technical",
  },
  {
    value: "COMMERCIAL",
    label: "Commercial",
  },
  {
    value: "INSTALLATION",
    label: "Installation",
  },
  {
    value: "SERVICE",
    label: "Service",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

const accessOptions = [
  {
    value: "PUBLIC",
    label: "Public",
  },
  {
    value: "DEALER",
    label: "Approved Dealer",
  },
  {
    value: "CONTROLLED",
    label: "Controlled Access",
  },
];

function slugify(
  value: string,
) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );
}

function resourceTypeLabel(
  value: string,
) {
  return (
    resourceTypes.find(
      (type) =>
        type.value === value,
    )?.label || value
  );
}

function accessLabel(
  value: string,
) {
  return (
    accessOptions.find(
      (option) =>
        option.value === value,
    )?.label || value
  );
}

function formatFileSize(
  bytes:
    | number
    | null,
) {
  if (
    !bytes ||
    bytes <= 0
  ) {
    return "";
  }

  if (
    bytes <
    1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(
      1,
    )} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(
    2,
  )} MB`;
}

function formFromResource(
  resource: Resource,
): FormState {
  return {
    id:
      resource.id,

    title:
      resource.title,

    slug:
      resource.slug,

    summary:
      resource.summary ||
      "",

    description:
      resource.description ||
      "",

    type:
      resource.type,

    access:
      resource.access,

    image:
      resource.image ||
      "",

    imagePublicId:
      resource.imagePublicId ||
      "",

    fileUrl:
      resource.fileUrl ||
      "",

    filePublicId:
      resource.filePublicId ||
      "",

    originalFileName:
      resource.originalFileName ||
      "",

    fileSize:
      resource.fileSize,

    mimeType:
      resource.mimeType ||
      "",

    externalUrl:
      resource.externalUrl ||
      "",

    position:
      resource.position,

    featured:
      resource.featured,

    isActive:
      resource.isActive,
  };
}

export function ResourceManager({
  initialResources,
}: {
  initialResources:
    Resource[];
}) {
  const [
    resources,
    setResources,
  ] =
    useState<Resource[]>(
      initialResources,
    );

  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      emptyForm,
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    deleting,
    setDeleting,
  ] =
    useState<
      string | null
    >(null);

  const [
    uploadingImage,
    setUploadingImage,
  ] =
    useState(false);

  const [
    uploadingFile,
    setUploadingFile,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    messageType,
    setMessageType,
  ] =
    useState<
      | "success"
      | "error"
      | ""
    >("");

  const sortedResources =
    useMemo(
      () =>
        [
          ...resources,
        ].sort(
          (
            a,
            b,
          ) =>
            a.position -
              b.position ||
            a.title.localeCompare(
              b.title,
            ),
        ),
      [resources],
    );

  const currentSlug =
    form.slug.trim() ||
    slugify(
      form.title,
    ) ||
    "unassigned";

  function showMessage(
    text: string,
    type:
      | "success"
      | "error",
  ) {
    setMessage(
      text,
    );

    setMessageType(
      type,
    );
  }

  function clearMessage() {
    setMessage(
      "",
    );

    setMessageType(
      "",
    );
  }

  function startNew() {
    setForm({
      ...emptyForm,
    });

    clearMessage();
  }

  function editResource(
    resource: Resource,
  ) {
    setForm(
      formFromResource(
        resource,
      ),
    );

    clearMessage();

    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  }

  async function uploadImage(
    file: File,
  ) {
    clearMessage();

    setUploadingImage(
      true,
    );

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      formData.append(
        "kind",
        "resource-image",
      );

      formData.append(
        "resourceSlug",
        currentSlug,
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
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Unable to upload the resource image.",
        );
      }

      if (
        !result.image
          ?.secureUrl ||
        !result.image
          ?.cloudinaryPublicId
      ) {
        throw new Error(
          "The image upload response was incomplete.",
        );
      }

      setForm(
        (current) => ({
          ...current,

          image:
            result.image
              .secureUrl,

          imagePublicId:
            result.image
              .cloudinaryPublicId,
        }),
      );

      showMessage(
        "Cover image uploaded successfully. Save the resource to apply the change.",
        "success",
      );
    } catch (
      error
    ) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload the resource image.",
        "error",
      );
    } finally {
      setUploadingImage(
        false,
      );
    }
  }

  async function uploadFile(
    file: File,
  ) {
    clearMessage();

    setUploadingFile(
      true,
    );

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      formData.append(
        "kind",
        "resource-file",
      );

      formData.append(
        "resourceSlug",
        currentSlug,
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
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Unable to upload the resource document.",
        );
      }

      if (
        !result.file
          ?.secureUrl ||
        !result.file
          ?.cloudinaryPublicId
      ) {
        throw new Error(
          "The document upload response was incomplete.",
        );
      }

      setForm(
        (current) => ({
          ...current,

          fileUrl:
            result.file
              .secureUrl,

          filePublicId:
            result.file
              .cloudinaryPublicId,

          originalFileName:
            result.file
              .originalFilename ||
            file.name,

          fileSize:
            typeof result.file
              .bytes ===
            "number"
              ? result.file
                  .bytes
              : file.size,

          mimeType:
            result.file
              .mimeType ||
            file.type,
        }),
      );

      showMessage(
        "Document uploaded successfully. Save the resource to apply the change.",
        "success",
      );
    } catch (
      error
    ) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload the resource document.",
        "error",
      );
    } finally {
      setUploadingFile(
        false,
      );
    }
  }

  function removeImage() {
    setForm(
      (current) => ({
        ...current,

        image: "",

        imagePublicId:
          "",
      }),
    );

    showMessage(
      "Cover image marked for removal. Save the resource to apply the change.",
      "success",
    );
  }

  function removeFile() {
    setForm(
      (current) => ({
        ...current,

        fileUrl: "",

        filePublicId:
          "",

        originalFileName:
          "",

        fileSize:
          null,

        mimeType:
          "",
      }),
    );

    showMessage(
      "Document marked for removal. Save the resource to apply the change.",
      "success",
    );
  }

  async function save() {
    clearMessage();

    if (
      !form.title.trim()
    ) {
      showMessage(
        "Resource title is required.",
        "error",
      );

      return;
    }

    const slug =
      form.slug.trim() ||
      slugify(
        form.title,
      );

    if (!slug) {
      showMessage(
        "A valid resource slug is required.",
        "error",
      );

      return;
    }

    setSaving(
      true,
    );

    try {
      const payload = {
        title:
          form.title.trim(),

        slug,

        summary:
          form.summary,

        description:
          form.description,

        type:
          form.type,

        access:
          form.access,

        image:
          form.image,

        imagePublicId:
          form.imagePublicId,

        fileUrl:
          form.fileUrl,

        filePublicId:
          form.filePublicId,

        originalFileName:
          form.originalFileName,

        fileSize:
          form.fileSize,

        mimeType:
          form.mimeType,

        externalUrl:
          form.externalUrl,

        position:
          Number.isFinite(
            form.position,
          )
            ? Math.max(
                0,
                Math.trunc(
                  form.position,
                ),
              )
            : 0,

        featured:
          form.featured,

        isActive:
          form.isActive,
      };

      const response =
        await fetch(
          form.id
            ? `/api/admin/resources/${form.id}`
            : "/api/admin/resources",
          {
            method:
              form.id
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload,
              ),
          },
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Unable to save the resource.",
        );
      }

      const saved =
        result.resource as
          Resource;

      setResources(
        (current) => {
          const exists =
            current.some(
              (item) =>
                item.id ===
                saved.id,
            );

          if (
            exists
          ) {
            return current.map(
              (item) =>
                item.id ===
                saved.id
                  ? saved
                  : item,
            );
          }

          return [
            ...current,
            saved,
          ];
        },
      );

      setForm(
        formFromResource(
          saved,
        ),
      );

      showMessage(
        form.id
          ? "Resource updated successfully."
          : "Resource created successfully.",
        "success",
      );
    } catch (
      error
    ) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to save the resource.",
        "error",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  async function deleteItem(
    resource: Resource,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${resource.title}"?\n\nIts uploaded cover image and document will also be removed from Cloudinary.`,
      );

    if (
      !confirmed
    ) {
      return;
    }

    clearMessage();

    setDeleting(
      resource.id,
    );

    try {
      const response =
        await fetch(
          `/api/admin/resources/${resource.id}`,
          {
            method:
              "DELETE",
          },
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Unable to delete the resource.",
        );
      }

      setResources(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              resource.id,
          ),
      );

      if (
        form.id ===
        resource.id
      ) {
        setForm({
          ...emptyForm,
        });
      }

      showMessage(
        "Resource deleted successfully.",
        "success",
      );
    } catch (
      error
    ) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete the resource.",
        "error",
      );
    } finally {
      setDeleting(
        null,
      );
    }
  }

  async function toggleVisibility(
    resource: Resource,
  ) {
    clearMessage();

    try {
      const response =
        await fetch(
          `/api/admin/resources/${resource.id}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  title:
                    resource.title,

                  slug:
                    resource.slug,

                  summary:
                    resource.summary,

                  description:
                    resource.description,

                  type:
                    resource.type,

                  access:
                    resource.access,

                  image:
                    resource.image,

                  imagePublicId:
                    resource.imagePublicId,

                  fileUrl:
                    resource.fileUrl,

                  filePublicId:
                    resource.filePublicId,

                  originalFileName:
                    resource.originalFileName,

                  fileSize:
                    resource.fileSize,

                  mimeType:
                    resource.mimeType,

                  externalUrl:
                    resource.externalUrl,

                  position:
                    resource.position,

                  featured:
                    resource.featured,

                  isActive:
                    !resource.isActive,
                },
              ),
          },
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Unable to update visibility.",
        );
      }

      const updated =
        result.resource as
          Resource;

      setResources(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              updated.id
                ? updated
                : item,
          ),
      );

      if (
        form.id ===
        updated.id
      ) {
        setForm(
          formFromResource(
            updated,
          ),
        );
      }

      showMessage(
        updated.isActive
          ? "Resource is now visible."
          : "Resource is now hidden.",
        "success",
      );
    } catch (
      error
    ) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to update resource visibility.",
        "error",
      );
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
      {/* =========================================================
          LEFT: RESOURCE LIST
      ========================================================= */}

      <aside className="card h-fit overflow-hidden">
        <div className="border-b border-[#e1ebe6] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold">
                Resources
              </h2>

              <p className="mt-1 text-xs leading-5 text-[#657983]">
                Manage public and
                protected PDF
                resources.
              </p>
            </div>

            <button
              type="button"
              onClick={
                startNew
              }
              className="btn btn-secondary shrink-0"
            >
              + Add
            </button>
          </div>

          <div className="mt-4 rounded-lg bg-[#f4f8f6] px-3 py-2 text-xs font-bold text-[#536b76]">
            {
              resources.length
            }{" "}
            resource
            {resources.length ===
            1
              ? ""
              : "s"}
          </div>
        </div>

        <div className="max-h-[760px] overflow-y-auto p-3">
          {sortedResources.length ===
          0 ? (
            <div className="rounded-xl border border-dashed border-[#cfddd6] p-7 text-center">
              <p className="text-sm font-bold text-[#435a65]">
                No resources yet
              </p>

              <p className="mt-1 text-xs leading-5 text-[#71848d]">
                Create your first
                resource and upload
                its PDF document.
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {sortedResources.map(
                (
                  resource,
                ) => {
                  const selected =
                    form.id ===
                    resource.id;

                  return (
                    <div
                      key={
                        resource.id
                      }
                      className={`rounded-xl border p-3 transition ${
                        selected
                          ? "border-[#0a9c63] bg-[#f2faf6]"
                          : "border-[#dce7e2] bg-white hover:border-[#bdd2c8]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          editResource(
                            resource,
                          )
                        }
                        className="block w-full text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e9f7f0] text-[10px] font-extrabold text-[#0a9c63]">
                            PDF
                          </div>

                          <div className="min-w-0 flex-1">
                            <strong className="block truncate text-sm text-[#0c2230]">
                              {
                                resource.title
                              }
                            </strong>

                            <span className="mt-1 block truncate text-[10px] font-extrabold uppercase tracking-[.08em] text-[#71848d]">
                              {resourceTypeLabel(
                                resource.type,
                              )}
                            </span>
                          </div>
                        </div>
                      </button>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.06em] ${
                            resource.access ===
                            "PUBLIC"
                              ? "bg-[#e9f7f0] text-[#087b50]"
                              : resource.access ===
                                  "DEALER"
                                ? "bg-[#edf3fa] text-[#315f8a]"
                                : "bg-[#fff5dc] text-[#9a6b00]"
                          }`}
                        >
                          {accessLabel(
                            resource.access,
                          )}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.06em] ${
                            resource.isActive
                              ? "bg-[#e9f7f0] text-[#087b50]"
                              : "bg-[#f2f2f2] text-[#75838a]"
                          }`}
                        >
                          {resource.isActive
                            ? "Visible"
                            : "Hidden"}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#e8efec] pt-3">
                        <button
                          type="button"
                          onClick={() =>
                            void toggleVisibility(
                              resource,
                            )
                          }
                          className="text-[10px] font-extrabold text-[#526a74] hover:text-[#0a9c63]"
                        >
                          {resource.isActive
                            ? "Hide"
                            : "Show"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            deleting ===
                            resource.id
                          }
                          onClick={() =>
                            void deleteItem(
                              resource,
                            )
                          }
                          className="text-[10px] font-extrabold text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {deleting ===
                          resource.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
      </aside>

      {/* =========================================================
          RIGHT: EDITOR
      ========================================================= */}

      <section className="card overflow-hidden">
        <div className="border-b border-[#e1ebe6] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="eyebrow">
                Resource Manager
              </div>

              <h2 className="mt-2 text-2xl font-extrabold tracking-[-.03em]">
                {form.id
                  ? "Edit Resource"
                  : "Add Resource"}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657983]">
                Upload PDF
                catalogues,
                datasheets,
                company
                documents,
                technical manuals
                and controlled
                commercial files.
              </p>
            </div>

            {form.id && (
              <span
                className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.08em] ${
                  form.isActive
                    ? "bg-[#e9f7f0] text-[#087b50]"
                    : "bg-[#f1f3f2] text-[#6b7b82]"
                }`}
              >
                {form.isActive
                  ? "Visible"
                  : "Hidden"}
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          {message && (
            <div
              className={`mb-6 rounded-xl border px-4 py-3 text-sm font-bold ${
                messageType ===
                "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-[#bee3d2] bg-[#f0faf5] text-[#087b50]"
              }`}
            >
              {message}
            </div>
          )}

          <div className="grid gap-6">
            {/* =====================================================
                BASIC DETAILS
            ===================================================== */}

            <div className="rounded-xl border border-[#e1ebe6] p-5">
              <div>
                <h3 className="font-extrabold">
                  Basic Information
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#71848d]">
                  Public title,
                  description,
                  type and access
                  control.
                </p>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-extrabold">
                    Resource Title
                    <span className="text-red-500">
                      {" "}
                      *
                    </span>
                  </span>

                  <input
                    className="input"
                    value={
                      form.title
                    }
                    placeholder="e.g. Company Profile"
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          title:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-extrabold">
                    Slug
                  </span>

                  <input
                    className="input"
                    value={
                      form.slug
                    }
                    placeholder={
                      slugify(
                        form.title,
                      ) ||
                      "company-profile"
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          slug:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                  />

                  <span className="text-[10px] text-[#809097]">
                    Leave blank to
                    generate it
                    automatically
                    from the title.
                  </span>
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-extrabold">
                    Resource Type
                  </span>

                  <select
                    className="input"
                    value={
                      form.type
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          type:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                  >
                    {resourceTypes.map(
                      (
                        type,
                      ) => (
                        <option
                          key={
                            type.value
                          }
                          value={
                            type.value
                          }
                        >
                          {
                            type.label
                          }
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-extrabold">
                    Access Level
                  </span>

                  <select
                    className="input"
                    value={
                      form.access
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          access:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                  >
                    {accessOptions.map(
                      (
                        option,
                      ) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      ),
                    )}
                  </select>

                  <span className="text-[10px] leading-4 text-[#809097]">
                    Public =
                    anyone.
                    Dealer =
                    approved
                    dealers only.
                    Controlled =
                    request access.
                  </span>
                </label>

                <label className="grid gap-2 md:col-span-2">
                  <span className="text-xs font-extrabold">
                    Short
                    Description
                  </span>

                  <textarea
                    className="input min-h-[100px] resize-y"
                    value={
                      form.summary
                    }
                    placeholder="Short description shown on the Resources page."
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          summary:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label className="grid gap-2 md:col-span-2">
                  <span className="text-xs font-extrabold">
                    Full
                    Description
                  </span>

                  <textarea
                    className="input min-h-[170px] resize-y"
                    value={
                      form.description
                    }
                    placeholder="Detailed information about this resource."
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          description:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                  />
                </label>
              </div>
            </div>

            {/* =====================================================
                PRIMARY DOCUMENT UPLOAD
            ===================================================== */}

            <div className="rounded-xl border-2 border-[#b9d8ca] bg-[#fbfefc] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e5f6ed] text-xs font-black text-[#087b50]">
                      PDF
                    </div>

                    <div>
                      <h3 className="font-extrabold text-[#0c2230]">
                        PDF /
                        Resource
                        Document
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-[#71848d]">
                        Main
                        downloadable
                        document for
                        this
                        resource.
                      </p>
                    </div>
                  </div>
                </div>

                {form.filePublicId && (
                  <span className="rounded-full bg-[#e9f7f0] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#087b50]">
                    Document
                    Uploaded
                  </span>
                )}
              </div>

              <label
                className={`mt-5 flex min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
                  uploadingFile
                    ? "cursor-wait border-[#b5c8bf] bg-[#f5f7f6]"
                    : "cursor-pointer border-[#83bfa3] bg-[#f1faf5] hover:border-[#0a9c63] hover:bg-[#eaf8f1]"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  className="hidden"
                  disabled={
                    uploadingFile
                  }
                  onChange={(
                    event,
                  ) => {
                    const file =
                      event
                        .target
                        .files?.[0];

                    if (
                      file
                    ) {
                      void uploadFile(
                        file,
                      );
                    }

                    event.target.value =
                      "";
                  }}
                />

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d5e7de] bg-white shadow-sm">
                  <span className="text-lg font-black text-[#0a9c63]">
                    PDF
                  </span>
                </div>

                <div className="mt-5 text-base font-extrabold text-[#0c2230]">
                  {uploadingFile
                    ? "Uploading document..."
                    : form.filePublicId
                      ? "Click to Replace Document"
                      : "Click to Upload PDF / Document"}
                </div>

                <p className="mt-2 max-w-lg text-xs leading-5 text-[#6f838c]">
                  Upload company
                  profiles,
                  catalogues,
                  product
                  datasheets,
                  technical
                  manuals,
                  commercial
                  documents,
                  installation
                  guides or
                  service
                  documents.
                </p>

                <div className="mt-4 rounded-full border border-[#d7e5de] bg-white px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.07em] text-[#647981]">
                  PDF, DOC,
                  DOCX, XLS,
                  XLSX, PPT,
                  PPTX or TXT
                  · Max 25 MB
                </div>
              </label>

              {form.originalFileName && (
                <div className="mt-4 rounded-xl border border-[#d7e6df] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef7f3] text-[10px] font-black text-[#087b50]">
                        FILE
                      </div>

                      <div className="min-w-0">
                        <div className="text-[9px] font-extrabold uppercase tracking-[.1em] text-[#0a9c63]">
                          Uploaded
                          Document
                        </div>

                        <div className="mt-1 break-all text-sm font-extrabold text-[#0c2230]">
                          {
                            form.originalFileName
                          }
                        </div>

                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-[#778990]">
                          {formatFileSize(
                            form.fileSize,
                          ) && (
                            <span>
                              {formatFileSize(
                                form.fileSize,
                              )}
                            </span>
                          )}

                          {form.mimeType && (
                            <span>
                              {
                                form.mimeType
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={
                        removeFile
                      }
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-50"
                    >
                      Remove
                      Document
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* =====================================================
                COVER IMAGE
            ===================================================== */}

            <div className="rounded-xl border border-[#dce7e2] p-5">
              <div>
                <h3 className="font-extrabold">
                  Resource Cover
                  Image
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#71848d]">
                  Optional image
                  displayed on the
                  public Resources
                  page and resource
                  details page.
                </p>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <label
                  className={`flex min-h-[190px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-7 text-center transition ${
                    uploadingImage
                      ? "cursor-wait border-[#cbd8d2] bg-[#f5f7f6]"
                      : "cursor-pointer border-[#c5d9cf] bg-[#f8fbf9] hover:border-[#0a9c63] hover:bg-[#f2faf6]"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    disabled={
                      uploadingImage
                    }
                    onChange={(
                      event,
                    ) => {
                      const file =
                        event
                          .target
                          .files?.[0];

                      if (
                        file
                      ) {
                        void uploadImage(
                          file,
                        );
                      }

                      event.target.value =
                        "";
                    }}
                  />

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e9f7f0] text-lg font-extrabold text-[#0a9c63]">
                    +
                  </div>

                  <div className="mt-4 text-sm font-extrabold text-[#0c2230]">
                    {uploadingImage
                      ? "Uploading image..."
                      : form.image
                        ? "Replace Cover Image"
                        : "Upload Cover Image"}
                  </div>

                  <p className="mt-2 text-xs leading-5 text-[#71848d]">
                    JPG, PNG,
                    WebP or AVIF
                    <br />
                    Maximum 10 MB
                  </p>
                </label>

                <div className="overflow-hidden rounded-xl border border-[#dce7e2] bg-[#f5f8f7]">
                  {form.image ? (
                    <>
                      <div className="relative aspect-[4/3] overflow-hidden bg-[#eaf0ed]">
                        {/* Using a normal image element here keeps
                            the admin preview independent of
                            Next.js remote image configuration. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            form.image
                          }
                          alt="Resource cover preview"
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3 p-3">
                        <span className="text-xs font-bold text-[#087b50]">
                          Cover image
                          ready
                        </span>

                        <button
                          type="button"
                          onClick={
                            removeImage
                          }
                          className="text-xs font-extrabold text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex aspect-[4/3] flex-col items-center justify-center p-5 text-center">
                      <div className="text-xs font-extrabold text-[#829198]">
                        No Cover
                        Image
                      </div>

                      <p className="mt-1 text-[10px] leading-4 text-[#93a0a6]">
                        A document
                        icon will be
                        used when no
                        image is
                        uploaded.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* =====================================================
                EXTERNAL LINK
            ===================================================== */}

            <div className="rounded-xl border border-[#e1ebe6] p-5">
              <div>
                <h3 className="font-extrabold">
                  External Link
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#71848d]">
                  Optional
                  alternative
                  destination when
                  the resource does
                  not use an
                  uploaded file.
                </p>
              </div>

              <label className="mt-5 grid gap-2">
                <span className="text-xs font-extrabold">
                  External URL
                </span>

                <input
                  className="input"
                  type="url"
                  placeholder="https://example.com/resource"
                  value={
                    form.externalUrl
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        externalUrl:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                />

                <span className="text-[10px] leading-4 text-[#809097]">
                  Leave this
                  blank when an
                  uploaded PDF or
                  document should
                  be used.
                </span>
              </label>
            </div>

            {/* =====================================================
                DISPLAY SETTINGS
            ===================================================== */}

            <div className="rounded-xl border border-[#e1ebe6] p-5">
              <div>
                <h3 className="font-extrabold">
                  Display Settings
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#71848d]">
                  Control sorting,
                  visibility and
                  featured status.
                </p>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-extrabold">
                    Position
                  </span>

                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    value={
                      form.position
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          position:
                            Number(
                              event
                                .target
                                .value,
                            ),
                        }),
                      )
                    }
                  />

                  <span className="text-[10px] text-[#809097]">
                    Lower numbers
                    appear first.
                  </span>
                </label>

                <div className="grid gap-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#dce7e2] p-4">
                    <input
                      type="checkbox"
                      checked={
                        form.featured
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            featured:
                              event
                                .target
                                .checked,
                          }),
                        )
                      }
                      className="mt-0.5 h-4 w-4"
                    />

                    <div>
                      <span className="block text-sm font-extrabold">
                        Featured
                        Resource
                      </span>

                      <span className="mt-1 block text-[10px] leading-4 text-[#71848d]">
                        Highlight
                        this item on
                        the public
                        Resources
                        page.
                      </span>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#dce7e2] p-4">
                    <input
                      type="checkbox"
                      checked={
                        form.isActive
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            isActive:
                              event
                                .target
                                .checked,
                          }),
                        )
                      }
                      className="mt-0.5 h-4 w-4"
                    />

                    <div>
                      <span className="block text-sm font-extrabold">
                        Visible on
                        Website
                      </span>

                      <span className="mt-1 block text-[10px] leading-4 text-[#71848d]">
                        Hidden
                        resources
                        remain in
                        Admin but
                        are removed
                        from the
                        public page.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* =====================================================
                SAVE ACTIONS
            ===================================================== */}

            <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#d7e5de] bg-white/95 p-4 shadow-[0_-8px_24px_rgba(10,40,30,0.05)] backdrop-blur">
              <div className="text-xs leading-5 text-[#71848d]">
                {form.id ? (
                  <>
                    Editing{" "}
                    <strong className="text-[#0c2230]">
                      {
                        form.title
                      }
                    </strong>
                  </>
                ) : (
                  "Creating a new resource"
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={
                    startNew
                  }
                  disabled={
                    saving ||
                    uploadingFile ||
                    uploadingImage
                  }
                  className="btn btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {form.id
                    ? "New Resource"
                    : "Clear"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void save()
                  }
                  disabled={
                    saving ||
                    uploadingFile ||
                    uploadingImage
                  }
                  className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : uploadingFile
                      ? "Uploading Document..."
                      : uploadingImage
                        ? "Uploading Image..."
                        : form.id
                          ? "Save Changes"
                          : "Create Resource"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}