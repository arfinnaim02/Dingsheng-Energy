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
  "PENDING",
  "AWAITING_PAYMENT",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

type OrderStatus =
  (typeof statuses)[number];

function isOrderStatus(
  value: unknown,
): value is OrderStatus {
  return (
    typeof value ===
      "string" &&
    statuses.includes(
      value as OrderStatus,
    )
  );
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  if (
    !(await isAdminSession())
  ) {
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

  const {
    id,
  } =
    await context.params;

  try {
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
      !isOrderStatus(
        body.status,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Select a valid order status.",
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.order.findUnique(
        {
          where: {
            id,
          },

          select: {
            id: true,
          },
        },
      );

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Order not found.",
        },
        {
          status: 404,
        },
      );
    }

    const order =
      await prisma.order.update(
        {
          where: {
            id,
          },

          data: {
            status:
              body.status,
          },

          select: {
            id: true,
            reference: true,
            status: true,
          },
        },
      );

    return NextResponse.json(
      {
        ok: true,

        id:
          order.id,

        reference:
          order.reference,

        status:
          order.status,
      },
    );
  } catch (error) {
    console.error(
      "Admin order update failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to update order status.",
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

  const {
    id,
  } =
    await context.params;

  try {
    const order =
      await prisma.order.findUnique(
        {
          where: {
            id,
          },

          select: {
            id: true,
            reference: true,
          },
        },
      );

    if (!order) {
      return NextResponse.json(
        {
          error:
            "Order not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Current schema:
     *
     * OrderItem -> Order:
     * onDelete Cascade.
     *
     * Payment -> Order:
     * no Cascade.
     *
     * Therefore payments are
     * removed explicitly first.
     */
    await prisma.$transaction(
      async (tx) => {
        await tx.payment.deleteMany(
          {
            where: {
              orderId:
                order.id,
            },
          },
        );

        await tx.order.delete(
          {
            where: {
              id:
                order.id,
            },
          },
        );
      },
    );

    return NextResponse.json(
      {
        ok: true,

        id:
          order.id,

        reference:
          order.reference,
      },
    );
  } catch (error) {
    console.error(
      "Admin order delete failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to delete order.",
      },
      {
        status: 400,
      },
    );
  }
}