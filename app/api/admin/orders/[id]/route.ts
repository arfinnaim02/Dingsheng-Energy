import { NextResponse } from "next/server";

import { isAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

const statuses = [
  "PENDING",
  "AWAITING_PAYMENT",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

type OrderStatus = (typeof statuses)[number];

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
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
    status?: OrderStatus;
  } | null;

  if (
    !body?.status ||
    !statuses.includes(body.status)
  ) {
    return NextResponse.json(
      { error: "Select a valid order status." },
      { status: 400 },
    );
  }

  const existing = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Order not found." },
      { status: 404 },
    );
  }


  const order = await prisma.order.update({
    where: { id },
    data: {
      status: body.status,
    },
  });

  return NextResponse.json({
    ok: true,
    status: order.status,
  });
}