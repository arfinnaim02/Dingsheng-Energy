import { PortalShell } from "@/components/PortalShell";
import { CategoryEditor } from "@/components/admin/CategoryEditor";
import { getCategories } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  return <PortalShell admin title="Product Systems"><CategoryEditor initial={await getCategories()} /></PortalShell>;
}
