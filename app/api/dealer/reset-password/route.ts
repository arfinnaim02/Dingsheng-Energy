import {
  hash,
} from "bcryptjs";

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
  password?: string;
  confirmPassword?: string;
};

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

  const password =
    typeof body?.password === "string"
      ? body.password
      : "";

  const confirmPassword =
    typeof body?.confirmPassword === "string"
      ? body.confirmPassword
      : "";

  if (!rawToken) {
    return NextResponse.json(
      {
        error:
          "The password-reset link is invalid.",
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
    password !==
    confirmPassword
  ) {
    return NextResponse.json(
      {
        error:
          "The passwords do not match.",
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
      await prisma.passwordResetToken.findUnique({
        where: {
          tokenHash,
        },

        select: {
          id: true,
          userId: true,
          expiresAt: true,
        },
      });

    if (!token) {
      return NextResponse.json(
        {
          error:
            "This password-reset link is invalid or has already been used.",
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
      await prisma.passwordResetToken.delete({
        where: {
          id: token.id,
        },
      });

      return NextResponse.json(
        {
          error:
            "This password-reset link has expired. Request a new one.",
        },
        {
          status: 400,
        },
      );
    }

    const passwordHash =
      await hash(password, 12);

    await prisma.$transaction(
      async (transaction) => {
        await transaction.user.update({
          where: {
            id: token.userId,
          },

          data: {
            passwordHash,
          },
        });

        await transaction.passwordResetToken.deleteMany({
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
              "DEALER_PASSWORD_RESET",

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
        "Your password has been reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error(
      "Dealer password reset failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to reset your password right now.",
      },
      {
        status: 500,
      },
    );
  }
}