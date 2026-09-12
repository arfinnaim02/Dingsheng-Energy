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
  AdminCategory,
} from "@/lib/databaseCategories";

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
  isActive: boolean;
};

type ImageTarget =
  | "card"
  | "hero";

type UploadResponse = {
  image?: {
    url?: string;
    secureUrl?: string;
    cloudinaryPublicId?: string;
  };

  error?: string;
};

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const allowedTypes =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
  ]);

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
    isActive: true,
  };
}

function fromCategory(
  category:
    AdminCategory,
): Draft {
  return {
    id:
      category.id,

    name:
      category.name,

    slug:
      category.slug,

    shortName:
      category.shortName ??
      "",

    summary:
      category.summary ??
      "",

    description:
      categoryDescriptionToDocument(
        category.description,
      ),

    image:
      category.image ??
      "",

    imagePublicId:
      category.imagePublicId ??
      "",

    heroImage:
      category.heroImage ??
      "",

    heroImagePublicId:
      category.heroImagePublicId ??
      "",

    parentId:
      category.parentId,

    position:
      category.position,

    isActive:
      category.isActive,
  };
}

function categoryDescriptionToDocument(
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
   * New rich-text descriptions are stored
   * as one serialized value.
   *
   * Existing plain descriptions are split
   * by line breaks so old multi-paragraph
   * content is preserved correctly.
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
            (item) =>
              item.trim(),
          )
          .filter(
            Boolean,
          );

  return storedServiceTextToDocument(
    values,
  );
}

function imageErrorMessage(
  value: string,
) {
  return value;
}

