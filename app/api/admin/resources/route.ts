import {
  NextResponse,
} from "next/server";

import {
  revalidatePath,
} from "next/cache";

import {
  isAdminSession,
} from "@/lib/adminAuth";

import {
  createResource,
  getAdminResources,
  type ResourceInput,
} from "@/lib/databaseResources";

function errorMessage(
  error: unknown,
) {
  return error instanceof Error
    ? error.message
    : "Unable to process resource.";
}

export async function GET() {
  if (
    !(await isAdminSession())
  ) {
    return NextResponse.json(
      {
        error:
          "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const resources =
      await getAdminResources();

    return NextResponse.json({
      resources,
    });
  } catch (
    error
  ) {
    console.error(
      "Unable to load resources:",
      error,
    );

    return NextResponse.json(
      {
        error:
          errorMessage(
            error,
          ),
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
) {
  if (
    !(await isAdminSession())
  ) {
    return NextResponse.json(
      {
        error:
          "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const body =
      (await request.json()) as ResourceInput;

    const resource =
      await createResource(
        body,
      );

    revalidatePath(
      "/resources",
    );

    revalidatePath(
      `/resources/${resource.slug}`,
    );

    revalidatePath(
      "/admin/resources",
    );

    return NextResponse.json(
      {
        resource,
      },
      {
        status: 201,
      },
    );
  } catch (
    error
  ) {
    console.error(
      "Unable to create resource:",
      error,
    );

    return NextResponse.json(
      {
        error:
          errorMessage(
            error,
          ),
      },
      {
        status: 400,
      },
    );
  }
}