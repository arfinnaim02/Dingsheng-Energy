"use client";

import {
  ChangeEvent,
  FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  MAX_TREE_DEPTH,
  buildTree,
  getDescendantIds,
  type TreeNode,
} from "@/lib/categoryTree";

import type {
  AdminService,
} from "@/lib/databaseServices";

import {
  ServiceRichTextEditor,
} from "@/components/admin/ServiceRichTextEditor";

import {
  SERVICE_RICH_TEXT_PREFIX,
  documentToStoredServiceText,
  emptyServiceRichTextDocument,
  storedServiceTextToDocument,
  type ServiceRichTextDocument,
} from "@/lib/serviceRichText";

type Draft = {
  id?: string;

  name: string;
  slug: string;
  shortName: string;

  summary: string;
  description: ServiceRichTextDocument;

  image: string;
  imagePublicId: string;

  heroImage: string;
  heroImagePublicId: string;

  parentId:
    | string
    | null;

  position: number;

  scope:
    ServiceRichTextDocument;

  process:
    ServiceRichTextDocument;

  applications:
    ServiceRichTextDocument;

  featured: boolean;
  isActive: boolean;
};

function emptyDraft(
  parentId:
    | string
    | null = null,
): Draft {
  return {
    name: "",
    slug: "",
    shortName: "",

    summary: "",

    description:
      emptyServiceRichTextDocument(),

    image: "",
    imagePublicId: "",

    heroImage: "",
    heroImagePublicId: "",

    parentId,
    position: 0,

    scope:
      emptyServiceRichTextDocument(),

    process:
      emptyServiceRichTextDocument(),

    applications:
      emptyServiceRichTextDocument(),

    featured: false,
    isActive: true,
  };
}

function serviceDescriptionToDocument(
  value:
    | string
    | null
    | undefined,
): ServiceRichTextDocument {
  const cleaned =
    value?.trim() ?? "";

  if (!cleaned) {
    return emptyServiceRichTextDocument();
  }

  /*
   * New descriptions are stored as one
   * serialized rich-text value.
   *
   * Existing plain descriptions remain
   * backwards compatible. Existing line
   * breaks become individual paragraphs.
   */
  const values =
    cleaned.startsWith(
      SERVICE_RICH_TEXT_PREFIX,
    )
      ? [cleaned]
      : cleaned
          .split(
            /\r?\n+/,
          )
          .map(
            (
              item,
            ) =>
              item.trim(),
          )
          .filter(
            Boolean,
          );

  return storedServiceTextToDocument(
    values,
  );
}

function fromService(
  service:
    AdminService,
): Draft {
  return {
    id:
      service.id,

    name:
      service.name,

    slug:
      service.slug,

    shortName:
      service.shortName ??
      "",

    summary:
      service.summary ??
      "",

    description:
      serviceDescriptionToDocument(
        service.description,
      ),

    image:
      service.image ??
      "",

    imagePublicId:
      service.imagePublicId ??
      "",

    heroImage:
      service.heroImage ??
      "",

    heroImagePublicId:
      service.heroImagePublicId ??
      "",

    parentId:
      service.parentId,

    position:
      service.position,

    scope:
      storedServiceTextToDocument(
        service.scope,
      ),

    process:
      storedServiceTextToDocument(
        service.process,
      ),

    applications:
      storedServiceTextToDocument(
        service.applications,
      ),

    featured:
      service.featured,

    isActive:
      service.isActive,
  };
}

