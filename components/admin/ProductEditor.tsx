"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ProductImageManager,
} from "@/components/admin/ProductImageManager";

import {
  ProductDocumentManager,
} from "@/components/admin/ProductDocumentManager";

import {
  ProductCategoryTreePicker,
} from "@/components/admin/ProductCategoryTreePicker";

import type {
  ProductCategoryTreeItem,
} from "@/components/admin/ProductCategoryTreePicker";

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

import type {
  ManagedProductDocument,
  ManagedProductImage,
  PriceGroup,
  Product,
  ProductSpecification,
} from "@/data/site";

type Props = {
  product?: Product;

  categories:
    ProductCategoryTreeItem[];

  priceGroups:
    PriceGroup[];

  initialImages?:
    ManagedProductImage[];

  initialDocuments?:
    ManagedProductDocument[];
};

type ProductPayload =
  Product & {
    managedImages:
      ManagedProductImage[];

    managedDocuments:
      ManagedProductDocument[];
  };

const blankProduct: Product = {
  slug: "",
  name: "",
  categorySlugs: [],
  primaryCategorySlug: "",
  subcategory: "",
  categoryGroups: {},
  eyebrow: "",
  summary: "",
  description: "",
  image: "",
  gallery: [],
  specs: [],
  standards: [],
  applications: [],

  showStandards: false,
  showApplications: false,

  commercialMode:
    "dealer-purchase-rfq",
  dealerPriceProtected:
    true,
  featured: false,
  availability:
    "Contact Dingsheng",
  sku: "",
  unitLabel: "Unit",
  basePrice: undefined,
  baseCurrency: "USD",
  minimumQty: undefined,
  leadTimeText: "",
  pricingNote: "",
  dealerCommercialDetails:
    "",
  dealerPrices: [],
  publicDownloads: [],
  dealerDownloads: [],
  relatedProducts: [],
  active: true,
};

function lines(
  value?: string[],
) {
  return (
    value ?? []
  ).join("\n");
}

function parseLines(
  value: string,
) {
  return value
    .split("\n")
    .map(
      (item) =>
        item.trim(),
    )
    .filter(Boolean);
}

