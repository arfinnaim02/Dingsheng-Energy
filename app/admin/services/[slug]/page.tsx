import {
  notFound,
} from "next/navigation";

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

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EditServicePage({
  params,
}: Props) {
  const {
    slug: rawSlug,
  } = await params;

  let slug: string;

  try {
    slug =
      decodeURIComponent(
        rawSlug,
      );
  } catch {
    notFound();
  }

  const services =
    await getAdminServices();

  const selectedService =
    services.find(
      (service) =>
        service.slug === slug,
    );

  if (!selectedService) {
    notFound();
  }

  return (
    <PortalShell
      admin
      title="Service Management"
    >
      <ServiceEditor
        key={selectedService.id}
        initial={services}
        selectedSlug={
          selectedService.slug
        }
      />
    </PortalShell>
  );
}
