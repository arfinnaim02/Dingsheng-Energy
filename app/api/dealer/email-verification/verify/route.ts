import {
  NextResponse,
} from "next/server";

import {
  hashAccountToken,
} from "@/lib/dealerAccountEmails";

import {
  prisma,
} from "@/lib/prisma";

type RequestBody = {
  token?: string;
};

export async function POST(
  request: Request,
) {
  const body =
    (await request.json().catch(
      () => null,
    )) as RequestBody | null;

  const rawToken =
    typeof body?.token === "string"
      ? body.token.trim()
      : "";

  if (!rawToken) {
    return NextResponse.json(
      {
        error:
          "The verification link is invalid.",
      },
      {
        status: 400,
      },
    );
  }

  const tokenHash =
    hashAccountToken(rawToken);

  try {
    const token =
      await prisma.emailVerificationToken.findUnique({
        where: {
          tokenHash,
        },

        include: {
          user: {
            select: {
              id: true,
              emailVerified: true,
            },
          },
        },
      });

    if (!token) {
      return NextResponse.json(
        {
          error:
            "This verification link is invalid or has already been used.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      token.expiresAt.getTime() <=
      Date.now()
    ) {
      await prisma.emailVerificationToken.delete({
        where: {
          id: token.id,
        },
      });

      return NextResponse.json(
        {
          error:
            "This verification link has expired. Sign in and request a new verification email.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      token.user.emailVerified
    ) {
      await prisma.emailVerificationToken.deleteMany({
        where: {
          userId:
            token.userId,
        },
      });

      return NextResponse.json({
        ok: true,

        alreadyVerified: true,

        message:
          "Your email address is already verified.",
      });
    }

    await prisma.$transaction(
      async (transaction) => {
        await transaction.user.update({
          where: {
            id: token.userId,
          },

          data: {
            emailVerified:
              new Date(),
          },
        });

        await transaction.emailVerificationToken.deleteMany({
          where: {
            userId:
              token.userId,
          },
        });

        await transaction.activityLog.create({
          data: {
            userId:
              token.userId,

            event:
              "DEALER_EMAIL_VERIFIED",

            entityType:
              "User",

            entityId:
              token.userId,
          },
        });
      },
    );

    return NextResponse.json({
      ok: true,

      message:
        "Your business email has been verified successfully.",
    });
  } catch (error) {
    console.error(
      "Dealer email verification failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to verify your email right now.",
      },
      {
        status: 500,
      },
    );
  }
}