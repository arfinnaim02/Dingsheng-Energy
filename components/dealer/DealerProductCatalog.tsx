"use client";

import { useMemo, useState } from "react";

import { ProductCard } from "@/components/ProductCard";
import type {
  Product,
  ProductCategory,
} from "@/data/site";
import { getDealerPrice } from "@/lib/pricing";

type Props = {
  products: Product[];
  categories: ProductCategory[];
  priceGroupSlug: string;
  priceGroupName: string;
};

export function DealerProductCatalog({
  products,
  categories,
  priceGroupSlug,
  priceGroupName,
}: Props) {
  const [search, setSearch] = useState("");
  const [categorySlug, setCategorySlug] =
    useState("all");

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        categorySlug === "all" ||
        product.categorySlugs.includes(categorySlug);

      if (!matchesCategory) return false;

      if (!normalizedSearch) return true;

      const searchableText = [
        product.name,
        product.sku,
        product.summary,
        product.description,
        product.subcategory,
        product.eyebrow,
        product.availability,
        ...(product.applications ?? []),
        ...(product.standards ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [products, search, categorySlug]);

  const activeCategory = categories.find(
    (category) => category.slug === categorySlug,
  );

  function clearFilters() {
    setSearch("");
    setCategorySlug("all");
  }

  const hasFilters =
    search.trim().length > 0 || categorySlug !== "all";

  return (
    <div>
      <div className="card p-5 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_300px_auto] lg:items-end">
          <div className="field">
            <label htmlFor="dealer-product-search">
              Search products
            </label>

            <div className="relative">
              <input
                id="dealer-product-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by product, SKU, specification or application..."
                className="pr-10"
              />

              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-bold text-[#829198] hover:text-[#0a9c63]"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="field">
            <label htmlFor="dealer-product-category">
              Product system
            </label>

            <select
              id="dealer-product-category"
              value={categorySlug}
              onChange={(event) =>
                setCategorySlug(event.target.value)
              }
            >
              <option value="all">
                All product systems
              </option>

              {categories.map((category) => (
                <option
                  key={category.slug}
                  value={category.slug}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="btn btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear Filters
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e1ebe7] pt-4">
          <div className="text-sm text-[#657983]">
            Showing{" "}
            <strong className="text-[#0c2230]">
              {filteredProducts.length}
            </strong>{" "}
            of{" "}
            <strong className="text-[#0c2230]">
              {products.length}
            </strong>{" "}
            products
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeCategory && (
              <span className="rounded-full bg-[#e7f7ef] px-3 py-1 text-[11px] font-black text-[#087a50]">
                {activeCategory.name}
              </span>
            )}

            {search.trim() && (
              <span className="rounded-full bg-[#eef3f5] px-3 py-1 text-[11px] font-bold text-[#526872]">
                Search: “{search.trim()}”
              </span>
            )}

            <span className="rounded-full bg-[#fff6dc] px-3 py-1 text-[11px] font-black text-[#926900]">
              {priceGroupName} Pricing
            </span>
          </div>
        </div>
      </div>

      {filteredProducts.length ? (
        <div className="grid-3 mt-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              dealer
              dealerPrice={getDealerPrice(
                product,
                priceGroupSlug,
              )}
              dealerPriceGroupName={priceGroupName}
            />
          ))}
        </div>
      ) : (
        <div className="card mt-6 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf7f2] text-2xl">
            ⌕
          </div>

          <h2 className="mt-4 text-xl font-black">
            No matching products
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#657983]">
            Try a different product name, SKU or product
            system.
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
    </div>
  );
}