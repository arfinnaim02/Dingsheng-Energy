import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "dingsheng_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 10;

function getAdminSessionSecret() {
  const value =
    process.env.ADMIN_SESSION_SECRET?.trim();

  if (!value) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not configured.",
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    value.length < 32
  ) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be at least 32 characters in production.",
    );
  }

  return value;
}

function getAdminPassword() {
  const value =
    process.env.ADMIN_PASSWORD?.trim();

  if (!value) {
    throw new Error(
      "ADMIN_PASSWORD is not configured.",
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    value.length < 12
  ) {
    throw new Error(
      "ADMIN_PASSWORD must be at least 12 characters in production.",
    );
  }

  return value;
}

function sign(
  value: string,
) {
  return crypto
    .createHmac(
      "sha256",
      getAdminSessionSecret(),
    )
    .update(value)
    .digest("base64url");
}

export function verifyAdminPassword(
  value: string,
) {
  const expectedPassword =
    getAdminPassword();

  const expected =
    Buffer.from(
      expectedPassword,
      "utf8",
    );

  const provided =
    Buffer.from(
      value || "",
      "utf8",
    );

  if (
    expected.length !==
    provided.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expected,
    provided,
  );
}

export function createAdminToken() {
  const payload =
    Buffer.from(
      JSON.stringify({
        exp:
          Math.floor(
            Date.now() / 1000,
          ) +
          MAX_AGE_SECONDS,
      }),
      "utf8",
    ).toString(
      "base64url",
    );

  return `${payload}.${sign(
    payload,
  )}`;
}

export function verifyAdminToken(
  token?: string | null,
) {
  if (!token) {
    return false;
  }

  const parts =
    token.split(".");

  if (
    parts.length !== 2
  ) {
    return false;
  }

  const [
    payload,
    signature,
  ] = parts;

  if (
    !payload ||
    !signature
  ) {
    return false;
  }

  const expectedSignature =
    sign(payload);

  const providedBuffer =
    Buffer.from(
      signature,
      "utf8",
    );

  const expectedBuffer =
    Buffer.from(
      expectedSignature,
      "utf8",
    );

  if (
    providedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  if (
    !crypto.timingSafeEqual(
      providedBuffer,
      expectedBuffer,
    )
  ) {
    return false;
  }

  try {
    const data =
      JSON.parse(
        Buffer.from(
          payload,
          "base64url",
        ).toString(
          "utf8",
        ),
      ) as {
        exp?: number;
      };

    if (
      typeof data.exp !==
      "number"
    ) {
      return false;
    }

    return (
      data.exp >
      Math.floor(
        Date.now() / 1000,
      )
    );
  } catch {
    return false;
  }
}

export async function isAdminSession() {
  const store =
    await cookies();

  return verifyAdminToken(
    store.get(
      COOKIE_NAME,
    )?.value,
  );
}

export async function requireAdmin() {
  const authenticated =
    await isAdminSession();

  if (!authenticated) {
    redirect(
      "/admin-login",
    );
  }
}

export const adminCookieConfig = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SECONDS,
} as const;