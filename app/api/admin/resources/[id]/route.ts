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
  deleteResource,
  updateResource,
  type ResourceInput,
} from "@/lib/databaseResources";

import {
  deleteResourceFile,
  deleteResourceImage,
} from "@/lib/cloudinary";

export const runtime =
  "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function errorMessage(
  error: unknown,
) {
  return error instanceof Error
    ? error.message
    : "Unable to process resource.";
}

function statusForError(
  message: string,
) {
  if (
    message ===
    "Resource not found."
  ) {
    return 404;
  }

  return 400;
}

export async function PUT(
  request: Request,
  context: RouteContext,
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
    const {
      id,
    } =
      await context.params;

    if (!id?.trim()) {
      return NextResponse.json(
        {
          error:
            "Resource ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const body =
      (await request.json()) as ResourceInput;

    const result =
      await updateResource(
        id,
        body,
      );

    if (
      result.previousImagePublicId &&
      result.previousImagePublicId !==
        result.resource.imagePublicId
    ) {
      try {
        await deleteResourceImage(
          result.previousImagePublicId,
        );
      } catch (error) {
        console.error(
          "Unable to remove previous resource image:",
          error,
        );
      }
    }

    if (
      result.previousFilePublicId &&
      result.previousFilePublicId !==
        result.resource.filePublicId
    ) {
      try {
        await deleteResourceFile(
          result.previousFilePublicId,
        );
      } catch (error) {
        console.error(
          "Unable to remove previous resource file:",
          error,
        );
      }
    }

    revalidatePath(
      "/resources",
    );

    revalidatePath(
      `/resources/${result.resource.slug}`,
    );

    revalidatePath(
      "/admin/resources",
    );

    return NextResponse.json({
      resource:
        result.resource,
    });
  } catch (error) {
    const message =
      errorMessage(
        error,
      );

    console.error(
      "Unable to update resource:",
      error,
    );

    return NextResponse.json(
      {
        error:
          message,
      },
      {
        status:
          statusForError(
            message,
          ),
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
    const {
      id,
    } =
      await context.params;

    if (!id?.trim()) {
      return NextResponse.json(
        {
          error:
            "Resource ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const deleted =
      await deleteResource(
        id,
      );

    if (
      deleted.imagePublicId
    ) {
      try {
        await deleteResourceImage(
          deleted.imagePublicId,
        );
      } catch (error) {
        console.error(
          "Unable to remove deleted resource image:",
          error,
        );
      }
    }

    if (
      deleted.filePublicId
    ) {
      try {
        await deleteResourceFile(
          deleted.filePublicId,
        );
      } catch (error) {
        console.error(
          "Unable to remove deleted resource file:",
          error,
        );
      }
    }

    revalidatePath(
      "/resources",
    );

    revalidatePath(
      "/admin/resources",
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    const message =
      errorMessage(
        error,
      );

    console.error(
      "Unable to delete resource:",
      error,
    );

    return NextResponse.json(
      {
        error:
          message,
      },
      {
        status:
          statusForError(
            message,
          ),
      },
    );
  }
}