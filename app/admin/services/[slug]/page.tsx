import { notFound } from "next/navigation";

import { PortalShell } from "@/components/PortalShell";
import { ServiceEditor } from "@/components/admin/ServiceEditor";
import { getService } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function EditServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();
  return <PortalShell admin title={`Edit: ${service.name}`}><ServiceEditor service={service} /></PortalShell>;
}
