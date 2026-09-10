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

function normalizeIds(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter(
          (
            item,
          ): item is string =>
            typeof item ===
            "string",
        )
        .map(
          (item) =>
            item.trim(),
        )
        .filter(Boolean),
    ),
  ];
}

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

export async function POST(
  request: Request,
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

  const body =
    (await request
      .json()
      .catch(
        () => null,
      )) as any;

  const ids: string[] =
    normalizeIds(
      body?.ids,
    );

  if (!ids.length) {
    return NextResponse.json(
      {
        error:
          "Select at least one payment.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    if (
      body.action ===
      "DELETE"
    ) {
      const result =
        await prisma.payment.deleteMany(
          {
            where: {
              id: {
                in: ids,
              },
            },
          },
        );

      return NextResponse.json({
        ok: true,
        count:
          result.count,
      });
    }

    if (
      body.action ===
      "STATUS" &&
      isStatus(
        body.status,
      )
    ) {
      const result =
        await prisma.payment.updateMany(
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

      return NextResponse.json({
        ok: true,
        count:
          result.count,
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
    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to apply payment action.",
      },
      {
        status: 400,
      },
    );
  }
}