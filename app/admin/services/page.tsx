import {
  PortalShell,
} from "@/components/PortalShell";

import {
  ServiceEditor,
} from "@/components/admin/ServiceEditor";

import {
  getAdminServices,
} from "@/lib/databaseServices";

export const dynamic =
  "force-dynamic";

export default async function AdminServicesPage() {
  const services =
    await getAdminServices();

  return (
    <PortalShell
      admin
      title="Service Management"
    >
      <ServiceEditor
        initial={
          services
        }
      />
    </PortalShell>
  );
}