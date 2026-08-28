import { PortalShell } from "@/components/PortalShell";
import { ServiceEditor } from "@/components/admin/ServiceEditor";

export default function NewServicePage() {
  return <PortalShell admin title="Add Service"><ServiceEditor /></PortalShell>;
}
