"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ProductImageManager,
} from "@/components/admin/ProductImageManager";

import type {
  DealerPrice,
  ManagedProductImage,
  PriceGroup,
  Product,
  ProductCategory,
  ProductSpecification,
} from "@/data/site";

type Props = {
  product?: Product;
  categories: ProductCategory[];
  priceGroups: PriceGroup[];
  initialImages?: ManagedProductImage[];
};

type ProductPayload = Product & {
  managedImages: ManagedProductImage[];
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
  commercialMode: "dealer-purchase-rfq",
  dealerPriceProtected: true,
  featured: false,
  availability: "Contact Dingsheng",
  sku: "",
  unitLabel: "Unit",
  dealerCommercialDetails: "",
  dealerPrices: [],
  publicDownloads: [],
  dealerDownloads: [],
  relatedProducts: [],
  active: true,
};

function lines(value?: string[]) {
  return (value ?? []).join("\n");
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeManagedImages(
  images: ManagedProductImage[],
) {
  return images.map(
    (image, position) => ({
      id: image.id,
      url: image.url.trim(),

      cloudinaryPublicId:
        image.cloudinaryPublicId?.trim() ||
        null,

      alt: image.alt.trim(),
      position,
    }),
  );
}

export function ProductEditor({
  product,
  categories,
  priceGroups,
  initialImages = [],
}: Props) {
  const router = useRouter();

  const [form, setForm] =
    useState<Product>(
      product
        ? structuredClone(product)
        : structuredClone(blankProduct),
    );

  const [
    managedImages,
    setManagedImages,
  ] = useState<
    ManagedProductImage[]
  >(
    structuredClone(initialImages),
  );

  const [
    standards,
    setStandards,
  ] = useState(
    lines(product?.standards),
  );

  const [
    applications,
    setApplications,
  ] = useState(
    lines(product?.applications),
  );

  const [
    publicDownloads,
    setPublicDownloads,
  ] = useState(
    lines(product?.publicDownloads),
  );

  const [
    dealerDownloads,
    setDealerDownloads,
  ] = useState(
    lines(product?.dealerDownloads),
  );

  const [
    relatedProducts,
    setRelatedProducts,
  ] = useState(
    lines(product?.relatedProducts),
  );

  const [saving, setSaving] =
    useState(false);

  const [
    uploadingDocument,
    setUploadingDocument,
  ] = useState(false);

  const [
    deletingProduct,
    setDeletingProduct,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const groupOptions =
    useMemo(() => {
      const selected =
        categories.filter(
          (category) =>
            form.categorySlugs.includes(
              category.slug,
            ),
        );

      return [
        ...new Set(
          selected.flatMap(
            (category) =>
              category.groups,
          ),
        ),
      ];
    }, [
      categories,
      form.categorySlugs,
    ]);

  function patch<
    K extends keyof Product,
  >(
    key: K,
    value: Product[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleCategory(
    slug: string,
  ) {
    setForm((current) => {
      const exists =
        current.categorySlugs.includes(
          slug,
        );

      const categorySlugs = exists
        ? current.categorySlugs.filter(
            (item) => item !== slug,
          )
        : [
            ...current.categorySlugs,
            slug,
          ];

      const categoryGroups = {
        ...(current.categoryGroups ?? {}),
      };

      if (exists) {
        delete categoryGroups[slug];
      } else {
        const category =
          categories.find(
            (item) =>
              item.slug === slug,
          );

        categoryGroups[slug] =
          category?.groups[0] ??
          current.subcategory ??
          "";
      }

      let primaryCategorySlug =
        current.primaryCategorySlug;

      if (
        !categorySlugs.includes(
          primaryCategorySlug,
        )
      ) {
        primaryCategorySlug =
          categorySlugs[0] ?? "";
      }

      const subcategory =
        primaryCategorySlug
          ? categoryGroups[
              primaryCategorySlug
            ] ??
            current.subcategory
          : current.subcategory;

      return {
        ...current,
        categorySlugs,
        categoryGroups,
        primaryCategorySlug,
        subcategory,
      };
    });
  }

  function updateCategoryGroup(
    categorySlug: string,
    group: string,
  ) {
    setForm((current) => {
      const categoryGroups = {
        ...(current.categoryGroups ?? {}),
        [categorySlug]: group,
      };

      return {
        ...current,
        categoryGroups,

        subcategory:
          current.primaryCategorySlug ===
          categorySlug
            ? group
            : current.subcategory,
      };
    });
  }

  function updateSpec(
    index: number,
    key: 0 | 1,
    value: string,
  ) {
    const specs = form.specs.map(
      (row, rowIndex) => {
        if (rowIndex !== index) {
          return row;
        }

        const next:
          ProductSpecification = [
            row[0],
            row[1],
          ];

        next[key] = value;

        return next;
      },
    );

    patch("specs", specs);
  }

  function addSpec() {
    patch("specs", [
      ...form.specs,
      ["", ""],
    ]);
  }

  function removeSpec(
    index: number,
  ) {
    patch(
      "specs",
      form.specs.filter(
        (_, rowIndex) =>
          rowIndex !== index,
      ),
    );
  }

  function updateDealerPrice(
    groupSlug: string,
    key: keyof DealerPrice,
    value: string,
  ) {
    setForm((current) => {
      const prices = [
        ...(current.dealerPrices ?? []),
      ];

      const index =
        prices.findIndex(
          (item) =>
            item.priceGroupSlug ===
            groupSlug,
        );

      const existing:
        DealerPrice =
        index >= 0
          ? {
              ...prices[index],
            }
          : {
              priceGroupSlug:
                groupSlug,
              currency: "USD",
            };

      if (
        key === "amount" ||
        key === "minimumQty"
      ) {
        const trimmed =
          value.trim();

        (
          existing as DealerPrice &
            Record<string, unknown>
        )[key] =
          trimmed === ""
            ? undefined
            : Number(trimmed);
      } else {
        (
          existing as DealerPrice &
            Record<string, unknown>
        )[key] = value;
      }

      if (index >= 0) {
        prices[index] = existing;
      } else {
        prices.push(existing);
      }

      return {
        ...current,
        dealerPrices: prices,
      };
    });
  }

  function priceFor(
    groupSlug: string,
  ): DealerPrice {
    return (
      form.dealerPrices?.find(
        (item) =>
          item.priceGroupSlug ===
          groupSlug,
      ) ?? {
        priceGroupSlug: groupSlug,
        currency: "USD",
      }
    );
  }

  async function uploadDocument(
    file: File | undefined,
    target: "public" | "dealer",
  ) {
    if (!file) {
      return;
    }

    setUploadingDocument(true);
    setError("");
    setSuccess("");

    try {
      const data = new FormData();

      data.set("file", file);
      data.set("kind", "documents");

      const response = await fetch(
        "/api/admin/upload",
        {
          method: "POST",
          body: data,
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Document upload failed.",
        );
      }

      if (target === "public") {
        setPublicDownloads(
          (current) =>
            [
              current,
              result.url,
            ]
              .filter(Boolean)
              .join("\n"),
        );
      } else {
        setDealerDownloads(
          (current) =>
            [
              current,
              result.url,
            ]
              .filter(Boolean)
              .join("\n"),
        );
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Document upload failed.",
      );
    } finally {
      setUploadingDocument(false);
    }
  }

  async function deleteUnsavedImages() {
    const unsavedPublicIds = [
      ...new Set(
        managedImages
          .filter(
            (image) =>
              image.uploadedNow &&
              image.cloudinaryPublicId,
          )
          .map(
            (image) =>
              image.cloudinaryPublicId,
          )
          .filter(
            (
              publicId,
            ): publicId is string =>
              Boolean(publicId),
          ),
      ),
    ];

    if (!unsavedPublicIds.length) {
      return;
    }

    await Promise.allSettled(
      unsavedPublicIds.map(
        async (publicId) => {
          const response =
            await fetch(
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

          if (!response.ok) {
            const result =
              await response
                .json()
                .catch(() => ({}));

            throw new Error(
              result.error ||
                "Unable to clean up an uploaded image.",
            );
          }
        },
      ),
    );
  }

  async function cancelEditing() {
    if (
      managedImages.some(
        (image) =>
          image.uploadedNow,
      )
    ) {
      const confirmed =
        confirm(
          "Leave this page? Newly uploaded unsaved images will be removed.",
        );

      if (!confirmed) {
        return;
      }

      setSaving(true);
      await deleteUnsavedImages();
    }

    router.push("/admin/products");
    router.refresh();
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (
        !form.categorySlugs.length
      ) {
        throw new Error(
          "Select at least one product category.",
        );
      }

      if (
        !form.primaryCategorySlug
      ) {
        throw new Error(
          "Select the primary product category.",
        );
      }

      const primaryGroup =
        form.primaryCategorySlug
          ? form.categoryGroups?.[
              form.primaryCategorySlug
            ] ?? form.subcategory
          : form.subcategory;

      const normalizedImages =
        normalizeManagedImages(
          managedImages,
        );

      const payload:
        ProductPayload = {
        ...form,

        subcategory: primaryGroup,

        categoryGroups:
          form.categoryGroups ?? {},

        image:
          normalizedImages[0]?.url ??
          "",

        gallery:
          normalizedImages
            .slice(1)
            .map(
              (image) =>
                image.url,
            ),

        standards:
          parseLines(standards),

        applications:
          parseLines(applications),

        publicDownloads:
          parseLines(publicDownloads),

        dealerDownloads:
          parseLines(dealerDownloads),

        relatedProducts:
          parseLines(relatedProducts),

        specs:
          form.specs.filter(
            ([label, value]) =>
              label.trim() ||
              value.trim(),
          ),

        managedImages:
          normalizedImages,
      };

      const endpoint = product
        ? `/api/admin/products/${encodeURIComponent(
            product.slug,
          )}`
        : "/api/admin/products";

      const response = await fetch(
        endpoint,
        {
          method: product
            ? "PUT"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload,
          ),
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to save product.",
        );
      }

      setManagedImages(
        normalizedImages.map(
          (image) => ({
            ...image,
            uploadedNow: false,
          }),
        ),
      );

      setSuccess(
        "Product and images saved successfully.",
      );

      router.push(
        `/admin/products/${result.product.slug}`,
      );

      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save product.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!product) {
      return;
    }

    const confirmed = confirm(
      `Delete ${product.name}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingProduct(true);
    setError("");
    setSuccess("");

    try {
      /*
       * Uploaded images that have not been saved
       * are not owned by the database yet.
       */
      await deleteUnsavedImages();

      const response = await fetch(
        `/api/admin/products/${encodeURIComponent(
          product.slug,
        )}`,
        {
          method: "DELETE",
        },
      );

      const result =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to delete product.",
        );
      }

      router.push(
        "/admin/products",
      );

      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete product.",
      );

      setDeletingProduct(false);
    }
  }

  return (
    <form
      onSubmit={submit}
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
                value={form.name}
                onChange={(event) =>
                  patch(
                    "name",
                    event.target.value,
                  )
                }
                required
              />
            </div>

            <div className="field">
              <label>Slug</label>

              <input
                value={form.slug}
                onChange={(event) =>
                  patch(
                    "slug",
                    event.target.value,
                  )
                }
                placeholder="auto-generated if blank"
              />
            </div>

            <div className="field">
              <label>
                Subcategory / product group
              </label>

              <input
                list="product-groups"
                value={form.subcategory}
                onChange={(event) =>
                  patch(
                    "subcategory",
                    event.target.value,
                  )
                }
              />
            </div>

            <datalist id="product-groups">
              {groupOptions.map(
                (item) => (
                  <option
                    value={item}
                    key={item}
                  />
                ),
              )}
            </datalist>

            <div className="field">
              <label>
                Eyebrow / short label
              </label>

              <input
                value={form.eyebrow}
                onChange={(event) =>
                  patch(
                    "eyebrow",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field span-2">
              <label>
                Short summary *
              </label>

              <textarea
                value={form.summary}
                onChange={(event) =>
                  patch(
                    "summary",
                    event.target.value,
                  )
                }
                required
              />
            </div>

            <div className="field span-2">
              <label>
                Full description
              </label>

              <textarea
                value={
                  form.description ??
                  ""
                }
                onChange={(event) =>
                  patch(
                    "description",
                    event.target.value,
                  )
                }
                className="!min-h-[180px]"
              />
            </div>
          </div>
        </section>

        <ProductImageManager
          images={managedImages}
          productName={form.name}
          productSlug={form.slug}
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
            Product systems & groups
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#71838b]">
            A product can appear in multiple
            systems. Choose one primary category
            for the canonical public URL.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {categories.map(
              (category) => (
                <label
                  key={category.slug}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${
                    form.categorySlugs.includes(
                      category.slug,
                    )
                      ? "border-[#0a9c63] bg-[#eff9f4]"
                      : "border-[#dfe8e4] bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.categorySlugs.includes(
                      category.slug,
                    )}
                    onChange={() =>
                      toggleCategory(
                        category.slug,
                      )
                    }
                    className="mt-1"
                  />

                  <span>
                    <strong className="block text-sm">
                      {category.name}
                    </strong>

                    <span className="mt-1 block text-xs leading-5 text-[#71838b]">
                      {category.summary}
                    </span>
                  </span>
                </label>
              ),
            )}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {categories
              .filter((category) =>
                form.categorySlugs.includes(
                  category.slug,
                ),
              )
              .map((category) => (
                <div
                  className="field"
                  key={category.slug}
                >
                  <label>
                    {category.name} group
                  </label>

                  <select
                    value={
                      form.categoryGroups?.[
                        category.slug
                      ] ?? ""
                    }
                    onChange={(event) =>
                      updateCategoryGroup(
                        category.slug,
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      Select product group
                    </option>

                    {category.groups.map(
                      (group) => (
                        <option
                          key={group}
                          value={group}
                        >
                          {group}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              ))}
          </div>

          <div className="field mt-5 max-w-md">
            <label>
              Primary category *
            </label>

            <select
              value={
                form.primaryCategorySlug
              }
              onChange={(event) => {
                const value =
                  event.target.value;

                setForm(
                  (current) => ({
                    ...current,

                    primaryCategorySlug:
                      value,

                    subcategory:
                      current
                        .categoryGroups?.[
                        value
                      ] ??
                      current.subcategory,
                  }),
                );
              }}
              required
            >
              <option value="">
                Select primary category
              </option>

              {categories
                .filter((category) =>
                  form.categorySlugs.includes(
                    category.slug,
                  ),
                )
                .map((category) => (
                  <option
                    value={
                      category.slug
                    }
                    key={
                      category.slug
                    }
                  >
                    {category.name}
                  </option>
                ))}
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
              onClick={addSpec}
              className="btn btn-secondary"
            >
              + Add specification
            </button>
          </div>

          <div className="mt-6 grid gap-3">
            {form.specs.length === 0 && (
              <div className="rounded-lg border border-dashed border-[#cfded7] p-5 text-sm text-[#71838b]">
                No specifications yet. Leave this
                empty when the client source does
                not provide reliable technical
                values.
              </div>
            )}

            {form.specs.map(
              (
                [label, value],
                index,
              ) => (
                <div
                  key={index}
                  className="grid gap-2 rounded-lg border border-[#e0e9e5] bg-[#fafcfb] p-3 md:grid-cols-[.8fr_1.2fr_auto]"
                >
                  <input
                    className="rounded-md border border-[#d8e4df] px-3 py-2 text-sm outline-none focus:border-[#0a9c63]"
                    placeholder="Specification"
                    value={label}
                    onChange={(event) =>
                      updateSpec(
                        index,
                        0,
                        event.target.value,
                      )
                    }
                  />

                  <input
                    className="rounded-md border border-[#d8e4df] px-3 py-2 text-sm outline-none focus:border-[#0a9c63]"
                    placeholder="Value"
                    value={value}
                    onChange={(event) =>
                      updateSpec(
                        index,
                        1,
                        event.target.value,
                      )
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeSpec(index)
                    }
                    className="rounded-md border border-red-200 px-3 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ),
            )}
          </div>

          <div className="form-grid mt-6">
            <div className="field">
              <label>
                Standards / references — one per
                line
              </label>

              <textarea
                value={standards}
                onChange={(event) =>
                  setStandards(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label>
                Applications — one per line
              </label>

              <textarea
                value={applications}
                onChange={(event) =>
                  setApplications(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="field">
              <label>
                Related product slugs — one per line
              </label>

              <textarea
                value={relatedProducts}
                onChange={(event) =>
                  setRelatedProducts(
                    event.target.value,
                  )
                }
              />
            </div>
          </div>
        </section>

        <section className="card p-6 md:p-7">
          <div className="eyebrow">
            Documents
          </div>

          <h2 className="mt-2 text-xl font-black">
            Public & dealer resources
          </h2>

          <div className="form-grid mt-6">
            <div className="field">
              <label>
                Public download URLs — one per line
              </label>

              <textarea
                value={publicDownloads}
                onChange={(event) =>
                  setPublicDownloads(
                    event.target.value,
                  )
                }
              />

              <label className="btn btn-secondary w-full cursor-pointer">
                <input
                  className="hidden"
                  type="file"
                  accept="application/pdf"
                  disabled={
                    uploadingDocument
                  }
                  onChange={(event) =>
                    void uploadDocument(
                      event.target
                        .files?.[0],
                      "public",
                    )
                  }
                />

                {uploadingDocument
                  ? "Uploading..."
                  : "Upload Public PDF"}
              </label>
            </div>

            <div className="field">
              <label>
                Dealer-only download URLs — one per
                line
              </label>

              <textarea
                value={dealerDownloads}
                onChange={(event) =>
                  setDealerDownloads(
                    event.target.value,
                  )
                }
              />

              <label className="btn btn-secondary w-full cursor-pointer">
                <input
                  className="hidden"
                  type="file"
                  accept="application/pdf"
                  disabled={
                    uploadingDocument
                  }
                  onChange={(event) =>
                    void uploadDocument(
                      event.target
                        .files?.[0],
                      "dealer",
                    )
                  }
                />

                {uploadingDocument
                  ? "Uploading..."
                  : "Upload Dealer PDF"}
              </label>
            </div>
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
                These values are protected from
                public visitors and displayed only
                inside the dealer workspace.
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
                value={form.sku ?? ""}
                onChange={(event) =>
                  patch(
                    "sku",
                    event.target.value,
                  )
                }
                placeholder="Optional"
              />
            </div>

            <div className="field">
              <label>Unit label</label>

              <input
                value={
                  form.unitLabel ??
                  "Unit"
                }
                onChange={(event) =>
                  patch(
                    "unitLabel",
                    event.target.value,
                  )
                }
                placeholder="Unit / Set / Piece / System"
              />
            </div>

            <div className="field span-2">
              <label>
                Dealer commercial details
              </label>

              <textarea
                value={
                  form.dealerCommercialDetails ??
                  ""
                }
                onChange={(event) =>
                  patch(
                    "dealerCommercialDetails",
                    event.target.value,
                  )
                }
                placeholder="Commercial notes, packing, payment notes or other approved dealer-only information."
              />
            </div>
          </div>

          <div className="mt-7 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#dfe8e4] text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
                  <th className="px-3 py-3">
                    Price Group
                  </th>

                  <th className="px-3 py-3">
                    Currency
                  </th>

                  <th className="px-3 py-3">
                    Unit Price
                  </th>

                  <th className="px-3 py-3">
                    Minimum Qty
                  </th>

                  <th className="px-3 py-3">
                    Lead Time
                  </th>

                  <th className="px-3 py-3">
                    Note
                  </th>
                </tr>
              </thead>

              <tbody>
                {priceGroups.map(
                  (group) => {
                    const price =
                      priceFor(
                        group.slug,
                      );

                    return (
                      <tr
                        key={group.slug}
                        className="border-b border-[#edf2ef] align-top"
                      >
                        <td className="px-3 py-3">
                          <strong className="block text-sm text-[#17313d]">
                            {group.name}
                          </strong>

                          <span className="mt-1 block text-[10px] text-[#82938c]">
                            {group.slug}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <input
                            className="w-20 rounded-md border border-[#d8e4df] px-2 py-2 text-sm uppercase"
                            value={
                              price.currency ??
                              "USD"
                            }
                            onChange={(event) =>
                              updateDealerPrice(
                                group.slug,
                                "currency",
                                event.target.value.toUpperCase(),
                              )
                            }
                          />
                        </td>

                        <td className="px-3 py-3">
                          <input
                            className="w-32 rounded-md border border-[#d8e4df] px-3 py-2 text-sm"
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              price.amount ??
                              ""
                            }
                            onChange={(event) =>
                              updateDealerPrice(
                                group.slug,
                                "amount",
                                event.target.value,
                              )
                            }
                            placeholder="Not set"
                          />
                        </td>

                        <td className="px-3 py-3">
                          <input
                            className="w-28 rounded-md border border-[#d8e4df] px-3 py-2 text-sm"
                            type="number"
                            min="1"
                            step="1"
                            value={
                              price.minimumQty ??
                              ""
                            }
                            onChange={(event) =>
                              updateDealerPrice(
                                group.slug,
                                "minimumQty",
                                event.target.value,
                              )
                            }
                            placeholder="Optional"
                          />
                        </td>

                        <td className="px-3 py-3">
                          <input
                            className="w-36 rounded-md border border-[#d8e4df] px-3 py-2 text-sm"
                            value={
                              price.leadTimeText ??
                              ""
                            }
                            onChange={(event) =>
                              updateDealerPrice(
                                group.slug,
                                "leadTimeText",
                                event.target.value,
                              )
                            }
                            placeholder="Optional"
                          />
                        </td>

                        <td className="px-3 py-3">
                          <input
                            className="w-52 rounded-md border border-[#d8e4df] px-3 py-2 text-sm"
                            value={
                              price.note ??
                              ""
                            }
                            onChange={(event) =>
                              updateDealerPrice(
                                group.slug,
                                "note",
                                event.target.value,
                              )
                            }
                            placeholder="Optional"
                          />
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-lg border border-[#e8d8aa] bg-[#fffaf0] p-4 text-xs leading-6 text-[#776e58]">
            No prices are invented in this project.
            Enter only client-approved prices. Blank
            prices display as{" "}
            <strong>
              Price not configured — Request Quote
            </strong>{" "}
            in the dealer portal.
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
                  managedImages[0].url
                }
                alt={
                  managedImages[0].alt ||
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
              onChange={(event) =>
                patch(
                  "commercialMode",
                  event.target
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
            <label>Availability</label>

            <input
              value={
                form.availability ??
                ""
              }
              onChange={(event) =>
                patch(
                  "availability",
                  event.target.value,
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
                onChange={(event) =>
                  patch(
                    "dealerPriceProtected",
                    event.target.checked,
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
                onChange={(event) =>
                  patch(
                    "featured",
                    event.target.checked,
                  )
                }
              />

              Featured product
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={
                  form.active !== false
                }
                onChange={(event) =>
                  patch(
                    "active",
                    event.target.checked,
                  )
                }
              />

              Visible on public catalogue
            </label>
          </div>
        </section>

        {(error || success) && (
          <div
            className={`rounded-lg border p-4 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || success}
          </div>
        )}

        <section className="card p-5">
          <button
            disabled={
              saving ||
              deletingProduct ||
              uploadingDocument
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