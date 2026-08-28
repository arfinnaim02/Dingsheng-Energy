import { NextResponse } from "next/server";

import { isAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

const paymentStatuses = [
  "PENDING",
  "PAID",
] as const;

type PaymentStatus =
  (typeof paymentStatuses)[number];

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

  const { id: orderId } = await context.params;

  const body = (await request.json().catch(() => null)) as {
    status?: PaymentStatus;
  } | null;

  if (
    !body?.status ||
    !paymentStatuses.includes(body.status)
  ) {
    return NextResponse.json(
      { error: "Select a valid payment status." },
      { status: 400 },
    );
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },

    include: {
      payments: {
        orderBy: {
          createdAt: "desc",
        },

        take: 1,
      },
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Order not found." },
      { status: 404 },
    );
  }

  const existingPayment = order.payments[0];

  const payment = existingPayment
    ? await prisma.payment.update({
        where: {
          id: existingPayment.id,
        },

        data: {
          status: body.status,
        },
      })
    : await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: "MANUAL_COMMERCIAL_AGREEMENT",
          status: body.status,
          amount: order.totalAmount,
          currency: order.currency,
        },
      });

  return NextResponse.json({
    ok: true,
    payment: {
      id: payment.id,
      status: payment.status,
      provider: payment.provider,
    },
  });
}