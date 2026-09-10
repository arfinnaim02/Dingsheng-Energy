import {
  PortalShell,
} from "@/components/PortalShell";

import {
  ProductEditor,
} from "@/components/admin/ProductEditor";

import {
  getPriceGroups,
} from "@/lib/catalog";

import {
  getAdminCategories,
} from "@/lib/databaseCategories";

export const dynamic =
  "force-dynamic";

export default async function NewProductPage() {
  const [
    categories,
    priceGroups,
  ] = await Promise.all([
    getAdminCategories(),
    getPriceGroups(),
  ]);

  return (
    <PortalShell
      admin
      title="Add Product"
    >
      <ProductEditor
        categories={
          categories
        }
        priceGroups={
          priceGroups
        }
        initialImages={[]}
      />
    </PortalShell>
  );
}