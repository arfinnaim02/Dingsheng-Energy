import {
  notFound,
  redirect,
} from "next/navigation";

import {
  buildServiceHref,
  getPublicServices,
} from "@/lib/publicServiceTree";

export const dynamic =
  "force-dynamic";

type Props = {
  params: Promise<{
    service: string;
  }>;
};

export default async function LegacyServicePage({
  params,
}: Props) {
  const {
    service: slug,
  } =
    await params;

  const services =
    await getPublicServices();

  const service =
    services.find(
      (item) =>
        item.slug ===
        slug,
    );

  if (!service) {
    notFound();
  }

  redirect(
    buildServiceHref(
      services,
      service.id,
    ),
  );
}