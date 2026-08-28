import {
  PortalShell,
} from "@/components/PortalShell";

import {
  ProductEditor,
} from "@/components/admin/ProductEditor";

import {
  getCategories,
  getPriceGroups,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [
    categories,
    priceGroups,
  ] = await Promise.all([
    getCategories(),
    getPriceGroups(),
  ]);

  return (
    <PortalShell
      admin
      title="Add Product"
    >
      <ProductEditor
        categories={categories}
        priceGroups={priceGroups}
        initialImages={[]}
      />
    </PortalShell>
  );
}