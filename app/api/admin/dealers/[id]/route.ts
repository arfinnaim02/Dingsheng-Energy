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

type DealerStatus = (typeof allowedStatuses)[number];

type UpdateDealerBody = {
  status?: DealerStatus;
  priceGroupId?: string | null;
};

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

  const body = (await request.json().catch(() => null)) as
    | UpdateDealerBody
    | null;

  if (!body) {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 },
    );
  }

  if (
    body.status &&
    !allowedStatuses.includes(body.status)
  ) {
    return NextResponse.json(
      { error: "Invalid dealer status." },
      { status: 400 },
    );
  }

  const dealer = await prisma.dealerProfile.findUnique({
    where: { id },
    include: {
      user: true,
      priceGroup: true,
    },
  });

  if (!dealer) {
    return NextResponse.json(
      { error: "Dealer was not found." },
      { status: 404 },
    );
  }

  let selectedPriceGroupId =
    body.priceGroupId === undefined
      ? dealer.priceGroupId
      : body.priceGroupId || null;

  if (selectedPriceGroupId) {
    const selectedGroup = await prisma.priceGroup.findUnique({
      where: {
        id: selectedPriceGroupId,
      },
    });

    if (!selectedGroup || !selectedGroup.active) {
      return NextResponse.json(
        { error: "Select a valid active price group." },
        { status: 400 },
      );
    }
  }

  const nextStatus = body.status ?? dealer.status;

  if (nextStatus === "ACTIVE" && !selectedPriceGroupId) {
    return NextResponse.json(
      {
        error:
          "Assign an active price group before approving the dealer.",
      },
      { status: 400 },
    );
  }

  const nextRole =
    nextStatus === "ACTIVE" ||
    nextStatus === "SUSPENDED" ||
    nextStatus === "INACTIVE"
      ? "DEALER"
      : "DEALER_APPLICANT";

  const updatedDealer = await prisma.$transaction(
    async (transaction) => {
      await transaction.user.update({
        where: {
          id: dealer.userId,
        },
        data: {
          role: nextRole,
        },
      });

      return transaction.dealerProfile.update({
        where: {
          id,
        },
        data: {
          status: nextStatus,
          priceGroupId: selectedPriceGroupId,
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
      });
    },
  );

  return NextResponse.json({
    ok: true,
    dealer: updatedDealer,
  });
}