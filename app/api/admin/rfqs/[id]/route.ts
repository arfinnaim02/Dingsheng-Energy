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

const allowedStatuses = [
  "SUBMITTED",
  "REVIEWING",
  "ACCEPTED",
  "REJECTED",
] as const;

type RfqStatus =
  (typeof allowedStatuses)[number];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  if (!(await isAdminSession())) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const { id } =
    await context.params;

  const rfqId = id.trim();

  if (!rfqId) {
    return NextResponse.json(
      {
        error: "Invalid RFQ.",
      },
      {
        status: 400,
      },
    );
  }

  const body =
    (await request.json().catch(
      () => null,
    )) as {
      status?: RfqStatus;
    } | null;

  if (
    !body?.status ||
    !allowedStatuses.includes(
      body.status,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Select a valid RFQ status.",
      },
      {
        status: 400,
      },
    );
  }

  const existingRfq =
    await prisma.rfq.findUnique({
      where: {
        id: rfqId,
      },

      select: {
        id: true,
      },
    });

  if (!existingRfq) {
    return NextResponse.json(
      {
        error: "RFQ not found.",
      },
      {
        status: 404,
      },
    );
  }

  try {
    const rfq =
      await prisma.rfq.update({
        where: {
          id: rfqId,
        },

        data: {
          status: body.status,
        },

        select: {
          id: true,
          reference: true,
          status: true,
          updatedAt: true,
        },
      });

    revalidatePath(
      "/admin/rfqs",
    );

    revalidatePath(
      "/admin/operations",
    );

    revalidatePath(
      "/dealer/rfq",
    );

    return NextResponse.json({
      ok: true,

      rfq: {
        ...rfq,

        updatedAt:
          rfq.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "RFQ status update failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to update the RFQ status.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  if (!(await isAdminSession())) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const { id } =
    await context.params;

  const rfqId = id.trim();

  if (!rfqId) {
    return NextResponse.json(
      {
        error: "Invalid RFQ.",
      },
      {
        status: 400,
      },
    );
  }

  const existingRfq =
    await prisma.rfq.findUnique({
      where: {
        id: rfqId,
      },

      select: {
        id: true,
        reference: true,
        status: true,
      },
    });

  if (!existingRfq) {
    return NextResponse.json(
      {
        error: "RFQ not found.",
      },
      {
        status: 404,
      },
    );
  }

  /*
   * Only rejected RFQs can be permanently deleted.
   * Active commercial requests must be rejected first.
   */
  if (
    existingRfq.status !==
    "REJECTED"
  ) {
    return NextResponse.json(
      {
        error:
          "Only rejected RFQs can be permanently deleted. Reject this RFQ first.",
      },
      {
        status: 409,
      },
    );
  }

  try {
    await prisma.$transaction(
      async (transaction) => {
        /*
         * Quotation does not currently use cascading
         * deletion, so remove it explicitly.
         */
        await transaction.quotation.deleteMany({
          where: {
            rfqId,
          },
        });

        /*
         * RfqItem rows use onDelete: Cascade and will
         * be removed automatically with the RFQ.
         */
        await transaction.rfq.delete({
          where: {
            id: rfqId,
          },
        });

        await transaction.activityLog.create({
          data: {
            event: "RFQ_DELETED",
            entityType: "RFQ",
            entityId: rfqId,

            metadata: {
              reference:
                existingRfq.reference,

              previousStatus:
                existingRfq.status,
            },
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

    revalidatePath(
      "/admin/rfqs",
    );

    revalidatePath(
      "/admin/operations",
    );

    revalidatePath(
      "/dealer/rfq",
    );

    return NextResponse.json({
      ok: true,

      deleted: {
        id: existingRfq.id,
        reference:
          existingRfq.reference,
      },
    });
  } catch (error) {
    console.error(
      `RFQ deletion failed for ${existingRfq.reference}:`,
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete this RFQ. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}