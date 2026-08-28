import { redirect } from "next/navigation";

import { DealerCartClient } from "@/components/dealer/DealerCartClient";
import { PortalShell } from "@/components/PortalShell";
import { requireDealer } from "@/lib/dealerAuth";
import { getProducts } from "@/lib/catalog";
import { productForDealerGroup } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function DealerCartPage() {
  const dealer = await requireDealer();

  if (!dealer.priceGroup || !dealer.priceGroup.active) {
    redirect("/dealer/login");
  }

  const products = await getProducts({
    includeProtected: true,
  });

  const priceGroupSlug = dealer.priceGroup.slug;
  const priceGroupName = dealer.priceGroup.name;

  /*
   * Remove every other dealer price group before the
   * products are passed to the client-side cart.
   */
  const dealerProducts = products.map((product) =>
    productForDealerGroup(product, priceGroupSlug),
  );

  return (
    <PortalShell title="Cart">
      <section className="mb-6 rounded-xl border border-[#cfe9dd] bg-[#edf9f3] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#0a7f55]">
              Protected dealer cart
            </div>

            <h2 className="mt-2 text-xl font-black">
              {dealer.companyName}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#617b70]">
              Cart prices are calculated using the{" "}
              <strong>{priceGroupName}</strong> price group
              assigned to your approved dealer account.
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

      <DealerCartClient
        products={dealerProducts}
        priceGroupSlug={priceGroupSlug}
        priceGroupName={priceGroupName}
      />
    </PortalShell>
  );
}