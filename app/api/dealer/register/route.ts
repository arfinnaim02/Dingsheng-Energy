import {
  hash,
} from "bcryptjs";

import {
  NextResponse,
} from "next/server";

import {
  sendDealerVerificationEmail,
} from "@/lib/dealerAccountEmails";

import {
  prisma,
} from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 30;

type RegistrationBody = {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  country?: string;
  businessType?: string;
  jobTitle?: string;
  website?: string;
  interests?: string;
  password?: string;
  acceptedTerms?: boolean;
};

function clean(
  value?: string,
) {
  return value?.trim() || null;
}

function validEmail(
  email: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}

function validPassword(
  password: string,
) {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

function validWebsite(
  website: string | null,
) {
  if (!website) {
    return true;
  }

  try {
    const parsed =
      new URL(website);

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );
  } catch {
    return false;
  }
}

export async function POST(
  request: Request,
) {
  const body =
    (await request.json().catch(
      () => null,
    )) as RegistrationBody | null;

  if (!body) {
    return NextResponse.json(
      {
        error:
          "Invalid registration request.",
      },
      {
        status: 400,
      },
    );
  }

  const companyName =
    body.companyName?.trim() || "";

  const contactName =
    body.contactName?.trim() || "";

  const email =
    body.email
      ?.trim()
      .toLowerCase() || "";

  const phone =
    body.phone?.trim() || "";

  const country =
    body.country?.trim() || "";

  const password =
    body.password || "";

  const website =
    clean(body.website);

  if (
    !companyName ||
    !contactName ||
    !email ||
    !phone ||
    !country
  ) {
    return NextResponse.json(
      {
        error:
          "Complete all required fields.",
      },
      {
        status: 400,
      },
    );
  }

  if (!validEmail(email)) {
    return NextResponse.json(
      {
        error:
          "Enter a valid business email.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !validPassword(password)
  ) {
    return NextResponse.json(
      {
        error:
          "Password must contain at least 8 characters, uppercase, lowercase and a number.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !validWebsite(website)
  ) {
    return NextResponse.json(
      {
        error:
          "Website must begin with http:// or https://.",
      },
      {
        status: 400,
      },
    );
  }

  if (!body.acceptedTerms) {
    return NextResponse.json(
      {
        error:
          "You must accept the dealer terms.",
      },
      {
        status: 400,
      },
    );
  }

  const existingUser =
    await prisma.user.findUnique({
      where: {
        email,
      },

      select: {
        id: true,
      },
    });

  if (existingUser) {
    return NextResponse.json(
      {
        error:
          "An account already exists with this email address.",
      },
      {
        status: 409,
      },
    );
  }

  const passwordHash =
    await hash(password, 12);

  try {
    const user =
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          role:
            "DEALER_APPLICANT",

          dealerProfile: {
            create: {
              companyName,
              contactName,
              phone,
              country,

              businessType:
                clean(
                  body.businessType,
                ),

              jobTitle:
                clean(
                  body.jobTitle,
                ),

              website,

              interests:
                clean(
                  body.interests,
                ),

              status:
                "PENDING",
            },
          },
        },

        select: {
          id: true,
        },
      });

    let verificationSent =
      false;

    try {
      const emailResult =
        await sendDealerVerificationEmail(
          user.id,
        );

      verificationSent =
        emailResult.sent === true;
    } catch (emailError) {
      /*
       * Registration remains successful even if Gmail
       * has a temporary delivery failure.
       */
      console.error(
        "Initial dealer verification email failed:",
        emailError,
      );
    }

    return NextResponse.json(
      {
        ok: true,

        verificationSent,

        message:
          verificationSent
            ? "Your dealer application was submitted. Check your email to verify your address while administrator approval is pending."
            : "Your dealer application was submitted successfully and is awaiting administrator approval.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Dealer registration failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to submit the application. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}