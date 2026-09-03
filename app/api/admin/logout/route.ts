import {
  NextResponse,
} from "next/server";

import {
  adminCookieConfig,
} from "@/lib/adminAuth";

export async function POST(
  request: Request,
) {
  const response =
    NextResponse.redirect(
      new URL("/", request.url),
      {
        status: 303,
      },
    );

  response.cookies.set({
    name:
      adminCookieConfig.name,

    value: "",
    httpOnly: true,
    secure:
      process.env.NODE_ENV ===
      "production",

    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}