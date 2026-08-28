"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  useMemo,
  useState,
} from "react";

import type {
  Product,
  ProductCategory,
} from "@/data/site";

type ProductBulkAction =
  | "activate"
  | "hide"
  | "feature"
  | "unfeature"
  | "delete";

type Props = {
  products: Product[];
  categories: ProductCategory[];
};

function commercialModeLabel(
  mode: Product["commercialMode"],
) {
  switch (mode) {
    case "information":
      return "Information";

    case "rfq":
      return "RFQ";

    case "dealer-purchase":
      return "Dealer Purchase";

    case "dealer-purchase-rfq":
      return "Purchase + RFQ";
  }
}

function actionLabel(
  action: ProductBulkAction,
) {
  switch (action) {
    case "activate":
      return "Activate";

    case "hide":
      return "Hide";

    case "feature":
      return "Mark Featured";

    case "unfeature":
      return "Remove Featured";

    case "delete":
      return "Delete Permanently";
  }
}

export function ProductManager({
  products,
  categories,
}: Props) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState("all");
  const [status, setStatus] =
    useState("all");

  const [selected, setSelected] = useState<
    string[]
  >([]);

  const [action, setAction] =
    useState<ProductBulkAction | "">("");

  const [working, setWorking] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const categoryNames = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.slug,
          category.name,
        ]),
      ),
    [categories],
  );

  const filteredProducts = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        [
          product.name,
          product.slug,
          product.sku,
          product.summary,
          product.subcategory,
          product.eyebrow,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        category === "all" ||
        product.categorySlugs.includes(
          category,
        );

      const matchesStatus =
        status === "all" ||
        (status === "active" &&
          product.active !== false) ||
        (status === "hidden" &&
          product.active === false) ||
        (status === "featured" &&
          product.featured === true) ||
        (status === "unfeatured" &&
          product.featured !== true);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    products,
    search,
    category,
    status,
  ]);

  const visibleSlugs =
    filteredProducts.map(
      (product) => product.slug,
    );

  const allVisibleSelected =
    visibleSlugs.length > 0 &&
    visibleSlugs.every((slug) =>
      selected.includes(slug),
    );

  const selectedProducts =
    products.filter((product) =>
      selected.includes(product.slug),
    );

  function toggleProduct(slug: string) {
    setSelected((current) =>
      current.includes(slug)
        ? current.filter(
            (item) => item !== slug,
          )
        : [...current, slug],
    );
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      setSelected((current) =>
        current.filter(
          (slug) =>
            !visibleSlugs.includes(slug),
        ),
      );

      return;
    }

    setSelected((current) => [
      ...new Set([
        ...current,
        ...visibleSlugs,
      ]),
    ]);
  }

  function clearFilters() {
    setSearch("");
    setCategory("all");
    setStatus("all");
  }

  async function applyAction() {
    if (!selected.length) {
      setError(
        "Select at least one product.",
      );

      return;
    }

    if (!action) {
      setError(
        "Select a bulk action.",
      );

      return;
    }

    if (action === "delete") {
      const productNames =
        selectedProducts
          .slice(0, 5)
          .map((product) => product.name)
          .join(", ");

      const additional =
        selectedProducts.length > 5
          ? ` and ${
              selectedProducts.length - 5
            } more`
          : "";

      const confirmed = window.confirm(
        `Permanently delete ${selected.length} product(s)?\n\n${productNames}${additional}\n\nProducts referenced by orders or RFQs cannot be deleted. This action cannot be undone.`,
      );

      if (!confirmed) return;
    }

    setWorking(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/admin/products/bulk",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            slugs: selected,
            action,
          }),
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to update products.",
        );
      }

      setMessage(
        `${result.result.affected} product(s) updated successfully.`,
      );

      setSelected([]);
      setAction("");

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update products.",
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <div>
      <section className="card p-5 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_260px_220px_auto] lg:items-end">
          <div className="field">
            <label htmlFor="product-search">
              Search products
            </label>

            <input
              id="product-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Name, SKU, slug or group..."
            />
          </div>

          <div className="field">
            <label htmlFor="product-category">
              Product system
            </label>

            <select
              id="product-category"
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value,
                )
              }
            >
              <option value="all">
                All product systems
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category.slug}
                    value={category.slug}
                  >
                    {category.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="field">
            <label htmlFor="product-status">
              Product status
            </label>

            <select
              id="product-status"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value,
                )
              }
            >
              <option value="all">
                All statuses
              </option>

              <option value="active">
                Active
              </option>

              <option value="hidden">
                Hidden
              </option>

              <option value="featured">
                Featured
              </option>

              <option value="unfeatured">
                Not Featured
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#e1ebe7] pt-5">
          <div className="text-sm text-[#657983]">
            Showing{" "}
            <strong>
              {filteredProducts.length}
            </strong>{" "}
            of{" "}
            <strong>
              {products.length}
            </strong>{" "}
            products ·{" "}
            <strong>
              {selected.length}
            </strong>{" "}
            selected
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="field min-w-52 !gap-1">
              <label htmlFor="bulk-action">
                Bulk action
              </label>

              <select
                id="bulk-action"
                value={action}
                onChange={(event) =>
                  setAction(
                    event.target
                      .value as
                      | ProductBulkAction
                      | "",
                  )
                }
              >
                <option value="">
                  Select action
                </option>

                <option value="activate">
                  Activate
                </option>

                <option value="hide">
                  Hide
                </option>

                <option value="feature">
                  Mark Featured
                </option>

                <option value="unfeature">
                  Remove Featured
                </option>

                <option value="delete">
                  Delete Permanently
                </option>
              </select>
            </div>

            <button
              type="button"
              disabled={
                working ||
                !selected.length ||
                !action
              }
              onClick={applyAction}
              className={
                action === "delete"
                  ? "rounded-md bg-red-600 px-5 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                  : "btn btn-primary disabled:cursor-not-allowed disabled:opacity-40"
              }
            >
              {working
                ? "Applying..."
                : action
                  ? `${actionLabel(
                      action,
                    )} (${selected.length})`
                  : "Apply Action"}
            </button>
          </div>
        </div>
      </section>

      {message && (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <section className="card mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr>
                <th className="w-12">
                  <input
                    type="checkbox"
                    aria-label="Select all visible products"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                  />
                </th>

                <th>Product</th>
                <th>Primary System</th>
                <th>Group</th>
                <th>Commercial Mode</th>
                <th>Pricing</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map(
                (product) => {
                  const configuredPrices = (
                    product.dealerPrices ?? []
                  ).filter(
                    (price) =>
                      typeof price.amount ===
                        "number" &&
                      Number.isFinite(
                        price.amount,
                      ),
                  ).length;

                  const checked =
                    selected.includes(
                      product.slug,
                    );

                  return (
                    <tr
                      key={product.slug}
                      className={
                        checked
                          ? "bg-[#f0faf5]"
                          : ""
                      }
                    >
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${product.name}`}
                          checked={checked}
                          onChange={() =>
                            toggleProduct(
                              product.slug,
                            )
                          }
                        />
                      </td>

                      <td>
                        <Link
                          href={`/admin/products/${product.slug}`}
                          className="font-black hover:text-[#0a9c63]"
                        >
                          {product.name}
                        </Link>

                        <div className="mt-1 text-[10px] text-[#82938c]">
                          {product.sku
                            ? `SKU ${product.sku}`
                            : product.slug}
                        </div>

                        {product.featured && (
                          <span className="mt-2 inline-flex rounded-full bg-[#fff6dc] px-2 py-1 text-[9px] font-black uppercase text-[#926900]">
                            Featured
                          </span>
                        )}
                      </td>

                      <td>
                        {categoryNames.get(
                          product.primaryCategorySlug,
                        ) ||
                          product.primaryCategorySlug}

                        <div className="mt-1 text-[10px] text-[#82938c]">
                          {
                            product.categorySlugs
                              .length
                          }{" "}
                          system
                          {product
                            .categorySlugs
                            .length === 1
                            ? ""
                            : "s"}
                        </div>
                      </td>

                      <td>
                        {product.subcategory ||
                          "Not assigned"}
                      </td>

                      <td>
                        {commercialModeLabel(
                          product.commercialMode,
                        )}
                      </td>

                      <td>
                        {configuredPrices > 0 ? (
                          <span className="font-black text-[#08774f]">
                            {configuredPrices}{" "}
                            configured
                          </span>
                        ) : (
                          <span className="font-bold text-[#a27300]">
                            Not configured
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            product.active ===
                            false
                              ? "rounded-full bg-[#fbeaea] px-3 py-1 text-[10px] font-black uppercase text-[#a43e3e]"
                              : "rounded-full bg-[#e7f7ef] px-3 py-1 text-[10px] font-black uppercase text-[#087a50]"
                          }
                        >
                          {product.active ===
                          false
                            ? "Hidden"
                            : "Active"}
                        </span>
                      </td>

                      <td>
                        <Link
                          href={`/admin/products/${product.slug}`}
                          className="text-xs font-black text-[#0a9c63]"
                        >
                          Edit →
                        </Link>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>

        {!filteredProducts.length && (
          <div className="p-10 text-center">
            <h2 className="text-xl font-black">
              No matching products
            </h2>

            <p className="mt-3 text-sm text-[#71838b]">
              Change the search or filter
              settings.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="btn btn-secondary mt-5"
            >
              Show All Products
            </button>
          </div>
        )}
      </section>
    </div>
  );
}