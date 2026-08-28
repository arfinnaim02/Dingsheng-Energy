import { PricingManager } from "@/components/admin/PricingManager";
import { PortalShell } from "@/components/PortalShell";

import {
  getAllPriceGroups,
  getDealerPortalSettings,
  getProducts,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  const [
    priceGroups,
    products,
    dealerPortal,
  ] = await Promise.all([
    getAllPriceGroups(),

    getProducts({
      activeOnly: false,
      includeProtected: true,
    }),

    getDealerPortalSettings(),
  ]);

  return (
    <PortalShell
      admin
      title="Dealer Pricing"
    >
      <PricingManager
        initialGroups={priceGroups}
        products={products}
        dealerPortal={dealerPortal}
      />
    </PortalShell>
  );
}