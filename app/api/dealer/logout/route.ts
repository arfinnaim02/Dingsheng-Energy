import {
  NextResponse,
} from "next/server";

import {
  dealerCookieConfig,
} from "@/lib/dealerAuth";

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
      dealerCookieConfig.name,

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