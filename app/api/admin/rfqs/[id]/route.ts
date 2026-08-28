import { NextResponse } from "next/server";

import { isAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

const allowedStatuses = [
  "SUBMITTED",
  "REVIEWING",
  "ACCEPTED",
  "REJECTED",
] as const;

type RfqStatus =
  (typeof allowedStatuses)[number];

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  if (!(await isAdminSession())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  const body = (await request.json().catch(() => null)) as {
    status?: RfqStatus;
  } | null;

  if (
    !body?.status ||
    !allowedStatuses.includes(body.status)
  ) {
    return NextResponse.json(
      { error: "Select a valid RFQ status." },
      { status: 400 },
    );
  }

  const existingRfq = await prisma.rfq.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
    },
  });

  if (!existingRfq) {
    return NextResponse.json(
      { error: "RFQ not found." },
      { status: 404 },
    );
  }

  const rfq = await prisma.rfq.update({
    where: {
      id,
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

  return NextResponse.json({
    ok: true,

    rfq: {
      ...rfq,
      updatedAt: rfq.updatedAt.toISOString(),
    },
  });
}