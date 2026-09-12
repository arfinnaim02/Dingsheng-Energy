import {
  revalidatePath,
} from "next/cache";

import {
  NextResponse,
} from "next/server";



import {
  isAdminSession,
} from "@/lib/adminAuth";

import {
  deleteServiceImage,
} from "@/lib/cloudinary";



import {
  createService,
  deleteService,
  getAdminServices,
  updateService,
  type AdminService,
  type ServiceInput,
  type ServiceMediaState,
} from "@/lib/databaseServices";

async function unauthorized() {
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

function refreshServicePaths() {
  revalidatePath(
    "/",
  );

  revalidatePath(
    "/services",
  );

  revalidatePath(
    "/services/category/[...segments]",
    "page",
  );

  revalidatePath(
    "/admin/services",
  );
}

async function result() {
  return NextResponse.json({
    ok: true,

    services:
      await getAdminServices(),
  });
}

function replacedPublicIds(
  before:
    ServiceMediaState,

  after:
    ServiceMediaState,
) {
  const values:
    string[] = [];

  if (
    before.imagePublicId &&
    before.imagePublicId !==
      after.imagePublicId
  ) {
    values.push(
      before.imagePublicId,
    );
  }

  if (
    before.heroImagePublicId &&
    before.heroImagePublicId !==
      after.heroImagePublicId
  ) {
    values.push(
      before.heroImagePublicId,
    );
  }

  return [
    ...new Set(
      values,
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
  const unique =
    [
      ...new Set(
        publicIds
          .map(
            (
              value,
            ) =>
              value?.trim() ||
              "",
          )
          .filter(Boolean),
      ),
    ];

  await Promise.allSettled(
    unique.map(
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

export async function GET() {
  if (
    !(await isAdminSession())
  ) {
    return unauthorized();
  }

  return NextResponse.json({
    services:
      await getAdminServices(),
  });
}

export async function POST(
  request: Request,
) {
  if (
    !(await isAdminSession())
  ) {
    return unauthorized();
  }

  try {
    const body =
      (await request.json()) as
        ServiceInput;

    const service =
      await createService(
        body,
      );


    refreshServicePaths();

    return result();
  } catch (
    error
  ) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create service.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function PUT(
  request: Request,
) {
  if (
    !(await isAdminSession())
  ) {
    return unauthorized();
  }

  try {
    const body =
      (await request.json()) as
        ServiceInput & {
          id?: string;
        };

    if (!body.id) {
      return NextResponse.json(
        {
          error:
            "Service id is required.",
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      (
        await getAdminServices()
      ).find(
        (
          service,
        ) =>
          service.id ===
          body.id,
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

    const {
      id,
      ...input
    } = body;

    const update =
      await updateService(
        id,
        input,
      );

    /*
     * Neon and legacy catalogue now both
     * reference the replacement media.
     * Old Cloudinary assets may be removed.
     */
    await cleanupServiceImages(
      replacedPublicIds(
        update.before,
        update.after,
      ),
    );

    revalidatePath(
      `/services/${existing.slug}`,
    );

    revalidatePath(
      `/services/${update.service.slug}`,
    );

    refreshServicePaths();

    return result();
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
  request: Request,
) {
  if (
    !(await isAdminSession())
  ) {
    return unauthorized();
  }

  try {
    const id =
      new URL(
        request.url,
      ).searchParams.get(
        "id",
      );

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Service id is required.",
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      (
        await getAdminServices()
      ).find(
        (
          service,
        ) =>
          service.id ===
          id,
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
     * Neon performs child safety validation.
     */
    const deletion =
      await deleteService(
        id,
      );

    /*
     * DB + legacy catalogue no longer need
     * these images.
     */
    await cleanupServiceImages([
      deletion.media
        .imagePublicId,

      deletion.media
        .heroImagePublicId,
    ]);

    refreshServicePaths();

    return result();
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