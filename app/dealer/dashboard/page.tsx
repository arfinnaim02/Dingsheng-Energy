import Link from "next/link";
import { redirect } from "next/navigation";

import { PortalShell } from "@/components/PortalShell";
import { requireDealer } from "@/lib/dealerAuth";
import { getProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function DealerDashboardPage() {
  const dealer = await requireDealer();

  if (!dealer.priceGroup || !dealer.priceGroup.active) {
    redirect("/dealer/login");
  }

  const products = await getProducts({
    includeProtected: true,
  });

  const priceGroupSlug = dealer.priceGroup.slug;
  const priceGroupName = dealer.priceGroup.name;

  const pricedProducts = products.filter((product) =>
    product.dealerPrices?.some(
      (price) =>
        price.priceGroupSlug === priceGroupSlug &&
        typeof price.amount === "number" &&
        Number.isFinite(price.amount),
    ),
  ).length;

  return (
    <PortalShell
      title={`Welcome back, ${dealer.contactName}`}
    >
      <div className="rounded-xl border border-[#cfe9dd] bg-[#edf9f3] p-5">
        <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#0a7f55]">
          Active commercial profile
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <strong className="text-lg">
              {dealer.companyName}
            </strong>

            <div className="mt-1 text-xs text-[#617b70]">
              Price group: {priceGroupName}
            </div>

            <div className="mt-1 text-xs text-[#71877d]">
              Account: {dealer.user.email}
            </div>
          </div>

          <Link
            href="/dealer/products"
            className="btn btn-primary"
          >
            Browse Priced Products →
          </Link>
        </div>
      </div>

      <div className="grid-4 mt-6">
        {[
          ["Catalogue Products", String(products.length)],
          ["Priced Products", String(pricedProducts)],
          ["Price Group", priceGroupName],
          ["Commercial Access", "Active"],
        ].map(([title, value]) => (
          <div className="card p-6" key={title}>
            <div className="text-xs font-black uppercase tracking-[.08em] text-[#71838b]">
              {title}
            </div>

            <div className="mt-2 text-2xl font-black text-[#0a9c63]">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="card p-6">
          <div className="eyebrow">Pricing access</div>

          <h2 className="mt-2 text-xl font-black">
            Your approved dealer pricing
          </h2>

          <p className="mt-3 text-sm leading-7 text-[#657983]">
            Prices shown in the dealer catalogue are limited
            to the {priceGroupName} price group assigned to
            your company. Products without a configured price
            remain available through the RFQ workflow.
          </p>

          <div className="mt-5 rounded-lg border border-[#dbe9e3] bg-[#f6faf8] p-4 text-sm">
            <div className="font-extrabold">
              {pricedProducts} of {products.length} products
              currently have an approved {priceGroupName} price.
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-black">
            Quick actions
          </h2>

          <div className="mt-5 grid gap-3">
            <Link
              className="btn btn-primary"
              href="/dealer/products"
            >
              Browse Dealer Products
            </Link>

            <Link
              className="btn btn-secondary"
              href="/dealer/rfq"
            >
              Build an RFQ
            </Link>

            <Link
              className="btn btn-secondary"
              href="/dealer/cart"
            >
              View Cart
            </Link>

            <Link
              className="btn btn-secondary"
              href="/dealer/downloads"
            >
              Dealer Downloads
            </Link>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}