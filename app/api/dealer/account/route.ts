import {
  compare,
  hash,
} from "bcryptjs";

import {
  NextResponse,
} from "next/server";

import {
  getCurrentDealer,
} from "@/lib/dealerAuth";

import {
  prisma,
} from "@/lib/prisma";

type ProfileBody = {
  action?: "profile";
  companyName?: string;
  contactName?: string;
  jobTitle?: string;
  businessType?: string;
  phone?: string;
  country?: string;
  website?: string;
  interests?: string;
};

type PasswordBody = {
  action?: "password";
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

type RequestBody =
  | ProfileBody
  | PasswordBody;

function cleanText(
  value: unknown,
  maximum: number,
) {
  return typeof value === "string"
    ? value.trim().slice(0, maximum)
    : "";
}

function nullableText(
  value: unknown,
  maximum: number,
) {
  const cleaned =
    cleanText(value, maximum);

  return cleaned || null;
}

function validWebsite(
  value: string,
) {
  if (!value) {
    return true;
  }

  try {
    const parsed = new URL(value);

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function validPassword(
  password: string,
) {
  return (
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}

export async function PATCH(
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
    )) as RequestBody | null;

  if (!body?.action) {
    return NextResponse.json(
      {
        error:
          "Select a valid account action.",
      },
      {
        status: 400,
      },
    );
  }

  if (body.action === "profile") {
    const profile =
      body as ProfileBody;

    const companyName =
      cleanText(
        profile.companyName,
        160,
      );

    const contactName =
      cleanText(
        profile.contactName,
        160,
      );

    const jobTitle =
      nullableText(
        profile.jobTitle,
        120,
      );

    const businessType =
      nullableText(
        profile.businessType,
        160,
      );

    const phone =
      nullableText(
        profile.phone,
        80,
      );

    const country =
      nullableText(
        profile.country,
        120,
      );

    const website =
      nullableText(
        profile.website,
        500,
      );

    const interests =
      nullableText(
        profile.interests,
        5000,
      );

    if (
      companyName.length < 2
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid company name.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      contactName.length < 2
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid contact name.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      website &&
      !validWebsite(website)
    ) {
      return NextResponse.json(
        {
          error:
            "Website must be a complete URL beginning with http:// or https://.",
        },
        {
          status: 400,
        },
      );
    }

    try {
      const updated =
        await prisma.$transaction(
          async (transaction) => {
            const result =
              await transaction.dealerProfile.update({
                where: {
                  id: dealer.id,
                },

                data: {
                  companyName,
                  contactName,
                  jobTitle,
                  businessType,
                  phone,
                  country,
                  website,
                  interests,
                },

                select: {
                  id: true,
                  companyName: true,
                  contactName: true,
                  jobTitle: true,
                  businessType: true,
                  phone: true,
                  country: true,
                  website: true,
                  interests: true,
                  updatedAt: true,
                },
              });

            await transaction.activityLog.create({
              data: {
                userId:
                  dealer.userId,

                event:
                  "DEALER_PROFILE_UPDATED",

                entityType:
                  "DealerProfile",

                entityId:
                  dealer.id,

                metadata: {
                  companyName,
                  contactName,
                },
              },
            });

            return result;
          },
        );

      return NextResponse.json({
        ok: true,

        profile: {
          ...updated,

          updatedAt:
            updated.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error(
        "Dealer profile update failed:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to update your account right now.",
        },
        {
          status: 500,
        },
      );
    }
  }

  if (body.action === "password") {
    const passwordBody =
      body as PasswordBody;

    const currentPassword =
      typeof passwordBody.currentPassword ===
      "string"
        ? passwordBody.currentPassword
        : "";

    const newPassword =
      typeof passwordBody.newPassword ===
      "string"
        ? passwordBody.newPassword
        : "";

    const confirmPassword =
      typeof passwordBody.confirmPassword ===
      "string"
        ? passwordBody.confirmPassword
        : "";

    if (!currentPassword) {
      return NextResponse.json(
        {
          error:
            "Enter your current password.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !validPassword(newPassword)
    ) {
      return NextResponse.json(
        {
          error:
            "The new password must contain at least 8 characters, including a letter and a number.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      return NextResponse.json(
        {
          error:
            "The new passwords do not match.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      currentPassword ===
      newPassword
    ) {
      return NextResponse.json(
        {
          error:
            "Your new password must be different from your current password.",
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
            id: dealer.userId,
          },

          select: {
            passwordHash: true,
          },
        });

      if (!user) {
        return NextResponse.json(
          {
            error:
              "Dealer account was not found.",
          },
          {
            status: 404,
          },
        );
      }

      const passwordMatches =
        await compare(
          currentPassword,
          user.passwordHash,
        );

      if (!passwordMatches) {
        return NextResponse.json(
          {
            error:
              "Your current password is incorrect.",
          },
          {
            status: 400,
          },
        );
      }

      const passwordHash =
        await hash(
          newPassword,
          12,
        );

      await prisma.$transaction(
        async (transaction) => {
          await transaction.user.update({
            where: {
              id: dealer.userId,
            },

            data: {
              passwordHash,
            },
          });

          await transaction.activityLog.create({
            data: {
              userId:
                dealer.userId,

              event:
                "DEALER_PASSWORD_CHANGED",

              entityType:
                "User",

              entityId:
                dealer.userId,
            },
          });
        },
      );

      return NextResponse.json({
        ok: true,

        message:
          "Password changed successfully.",
      });
    } catch (error) {
      console.error(
        "Dealer password update failed:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to change your password right now.",
        },
        {
          status: 500,
        },
      );
    }
  }

  return NextResponse.json(
    {
      error:
        "Select a valid account action.",
    },
    {
      status: 400,
    },
  );
}