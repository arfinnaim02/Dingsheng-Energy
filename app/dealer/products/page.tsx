import { redirect } from "next/navigation";

import { DealerProductCatalog } from "@/components/dealer/DealerProductCatalog";
import { PortalShell } from "@/components/PortalShell";
import { requireDealer } from "@/lib/dealerAuth";
import {
  getCategories,
  getProducts,
} from "@/lib/catalog";
import {
  getDealerPrice,
  productForDealerGroup,
} from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function DealerProductsPage() {
  const dealer = await requireDealer();

  if (!dealer.priceGroup || !dealer.priceGroup.active) {
    redirect("/dealer/login");
  }

  const [products, categories] = await Promise.all([
    getProducts({
      includeProtected: true,
    }),
    getCategories(),
  ]);

  const priceGroupSlug = dealer.priceGroup.slug;
  const priceGroupName = dealer.priceGroup.name;

  const dealerProducts = products.map((product) =>
    productForDealerGroup(product, priceGroupSlug),
  );

  const configuredPriceCount = dealerProducts.filter(
    (product) => {
      const price = getDealerPrice(
        product,
        priceGroupSlug,
      );

      return (
        typeof price?.amount === "number" &&
        Number.isFinite(price.amount)
      );
    },
  ).length;

  const rfqOnlyCount = dealerProducts.filter(
    (product) => product.commercialMode === "rfq",
  ).length;

  const directlyPurchasableCount = dealerProducts.filter(
    (product) => {
      const price = getDealerPrice(
        product,
        priceGroupSlug,
      );

      const permitsPurchase =
        product.commercialMode === "dealer-purchase" ||
        product.commercialMode ===
          "dealer-purchase-rfq";

      return (
        permitsPurchase &&
        typeof price?.amount === "number" &&
        Number.isFinite(price.amount)
      );
    },
  ).length;

  return (
    <PortalShell title="Dealer Products">
      <section className="rounded-xl border border-[#cfe9dd] bg-[#edf9f3] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#0a7f55]">
              Protected product catalogue
            </div>

            <h2 className="mt-2 text-xl font-black">
              {dealer.companyName}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#617b70]">
              You are viewing prices and commercial
              information assigned to the{" "}
              <strong>{priceGroupName}</strong> dealer group.
              Products without a configured price remain
              available through RFQ.
            </p>
          </div>

          <div className="rounded-lg border border-[#c4dfd3] bg-white/70 px-4 py-3 text-right">
            <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#71877d]">
              Active price group
            </div>

            <div className="mt-1 font-black text-[#0a7f55]">
              {priceGroupName}
            </div>
          </div>
        </div>
      </section>

      <section className="grid-4 mt-6">
        {[
          ["Catalogue Products", products.length],
          ["Configured Prices", configuredPriceCount],
          ["Direct Purchase", directlyPurchasableCount],
          ["RFQ Only", rfqOnlyCount],
        ].map(([label, value]) => (
          <div className="card p-5" key={label}>
            <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
              {label}
            </div>

            <div className="mt-2 text-2xl font-black text-[#0a9c63]">
              {value}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-7">
        <div className="mb-5">
          <div className="eyebrow">Dealer catalogue</div>

          <h2 className="mt-2 text-2xl font-black">
            Find products for your requirements
          </h2>
        </div>

        <DealerProductCatalog
          products={dealerProducts}
          categories={categories}
          priceGroupSlug={priceGroupSlug}
          priceGroupName={priceGroupName}
        />
      </section>
    </PortalShell>
  );
}