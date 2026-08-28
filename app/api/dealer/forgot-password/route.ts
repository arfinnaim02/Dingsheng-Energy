import {
  NextResponse,
} from "next/server";

import {
  sendDealerPasswordResetEmail,
} from "@/lib/dealerAccountEmails";

import {
  prisma,
} from "@/lib/prisma";

type RequestBody = {
  email?: string;
};

const genericMessage =
  "If a dealer account exists for this email, a password-reset link has been sent.";

function validEmail(
  email: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}

export async function POST(
  request: Request,
) {
  const body =
    (await request.json().catch(
      () => null,
    )) as RequestBody | null;

  const email =
    typeof body?.email === "string"
      ? body.email
          .trim()
          .toLowerCase()
          .slice(0, 320)
      : "";

  if (
    !email ||
    !validEmail(email)
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

  try {
    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          id: true,

          dealerProfile: {
            select: {
              id: true,
            },
          },
        },
      });

    /*
     * Always return the same public response so attackers
     * cannot determine which email addresses are registered.
     */
    if (
      !user ||
      !user.dealerProfile
    ) {
      return NextResponse.json({
        ok: true,
        message: genericMessage,
      });
    }

    const recentToken =
      await prisma.passwordResetToken.findFirst({
        where: {
          userId: user.id,

          createdAt: {
            gte: new Date(
              Date.now() -
                60 * 1000,
            ),
          },
        },

        select: {
          id: true,
        },
      });

    if (!recentToken) {
      try {
        await sendDealerPasswordResetEmail(
          user.id,
        );
      } catch (emailError) {
        /*
         * Do not reveal delivery or account information
         * through the public response.
         */
        console.error(
          "Dealer password-reset email failed:",
          emailError,
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message: genericMessage,
    });
  } catch (error) {
    console.error(
      "Dealer forgot-password request failed:",
      error,
    );

    /*
     * Keep the response generic even when an internal
     * delivery or database issue occurs.
     */
    return NextResponse.json({
      ok: true,
      message: genericMessage,
    });
  }
}