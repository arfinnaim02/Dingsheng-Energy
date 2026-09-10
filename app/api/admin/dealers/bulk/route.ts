import { NextResponse } from "next/server";

import { isAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

const statuses = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "REJECTED",
  "INACTIVE",
] as const;

type DealerStatus =
  (typeof statuses)[number];

type BulkDealerBody = {
  ids?: unknown;
  action?: unknown;
  status?: unknown;
  priceGroupId?: unknown;
};

function normalizeIds(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids = value.filter(
    (
      item,
    ): item is string =>
      typeof item === "string",
  );

  return [
    ...new Set(
      ids
        .map(
          (item) =>
            item.trim(),
        )
        .filter(Boolean),
    ),
  ];
}

function isDealerStatus(
  value: unknown,
): value is DealerStatus {
  return (
    typeof value === "string" &&
    statuses.includes(
      value as DealerStatus,
    )
  );
}

export async function POST(
  request: Request,
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

  try {
    const body = (await request
      .json()
      .catch(() => null)) as
      | BulkDealerBody
      | null;

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

    const ids =
      normalizeIds(
        body.ids,
      );

    if (!ids.length) {
      return NextResponse.json(
        {
          error:
            "Select at least one dealer.",
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
            "A maximum of 250 dealers can be managed at once.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ========================================
     * BULK PERMANENT DELETE
     * ========================================
     */
    if (
      body.action ===
      "DELETE"
    ) {
      const dealers =
        await prisma.dealerProfile.findMany(
          {
            where: {
              id: {
                in: ids,
              },
            },

            select: {
              id: true,
              userId: true,

              orders: {
                select: {
                  id: true,
                },
              },

              rfqs: {
                select: {
                  id: true,
                },
              },
            },
          },
        );

      if (!dealers.length) {
        return NextResponse.json(
          {
            error:
              "No matching dealers were found.",
          },
          {
            status: 404,
          },
        );
      }

      const dealerIds =
        dealers.map(
          (dealer) =>
            dealer.id,
        );

      const userIds =
        dealers.map(
          (dealer) =>
            dealer.userId,
        );

      const orderIds =
        dealers.flatMap(
          (dealer) =>
            dealer.orders.map(
              (order) =>
                order.id,
            ),
        );

      const rfqIds =
        dealers.flatMap(
          (dealer) =>
            dealer.rfqs.map(
              (rfq) =>
                rfq.id,
            ),
        );

      await prisma.$transaction(
        async (transaction) => {
          /*
           * Payments must be deleted before
           * Orders because Payment -> Order
           * does not cascade.
           */
          if (orderIds.length) {
            await transaction.payment.deleteMany(
              {
                where: {
                  orderId: {
                    in:
                      orderIds,
                  },
                },
              },
            );
          }

          /*
           * OrderItem rows cascade from Order.
           */
          await transaction.order.deleteMany(
            {
              where: {
                dealerId: {
                  in:
                    dealerIds,
                },
              },
            },
          );

          /*
           * Quotations must be removed before
           * their RFQs.
           */
          if (rfqIds.length) {
            await transaction.quotation.deleteMany(
              {
                where: {
                  rfqId: {
                    in:
                      rfqIds,
                  },
                },
              },
            );
          }

          /*
           * RfqItem rows cascade from RFQ.
           */
          await transaction.rfq.deleteMany(
            {
              where: {
                dealerId: {
                  in:
                    dealerIds,
                },
              },
            },
          );

          /*
           * DealerNote rows cascade automatically.
           * ContactInquiry dealerId uses SetNull.
           */
          await transaction.dealerProfile.deleteMany(
            {
              where: {
                id: {
                  in:
                    dealerIds,
                },
              },
            },
          );

          /*
           * ActivityLog userId uses SetNull.
           */
          await transaction.user.deleteMany(
            {
              where: {
                id: {
                  in:
                    userIds,
                },
              },
            },
          );
        },
      );

      return NextResponse.json({
        ok: true,
        action: "DELETE",
        count:
          dealerIds.length,
        deletedIds:
          dealerIds,
      });
    }

    /*
     * ========================================
     * BULK STATUS UPDATE
     * ========================================
     */
    if (
      body.action ===
      "STATUS"
    ) {
      if (
        !isDealerStatus(
          body.status,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid dealer status.",
          },
          {
            status: 400,
          },
        );
      }

      /*
       * Important:
       * Copy the validated value into a
       * strongly typed constant.
       *
       * This prevents TypeScript from losing
       * the narrowing inside the async
       * transaction callback.
       */
      const nextStatus:
        DealerStatus =
          body.status;

      const profiles =
        await prisma.dealerProfile.findMany(
          {
            where: {
              id: {
                in: ids,
              },
            },

            select: {
              id: true,
              userId: true,
              priceGroupId: true,
            },
          },
        );

      if (!profiles.length) {
        return NextResponse.json(
          {
            error:
              "No matching dealers were found.",
          },
          {
            status: 404,
          },
        );
      }

      /*
       * Preserve the same approval rule used
       * by the individual dealer PATCH route:
       * an ACTIVE dealer must have an active
       * price group.
       */
      if (
        nextStatus ===
        "ACTIVE"
      ) {
        const missingPriceGroup =
          profiles.some(
            (profile) =>
              !profile.priceGroupId,
          );

        if (missingPriceGroup) {
          return NextResponse.json(
            {
              error:
                "Assign an active price group to every selected dealer before activating them.",
            },
            {
              status: 400,
            },
          );
        }

        const priceGroupIds = [
          ...new Set(
            profiles
              .map(
                (profile) =>
                  profile.priceGroupId,
              )
              .filter(
                (
                  value,
                ): value is string =>
                  Boolean(value),
              ),
          ),
        ];

        const activeGroups =
          await prisma.priceGroup.findMany(
            {
              where: {
                id: {
                  in:
                    priceGroupIds,
                },

                active: true,
              },

              select: {
                id: true,
              },
            },
          );

        if (
          activeGroups.length !==
          priceGroupIds.length
        ) {
          return NextResponse.json(
            {
              error:
                "Every selected dealer must have an active price group before activation.",
            },
            {
              status: 400,
            },
          );
        }
      }

      /*
       * Keep User.role synchronized with
       * DealerProfile.status exactly like the
       * individual PATCH route.
       */
      const nextRole =
        nextStatus === "ACTIVE" ||
        nextStatus ===
          "SUSPENDED" ||
        nextStatus ===
          "INACTIVE"
          ? "DEALER"
          : "DEALER_APPLICANT";

      const dealerIds =
        profiles.map(
          (profile) =>
            profile.id,
        );

      const userIds =
        profiles.map(
          (profile) =>
            profile.userId,
        );

      await prisma.$transaction(
        async (transaction) => {
          await transaction.user.updateMany(
            {
              where: {
                id: {
                  in:
                    userIds,
                },
              },

              data: {
                role:
                  nextRole,
              },
            },
          );

          await transaction.dealerProfile.updateMany(
            {
              where: {
                id: {
                  in:
                    dealerIds,
                },
              },

              data: {
                status:
                  nextStatus,
              },
            },
          );
        },
      );

      return NextResponse.json({
        ok: true,
        action: "STATUS",
        count:
          dealerIds.length,
        status:
          nextStatus,
      });
    }

    /*
     * ========================================
     * BULK PRICE GROUP
     * ========================================
     */
    if (
      body.action ===
      "PRICE_GROUP"
    ) {
      if (
        typeof body.priceGroupId !==
          "string" ||
        !body.priceGroupId.trim()
      ) {
        return NextResponse.json(
          {
            error:
              "Select a valid price group.",
          },
          {
            status: 400,
          },
        );
      }

      const priceGroupId =
        body.priceGroupId.trim();

      const group =
        await prisma.priceGroup.findUnique(
          {
            where: {
              id:
                priceGroupId,
            },

            select: {
              id: true,
              active: true,
            },
          },
        );

      if (
        !group ||
        !group.active
      ) {
        return NextResponse.json(
          {
            error:
              "Select a valid active price group.",
          },
          {
            status: 400,
          },
        );
      }

      const result =
        await prisma.dealerProfile.updateMany(
          {
            where: {
              id: {
                in: ids,
              },
            },

            data: {
              priceGroupId:
                group.id,
            },
          },
        );

      return NextResponse.json({
        ok: true,
        action:
          "PRICE_GROUP",
        count:
          result.count,
        priceGroupId:
          group.id,
      });
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
      "Bulk dealer action failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to apply dealer action.",
      },
      {
        status: 400,
      },
    );
  }
}