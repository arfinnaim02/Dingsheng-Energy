import { NextResponse } from "next/server";
import { adminCookieConfig } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin-login", request.url), 303);
  response.cookies.set(adminCookieConfig.name, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });
  return response;
}
