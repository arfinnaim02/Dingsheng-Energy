import Link from "next/link";

import { ProductManager } from "@/components/admin/ProductManager";
import { PortalShell } from "@/components/PortalShell";

import {
  getCategories,
  getProducts,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories] =
    await Promise.all([
      getProducts({
        activeOnly: false,
        includeProtected: true,
      }),

      getCategories(),
    ]);

  const activeCount = products.filter(
    (product) =>
      product.active !== false,
  ).length;

  const hiddenCount = products.filter(
    (product) =>
      product.active === false,
  ).length;

  const featuredCount = products.filter(
    (product) =>
      product.featured === true,
  ).length;

  const pricedCount = products.filter(
    (product) =>
      product.dealerPrices?.some(
        (price) =>
          typeof price.amount ===
            "number" &&
          Number.isFinite(price.amount),
      ),
  ).length;

  return (
    <PortalShell
      admin
      title="Product Management"
    >
      <section className="mb-7 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[#cfe9dd] bg-[#edf9f3] p-5">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#0a7f55]">
            Product catalogue
          </div>

          <h2 className="mt-2 text-xl font-black">
            Manage products in bulk
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#617b70]">
            Search, filter and select products to
            change visibility, featured status or
            safely remove unused records.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="btn btn-primary"
        >
          + Add Product
        </Link>
      </section>

      <section className="grid-4 mb-7">
        {[
          ["Total Products", products.length],
          ["Active", activeCount],
          ["Hidden", hiddenCount],
          ["Featured", featuredCount],
        ].map(([label, value]) => (
          <div
            className="card p-5"
            key={label}
          >
            <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
              {label}
            </div>

            <div className="mt-2 text-2xl font-black text-[#0a9c63]">
              {value}
            </div>
          </div>
        ))}
      </section>

      <div className="mb-5 rounded-lg border border-[#dfe8e4] bg-white px-5 py-4 text-xs text-[#657983]">
        <strong>
          Pricing coverage:
        </strong>{" "}
        {pricedCount} of {products.length} products
        currently have at least one configured
        Neon dealer price.
      </div>

      <ProductManager
        products={products}
        categories={categories}
      />
    </PortalShell>
  );
}