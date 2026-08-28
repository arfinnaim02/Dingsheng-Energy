import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import {
  createDealerToken,
  dealerCookie,
  dealerCookieConfig,
} from "@/lib/dealerAuth";
import { prisma } from "@/lib/prisma";

type LoginBody = {
  email?: string;
  password?: string;
  remember?: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | LoginBody
    | null;

  const email = body?.email?.trim().toLowerCase() || "";
  const password = body?.password || "";

  if (!email || !email.includes("@") || !password) {
    return NextResponse.json(
      { error: "Enter your business email and password." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      dealerProfile: {
        include: {
          priceGroup: true,
        },
      },
    },
  });

  if (!user || !user.dealerProfile) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const passwordMatches = await compare(
    password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const dealer = user.dealerProfile;

  if (dealer.status === "PENDING") {
    return NextResponse.json(
      {
        error:
          "Your dealer application is still awaiting administrator approval.",
      },
      { status: 403 },
    );
  }

  if (dealer.status === "REJECTED") {
    return NextResponse.json(
      {
        error:
          "Your dealer application was not approved. Please contact Dingsheng Energy.",
      },
      { status: 403 },
    );
  }

  if (
    dealer.status === "SUSPENDED" ||
    dealer.status === "INACTIVE"
  ) {
    return NextResponse.json(
      {
        error:
          "Your dealer account is currently inactive. Please contact Dingsheng Energy.",
      },
      { status: 403 },
    );
  }

  if (
    dealer.status !== "ACTIVE" ||
    user.role !== "DEALER"
  ) {
    return NextResponse.json(
      { error: "Dealer access is not active." },
      { status: 403 },
    );
  }

  if (!dealer.priceGroup || !dealer.priceGroup.active) {
    return NextResponse.json(
      {
        error:
          "No active pricing group is assigned to this account. Please contact Dingsheng Energy.",
      },
      { status: 403 },
    );
  }

  const maxAge = body?.remember
    ? dealerCookieConfig.maxAge
    : 60 * 60 * 2;

  const store = await dealerCookie();

  store.set(
    dealerCookieConfig.name,
    createDealerToken(user.id, user.email, maxAge),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    },
  );

  return NextResponse.json({
    ok: true,
  });
}