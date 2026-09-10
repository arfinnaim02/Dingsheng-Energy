import "server-only";

import {
  unstable_noStore as noStore,
} from "next/cache";

import {
  prisma,
} from "@/lib/prisma";

export type PublicService = {
  id: string;

  name: string;
  slug: string;

  shortName: string | null;
  summary: string | null;
  description: string | null;

  image: string | null;
  heroImage: string | null;

  parentId: string | null;
  position: number;

  scope: string[];
  process: string[];
  applications: string[];

  featured: boolean;
  isActive: boolean;
};

function toStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .map(
      (item) => item.trim(),
    )
    .filter(Boolean);
}

function cleanImageUrl(
  value:
    | string
    | null
    | undefined,
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const cleaned =
    value.trim();

  return cleaned || null;
}

export function getPublicServiceImage(
  service: Pick<
    PublicService,
    "image" | "heroImage"
  >,
  variant:
    | "card"
    | "hero" = "card",
): string | null {
  const image =
    cleanImageUrl(
      service.image,
    );

  const heroImage =
    cleanImageUrl(
      service.heroImage,
    );

  if (
    variant === "hero"
  ) {
    return (
      heroImage ||
      image
    );
  }

  return (
    image ||
    heroImage
  );
}

export async function getPublicServices(): Promise<
  PublicService[]
> {
  noStore();

  const services =
    await prisma.service.findMany({
      where: {
        isActive: true,
      },

      orderBy: [
        {
          position: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

  return services.map(
    (service) => ({
      id: service.id,

      name: service.name,
      slug: service.slug,

      shortName:
        service.shortName,

      summary:
        service.summary,

      description:
        service.description,

      image:
        cleanImageUrl(
          service.image,
        ),

      heroImage:
        cleanImageUrl(
          service.heroImage,
        ),

      parentId:
        service.parentId,

      position:
        service.position,

      scope:
        toStringArray(
          service.scopeJson,
        ),

      process:
        toStringArray(
          service.processJson,
        ),

      applications:
        toStringArray(
          service.applicationsJson,
        ),

      featured:
        service.featured,

      isActive:
        service.isActive,
    }),
  );
}

export function getServiceChildren(
  services: PublicService[],
  parentId: string | null,
): PublicService[] {
  return services
    .filter(
      (service) =>
        service.parentId ===
        parentId,
    )
    .sort(
      (a, b) =>
        a.position -
          b.position ||
        a.name.localeCompare(
          b.name,
        ),
    );
}

export function getServiceBreadcrumbs(
  services: PublicService[],
  serviceId: string,
): PublicService[] {
  const byId =
    new Map(
      services.map(
        (service) => [
          service.id,
          service,
        ],
      ),
    );

  const breadcrumbs:
    PublicService[] = [];

  const visited =
    new Set<string>();

  let current =
    byId.get(
      serviceId,
    );

  while (current) {
    if (
      visited.has(
        current.id,
      )
    ) {
      break;
    }

    visited.add(
      current.id,
    );

    breadcrumbs.unshift(
      current,
    );

    if (
      !current.parentId
    ) {
      break;
    }

    current =
      byId.get(
        current.parentId,
      );
  }

  return breadcrumbs;
}

export function buildServiceHref(
  services: PublicService[],
  serviceId: string,
): string {
  const breadcrumbs =
    getServiceBreadcrumbs(
      services,
      serviceId,
    );

  if (
    !breadcrumbs.length
  ) {
    return "/services";
  }

  return `/services/category/${breadcrumbs
    .map(
      (service) =>
        encodeURIComponent(
          service.slug,
        ),
    )
    .join("/")}`;
}

export function resolveServicePath(
  services: PublicService[],
  rawSegments: string[],
): PublicService | null {
  if (
    !rawSegments.length
  ) {
    return null;
  }

  const segments:
    string[] = [];

  for (
    const rawSegment
    of rawSegments
  ) {
    try {
      segments.push(
        decodeURIComponent(
          rawSegment,
        ),
      );
    } catch {
      return null;
    }
  }

  let parentId:
    | string
    | null = null;

  let current:
    | PublicService
    | undefined;

  for (
    const slug
    of segments
  ) {
    current =
      services.find(
        (service) =>
          service.slug ===
            slug &&
          service.parentId ===
            parentId,
      );

    if (!current) {
      return null;
    }

    parentId =
      current.id;
  }

  return current ?? null;
}

export async function getPublicServicePageData(
  segments: string[],
) {
  noStore();

  const services =
    await getPublicServices();

  const service =
    resolveServicePath(
      services,
      segments,
    );

  if (!service) {
    return null;
  }

  const children =
    getServiceChildren(
      services,
      service.id,
    );

  const breadcrumbs =
    getServiceBreadcrumbs(
      services,
      service.id,
    );

  return {
    service,
    services,
    children,
    breadcrumbs,
  };
}