export function ServiceEditor({
  initial,
  selectedSlug,
}: {
  initial:
    AdminService[];

  selectedSlug?:
    string;
}) {
  const router =
    useRouter();

  const initialService =
    selectedSlug
      ? initial.find(
          (
            service,
          ) =>
            service.slug ===
            selectedSlug,
        ) ??
        initial[0]
      : initial[0];

  const [
    services,
    setServices,
  ] = useState(
    initial,
  );

  const [
    draft,
    setDraft,
  ] = useState<Draft>(
    () =>
      initialService
        ? fromService(
            initialService,
          )
        : emptyDraft(),
  );

  const [
    expanded,
    setExpanded,
  ] = useState<
    Set<string>
  >(
    () =>
      new Set(
        initial.map(
          (
            item,
          ) =>
            item.id,
        ),
      ),
  );

  const [
    saving,
    setSaving,
  ] = useState(
    false,
  );

  const cardInputReference =
    useRef<HTMLInputElement>(
      null,
    );

  const heroInputReference =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    uploading,
    setUploading,
  ] = useState<
    | "image"
    | "heroImage"
    | null
  >(
    null,
  );

  const [
    message,
    setMessage,
  ] = useState("");

  /*
   * categoryTree's generic tree
   * builder only needs id, parentId
   * and position-compatible records.
   */
  const tree =
    useMemo(
      () =>
        buildTree(
          services as any,
        ) as TreeNode<AdminService>[],
      [
        services,
      ],
    );

  const forbiddenParents =
    useMemo(
      () => {
        if (!draft.id) {
          return new Set<
            string
          >();
        }

        const descendants =
          getDescendantIds(
            services,
            draft.id,
          );

        descendants.add(
          draft.id,
        );

        return descendants;
      },
      [
        services,
        draft.id,
      ],
    );

  /*
   * IMPORTANT:
   *
   * Service selection behaves exactly
   * like the Category tree now.
   *
   * We only change the local draft.
   * We do NOT navigate to another URL,
   * so the left tree keeps its current
   * scroll position.
   */
  function select(
    service:
      AdminService,
  ) {
    setDraft(
      fromService(
        service,
      ),
    );

    setMessage("");
  }

  function addRoot() {
    setDraft(
      emptyDraft(
        null,
      ),
    );

    setMessage("");
  }

  function addChild(
    parent:
      AdminService,
  ) {
    setExpanded(
      (
        current,
      ) => {
        const next =
          new Set(
            current,
          );

        next.add(
          parent.id,
        );

        return next;
      },
    );

    setDraft(
      emptyDraft(
        parent.id,
      ),
    );

    setMessage("");
  }

  function toggle(
    id:
      string,
  ) {
    setExpanded(
      (
        current,
      ) => {
        const next =
          new Set(
            current,
          );

        if (
          next.has(
            id,
          )
        ) {
          next.delete(
            id,
          );
        } else {
          next.add(
            id,
          );
        }

        return next;
      },
    );
  }

  async function upload(
    file:
      | File
      | undefined,

    field:
      | "image"
      | "heroImage",
  ) {
    if (
      !file ||
      saving ||
      uploading !==
        null
    ) {
      return;
    }

    const allowedTypes =
      new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
      ]);

    if (
      !allowedTypes.has(
        file.type,
      )
    ) {
      setMessage(
        "Only JPG, PNG, WebP and AVIF images are allowed.",
      );

      return;
    }

    if (
      file.size <=
      0
    ) {
      setMessage(
        "The selected image is empty.",
      );

      return;
    }

    if (
      file.size >
      10 *
        1024 *
        1024
    ) {
      setMessage(
        "The image must be 10 MB or smaller.",
      );

      return;
    }

    setUploading(
      field,
    );

    setMessage("");

    try {
      const data =
        new FormData();

      data.set(
        "file",
        file,
      );

      data.set(
        "kind",
        "service",
      );

      data.set(
        "serviceSlug",
        draft.slug.trim() ||
          draft.name.trim() ||
          "unassigned",
      );

      const response =
        await fetch(
          "/api/admin/cloudinary/upload",
          {
            method:
              "POST",

            body:
              data,
          },
        );

      const result =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Unable to upload service image.",
        );
      }

      const url =
        result.image
          ?.secureUrl ||
        result.image
          ?.url;

      const publicId =
        result.image
          ?.cloudinaryPublicId;

      if (
        !url ||
        !publicId
      ) {
        throw new Error(
          "Cloudinary returned incomplete image information.",
        );
      }

      setDraft(
        (
          current,
        ) =>
          field ===
          "image"
            ? {
                ...current,

                image:
                  url,

                imagePublicId:
                  publicId,
              }
            : {
                ...current,

                heroImage:
                  url,

                heroImagePublicId:
                  publicId,
              },
      );

      setMessage(
        field ===
        "image"
          ? "Card image uploaded to Cloudinary. Save the service to apply it."
          : "Hero image uploaded to Cloudinary. Save the service to apply it.",
      );
    } catch (
      error
    ) {
      setMessage(
        error instanceof
          Error
          ? error.message
          : "Unable to upload service image.",
      );
    } finally {
      setUploading(
        null,
      );

      if (
        field ===
          "image" &&
        cardInputReference.current
      ) {
        cardInputReference.current.value =
          "";
      }

      if (
        field ===
          "heroImage" &&
        heroInputReference.current
      ) {
        heroInputReference.current.value =
          "";
      }
    }
  }

  function clearImage(
    field:
      | "image"
      | "heroImage",
  ) {
    if (
      field ===
      "image"
    ) {
      setDraft(
        (
          current,
        ) => ({
          ...current,

          image:
            "",

          imagePublicId:
            "",
        }),
      );
    } else {
      setDraft(
        (
          current,
        ) => ({
          ...current,

          heroImage:
            "",

          heroImagePublicId:
            "",
        }),
      );
    }

    setMessage(
      "Image removed from the service draft. Save the service to apply the change.",
    );
  }

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(
      true,
    );

    setMessage("");

    try {
      const payload = {
        id:
          draft.id,

        name:
          draft.name,

        slug:
          draft.slug,

        shortName:
          draft.shortName,

        summary:
          draft.summary,

        /*
         * Description is stored in the
         * existing string field as the
         * same serialized rich-text format
         * already used by the other
         * service rich-text sections.
         */
        description:
          documentToStoredServiceText(
            draft.description,
          )[0] ?? "",

        image:
          draft.image,

        imagePublicId:
          draft.imagePublicId,

        heroImage:
          draft.heroImage,

        heroImagePublicId:
          draft.heroImagePublicId,

        parentId:
          draft.parentId,

        position:
          draft.position,

        scope:
          documentToStoredServiceText(
            draft.scope,
          ),

        process:
          documentToStoredServiceText(
            draft.process,
          ),

        applications:
          documentToStoredServiceText(
            draft.applications,
          ),

        featured:
          draft.featured,

        isActive:
          draft.isActive,
      };

      const response =
        await fetch(
          "/api/admin/services",
          {
            method:
              draft.id
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
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Unable to save service.",
        );
      }

      const next =
        (
          result.services ??
          []
        ) as AdminService[];

      setServices(
        next,
      );

      const saved =
        draft.id
          ? next.find(
              (
                item,
              ) =>
                item.id ===
                draft.id,
            )
          : next.find(
              (
                item,
              ) =>
                item.name ===
                  draft.name.trim() &&
                item.parentId ===
                  draft.parentId,
            );

      if (
        saved
      ) {
        setDraft(
          fromService(
            saved,
          ),
        );
      }

      setMessage(
        draft.id
          ? "Service updated successfully."
          : "Service created successfully.",
      );

      /*
       * Keep the current editor mounted so
       * the left tree does not jump back to
       * its top position after saving.
       */
      router.refresh();
    } catch (
      error
    ) {
      setMessage(
        error instanceof
          Error
          ? error.message
          : "Unable to save service.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  async function remove() {
    if (
      !draft.id
    ) {
      return;
    }

    const service =
      services.find(
        (
          item,
        ) =>
          item.id ===
          draft.id,
      );

    if (
      !service
    ) {
      return;
    }

    if (
      !confirm(
        `Delete "${service.name}"?\n\nOnly empty leaf services can be deleted.`,
      )
    ) {
      return;
    }

    setSaving(
      true,
    );

    setMessage("");

    try {
      const response =
        await fetch(
          `/api/admin/services?id=${encodeURIComponent(
            service.id,
          )}`,
          {
            method:
              "DELETE",
          },
        );

      const result =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Unable to delete service.",
        );
      }

      const next =
        (
          result.services ??
          []
        ) as AdminService[];

      setServices(
        next,
      );

      const nextService =
        next[0] ??
        null;

      setDraft(
        nextService
          ? fromService(
              nextService,
            )
          : emptyDraft(),
      );

      setMessage(
        "Service deleted successfully.",
      );

      if (
        nextService
      ) {
        router.replace(
          `/admin/services/${encodeURIComponent(
            nextService.slug,
          )}`,
        );
      } else {
        router.replace(
          "/admin/services",
        );
      }
    } catch (
      error
    ) {
      setMessage(
        error instanceof
          Error
          ? error.message
          : "Unable to delete service.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  async function toggleVisibility(
    service:
      AdminService,
  ) {
    setSaving(
      true,
    );

    setMessage("");

    try {
      const response =
        await fetch(
          "/api/admin/services",
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
                  id:
                    service.id,

                  name:
                    service.name,

                  slug:
                    service.slug,

                  shortName:
                    service.shortName ??
                    "",

                  summary:
                    service.summary ??
                    "",

                  /*
                   * Preserve the stored
                   * serialized description
                   * when only toggling
                   * visibility.
                   */
                  description:
                    service.description ??
                    "",

                  image:
                    service.image ??
                    "",

                  imagePublicId:
                    service.imagePublicId ??
                    "",

                  heroImage:
                    service.heroImage ??
                    "",

                  heroImagePublicId:
                    service.heroImagePublicId ??
                    "",

                  parentId:
                    service.parentId,

                  position:
                    service.position,

                  scope:
                    service.scope,

                  process:
                    service.process,

                  applications:
                    service.applications,

                  featured:
                    service.featured,

                  isActive:
                    !service.isActive,
                },
              ),
          },
        );

      const result =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Unable to update service visibility.",
        );
      }

      const next =
        (
          result.services ??
          []
        ) as AdminService[];

      setServices(
        next,
      );

      if (
        draft.id ===
        service.id
      ) {
        const updated =
          next.find(
            (
              item,
            ) =>
              item.id ===
              service.id,
          );

        if (
          updated
        ) {
          setDraft(
            fromService(
              updated,
            ),
          );
        }
      }

      setMessage(
        service.isActive
          ? `"${service.name}" hidden successfully.`
          : `"${service.name}" is now visible.`,
      );

      router.refresh();
    } catch (
      error
    ) {
      setMessage(
        error instanceof
          Error
          ? error.message
          : "Unable to update service visibility.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  async function deleteServiceNode(
    service:
      AdminService,
  ) {
    if (
      !confirm(
        `Delete "${service.name}"?\n\nOnly empty leaf services can be deleted.`,
      )
    ) {
      return;
    }

    setSaving(
      true,
    );

    setMessage("");

    try {
      const response =
        await fetch(
          `/api/admin/services?id=${encodeURIComponent(
            service.id,
          )}`,
          {
            method:
              "DELETE",
          },
        );

      const result =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Unable to delete service.",
        );
      }

      const next =
        (
          result.services ??
          []
        ) as AdminService[];

      setServices(
        next,
      );

      if (
        draft.id ===
        service.id
      ) {
        const nextService =
          next[0] ??
          null;

        setDraft(
          nextService
            ? fromService(
                nextService,
              )
            : emptyDraft(),
        );

        if (
          nextService
        ) {
          router.replace(
            `/admin/services/${encodeURIComponent(
              nextService.slug,
            )}`,
          );
        } else {
          router.replace(
            "/admin/services",
          );
        }
      } else {
        router.refresh();
      }

      setMessage(
        `"${service.name}" deleted successfully.`,
      );
    } catch (
      error
    ) {
      setMessage(
        error instanceof
          Error
          ? error.message
          : "Unable to delete service.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  function renderNode(
    node:
      TreeNode<AdminService>,
  ) {
    const hasChildren =
      node.children.length >
      0;

    const isSelected =
      draft.id ===
      node.id;

    return (
      <div
        key={
          node.id
        }
      >
        <div
          className={`group flex w-max min-w-full items-center gap-2 rounded-lg border px-3 py-2.5 transition ${
            isSelected
              ? "border-[#0a9c63] bg-[#edf7f2]"
              : "border-transparent hover:border-[#dfe8e4] hover:bg-[#f8fbfa]"
          }`}
          style={{
            marginLeft:
              `${
                Math.max(
                  0,
                  node.depth -
                    1,
                ) *
                18
              }px`,
          }}
        >
          <button
            type="button"
            aria-label={
              hasChildren
                ? "Toggle children"
                : "No children"
            }
            onClick={() =>
              hasChildren &&
              toggle(
                node.id,
              )
            }
            className="w-5 shrink-0 text-xs font-black text-[#627780]"
          >
            {hasChildren
              ? expanded.has(
                  node.id,
                )
                ? "−"
                : "+"
              : "·"}
          </button>

          <button
            type="button"
            onClick={() =>
              select(
                node,
              )
            }
            className="min-w-0 flex-1 text-left"
          >
            <div className="whitespace-nowrap text-sm font-black text-[#17313d]">
              {
                node.name
              }
            </div>

            <div className="mt-0.5 flex flex-wrap gap-x-3 text-[10px] font-bold uppercase tracking-wide text-[#71858d]">
              <span>
                Level{" "}
                {
                  node.depth
                }
              </span>

              {node.featured && (
                <span className="text-[#0a9c63]">
                  Featured
                </span>
              )}

              {!node.isActive && (
                <span className="text-red-600">
                  Hidden
                </span>
              )}
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              disabled={
                saving
              }
              onClick={() =>
                toggleVisibility(
                  node,
                )
              }
              className={`rounded-md border px-2 py-1 text-[10px] font-black ${
                node.isActive
                  ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                  : "border-[#bfe2d2] text-[#0a9c63] hover:bg-[#edf7f2]"
              }`}
            >
              {node.isActive
                ? "Hide"
                : "Show"}
            </button>

            {node.depth <
              MAX_TREE_DEPTH && (
              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() =>
                  addChild(
                    node,
                  )
                }
                className="rounded-md border border-[#d7e4df] px-2 py-1 text-[10px] font-black text-[#17313d] hover:bg-[#f3f7f5]"
              >
                + Child
              </button>
            )}

            <button
              type="button"
              disabled={
                saving
              }
              onClick={() =>
                deleteServiceNode(
                  node,
                )
              }
              className="rounded-md border border-red-200 px-2 py-1 text-[10px] font-black text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>

        {hasChildren &&
          expanded.has(
            node.id,
          ) &&
          node.children.map(
            (
              child,
            ) =>
              renderNode(
                child,
              ),
          )}
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[500px_minmax(0,1fr)]">
      {/* TREE */}
      <section className="card p-5 xl:sticky xl:top-6 xl:self-start">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="eyebrow">
              Service taxonomy
            </div>

            <h2 className="mt-2 text-xl font-black">
              Service Tree
            </h2>

            <p className="mt-2 text-sm text-[#627780]">
              Recursive service
              structure with a
              maximum of{" "}
              {MAX_TREE_DEPTH}{" "}
              levels.
            </p>
          </div>

          <button
            type="button"
            onClick={
              addRoot
            }
            className="btn btn-primary"
          >
            + Root
          </button>
        </div>

        <div className="mt-5 max-h-[70vh] space-y-1 overflow-auto pb-2 pr-1">
          {tree.length ? (
            tree.map(
              (
                node,
              ) =>
                renderNode(
                  node,
                ),
            )
          ) : (
            <div className="rounded-lg border border-dashed border-[#d7e4df] p-5 text-sm text-[#627780]">
              No services yet.
              Create the first
              root service.
            </div>
          )}
        </div>
      </section>

      {/* EDITOR */}
      <form
        onSubmit={
          submit
        }
        className="space-y-6"
      >
        <section className="card p-6 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="eyebrow">
                {draft.id
                  ? "Edit service"
                  : "Create service"}
              </div>

              <h2 className="mt-2 text-xl font-black">
                {draft.name ||
                  "New Service"}
              </h2>
            </div>

            {draft.id && (
              <div className="flex gap-2">
                {draft.featured && (
                  <span className="status">
                    Featured
                  </span>
                )}

                <span className="status">
                  {draft.isActive
                    ? "Active"
                    : "Hidden"}
                </span>
              </div>
            )}
          </div>

          <div className="form-grid mt-6">
            <div className="field">
              <label>
                Service name *
              </label>

              <input
                required
                value={
                  draft.name
                }
                onChange={(
                  event,
                ) =>
                  setDraft(
                    (
                      current,
                    ) => ({
                      ...current,

                      name:
                        event
                          .target
                          .value,
                    }),
                  )
                }
              />
            </div>

            <div className="field">
              <label>
                Slug
              </label>

              <input
                value={
                  draft.slug
                }
                placeholder="auto-generated if blank"
                onChange={(
                  event,
                ) =>
                  setDraft(
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
            </div>

            <div className="field">
              <label>
                Short name
              </label>

              <input
                value={
                  draft.shortName
                }
                onChange={(
                  event,
                ) =>
                  setDraft(
                    (
                      current,
                    ) => ({
                      ...current,

                      shortName:
                        event
                          .target
                          .value,
                    }),
                  )
                }
              />
            </div>

            <div className="field">
              <label>
                Parent
              </label>

              <select
                value={
                  draft.parentId ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  setDraft(
                    (
                      current,
                    ) => ({
                      ...current,

                      parentId:
                        event
                          .target
                          .value ||
                        null,
                    }),
                  )
                }
              >
                <option value="">
                  Root service
                </option>

                {services.map(
                  (
                    service,
                  ) => (
                    <option
                      key={
                        service.id
                      }
                      value={
                        service.id
                      }
                      disabled={
                        forbiddenParents.has(
                          service.id,
                        )
                      }
                    >
                      {
                        service.name
                      }
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="field">
              <label>
                Display order
              </label>

              <input
                type="number"
                min={
                  0
                }
                value={
                  draft.position
                }
                onChange={(
                  event,
                ) =>
                  setDraft(
                    (
                      current,
                    ) => ({
                      ...current,

                      position:
                        Number(
                          event
                            .target
                            .value,
                        ) ||
                        0,
                    }),
                  )
                }
              />
            </div>

            <div className="field flex items-end">
              <label className="flex min-h-[46px] w-full items-center gap-3 rounded-md border border-[#d7e4df] px-4">
                <input
                  type="checkbox"
                  checked={
                    draft.isActive
                  }
                  onChange={(
                    event,
                  ) =>
                    setDraft(
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
                />

                <span>
                  Visible on
                  public website
                </span>
              </label>
            </div>

            <div className="field flex items-end">
              <label className="flex min-h-[46px] w-full items-center gap-3 rounded-md border border-[#d7e4df] px-4">
                <input
                  type="checkbox"
                  checked={
                    draft.featured
                  }
                  onChange={(
                    event,
                  ) =>
                    setDraft(
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
                />

                <span>
                  Featured service
                </span>
              </label>
            </div>

            <div className="field span-2">
              <label>
                Summary
              </label>

              <textarea
                value={
                  draft.summary
                }
                onChange={(
                  event,
                ) =>
                  setDraft(
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
            </div>

            {/* Rich Description */}
            <div className="field span-2">
              <label>
                Description
              </label>

              <ServiceRichTextEditor
                value={
                  draft.description
                }
                disabled={
                  saving
                }
                minHeightClass="min-h-[220px]"
                onChange={(
                  value,
                ) =>
                  setDraft(
                    (
                      current,
                    ) => ({
                      ...current,

                      description:
                        value,
                    }),
                  )
                }
              />

              <p className="mt-2 text-xs leading-5 text-[#71838b]">
                Press Enter to create
                separate paragraphs.
                Select text to apply
                Bold, Italic or Text
                Size formatting.
              </p>
            </div>
          </div>
        </section>

        <section className="card p-6 md:p-7">
          <div className="eyebrow">
            Service delivery
          </div>

          <h2 className="mt-2 text-xl font-black">
            Scope, Process &
            Applications
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#71838b]">
            Write naturally in each editor. Select any word, phrase or sentence,
            then use Bold, Italic or Text Size. Press Enter to create another paragraph.
          </p>

          <div className="mt-6 grid gap-6">
            <div className="rounded-xl border border-[#dfe8e4] bg-[#fafcfb] p-5">
              <div className="text-sm font-black text-[#17313d]">
                Scope of work
              </div>

              <p className="mt-1 text-xs leading-5 text-[#71838b]">
                Add multiple paragraphs in one editor and format only the selected text.
              </p>

              <div className="mt-4">
                <ServiceRichTextEditor
                  value={
                    draft.scope
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    value,
                  ) =>
                    setDraft(
                      (
                        current,
                      ) => ({
                        ...current,

                        scope:
                          value,
                      }),
                    )
                  }
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#dfe8e4] bg-[#fafcfb] p-5">
              <div className="text-sm font-black text-[#17313d]">
                Delivery process
              </div>

              <p className="mt-1 text-xs leading-5 text-[#71838b]">
                Each paragraph becomes one process step on the public service page.
              </p>

              <div className="mt-4">
                <ServiceRichTextEditor
                  value={
                    draft.process
                  }
                  disabled={
                    saving
                  }
                  minHeightClass="min-h-[190px]"
                  onChange={(
                    value,
                  ) =>
                    setDraft(
                      (
                        current,
                      ) => ({
                        ...current,

                        process:
                          value,
                      }),
                    )
                  }
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#dfe8e4] bg-[#fafcfb] p-5">
              <div className="text-sm font-black text-[#17313d]">
                Applications
              </div>

              <p className="mt-1 text-xs leading-5 text-[#71838b]">
                Each paragraph becomes one application item on the public service page.
              </p>

              <div className="mt-4">
                <ServiceRichTextEditor
                  value={
                    draft.applications
                  }
                  disabled={
                    saving
                  }
                  minHeightClass="min-h-[160px]"
                  onChange={(
                    value,
                  ) =>
                    setDraft(
                      (
                        current,
                      ) => ({
                        ...current,

                        applications:
                          value,
                      }),
                    )
                  }
                />
              </div>
            </div>
          </div>
        </section>

        <section className="card p-6 md:p-7">
          <div className="eyebrow">
            Service media
          </div>

          <h2 className="mt-2 text-xl font-black">
            Cloudinary Images
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#71838b]">
            Upload service media directly to Cloudinary.
            The secure URLs are saved with the service and
            used automatically on the public website.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[#dfe8e4] bg-[#fafcfb] p-5">
              <div className="text-sm font-black text-[#17313d]">
                Card Image
              </div>

              <p className="mt-1 text-xs leading-5 text-[#71838b]">
                Used on the Services page, child-service cards
                and related-service cards.
              </p>

              <div className="mt-4 overflow-hidden rounded-xl border border-[#dfe8e4] bg-white">
                {draft.image ? (
                  <img
                    src={
                      draft.image
                    }
                    alt={
                      draft.name ||
                      "Service card"
                    }
                    className="h-56 w-full object-contain p-3"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center text-xs font-bold uppercase tracking-[.1em] text-[#94a49d]">
                    No card image
                  </div>
                )}
              </div>

              <input
                ref={
                  cardInputReference
                }
                className="hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={
                  saving ||
                  uploading !==
                    null
                }
                onChange={(
                  event:
                    ChangeEvent<HTMLInputElement>,
                ) =>
                  void upload(
                    event.target
                      .files?.[0],
                    "image",
                  )
                }
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={
                    saving ||
                    uploading !==
                      null
                  }
                  onClick={() =>
                    cardInputReference.current?.click()
                  }
                >
                  {uploading ===
                  "image"
                    ? "Uploading..."
                    : draft.image
                      ? "Replace Card Image"
                      : "Upload Card Image"}
                </button>

                {draft.image && (
                  <button
                    type="button"
                    disabled={
                      saving ||
                      uploading !==
                        null
                    }
                    onClick={() =>
                      clearImage(
                        "image",
                      )
                    }
                    className="rounded-md border border-red-200 px-4 py-3 text-xs font-extrabold text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
              </div>

              {draft.image && (
                <div className="mt-4 break-all rounded-lg bg-white p-3 text-[10px] leading-5 text-[#71838b]">
                  {
                    draft.image
                  }
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#dfe8e4] bg-[#fafcfb] p-5">
              <div className="text-sm font-black text-[#17313d]">
                Hero Image
              </div>

              <p className="mt-1 text-xs leading-5 text-[#71838b]">
                Used as the large hero image on the individual
                service page.
              </p>

              <div className="mt-4 overflow-hidden rounded-xl border border-[#dfe8e4] bg-white">
                {draft.heroImage ? (
                  <img
                    src={
                      draft.heroImage
                    }
                    alt={
                      draft.name ||
                      "Service hero"
                    }
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center text-xs font-bold uppercase tracking-[.1em] text-[#94a49d]">
                    No hero image
                  </div>
                )}
              </div>

              <input
                ref={
                  heroInputReference
                }
                className="hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={
                  saving ||
                  uploading !==
                    null
                }
                onChange={(
                  event:
                    ChangeEvent<HTMLInputElement>,
                ) =>
                  void upload(
                    event.target
                      .files?.[0],
                    "heroImage",
                  )
                }
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={
                    saving ||
                    uploading !==
                      null
                  }
                  onClick={() =>
                    heroInputReference.current?.click()
                  }
                >
                  {uploading ===
                  "heroImage"
                    ? "Uploading..."
                    : draft.heroImage
                      ? "Replace Hero Image"
                      : "Upload Hero Image"}
                </button>

                {draft.heroImage && (
                  <button
                    type="button"
                    disabled={
                      saving ||
                      uploading !==
                        null
                    }
                    onClick={() =>
                      clearImage(
                        "heroImage",
                      )
                    }
                    className="rounded-md border border-red-200 px-4 py-3 text-xs font-extrabold text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
              </div>

              {draft.heroImage && (
                <div className="mt-4 break-all rounded-lg bg-white p-3 text-[10px] leading-5 text-[#71838b]">
                  {
                    draft.heroImage
                  }
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-[#dce8e2] bg-[#f4faf7] p-4 text-xs leading-6 text-[#61767e]">
            JPG, PNG, WebP or AVIF · Maximum 10 MB.
            Replaced persisted images are cleaned from Cloudinary
            by the service API after a successful save.
          </div>
        </section>

        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#dfe8e4] bg-white/95 p-4 shadow-xl backdrop-blur">
          <span
            className={`text-sm ${
              message
                .toLowerCase()
                .includes(
                  "unable",
                ) ||
              message
                .toLowerCase()
                .includes(
                  "cannot",
                ) ||
              message
                .toLowerCase()
                .includes(
                  "required",
                ) ||
              message
                .toLowerCase()
                .includes(
                  "maximum",
                )
                ? "text-red-600"
                : "text-[#627780]"
            }`}
          >
            {
              message
            }
          </span>

          <div className="flex gap-2">
            {draft.id && (
              <button
                type="button"
                disabled={
                  saving
                }
                onClick={
                  remove
                }
                className="rounded-md border border-red-200 px-4 py-3 text-xs font-extrabold text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            )}

            <button
              disabled={
                saving ||
                uploading !==
                  null
              }
              className="btn btn-primary"
            >
              {saving
                ? "Saving..."
                : draft.id
                  ? "Save Service"
                  : "Create Service"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}