export function CategoryEditor({
  initial,
}: {
  initial:
    AdminCategory[];
}) {
  const router =
    useRouter();

  const cardInputReference =
    useRef<HTMLInputElement>(
      null,
    );

  const heroInputReference =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    categories,
    setCategories,
  ] = useState(initial);

  const [
    draft,
    setDraft,
  ] = useState<Draft>(
    () =>
      initial[0]
        ? fromCategory(
            initial[0],
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

  /*
   * Images uploaded during the current
   * editor session but not yet committed
   * to the database.
   *
   * If the administrator switches away,
   * these can safely be removed.
   */

  const [
    pendingPublicIds,
    setPendingPublicIds,
  ] = useState<
    Set<string>
  >(
    () =>
      new Set(),
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    uploading,
    setUploading,
  ] = useState<
    ImageTarget | null
  >(null);

  const [
    message,
    setMessage,
  ] = useState("");

  const tree =
    useMemo(
      () =>
        buildTree(
          categories,
        ),
      [
        categories,
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
            categories,
            draft.id,
          );

        descendants.add(
          draft.id,
        );

        return descendants;
      },
      [
        categories,
        draft.id,
      ],
    );

  const busy =
    saving ||
    uploading !== null;

  async function deleteCloudinaryAsset(
    publicId: string,
  ) {
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
            JSON.stringify(
              {
                publicId,

                kind:
                  "category",
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

    if (!response.ok) {
      throw new Error(
        result.error ||
          "Unable to remove the category image.",
      );
    }
  }

  async function cleanupPendingUploads(
    exclude:
      string[] = [],
  ) {
    const excluded =
      new Set(
        exclude.filter(
          Boolean,
        ),
      );

    const toDelete =
      [
        ...pendingPublicIds,
      ].filter(
        (
          publicId,
        ) =>
          !excluded.has(
            publicId,
          ),
      );

    if (
      !toDelete.length
    ) {
      return;
    }

    await Promise.allSettled(
      toDelete.map(
        (
          publicId,
        ) =>
          deleteCloudinaryAsset(
            publicId,
          ),
      ),
    );

    setPendingPublicIds(
      new Set(),
    );
  }

  async function select(
    category:
      AdminCategory,
  ) {
    if (busy) {
      return;
    }

    await cleanupPendingUploads();

    setDraft(
      fromCategory(
        category,
      ),
    );

    setMessage("");
  }

  async function addRoot() {
    if (busy) {
      return;
    }

    await cleanupPendingUploads();

    setDraft(
      emptyDraft(
        null,
      ),
    );

    setMessage("");
  }

  async function addChild(
    parent:
      AdminCategory,
  ) {
    if (busy) {
      return;
    }

    await cleanupPendingUploads();

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
    id: string,
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
          next.has(id)
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

  function validateFile(
    file: File,
  ) {
    if (
      !allowedTypes.has(
        file.type,
      )
    ) {
      return imageErrorMessage(
        "Only JPG, PNG, WebP and AVIF images are allowed.",
      );
    }

    if (
      file.size <= 0
    ) {
      return imageErrorMessage(
        "The selected image is empty.",
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return imageErrorMessage(
        "The image must be 10 MB or smaller.",
      );
    }

    return "";
  }

  async function uploadImage(
    target:
      ImageTarget,

    file:
      | File
      | undefined,
  ) {
    if (
      !file ||
      busy
    ) {
      return;
    }

    const validationError =
      validateFile(
        file,
      );

    if (
      validationError
    ) {
      setMessage(
        validationError,
      );

      return;
    }

    setUploading(
      target,
    );

    setMessage("");

    try {
      const formData =
        new FormData();

      formData.set(
        "file",
        file,
      );

      formData.set(
        "kind",
        "category",
      );

      formData.set(
        "categorySlug",
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
              formData,
          },
        );

      const result =
        (await response.json()) as
          UploadResponse;

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to upload the category image.",
        );
      }

      const url =
        result.image
          ?.secureUrl ||
        result.image?.url;

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

      /*
       * If the image currently occupying
       * this slot was itself uploaded in
       * this unsaved session, it is safe
       * to remove that temporary asset now.
       *
       * Existing DB-owned images are NOT
       * removed here. The category API will
       * remove those only after DB save.
       */

      const currentPublicId =
        target ===
        "card"
          ? draft.imagePublicId
          : draft.heroImagePublicId;

      if (
        currentPublicId &&
        pendingPublicIds.has(
          currentPublicId,
        )
      ) {
        await deleteCloudinaryAsset(
          currentPublicId,
        ).catch(
          () =>
            undefined,
        );

        setPendingPublicIds(
          (
            current,
          ) => {
            const next =
              new Set(
                current,
              );

            next.delete(
              currentPublicId,
            );

            return next;
          },
        );
      }

      setPendingPublicIds(
        (
          current,
        ) => {
          const next =
            new Set(
              current,
            );

          next.add(
            publicId,
          );

          return next;
        },
      );

      setDraft(
        (
          current,
        ) =>
          target ===
          "card"
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
        target ===
        "card"
          ? "Card image uploaded to Cloudinary. Save the category to commit it."
          : "Hero image uploaded to Cloudinary. Save the category to commit it.",
      );
    } catch (
      error
    ) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload the category image.",
      );
    } finally {
      setUploading(
        null,
      );

      if (
        target ===
          "card" &&
        cardInputReference.current
      ) {
        cardInputReference.current.value =
          "";
      }

      if (
        target ===
          "hero" &&
        heroInputReference.current
      ) {
        heroInputReference.current.value =
          "";
      }
    }
  }

  function handleImageInput(
    target:
      ImageTarget,

    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target
        .files?.[0];

    void uploadImage(
      target,
      file,
    );
  }

  async function clearImage(
    target:
      ImageTarget,
  ) {
    if (busy) {
      return;
    }

    const publicId =
      target ===
      "card"
        ? draft.imagePublicId
        : draft.heroImagePublicId;

    /*
     * If this asset was uploaded only in
     * the current unsaved session, remove
     * it immediately.
     *
     * Existing persisted assets remain in
     * Cloudinary until Save succeeds.
     */

    if (
      publicId &&
      pendingPublicIds.has(
        publicId,
      )
    ) {
      await deleteCloudinaryAsset(
        publicId,
      ).catch(
        () =>
          undefined,
      );

      setPendingPublicIds(
        (
          current,
        ) => {
          const next =
            new Set(
              current,
            );

          next.delete(
            publicId,
          );

          return next;
        },
      );
    }

    setDraft(
      (
        current,
      ) =>
        target ===
        "card"
          ? {
              ...current,

              image:
                "",

              imagePublicId:
                "",
            }
          : {
              ...current,

              heroImage:
                "",

              heroImagePublicId:
                "",
            },
    );

    setMessage(
      "Image removed from this category draft. Save the category to apply the change.",
    );
  }

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (uploading) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const payload = {
        ...draft,

        description:
          documentToStoredServiceText(
            draft.description,
          )[0] ?? "",
      };

      const response =
        await fetch(
          "/api/admin/categories",
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

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to save category.",
        );
      }

      const next =
        (
          result.categories ??
          []
        ) as AdminCategory[];

      setCategories(
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

      /*
       * These uploads are now owned
       * by the saved DB record.
       */

      setPendingPublicIds(
        new Set(),
      );

      if (saved) {
        setDraft(
          fromCategory(
            saved,
          ),
        );
      }

      setMessage(
        draft.id
          ? "Category updated successfully."
          : "Category created successfully.",
      );

      router.refresh();
    } catch (
      error
    ) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save category.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (
      !draft.id ||
      busy
    ) {
      return;
    }

    const category =
      categories.find(
        (
          item,
        ) =>
          item.id ===
          draft.id,
      );

    if (!category) {
      return;
    }

    if (
      !confirm(
        `Delete "${category.name}"?\n\nOnly empty leaf categories can be deleted.`,
      )
    ) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      /*
       * Remove temporary unsaved category
       * uploads first. Persisted category
       * assets are removed by the API only
       * after category deletion succeeds.
       */

      await cleanupPendingUploads();

      const response =
        await fetch(
          `/api/admin/categories?id=${encodeURIComponent(
            category.id,
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

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to delete category.",
        );
      }

      const next =
        (
          result.categories ??
          []
        ) as AdminCategory[];

      setCategories(
        next,
      );

      setDraft(
        next[0]
          ? fromCategory(
              next[0],
            )
          : emptyDraft(),
      );

      setMessage(
        "Category deleted successfully.",
      );

      router.refresh();
    } catch (
      error
    ) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete category.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleCategoryVisibility(
    category:
      AdminCategory,
  ) {
    if (busy) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response =
        await fetch(
          "/api/admin/categories",
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
                    category.id,

                  name:
                    category.name,

                  slug:
                    category.slug,

                  shortName:
                    category.shortName ??
                    "",

                  summary:
                    category.summary ??
                    "",

                  /*
                   * IMPORTANT:
                   * Preserve the already-stored
                   * serialized rich text exactly
                   * when only toggling visibility.
                   */
                  description:
                    category.description ??
                    "",

                  image:
                    category.image ??
                    "",

                  imagePublicId:
                    category.imagePublicId ??
                    "",

                  heroImage:
                    category.heroImage ??
                    "",

                  heroImagePublicId:
                    category.heroImagePublicId ??
                    "",

                  parentId:
                    category.parentId,

                  position:
                    category.position,

                  isActive:
                    !category.isActive,
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

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to update category visibility.",
        );
      }

      const next =
        (
          result.categories ??
          []
        ) as AdminCategory[];

      setCategories(
        next,
      );

      if (
        draft.id ===
        category.id
      ) {
        const updated =
          next.find(
            (
              item,
            ) =>
              item.id ===
              category.id,
          );

        if (updated) {
          setDraft(
            fromCategory(
              updated,
            ),
          );
        }
      }

      setMessage(
        category.isActive
          ? `"${category.name}" hidden successfully.`
          : `"${category.name}" is now visible.`,
      );

      router.refresh();
    } catch (
      error
    ) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update category visibility.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategoryNode(
    category:
      AdminCategory,
  ) {
    if (busy) {
      return;
    }

    if (
      !confirm(
        `Delete "${category.name}"?\n\nOnly empty leaf categories can be deleted.`,
      )
    ) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      if (
        draft.id ===
        category.id
      ) {
        await cleanupPendingUploads();
      }

      const response =
        await fetch(
          `/api/admin/categories?id=${encodeURIComponent(
            category.id,
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

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to delete category.",
        );
      }

      const next =
        (
          result.categories ??
          []
        ) as AdminCategory[];

      setCategories(
        next,
      );

      if (
        draft.id ===
        category.id
      ) {
        setDraft(
          next[0]
            ? fromCategory(
                next[0],
              )
            : emptyDraft(),
        );
      }

      setMessage(
        `"${category.name}" deleted successfully.`,
      );

      router.refresh();
    } catch (
      error
    ) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete category.",
      );
    } finally {
      setSaving(false);
    }
  }

  function renderNode(
    node:
      TreeNode<AdminCategory>,
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
              `${Math.max(
                0,
                node.depth -
                  1,
              ) * 18}px`,
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
            disabled={
              busy
            }
            onClick={() =>
              void select(
                node,
              )
            }
            className="flex-1 text-left"
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

              <span>
                {
                  node.productCount
                }{" "}
                products
              </span>

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
                busy
              }
              onClick={() =>
                void toggleCategoryVisibility(
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
                  busy
                }
                onClick={() =>
                  void addChild(
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
                busy
              }
              onClick={() =>
                void deleteCategoryNode(
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
      <section className="card p-5 xl:sticky xl:top-6 xl:self-start">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="eyebrow">
              Product taxonomy
            </div>

            <h2 className="mt-2 text-xl font-black">
              Category Tree
            </h2>

            <p className="mt-2 text-sm text-[#627780]">
              Recursive product structure
              with a maximum of{" "}
              {MAX_TREE_DEPTH} levels.
            </p>
          </div>

          <button
            type="button"
            disabled={
              busy
            }
            onClick={() =>
              void addRoot()
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
              No categories yet.
              Create the first root
              category.
            </div>
          )}
        </div>
      </section>

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
                  ? "Edit category"
                  : "Create category"}
              </div>

              <h2 className="mt-2 text-xl font-black">
                {draft.name ||
                  "New Product Category"}
              </h2>
            </div>

            {draft.id && (
              <span className="status">
                {categories.find(
                  (
                    item,
                  ) =>
                    item.id ===
                    draft.id,
                )
                  ?.productCount ??
                  0}{" "}
                products
              </span>
            )}
          </div>

          <div className="form-grid mt-6">
            <div className="field">
              <label>
                Name *
              </label>

              <input
                required
                value={
                  draft.name
                }
                onChange={
                  (
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
                onChange={
                  (
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
                onChange={
                  (
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
                onChange={
                  (
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
                  Root category
                </option>

                {[...categories]
                .sort(
                  (
                    a,
                    b,
                  ) =>
                    a.name.localeCompare(
                      b.name,
                      undefined,
                      {
                        sensitivity:
                          "base",

                        numeric:
                          true,
                      },
                    ),
                )
                .map(
                  (
                    category,
                  ) => (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                      disabled={
                        forbiddenParents.has(
                          category.id,
                        )
                      }
                    >
                      {
                        category.name
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
                onChange={
                  (
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
                  onChange={
                    (
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
                  Visible on public
                  website
                </span>
              </label>
            </div>

            <div className="field span-2">
              <label>
                Card Summary
              </label>

              <textarea
                className="!min-h-[100px]"
                value={
                  draft.summary
                }
                placeholder="Short description used on category cards."
                onChange={
                  (
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

              <div className="mt-1 text-[11px] leading-5 text-[#7b8d94]">
                Keep this concise. It is
                used on category and
                subcategory cards.
              </div>
            </div>

            <div className="field span-2">
              <label>
                Hero Description
              </label>

              <ServiceRichTextEditor
                value={
                  draft.description
                }
                disabled={
                  busy
                }
                minHeightClass="min-h-[220px]"
                onChange={(
                  description,
                ) =>
                  setDraft(
                    (
                      current,
                    ) => ({
                      ...current,

                      description,
                    }),
                  )
                }
              />

              <div className="mt-2 text-[11px] leading-5 text-[#7b8d94]">
                This content appears in the
                category hero banner. You can
                create multiple paragraphs and
                format selected text with bold,
                italic, and text size controls.
              </div>
            </div>
          </div>
        </section>

        <section className="card p-6 md:p-7">
          <div className="eyebrow">
            Category media
          </div>

          <h2 className="mt-2 text-xl font-black">
            Cloudinary Images
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#71838b]">
            Upload category media directly
            to Cloudinary. The secure URL
            is stored in Neon and used
            automatically on the public
            Products pages.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[#dfe8e4] bg-[#fafcfb] p-5">
              <div className="text-sm font-black text-[#17313d]">
                Card Image
              </div>

              <p className="mt-1 text-xs leading-5 text-[#71838b]">
                Used for category cards
                on Products and
                subcategory pages.
              </p>

              <div className="mt-4 overflow-hidden rounded-xl border border-[#dfe8e4] bg-white">
                {draft.image ? (
                  <img
                    src={
                      draft.image
                    }
                    alt={
                      draft.name ||
                      "Category image"
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
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={
                  busy
                }
                onChange={
                  (
                    event,
                  ) =>
                    handleImageInput(
                      "card",
                      event,
                    )
                }
                className="hidden"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={
                    busy
                  }
                  onClick={() =>
                    cardInputReference.current?.click()
                  }
                  className="btn btn-secondary"
                >
                  {uploading ===
                  "card"
                    ? "Uploading..."
                    : draft.image
                      ? "Replace Card Image"
                      : "Upload Card Image"}
                </button>

                {draft.image && (
                  <button
                    type="button"
                    disabled={
                      busy
                    }
                    onClick={() =>
                      void clearImage(
                        "card",
                      )
                    }
                    className="rounded-md border border-red-200 px-4 py-3 text-xs font-extrabold text-red-600 transition hover:bg-red-50"
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
                Used as the large
                background image on the
                recursive category page.
              </p>

              <div className="mt-4 overflow-hidden rounded-xl border border-[#dfe8e4] bg-white">
                {draft.heroImage ? (
                  <img
                    src={
                      draft.heroImage
                    }
                    alt={
                      draft.name ||
                      "Category hero"
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
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={
                  busy
                }
                onChange={
                  (
                    event,
                  ) =>
                    handleImageInput(
                      "hero",
                      event,
                    )
                }
                className="hidden"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={
                    busy
                  }
                  onClick={() =>
                    heroInputReference.current?.click()
                  }
                  className="btn btn-secondary"
                >
                  {uploading ===
                  "hero"
                    ? "Uploading..."
                    : draft.heroImage
                      ? "Replace Hero Image"
                      : "Upload Hero Image"}
                </button>

                {draft.heroImage && (
                  <button
                    type="button"
                    disabled={
                      busy
                    }
                    onClick={() =>
                      void clearImage(
                        "hero",
                      )
                    }
                    className="rounded-md border border-red-200 px-4 py-3 text-xs font-extrabold text-red-600 transition hover:bg-red-50"
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
            JPG, PNG, WebP or AVIF.
            Maximum 10 MB. Replacing a
            saved image does not delete
            the old Cloudinary asset
            until the category is saved
            successfully.
          </div>
        </section>

        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#dfe8e4] bg-white/95 p-4 shadow-xl backdrop-blur">
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
                  "only jpg",
                ) ||
              message
                .toLowerCase()
                .includes(
                  "10 mb",
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
                  busy
                }
                onClick={() =>
                  void remove()
                }
                className="rounded-md border border-red-200 px-4 py-3 text-xs font-extrabold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            )}

            <button
              type="submit"
              disabled={
                busy
              }
              className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading
                ? "Uploading..."
                : saving
                  ? "Saving..."
                  : draft.id
                    ? "Save Category"
                    : "Create Category"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}