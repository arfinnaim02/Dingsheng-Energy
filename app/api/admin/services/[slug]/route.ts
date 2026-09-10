import {
  revalidatePath,
} from "next/cache";

import {
  NextResponse,
} from "next/server";

import type {
  Service,
} from "@/data/site";

import {
  isAdminSession,
} from "@/lib/adminAuth";

import {
  deleteServiceImage,
} from "@/lib/cloudinary";

import {
  deleteService as deleteCatalogService,
  upsertService as upsertCatalogService,
} from "@/lib/catalog";

import {
  deleteService,
  getAdminServices,
  updateService,
  type AdminService,
  type ServiceInput,
  type ServiceMediaState,
} from "@/lib/databaseServices";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

function unauthorized() {
  return NextResponse.json(
    {
      error:
        "Unauthorized",
    },
    {
      status: 401,
    },
  );
}

function asLegacyService(
  service: AdminService,
): Service {
  return {
    slug:
      service.slug,

    name:
      service.name,

    shortName:
      service.shortName ??
      "",

    summary:
      service.summary ??
      "",

    description:
      service.description ??
      "",

    image:
      service.image ??
      "",

    heroImage:
      service.heroImage ??
      "",

    scope:
      service.scope,

    process:
      service.process,

    applications:
      service.applications,

    featured:
      service.featured,

    active:
      service.isActive,
  };
}

function refreshServicePaths(
  oldSlug?: string,
  newSlug?: string,
) {
  revalidatePath(
    "/",
  );

  revalidatePath(
    "/services",
  );

  revalidatePath(
    "/admin/services",
  );

  revalidatePath(
    "/services/category/[...segments]",
    "page",
  );

  if (oldSlug) {
    revalidatePath(
      `/services/${oldSlug}`,
    );
  }

  if (
    newSlug &&
    newSlug !==
      oldSlug
  ) {
    revalidatePath(
      `/services/${newSlug}`,
    );
  }
}

function replacedPublicIds(
  before:
    ServiceMediaState,

  after:
    ServiceMediaState,
): string[] {
  const publicIds:
    string[] = [];

  if (
    before.imagePublicId &&
    before.imagePublicId !==
      after.imagePublicId
  ) {
    publicIds.push(
      before.imagePublicId,
    );
  }

  if (
    before.heroImagePublicId &&
    before.heroImagePublicId !==
      after.heroImagePublicId
  ) {
    publicIds.push(
      before.heroImagePublicId,
    );
  }

  return [
    ...new Set(
      publicIds,
    ),
  ];
}

async function cleanupServiceImages(
  publicIds: Array<
    | string
    | null
    | undefined
  >,
) {
  const cleaned =
    [
      ...new Set(
        publicIds
          .map(
            (
              value,
            ) =>
              value?.trim() ??
              "",
          )
          .filter(Boolean),
      ),
    ];

  await Promise.allSettled(
    cleaned.map(
      async (
        publicId,
      ) => {
        try {
          await deleteServiceImage(
            publicId,
          );
        } catch (
          error
        ) {
          console.error(
            `Unable to clean up service image "${publicId}":`,
            error,
          );
        }
      },
    ),
  );
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  if (
    !(await isAdminSession())
  ) {
    return unauthorized();
  }

  const {
    slug,
  } =
    await context.params;

  const service =
    (
      await getAdminServices()
    ).find(
      (
        item,
      ) =>
        item.slug ===
        slug,
    );

  if (!service) {
    return NextResponse.json(
      {
        error:
          "Service not found.",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json({
    service,
  });
}

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  if (
    !(await isAdminSession())
  ) {
    return unauthorized();
  }

  const {
    slug,
  } =
    await context.params;

  try {
    const existing =
      (
        await getAdminServices()
      ).find(
        (
          item,
        ) =>
          item.slug ===
          slug,
      );

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Service not found.",
        },
        {
          status: 404,
        },
      );
    }

    const body =
      (await request.json()) as
        ServiceInput;

    /*
     * updateService now returns:
     *
     * {
     *   service,
     *   before,
     *   after
     * }
     */
    const update =
      await updateService(
        existing.id,
        body,
      );

    const updatedService =
      update.service;

    /*
     * Keep catalog.json compatibility
     * synchronized.
     */
    await upsertCatalogService(
      asLegacyService(
        updatedService,
      ),
      existing.slug,
    );

    /*
     * Neon + legacy catalogue now reference
     * the new media, so old Cloudinary
     * assets may safely be removed.
     */
    await cleanupServiceImages(
      replacedPublicIds(
        update.before,
        update.after,
      ),
    );

    refreshServicePaths(
      existing.slug,
      updatedService.slug,
    );

    return NextResponse.json({
      ok: true,

      service:
        updatedService,
    });
  } catch (
    error
  ) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update service.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  if (
    !(await isAdminSession())
  ) {
    return unauthorized();
  }

  const {
    slug,
  } =
    await context.params;

  try {
    const existing =
      (
        await getAdminServices()
      ).find(
        (
          item,
        ) =>
          item.slug ===
          slug,
      );

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Service not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Neon deletion first because it
     * enforces child-service safety.
     */
    const deletion =
      await deleteService(
        existing.id,
      );

    /*
     * Then remove the legacy catalog entry.
     */
    await deleteCatalogService(
      existing.slug,
    );

    /*
     * Finally remove Cloudinary assets
     * formerly owned by the service.
     */
    await cleanupServiceImages([
      deletion.media
        .imagePublicId,

      deletion.media
        .heroImagePublicId,
    ]);

    refreshServicePaths(
      existing.slug,
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (
    error
  ) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete service.",
      },
      {
        status: 400,
      },
    );
  }
}