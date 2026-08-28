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
  prisma,
} from "@/lib/prisma";

const statuses = [
  "NEW",
  "READ",
  "IN_PROGRESS",
  "RESOLVED",
  "ARCHIVED",
  "SPAM",
] as const;

const priorities = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
] as const;

type ContactStatus =
  (typeof statuses)[number];

type ContactPriority =
  (typeof priorities)[number];

type RequestBody = {
  status?: ContactStatus;
  priority?: ContactPriority;
  internalNotes?: string;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  {
    params,
  }: RouteContext,
) {
  if (
    !(await isAdminSession())
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const { id } = await params;

  const body =
    (await request.json().catch(
      () => null,
    )) as RequestBody | null;

  if (!body) {
    return NextResponse.json(
      {
        error: "Invalid request.",
      },
      {
        status: 400,
      },
    );
  }

  const data: {
    status?: ContactStatus;
    priority?: ContactPriority;
    internalNotes?:
      | string
      | null;
    adminLastViewed: Date;
    resolvedAt?:
      | Date
      | null;
  } = {
    adminLastViewed:
      new Date(),
  };

  if (
    body.status !== undefined
  ) {
    if (
      !statuses.includes(
        body.status,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Select a valid status.",
        },
        {
          status: 400,
        },
      );
    }

    data.status =
      body.status;

    data.resolvedAt =
      body.status === "RESOLVED"
        ? new Date()
        : null;
  }

  if (
    body.priority !== undefined
  ) {
    if (
      !priorities.includes(
        body.priority,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Select a valid priority.",
        },
        {
          status: 400,
        },
      );
    }

    data.priority =
      body.priority;
  }

  if (
    body.internalNotes !==
    undefined
  ) {
    data.internalNotes =
      body.internalNotes
        .trim()
        .slice(0, 20000) ||
      null;
  }

  try {
    const inquiry =
      await prisma.contactInquiry.update({
        where: {
          id,
        },

        data,
      });

    revalidatePath(
      "/admin/contacts",
    );

    revalidatePath(
      `/admin/contacts/${id}`,
    );

    revalidatePath(
      "/admin",
    );

    return NextResponse.json({
      ok: true,
      inquiry,
    });
  } catch (error) {
    console.error(
      "Contact update failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to update this contact inquiry.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: RouteContext,
) {
  if (
    !(await isAdminSession())
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const { id } = await params;

  try {
    await prisma.contactInquiry.delete({
      where: {
        id,
      },
    });

    revalidatePath(
      "/admin/contacts",
    );

    revalidatePath(
      "/admin",
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Contact deletion failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete this contact inquiry.",
      },
      {
        status: 400,
      },
    );
  }
}