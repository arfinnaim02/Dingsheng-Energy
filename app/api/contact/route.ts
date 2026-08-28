import {
  randomUUID,
} from "node:crypto";

import {
  NextResponse,
} from "next/server";

import {
  sendNewContactNotification,
} from "@/lib/email";

import {
  prisma,
} from "@/lib/prisma";

const inquiryTypes =
  new Set([
    "Product",
    "Engineering / EPC",
    "LPG Trading",
    "Dealer Access",
    "Service",
    "Other",
  ]);

type RequestBody = {
  fullName?: string;
  company?: string;
  email?: string;
  phone?: string;
  country?: string;
  inquiryType?: string;
  requirement?: string;
  website?: string;
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

  return `CON-${date}-${random}`;
}

export async function POST(
  request: Request,
) {
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

  /*
   * Honeypot field.
   * Real visitors cannot see or
   * complete this field.
   */
  if (
    cleanText(
      body.website,
      200,
    )
  ) {
    return NextResponse.json({
      ok: true,
      reference: "RECEIVED",
    });
  }

  const fullName =
    cleanText(
      body.fullName,
      120,
    );

  const company =
    cleanText(
      body.company,
      160,
    );

  const email =
    cleanText(
      body.email,
      200,
    ).toLowerCase();

  const phone =
    cleanText(
      body.phone,
      60,
    );

  const country =
    cleanText(
      body.country,
      100,
    );

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
    !fullName ||
    !company ||
    !email ||
    !requirement
  ) {
    return NextResponse.json(
      {
        error:
          "Full name, company, email and requirement details are required.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !/^\S+@\S+\.\S+$/.test(
      email,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Enter a valid email address.",
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
          "Please provide at least 10 characters of requirement details.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !inquiryTypes.has(
      inquiryType,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Select a valid inquiry type.",
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
     * Save to Neon first.
     * Email must never be the only copy
     * of a customer inquiry.
     */
    const inquiry =
      await prisma.contactInquiry.create({
        data: {
          reference:
            createReference(),

          source: "PUBLIC",

          dealerId: null,

          fullName,
          company,
          email,

          phone:
            phone || null,

          country:
            country || null,

          inquiryType,
          requirement,

          status: "NEW",
          priority: "NORMAL",

          ipAddress:
            ipAddress || null,

          userAgent:
            userAgent || null,
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
     * Try sending the admin email only
     * after the database record exists.
     *
     * An SMTP failure is logged but does
     * not make the public form fail.
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
        `Admin email notification failed for ${inquiry.reference}:`,
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
      "Contact submission failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to submit your request right now. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}