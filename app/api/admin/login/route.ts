import { NextResponse } from "next/server";

import {
  adminCookieConfig,
  createAdminToken,
  verifyAdminPassword,
} from "@/lib/adminAuth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { password?: string };
  if (!verifyAdminPassword(body.password ?? "")) {
    return NextResponse.json({ ok: false, error: "Invalid administrator password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieConfig.name, createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: adminCookieConfig.maxAge,
    path: "/",
  });
  return response;
}
