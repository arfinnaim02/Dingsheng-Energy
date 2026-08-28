import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "dingsheng_dealer_session";
const MAX_AGE_SECONDS = 60 * 60 * 8;

type DealerTokenPayload = {
  userId: string;
  email: string;
  exp: number;
};

function secret() {
  const value = process.env.DEALER_SESSION_SECRET;

  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("DEALER_SESSION_SECRET is required.");
  }

  return value || "local-dealer-secret-change-before-production";
}

function sign(value: string) {
  return crypto
    .createHmac("sha256", secret())
    .update(value)
    .digest("base64url");
}

export function createDealerToken(
  userId: string,
  email: string,
  maxAge = MAX_AGE_SECONDS,
) {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      email,
      exp: Math.floor(Date.now() / 1000) + maxAge,
    }),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function verifyDealerToken(
  token?: string | null,
): DealerTokenPayload | null {
  if (!token) return null;

  const [payload, signature] = token.split(".");

  if (!payload || !signature) return null;

  const expected = sign(payload);

  if (signature.length !== expected.length) return null;

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    )
  ) {
    return null;
  }

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as DealerTokenPayload;

    if (
      !data.userId ||
      !data.email ||
      !data.exp ||
      data.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export async function getCurrentDealer() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const payload = verifyDealerToken(token);

  if (!payload) return null;

  return prisma.dealerProfile.findFirst({
    where: {
      userId: payload.userId,
      status: "ACTIVE",
      user: {
        email: payload.email,
        role: "DEALER",
      },
    },
    include: {
      user: true,
      priceGroup: true,
    },
  });
}

export async function isDealerSession() {
  return Boolean(await getCurrentDealer());
}

export async function requireDealer() {
  const dealer = await getCurrentDealer();

  if (!dealer) {
    redirect("/dealer/login");
  }

  return dealer;
}

export async function dealerCookie() {
  return cookies();
}

export const dealerCookieConfig = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SECONDS,
};