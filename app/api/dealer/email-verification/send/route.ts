import {
  NextResponse,
} from "next/server";

import {
  getCurrentDealer,
} from "@/lib/dealerAuth";

import {
  sendDealerVerificationEmail,
} from "@/lib/dealerAccountEmails";

import {
  prisma,
} from "@/lib/prisma";

export async function POST() {
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

  if (
    dealer.user.emailVerified
  ) {
    return NextResponse.json({
      ok: true,

      alreadyVerified: true,

      message:
        "Your email address is already verified.",
    });
  }

  const recentToken =
    await prisma.emailVerificationToken.findFirst({
      where: {
        userId:
          dealer.userId,

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

  if (recentToken) {
    return NextResponse.json(
      {
        error:
          "A verification email was sent recently. Please wait one minute before trying again.",
      },
      {
        status: 429,
      },
    );
  }

  try {
    const result =
      await sendDealerVerificationEmail(
        dealer.userId,
      );

    if (
      !result.sent &&
      result.skipped
    ) {
      return NextResponse.json(
        {
          error:
            "Email delivery is not configured.",
        },
        {
          status: 503,
        },
      );
    }

    return NextResponse.json({
      ok: true,

      message:
        "Verification email sent. Please check your inbox and spam folder.",
    });
  } catch (error) {
    console.error(
      "Verification email delivery failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to send the verification email right now.",
      },
      {
        status: 500,
      },
    );
  }
}