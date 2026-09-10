import {
  NextResponse,
} from "next/server";

import {
  adminCookieConfig,
  createAdminToken,
  verifyAdminPassword,
} from "@/lib/adminAuth";

export const runtime =
  "nodejs";

type LoginBody = {
  password?: unknown;
};

export async function POST(
  request: Request,
) {
  try {
    const body =
      (await request
        .json()
        .catch(
          () => ({}),
        )) as LoginBody;

    const password =
      typeof body.password ===
      "string"
        ? body.password
        : "";

    if (
      !verifyAdminPassword(
        password,
      )
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "Invalid administrator password.",
        },
        {
          status: 401,
        },
      );
    }

    const response =
      NextResponse.json({
        ok: true,
      });

    response.cookies.set({
      name:
        adminCookieConfig.name,

      value:
        createAdminToken(),

      httpOnly: true,

      sameSite: "lax",

      secure:
        process.env.NODE_ENV ===
        "production",

      maxAge:
        adminCookieConfig.maxAge,

      path: "/",
    });

    return response;
  } catch (error) {
    console.error(
      "Administrator login failed:",
      error instanceof Error
        ? error.message
        : error,
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          "Administrator authentication is not configured correctly.",
      },
      {
        status: 500,
      },
    );
  }
}