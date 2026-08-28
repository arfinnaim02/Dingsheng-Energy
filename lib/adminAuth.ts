
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "dingsheng_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 10;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || "local-development-secret-change-before-production";
}

function password() {
  return process.env.ADMIN_PASSWORD || "dingsheng-admin";
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function verifyAdminPassword(value: string) {
  const expected = Buffer.from(password());
  const provided = Buffer.from(value || "");
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(expected, provided);
}

export function createAdminToken() {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token?: string | null) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  if (signature.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return Boolean(data.exp && data.exp > Math.floor(Date.now() / 1000));
  } catch {
    return false;
  }
}

export async function isAdminSession() {
  const store = await cookies();
  return verifyAdminToken(store.get(COOKIE_NAME)?.value);
}

export async function requireAdmin() {
  if (!(await isAdminSession())) redirect("/admin-login");
}

export async function adminCookie() {
  const store = await cookies();
  return store;
}

export const adminCookieConfig = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SECONDS,
};
