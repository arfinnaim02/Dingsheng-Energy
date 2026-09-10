import { NextResponse } from "next/server";

import { isAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

const statuses = [
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const;

type PaymentStatus =
  (typeof statuses)[number];

function isStatus(
  value: unknown,
): value is PaymentStatus {
  return (
    typeof value ===
      "string" &&
    statuses.includes(
      value as PaymentStatus,
    )
  );
}

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: Context,
) {
  if (!(await isAdminSession())) {
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

  const { id } =
    await context.params;

  const body =
    (await request
      .json()
      .catch(
        () => null,
      )) as
      | {
          status?: unknown;
        }
      | null;

  if (
    !body ||
    !isStatus(
      body.status,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid payment status.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const payment =
      await prisma.payment.update(
        {
          where: {
            id,
          },

          data: {
            status:
              body.status,
          },
        },
      );

    return NextResponse.json({
      ok: true,
      status:
        payment.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to update payment.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: Context,
) {
  if (!(await isAdminSession())) {
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

  const { id } =
    await context.params;

  try {
    await prisma.payment.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to delete payment.",
      },
      {
        status: 400,
      },
    );
  }
}