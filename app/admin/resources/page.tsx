import {
  redirect,
} from "next/navigation";

import {
  isAdminSession,
} from "@/lib/adminAuth";

import {
  getAdminResources,
} from "@/lib/databaseResources";

import {
  PortalShell,
} from "@/components/PortalShell";

import {
  ResourceManager,
} from "@/components/admin/ResourceManager";

export const dynamic =
  "force-dynamic";

export default async function AdminResourcesPage() {
  if (
    !(await isAdminSession())
  ) {
    redirect(
      "/admin/login",
    );
  }

  const resources =
    await getAdminResources();

  return (
    <PortalShell
      admin
      title="Resources"
    >
      <ResourceManager
        initialResources={
          JSON.parse(
            JSON.stringify(
              resources,
            ),
          )
        }
      />
    </PortalShell>
  );
}