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

type BulkBody = {
  ids?: unknown;
  action?: unknown;
  status?: unknown;
};

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

function normalizeIds(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const strings =
    value.filter(
      (
        id,
      ): id is string =>
        typeof id ===
          "string",
    );

  return [
    ...new Set(
      strings
        .map(
          (id) =>
            id.trim(),
        )
        .filter(Boolean),
    ),
  ];
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
          "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const body =
      (await request
        .json()
        .catch(
          () => null,
        )) as
        | BulkBody
        | null;

    if (!body) {
      return NextResponse.json(
        {
          error:
            "Invalid request.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Explicit string[] removes
     * the unknown[] Prisma error.
     */
    const ids: string[] =
      normalizeIds(
        body.ids,
      );

    if (!ids.length) {
      return NextResponse.json(
        {
          error:
            "Select at least one order.",
        },
        {
          status: 400,
        },
      );
    }

    if (ids.length > 250) {
      return NextResponse.json(
        {
          error:
            "A maximum of 250 orders can be changed at once.",
        },
        {
          status: 400,
        },
      );
    }

    const action =
      typeof body.action ===
      "string"
        ? body.action
        : "";

    /*
     * BULK STATUS UPDATE
     */
    if (
      action ===
      "STATUS"
    ) {
      if (
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

      const result =
        await prisma.order.updateMany(
          {
            where: {
              id: {
                in: ids,
              },
            },

            data: {
              status:
                body.status,
            },
          },
        );

      return NextResponse.json(
        {
          ok: true,

          action:
            "STATUS",

          count:
            result.count,

          status:
            body.status,
        },
      );
    }

    /*
     * BULK PERMANENT DELETE
     */
    if (
      action ===
      "DELETE"
    ) {
      const existingOrders =
        await prisma.order.findMany(
          {
            where: {
              id: {
                in: ids,
              },
            },

            select: {
              id: true,
              reference: true,
            },
          },
        );

      if (
        !existingOrders.length
      ) {
        return NextResponse.json(
          {
            error:
              "No matching orders were found.",
          },
          {
            status: 404,
          },
        );
      }

      const existingIds: string[] =
        existingOrders.map(
          (order) =>
            order.id,
        );

      await prisma.$transaction(
        async (tx) => {
          /*
           * Payment has no cascade
           * delete in the current
           * Prisma relation.
           */
          await tx.payment.deleteMany(
            {
              where: {
                orderId: {
                  in:
                    existingIds,
                },
              },
            },
          );

          /*
           * OrderItem records cascade
           * automatically from Order.
           */
          await tx.order.deleteMany(
            {
              where: {
                id: {
                  in:
                    existingIds,
                },
              },
            },
          );
        },
      );

      return NextResponse.json(
        {
          ok: true,

          action:
            "DELETE",

          count:
            existingIds.length,

          deletedIds:
            existingIds,
        },
      );
    }

    return NextResponse.json(
      {
        error:
          "Invalid bulk action.",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error(
      "Admin bulk order action failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to apply bulk order action.",
      },
      {
        status: 400,
      },
    );
  }
}