function productDescriptionToDocument(
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

function normalizeManagedImages(
  images:
    ManagedProductImage[],
) {
  return images.map(
    (
      image,
      position,
    ) => ({
      id:
        image.id,

      url:
        image.url.trim(),

      cloudinaryPublicId:
        image.cloudinaryPublicId
          ?.trim() ||
        null,

      alt:
        image.alt.trim(),

      position,
    }),
  );
}

function calculateDealerPrice(
  basePrice:
    | number
    | undefined,

  discountPercent:
    | number
    | undefined,
) {
  if (
    typeof basePrice !==
      "number" ||
    !Number.isFinite(
      basePrice,
    )
  ) {
    return undefined;
  }

  const discount =
    typeof discountPercent ===
      "number" &&
    Number.isFinite(
      discountPercent,
    )
      ? discountPercent
      : 0;

  return (
    Math.round(
      (
        basePrice *
          (
            1 -
            discount /
              100
          ) +
        Number.EPSILON
      ) *
        100,
    ) / 100
  );
}

export function ProductEditor({
  product,
  categories,
  priceGroups,
  initialImages = [],
  initialDocuments = [],
}: Props) {
  const router =
    useRouter();

  const [
    form,
    setForm,
  ] =
    useState<Product>(
      product
        ? structuredClone(
            product,
          )
        : structuredClone(
            blankProduct,
          ),
    );

  const [
    description,
    setDescription,
  ] = useState<ServiceRichTextDocument>(
    () =>
      productDescriptionToDocument(
        product?.description,
      ),
  );

  const [
    managedImages,
    setManagedImages,
  ] = useState<
    ManagedProductImage[]
  >(
    structuredClone(
      initialImages,
    ),
  );

  const [
    managedDocuments,
    setManagedDocuments,
  ] = useState<
    ManagedProductDocument[]
  >(
    structuredClone(
      initialDocuments,
    ),
  );

  const [
    standards,
    setStandards,
  ] =
    useState(
      lines(
        product?.standards,
      ),
    );

  const [
    applications,
    setApplications,
  ] =
    useState(
      lines(
        product?.applications,
      ),
    );

  const [
    relatedProducts,
    setRelatedProducts,
  ] =
    useState(
      lines(
        product?.relatedProducts,
      ),
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    deletingProduct,
    setDeletingProduct,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  function patch<
    K extends keyof Product,
  >(
    key: K,
    value:
      Product[K],
  ) {
    setForm(
      (
        current,
      ) => ({
        ...current,

        [key]:
          value,
      }),
    );
  }

  function toggleCategory(
    slug: string,
  ) {
    setForm(
      (
        current,
      ) => {
        const exists =
          current
            .categorySlugs
            .includes(
              slug,
            );

        const categorySlugs =
          exists
            ? current
                .categorySlugs
                .filter(
                  (
                    item,
                  ) =>
                    item !==
                    slug,
                )
            : [
                ...current
                  .categorySlugs,

                slug,
              ];

        let primaryCategorySlug =
          current
            .primaryCategorySlug;

        if (
          !categorySlugs.includes(
            primaryCategorySlug,
          )
        ) {
          primaryCategorySlug =
            categorySlugs[0] ??
            "";
        }

        return {
          ...current,

          categorySlugs,

          primaryCategorySlug,
        };
      },
    );
  }

  function updateSpec(
    index:
      number,

    key:
      | 0
      | 1,

    value:
      string,
  ) {
    const specs =
      form.specs.map(
        (
          row,
          rowIndex,
        ) => {
          if (
            rowIndex !==
            index
          ) {
            return row;
          }

          const next:
            ProductSpecification =
            [
              row[0],
              row[1],
            ];

          next[key] =
            value;

          return next;
        },
      );

    patch(
      "specs",
      specs,
    );
  }

  function addSpec() {
    patch(
      "specs",
      [
        ...form.specs,

        [
          "",
          "",
        ],
      ],
    );
  }

  function removeSpec(
    index:
      number,
  ) {
    patch(
      "specs",

      form.specs.filter(
        (
          _,
          rowIndex,
        ) =>
          rowIndex !==
          index,
      ),
    );
  }

  async function deleteUnsavedImages() {
    const unsavedPublicIds =
      [
        ...new Set(
          managedImages
            .filter(
              (
                image,
              ) =>
                image.uploadedNow &&
                image.cloudinaryPublicId,
            )
            .map(
              (
                image,
              ) =>
                image.cloudinaryPublicId,
            )
            .filter(
              (
                publicId,
              ): publicId is string =>
                Boolean(
                  publicId,
                ),
            ),
        ),
      ];

    if (
      !unsavedPublicIds.length
    ) {
      return;
    }

    await Promise.allSettled(
      unsavedPublicIds.map(
        async (
          publicId,
        ) => {
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
                    },
                  ),
              },
            );

          if (
            !response.ok
          ) {
            const result =
              await response
                .json()
                .catch(
                  () =>
                    ({}),
                );

            throw new Error(
              result.error ||
                "Unable to clean up an uploaded image.",
            );
          }
        },
      ),
    );
  }

  async function deleteUnsavedDocuments() {
    const unsavedPublicIds =
      [
        ...new Set(
          managedDocuments
            .filter(
              (
                document,
              ) =>
                document.uploadedNow &&
                document.cloudinaryPublicId,
            )
            .map(
              (
                document,
              ) =>
                document.cloudinaryPublicId,
            )
            .filter(
              (
                publicId,
              ): publicId is string =>
                Boolean(
                  publicId,
                ),
            ),
        ),
      ];

    if (
      !unsavedPublicIds.length
    ) {
      return;
    }

    await Promise.allSettled(
      unsavedPublicIds.map(
        async (
          publicId,
        ) => {
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
                        "product-document",
                    },
                  ),
              },
            );

          if (
            !response.ok
          ) {
            const result =
              await response
                .json()
                .catch(
                  () =>
                    ({}),
                );

            throw new Error(
              result.error ||
                "Unable to clean up an uploaded document.",
            );
          }
        },
      ),
    );
  }

  async function cancelEditing() {
    const hasUnsavedImages =
      managedImages.some(
        (
          image,
        ) =>
          image.uploadedNow,
      );

    const hasUnsavedDocuments =
      managedDocuments.some(
        (
          document,
        ) =>
          document.uploadedNow,
      );

    if (
      hasUnsavedImages ||
      hasUnsavedDocuments
    ) {
      const confirmed =
        confirm(
          "Leave this page? Newly uploaded unsaved images and documents will be removed.",
        );

      if (
        !confirmed
      ) {
        return;
      }

      setSaving(
        true,
      );

      await Promise.allSettled(
        [
          deleteUnsavedImages(),

          deleteUnsavedDocuments(),
        ],
      );
    }

    router.push(
      "/admin/products",
    );

    router.refresh();
  }

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(
      true,
    );

    setError(
      "",
    );

    setSuccess(
      "",
    );

    try {
      if (
        !form
          .categorySlugs
          .length
      ) {
        throw new Error(
          "Select at least one product category.",
        );
      }

      if (
        !form
          .primaryCategorySlug
      ) {
        throw new Error(
          "Select the primary product category.",
        );
      }

      const normalizedImages =
        normalizeManagedImages(
          managedImages,
        );

      const normalizedDocuments =
        managedDocuments
          .map(
            (
              document,
              position,
            ) => ({
              ...document,

              title:
                document.title
                  .trim(),

              filePath:
                document.filePath
                  .trim(),

              cloudinaryPublicId:
                document
                  .cloudinaryPublicId
                  ?.trim() ||
                null,

              originalFileName:
                document
                  .originalFileName
                  ?.trim() ||
                null,

              mimeType:
                document
                  .mimeType
                  ?.trim() ||
                null,

              position,

              uploadedNow:
                undefined,
            }),
          )
          .filter(
            (
              document,
            ) =>
              Boolean(
                document.filePath,
              ),
          );

      const payload:
        ProductPayload =
        {
          ...form,

          description:
            documentToStoredServiceText(
              description,
            )[0] ?? "",

          showStandards:
            form.showStandards ===
            true,

          showApplications:
            form.showApplications ===
            true,

          subcategory:
            form.subcategory ??
            "",

          categoryGroups:
            form.categoryGroups ??
            {},

          image:
            normalizedImages[0]
              ?.url ??
            "",

          gallery:
            normalizedImages
              .slice(
                1,
              )
              .map(
                (
                  image,
                ) =>
                  image.url,
              ),

          standards:
            parseLines(
              standards,
            ),

          applications:
            parseLines(
              applications,
            ),

          /*
           * Compatibility fields.
           *
           * Keep these until the old JSON
           * product catalogue is fully removed.
           */
          publicDownloads:
            normalizedDocuments
              .filter(
                (
                  document,
                ) =>
                  !document.dealerOnly,
              )
              .map(
                (
                  document,
                ) =>
                  document.filePath,
              ),

          dealerDownloads:
            normalizedDocuments
              .filter(
                (
                  document,
                ) =>
                  document.dealerOnly,
              )
              .map(
                (
                  document,
                ) =>
                  document.filePath,
              ),

          relatedProducts:
            parseLines(
              relatedProducts,
            ),

          specs:
            form.specs.filter(
              (
                [
                  label,
                  value,
                ],
              ) =>
                label.trim() ||
                value.trim(),
            ),

          managedImages:
            normalizedImages,

          managedDocuments:
            normalizedDocuments,
        };

      const endpoint =
        product
          ? `/api/admin/products/${encodeURIComponent(
              product.slug,
            )}`
          : "/api/admin/products";

      const response =
        await fetch(
          endpoint,
          {
            method:
              product
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
            () =>
              ({}),
          );

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Unable to save product.",
        );
      }

      setManagedImages(
        normalizedImages.map(
          (
            image,
          ) => ({
            ...image,

            uploadedNow:
              false,
          }),
        ),
      );

      setManagedDocuments(
        normalizedDocuments.map(
          (
            document,
          ) => ({
            ...document,

            uploadedNow:
              false,
          }),
        ),
      );

      setSuccess(
        "Product, images and documents saved successfully.",
      );

      router.push(
        `/admin/products/${result.product.slug}`,
      );

      router.refresh();
    } catch (
      submitError
    ) {
      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Unable to save product.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  async function remove() {
    if (
      !product
    ) {
      return;
    }

    const confirmed =
      confirm(
        `Delete ${product.name}? This cannot be undone.`,
      );

    if (
      !confirmed
    ) {
      return;
    }

    setDeletingProduct(
      true,
    );

    setError(
      "",
    );

    setSuccess(
      "",
    );

    try {
      /*
       * Clean up any unsaved
       * Cloudinary assets first.
       */
      await Promise.allSettled(
        [
          deleteUnsavedImages(),

          deleteUnsavedDocuments(),
        ],
      );

      const response =
        await fetch(
          `/api/admin/products/${encodeURIComponent(
            product.slug,
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
            () =>
              ({}),
          );

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Unable to delete product.",
        );
      }

      router.push(
        "/admin/products",
      );

      router.refresh();
    } catch (
      deleteError
    ) {
      setError(
        deleteError instanceof
          Error
          ? deleteError.message
          : "Unable to delete product.",
      );

      setDeletingProduct(
        false,
      );
    }
  }

  return (
    <form
      onSubmit={
        submit
      }
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]"
    >
      <div className="space-y-6">
        <section className="card p-6 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="eyebrow">
                Product identity
              </div>

              <h2 className="mt-2 text-xl font-black">
                Core product information
              </h2>
            </div>

            <span className="status">
              Dynamic content
            </span>
          </div>

          <div className="form-grid mt-6">
            <div className="field">
              <label>
                Product name *
              </label>

              <input
                value={
                  form.name
                }
                onChange={(
                  event,
                ) =>
                  patch(
                    "name",

                    event
                      .target
                      .value,
                  )
                }
                required
              />
            </div>

            <div className="field">
              <label>
                Slug
              </label>

              <input
                value={
                  form.slug
                }
                onChange={(
                  event,
                ) =>
                  patch(
                    "slug",

                    event
                      .target
                      .value,
                  )
                }
                placeholder="auto-generated if blank"
              />
            </div>

            <div className="field">
              <label>
                Eyebrow / short label
              </label>

              <input
                value={
                  form.eyebrow
                }
                onChange={(
                  event,
                ) =>
                  patch(
                    "eyebrow",

                    event
                      .target
                      .value,
                  )
                }
              />
            </div>

            <div className="field span-2">
              <label>
                Short summary
              </label>

              <textarea
                value={
                  form.summary
                }
                onChange={(
                  event,
                ) =>
                  patch(
                    "summary",

                    event
                      .target
                      .value,
                  )
                }
              />
            </div>

            <div className="field span-2">
              <label>
                Full description
              </label>

              <ServiceRichTextEditor
                value={
                  description
                }
                disabled={
                  saving ||
                  deletingProduct
                }
                minHeightClass="min-h-[220px]"
                onChange={
                  setDescription
                }
              />

              <p className="mt-2 text-[11px] leading-5 text-[#7a8c94]">
                Use multiple paragraphs and select text
                to apply Bold, Italic or Text Size formatting.
              </p>
            </div>
          </div>
        </section>

        <ProductImageManager
          images={
            managedImages
          }
          productName={
            form.name
          }
          productSlug={
            form.slug
          }
          disabled={
            saving ||
            deletingProduct
          }
          onChange={
            setManagedImages
          }
        />

        <section className="card p-6 md:p-7">
          <div className="eyebrow">
            Classification
          </div>

          <h2 className="mt-2 text-xl font-black">
            Product category tree
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#71838b]">
            Assign the product to the most specific relevant category.
            Multiple category branches are supported when genuinely
            required. Choose one selected category as the primary
            category.
          </p>

          <div className="mt-5">
            <ProductCategoryTreePicker
              categories={
                categories
              }
              selectedSlugs={
                form.categorySlugs
              }
              primarySlug={
                form.primaryCategorySlug
              }
              onToggle={
                toggleCategory
              }
              onPrimaryChange={(
                slug,
              ) =>
                patch(
                  "primaryCategorySlug",

                  slug,
                )
              }
            />
          </div>

          <div className="field mt-6 max-w-md">
            <label>
              Primary category *
            </label>

            <select
              value={
                form.primaryCategorySlug
              }
              onChange={(
                event,
              ) =>
                patch(
                  "primaryCategorySlug",

                  event
                    .target
                    .value,
                )
              }
              required
            >
              <option value="">
                Select primary category
              </option>

              {categories
                .filter(
                  (
                    category,
                  ) =>
                    form
                      .categorySlugs
                      .includes(
                        category.slug,
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
                        category.slug
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
        </section>

        <section className="card p-6 md:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="eyebrow">
                Technical data
              </div>

              <h2 className="mt-2 text-xl font-black">
                Specifications
              </h2>
            </div>

            <button
              type="button"
              onClick={
                addSpec
              }
              className="btn btn-secondary"
            >
              + Add specification
            </button>
          </div>

          <div className="mt-6 grid gap-3">
            {form.specs.length ===
              0 && (
              <div className="rounded-lg border border-dashed border-[#cfded7] p-5 text-sm text-[#71838b]">
                No specifications yet. Leave this empty when the client
                source does not provide reliable technical values.
              </div>
            )}

            {form.specs.map(
              (
                [
                  label,
                  value,
                ],

                index,
              ) => (
                <div
                  key={
                    index
                  }
                  className="grid gap-2 rounded-lg border border-[#e0e9e5] bg-[#fafcfb] p-3 md:grid-cols-[.8fr_1.2fr_auto]"
                >
                  <input
                    className="rounded-md border border-[#d8e4df] px-3 py-2 text-sm outline-none focus:border-[#0a9c63]"
                    placeholder="Specification"
                    value={
                      label
                    }
                    onChange={(
                      event,
                    ) =>
                      updateSpec(
                        index,

                        0,

                        event
                          .target
                          .value,
                      )
                    }
                  />

                  <input
                    className="rounded-md border border-[#d8e4df] px-3 py-2 text-sm outline-none focus:border-[#0a9c63]"
                    placeholder="Value"
                    value={
                      value
                    }
                    onChange={(
                      event,
                    ) =>
                      updateSpec(
                        index,

                        1,

                        event
                          .target
                          .value,
                      )
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeSpec(
                        index,
                      )
                    }
                    className="rounded-md border border-red-200 px-3 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ),
            )}
          </div>

          <div className="field">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label>
                Standards / references — one per line
              </label>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#d8e4df] bg-[#f8fbf9] px-3 py-2 text-xs font-bold text-[#536b75]">
                <input
                  type="checkbox"
                  checked={
                    form.showStandards ===
                    true
                  }
                  onChange={(
                    event,
                  ) =>
                    patch(
                      "showStandards",

                      event
                        .target
                        .checked,
                    )
                  }
                  className="h-4 w-4 accent-[#0a9c63]"
                />

                Show on website
              </label>
            </div>

            <textarea
              value={
                standards
              }
              onChange={(
                event,
              ) =>
                setStandards(
                  event
                    .target
                    .value,
                )
              }
            />

            <p className="mt-2 text-[11px] leading-5 text-[#7a8c94]">
              Standards can remain saved here even when
              this section is hidden from the public
              product page.
            </p>
          </div>

          <div className="field">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label>
                Applications — one per line
              </label>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#d8e4df] bg-[#f8fbf9] px-3 py-2 text-xs font-bold text-[#536b75]">
                <input
                  type="checkbox"
                  checked={
                    form.showApplications ===
                    true
                  }
                  onChange={(
                    event,
                  ) =>
                    patch(
                      "showApplications",

                      event
                        .target
                        .checked,
                    )
                  }
                  className="h-4 w-4 accent-[#0a9c63]"
                />

                Show on website
              </label>
            </div>

            <textarea
              value={
                applications
              }
              onChange={(
                event,
              ) =>
                setApplications(
                  event
                    .target
                    .value,
                )
              }
            />

            <p className="mt-2 text-[11px] leading-5 text-[#7a8c94]">
              Applications can remain saved here even
              when this section is hidden from the public
              product page.
            </p>
          </div>
        </section>

        <section className="card p-6 md:p-7">
          <div className="eyebrow">
            Documents
          </div>

          <h2 className="mt-2 text-xl font-black">
            Public & dealer resources
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71838b]">
            Public documents can be opened from the product page.
            Dealer-only documents remain protected and require an
            approved dealer session.
          </p>

          <div className="mt-6">
            <ProductDocumentManager
              productSlug={
                form.slug ||
                form.name ||
                "unassigned"
              }
              documents={
                managedDocuments
              }
              onChange={
                setManagedDocuments
              }
            />
          </div>
        </section>

        <section className="card p-6 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="eyebrow">
                Dealer commerce
              </div>

              <h2 className="mt-2 text-xl font-black">
                Pricing & commercial details
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#71838b]">
                Set one base price for this product. Dealer pricing is
                calculated automatically from each price group&apos;s
                discount percentage.
              </p>
            </div>

            <span className="status">
              Protected
            </span>
          </div>

          <div className="form-grid mt-6">
            <div className="field">
              <label>
                SKU / internal code
              </label>

              <input
                value={
                  form.sku ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  patch(
                    "sku",

                    event
                      .target
                      .value,
                  )
                }
                placeholder="Optional"
              />
            </div>

            <div className="field">
              <label>
                Unit label
              </label>

              <input
                value={
                  form.unitLabel ??
                  "Unit"
                }
                onChange={(
                  event,
                ) =>
                  patch(
                    "unitLabel",

                    event
                      .target
                      .value,
                  )
                }
                placeholder="Unit / Set / Piece / System"
              />
            </div>

            <div className="field">
              <label>
                Base price
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  form.basePrice ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  patch(
                    "basePrice",

                    event
                      .target
                      .value
                      .trim() ===
                      ""
                      ? undefined
                      : Number(
                          event
                            .target
                            .value,
                        ),
                  )
                }
                placeholder="Not set"
              />
            </div>

            <div className="field">
              <label>
                Currency
              </label>

              <input
                maxLength={
                  3
                }
                value={
                  form.baseCurrency ??
                  "USD"
                }
                onChange={(
                  event,
                ) =>
                  patch(
                    "baseCurrency",

                    event
                      .target
                      .value
                      .toUpperCase(),
                  )
                }
                placeholder="USD"
              />
            </div>

            <div className="field">
              <label>
                Minimum quantity
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={
                  form.minimumQty ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  patch(
                    "minimumQty",

                    event
                      .target
                      .value
                      .trim() ===
                      ""
                      ? undefined
                      : Number(
                          event
                            .target
                            .value,
                        ),
                  )
                }
                placeholder="Optional"
              />
            </div>

            <div className="field">
              <label>
                Lead time
              </label>

              <input
                value={
                  form.leadTimeText ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  patch(
                    "leadTimeText",

                    event
                      .target
                      .value,
                  )
                }
                placeholder="Example: 10–15 days"
              />
            </div>

            <div className="field span-2">
              <label>
                Pricing note
              </label>

              <input
                value={
                  form.pricingNote ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  patch(
                    "pricingNote",

                    event
                      .target
                      .value,
                  )
                }
                placeholder="Optional protected dealer pricing note"
              />
            </div>

            <div className="field span-2">
              <label>
                Dealer commercial details
              </label>

              <textarea
                value={
                  form
                    .dealerCommercialDetails ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  patch(
                    "dealerCommercialDetails",

                    event
                      .target
                      .value,
                  )
                }
                placeholder="Commercial notes, packing, payment notes or other approved dealer-only information."
              />
            </div>
          </div>

          <div className="mt-7 border-t border-[#e3ebe7] pt-6">
            <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
              Dealer price preview
            </div>

            <p className="mt-2 text-xs leading-5 text-[#71838b]">
              These values are calculated automatically. Only the base
              price above is editable.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {priceGroups
                .filter(
                  (
                    group,
                  ) =>
                    group.active !==
                    false,
                )
                .map(
                  (
                    group,
                  ) => {
                    const price =
                      calculateDealerPrice(
                        form.basePrice,

                        group.discountPercent,
                      );

                    return (
                      <div
                        key={
                          group.slug
                        }
                        className="rounded-lg border border-[#dfe8e4] bg-[#fafcfb] p-4"
                      >
                        <div className="text-sm font-black text-[#17313d]">
                          {
                            group.name
                          }
                        </div>

                        <div className="mt-1 text-[10px] font-bold text-[#71838b]">
                          {
                            group.discountPercent ??
                            0
                          }
                          % discount
                        </div>

                        <div className="mt-3 text-lg font-black text-[#087a50]">
                          {price ===
                          undefined
                            ? "RFQ"
                            : `${form.baseCurrency || "USD"} ${price.toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits:
                                    2,

                                  maximumFractionDigits:
                                    2,
                                },
                              )}`}
                        </div>
                      </div>
                    );
                  },
                )}
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-[#e8d8aa] bg-[#fffaf0] p-4 text-xs leading-6 text-[#776e58]">
            If no base price is configured, the dealer portal will
            continue through the RFQ flow. Dealer discounts are managed
            centrally from Admin → Pricing.
          </div>
        </section>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <section className="card p-6">
          <div className="eyebrow">
            Image summary
          </div>

          <h2 className="mt-2 text-lg font-black">
            Primary product image
          </h2>

          <div className="mt-4 overflow-hidden rounded-xl border border-[#dfe8e4] bg-[#f5f8f6] p-3">
            {managedImages[0] ? (
              <img
                src={
                  managedImages[0]
                    .url
                }
                alt={
                  managedImages[0]
                    .alt ||
                  form.name ||
                  "Product preview"
                }
                className="h-44 w-full rounded-lg bg-white object-contain p-3"
              />
            ) : (
              <div className="flex h-44 items-center justify-center rounded-lg bg-white text-center text-xs font-bold uppercase tracking-[.12em] text-[#92a29b]">
                No product image
              </div>
            )}
          </div>

          <div className="mt-4 text-xs leading-6 text-[#71838b]">
            {managedImages.length
              ? `${managedImages.length} managed image${
                  managedImages.length ===
                  1
                    ? ""
                    : "s"
                }.`
              : "Upload images from the Product Images section."}
          </div>
        </section>

        <section className="card p-6">
          <div className="eyebrow">
            Commercial settings
          </div>

          <h2 className="mt-2 text-lg font-black">
            Visibility & sales mode
          </h2>

          <div className="field mt-5">
            <label>
              Commercial mode
            </label>

            <select
              value={
                form.commercialMode
              }
              onChange={(
                event,
              ) =>
                patch(
                  "commercialMode",

                  event
                    .target
                    .value as Product["commercialMode"],
                )
              }
            >
              <option value="information">
                Information only
              </option>

              <option value="rfq">
                RFQ only
              </option>

              <option value="dealer-purchase">
                Dealer purchase
              </option>

              <option value="dealer-purchase-rfq">
                Dealer purchase + RFQ
              </option>
            </select>
          </div>

          <div className="field mt-4">
            <label>
              Availability
            </label>

            <input
              value={
                form.availability ??
                ""
              }
              onChange={(
                event,
              ) =>
                patch(
                  "availability",

                  event
                    .target
                    .value,
                )
              }
            />
          </div>

          <div className="mt-5 grid gap-3 text-sm">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={
                  form.dealerPriceProtected
                }
                onChange={(
                  event,
                ) =>
                  patch(
                    "dealerPriceProtected",

                    event
                      .target
                      .checked,
                  )
                }
              />

              Protect pricing for dealers
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={
                  form.featured ===
                  true
                }
                onChange={(
                  event,
                ) =>
                  patch(
                    "featured",

                    event
                      .target
                      .checked,
                  )
                }
              />

              Featured product
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={
                  form.active !==
                  false
                }
                onChange={(
                  event,
                ) =>
                  patch(
                    "active",

                    event
                      .target
                      .checked,
                  )
                }
              />

              Visible on public catalogue
            </label>
          </div>
        </section>

        {(error ||
          success) && (
          <div
            className={`rounded-lg border p-4 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error ||
              success}
          </div>
        )}

        <section className="card p-5">
          <button
            disabled={
              saving ||
              deletingProduct
            }
            type="submit"
            className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : product
                ? "Save Product Changes"
                : "Create Product"}
          </button>

          <button
            type="button"
            disabled={
              saving ||
              deletingProduct
            }
            onClick={() =>
              void cancelEditing()
            }
            className="btn btn-secondary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          {product && (
            <button
              type="button"
              disabled={
                saving ||
                deletingProduct
              }
              onClick={() =>
                void remove()
              }
              className="mt-3 w-full rounded-md border border-red-200 py-3 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deletingProduct
                ? "Deleting..."
                : "Delete Product"}
            </button>
          )}
        </section>
      </aside>
    </form>
  );
}