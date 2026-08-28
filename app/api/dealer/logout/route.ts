import { NextResponse } from "next/server";
import { dealerCookie, dealerCookieConfig } from "@/lib/dealerAuth";

export async function POST(request: Request) {
  const store = await dealerCookie();
  store.set(dealerCookieConfig.name, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return NextResponse.redirect(new URL("/dealer/login", request.url), 303);
}
