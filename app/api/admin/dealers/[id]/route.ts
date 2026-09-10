import { NextResponse } from "next/server";

import { isAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

const allowedStatuses = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "REJECTED",
  "INACTIVE",
] as const;

type DealerStatus =
  (typeof allowedStatuses)[number];

type UpdateDealerBody = {
  status?: DealerStatus;
  priceGroupId?: string | null;
};

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

  const { id } = await context.params;

  try {
    const body = (await request
      .json()
      .catch(() => null)) as
      | UpdateDealerBody
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

    if (
      body.status &&
      !allowedStatuses.includes(
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

    const dealer =
      await prisma.dealerProfile.findUnique(
        {
          where: {
            id,
          },

          include: {
            user: true,
            priceGroup: true,
          },
        },
      );

    if (!dealer) {
      return NextResponse.json(
        {
          error:
            "Dealer was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const selectedPriceGroupId =
      body.priceGroupId === undefined
        ? dealer.priceGroupId
        : body.priceGroupId ||
          null;

    if (selectedPriceGroupId) {
      const selectedGroup =
        await prisma.priceGroup.findUnique(
          {
            where: {
              id:
                selectedPriceGroupId,
            },
          },
        );

      if (
        !selectedGroup ||
        !selectedGroup.active
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
    }

    const nextStatus =
      body.status ??
      dealer.status;

    if (
      nextStatus === "ACTIVE" &&
      !selectedPriceGroupId
    ) {
      return NextResponse.json(
        {
          error:
            "Assign an active price group before approving the dealer.",
        },
        {
          status: 400,
        },
      );
    }

    const nextRole =
      nextStatus === "ACTIVE" ||
      nextStatus ===
        "SUSPENDED" ||
      nextStatus === "INACTIVE"
        ? "DEALER"
        : "DEALER_APPLICANT";

    const updatedDealer =
      await prisma.$transaction(
        async (transaction) => {
          await transaction.user.update(
            {
              where: {
                id:
                  dealer.userId,
              },

              data: {
                role:
                  nextRole,
              },
            },
          );

          return transaction.dealerProfile.update(
            {
              where: {
                id,
              },

              data: {
                status:
                  nextStatus,

                priceGroupId:
                  selectedPriceGroupId,
              },

              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    role: true,
                  },
                },

                priceGroup: {
                  select: {
                    id: true,
                    slug: true,
                    name: true,
                    active: true,
                  },
                },
              },
            },
          );
        },
      );

    return NextResponse.json({
      ok: true,
      dealer:
        updatedDealer,
    });
  } catch (error) {
    console.error(
      "Dealer update failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update dealer.",
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

  const { id } = await context.params;

  try {
    const dealer =
      await prisma.dealerProfile.findUnique(
        {
          where: {
            id,
          },

          select: {
            id: true,
            userId: true,
            companyName: true,
            contactName: true,

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

    if (!dealer) {
      return NextResponse.json(
        {
          error:
            "Dealer was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const orderIds: string[] =
      dealer.orders.map(
        (order) =>
          order.id,
      );

    const rfqIds: string[] =
      dealer.rfqs.map(
        (rfq) =>
          rfq.id,
      );

    await prisma.$transaction(
      async (transaction) => {
        /*
         * Payment -> Order currently
         * has no cascade delete.
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
         * OrderItem rows cascade
         * automatically from Order.
         */
        await transaction.order.deleteMany(
          {
            where: {
              dealerId:
                dealer.id,
            },
          },
        );

        /*
         * Quotation -> RFQ currently
         * has no cascade delete.
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
         * RfqItem rows cascade
         * automatically from RFQ.
         */
        await transaction.rfq.deleteMany(
          {
            where: {
              dealerId:
                dealer.id,
            },
          },
        );

        /*
         * DealerNote rows cascade
         * automatically.
         *
         * ContactInquiry uses SetNull,
         * so historical contact records
         * stay available.
         */
        await transaction.dealerProfile.delete(
          {
            where: {
              id:
                dealer.id,
            },
          },
        );

        /*
         * Delete the dealer login.
         *
         * ActivityLog uses SetNull,
         * therefore audit history remains.
         */
        await transaction.user.delete(
          {
            where: {
              id:
                dealer.userId,
            },
          },
        );
      },
    );

    return NextResponse.json({
      ok: true,

      id:
        dealer.id,

      companyName:
        dealer.companyName,
    });
  } catch (error) {
    console.error(
      "Dealer permanent delete failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to permanently delete dealer.",
      },
      {
        status: 400,
      },
    );
  }
}