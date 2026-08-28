import { redirect } from "next/navigation";

import { DealerCheckoutClient } from "@/components/dealer/DealerCheckoutClient";
import { PortalShell } from "@/components/PortalShell";
import { requireDealer } from "@/lib/dealerAuth";
import { getProducts } from "@/lib/catalog";
import { productForDealerGroup } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const dealer = await requireDealer();

  if (!dealer.priceGroup || !dealer.priceGroup.active) {
    redirect("/dealer/login");
  }

  const products = await getProducts({
    includeProtected: true,
  });

  const priceGroupSlug = dealer.priceGroup.slug;

  const dealerProducts = products.map((product) =>
    productForDealerGroup(product, priceGroupSlug),
  );

  return (
    <PortalShell title="Checkout">
      <DealerCheckoutClient
        products={dealerProducts}
        priceGroupSlug={priceGroupSlug}
        priceGroupName={dealer.priceGroup.name}
        companyName={dealer.companyName}
        contactName={dealer.contactName}
        defaultCountry={dealer.country || ""}
      />
    </PortalShell>
  );
}