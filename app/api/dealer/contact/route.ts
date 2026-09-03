import {
  randomUUID,
} from "node:crypto";

import {
  NextResponse,
} from "next/server";

import {
  getCurrentDealer,
} from "@/lib/dealerAuth";

import {
  sendNewContactNotification,
} from "@/lib/email";

import {
  prisma,
} from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 30;

const allowedInquiryTypes =
  new Set([
    "General Support",
    "Product Inquiry",
    "Dealer Pricing",
    "RFQ Support",
    "Order Support",
    "Payment Support",
    "Technical Support",
    "Account Support",
    "Other",
  ]);

type RequestBody = {
  inquiryType?: string;
  requirement?: string;
};

function cleanText(
  value: unknown,
  maximum: number,
) {
  return typeof value ===
    "string"
    ? value
        .trim()
        .slice(0, maximum)
    : "";
}

function createReference() {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const random = randomUUID()
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase();

  return `D-CON-${date}-${random}`;
}

export async function POST(
  request: Request,
) {
  const dealer =
    await getCurrentDealer();

  if (!dealer) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const body =
    (await request.json().catch(
      () => null,
    )) as
      | RequestBody
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

  const inquiryType =
    cleanText(
      body.inquiryType,
      80,
    );

  const requirement =
    cleanText(
      body.requirement,
      10000,
    );

  if (
    !allowedInquiryTypes.has(
      inquiryType,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Select a valid contact category.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    requirement.length < 10
  ) {
    return NextResponse.json(
      {
        error:
          "Please provide at least 10 characters of message details.",
      },
      {
        status: 400,
      },
    );
  }

  const forwardedFor =
    request.headers.get(
      "x-forwarded-for",
    );

  const ipAddress =
    cleanText(
      forwardedFor?.split(
        ",",
      )[0],
      100,
    );

  const userAgent =
    cleanText(
      request.headers.get(
        "user-agent",
      ),
      1000,
    );

  try {
    /*
     * Save the authenticated dealer
     * inquiry to Neon first.
     */
    const inquiry =
      await prisma.contactInquiry.create({
        data: {
          reference:
            createReference(),

          source: "DEALER",

          dealerId:
            dealer.id,

          fullName:
            dealer.contactName,

          company:
            dealer.companyName,

          email:
            dealer.user.email,

          phone:
            dealer.phone ||
            null,

          country:
            dealer.country ||
            null,

          inquiryType,
          requirement,

          status: "NEW",

          priority:
            inquiryType ===
              "Payment Support"
              ? "HIGH"
              : "NORMAL",

          ipAddress:
            ipAddress ||
            null,

          userAgent:
            userAgent ||
            null,
        },

        select: {
          id: true,
          reference: true,
          source: true,
          dealerId: true,
          fullName: true,
          company: true,
          email: true,
          phone: true,
          country: true,
          inquiryType: true,
          requirement: true,
          createdAt: true,
        },
      });

    /*
     * Send the notification after the
     * database record has been saved.
     *
     * Gmail failure is logged without
     * failing the dealer submission.
     */
    try {
      await sendNewContactNotification({
        id: inquiry.id,

        reference:
          inquiry.reference,

        source:
          inquiry.source,

        dealerId:
          inquiry.dealerId,

        fullName:
          inquiry.fullName,

        company:
          inquiry.company,

        email:
          inquiry.email,

        phone:
          inquiry.phone,

        country:
          inquiry.country,

        inquiryType:
          inquiry.inquiryType,

        requirement:
          inquiry.requirement,

        createdAt:
          inquiry.createdAt,
      });
    } catch (emailError) {
      console.error(
        `Admin email notification failed for dealer contact ${inquiry.reference}:`,
        emailError,
      );
    }

    return NextResponse.json(
      {
        ok: true,

        reference:
          inquiry.reference,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Dealer contact submission failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to send your message right now. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}