import { PortalShell } from "@/components/PortalShell";
import { CategoryEditor } from "@/components/admin/CategoryEditor";
import { getAdminCategories } from "@/lib/databaseCategories";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <PortalShell admin title="Product Systems">
      <CategoryEditor initial={categories} />
    </PortalShell>
  );
}
