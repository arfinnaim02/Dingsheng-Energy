import {
  createHash,
  randomBytes,
} from "node:crypto";

import nodemailer from "nodemailer";

import {
  prisma,
} from "@/lib/prisma";

const VERIFICATION_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_MINUTES = 60;

function emailConfiguration() {
  const user =
    process.env.GMAIL_SMTP_USER?.trim();

  const appPassword =
    process.env.GMAIL_SMTP_APP_PASSWORD
      ?.replace(/\s/g, "");

  if (!user || !appPassword) {
    return null;
  }

  return {
    user,
    appPassword,
  };
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL
      ?.trim()
      .replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function createRawToken() {
  return randomBytes(32).toString("hex");
}

export function hashAccountToken(
  token: string,
) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function escapeHtml(
  value:
    | string
    | null
    | undefined,
) {
  return (value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function transporter(
  user: string,
  appPassword: string,
) {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,

    auth: {
      user,
      pass: appPassword,
    },

    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,

    tls: {
      servername: "smtp.gmail.com",
      minVersion: "TLSv1.2",
    },
  });
}

type AccountEmailOptions = {
  to: string;
  contactName: string;
  subject: string;
  heading: string;
  description: string;
  buttonLabel: string;
  url: string;
  expiryText: string;
};

async function sendAccountEmail({
  to,
  contactName,
  subject,
  heading,
  description,
  buttonLabel,
  url,
  expiryText,
}: AccountEmailOptions) {
  const configuration =
    emailConfiguration();

  if (!configuration) {
    console.warn(
      `Dealer account email skipped for ${to}: Gmail SMTP environment variables are incomplete.`,
    );

    return {
      sent: false,
      skipped: true,
    };
  }

  const mailer = transporter(
    configuration.user,
    configuration.appPassword,
  );

  const text = [
    `Hello ${contactName},`,
    "",
    description,
    "",
    url,
    "",
    expiryText,
    "",
    "If you did not request this action, you can ignore this email.",
    "",
    "Dingsheng Energy",
  ].join("\n");

  const html = `
    <div style="margin:0;padding:32px;background:#f3f7f5;font-family:Arial,Helvetica,sans-serif;color:#17313d;">
      <div style="max-width:640px;margin:0 auto;overflow:hidden;border:1px solid #dfe8e4;border-radius:14px;background:#ffffff;">
        <div style="padding:28px 32px;background:#0c322a;color:#ffffff;">
          <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#91cbb3;">
            Dingsheng Dealer Portal
          </div>

          <h1 style="margin:10px 0 0;font-size:25px;line-height:1.3;">
            ${escapeHtml(heading)}
          </h1>
        </div>

        <div style="padding:30px 32px;">
          <p style="margin:0;font-size:15px;line-height:1.7;">
            Hello ${escapeHtml(contactName)},
          </p>

          <p style="margin:18px 0 0;font-size:14px;line-height:1.7;color:#526872;">
            ${escapeHtml(description)}
          </p>

          <div style="margin-top:26px;">
            <a
              href="${escapeHtml(url)}"
              style="display:inline-block;padding:13px 20px;border-radius:6px;background:#0a9c63;color:#ffffff;font-size:13px;font-weight:800;text-decoration:none;"
            >
              ${escapeHtml(buttonLabel)}
            </a>
          </div>

          <p style="margin:24px 0 0;font-size:12px;line-height:1.7;color:#71838b;">
            ${escapeHtml(expiryText)}
          </p>

          <p style="margin:12px 0 0;font-size:12px;line-height:1.7;color:#71838b;">
            If the button does not work, copy and paste this link into your browser:
          </p>

          <p style="margin:8px 0 0;word-break:break-all;font-size:11px;line-height:1.7;color:#087a50;">
            ${escapeHtml(url)}
          </p>
        </div>

        <div style="padding:18px 32px;border-top:1px solid #e5ece8;background:#f7faf8;color:#829198;font-size:11px;line-height:1.6;">
          If you did not request this action, you can safely ignore this email.
          This notification was generated automatically by Dingsheng Energy.
        </div>
      </div>
    </div>
  `;

  const result =
    await mailer.sendMail({
      from: {
        name:
          "Dingsheng Energy Dealer Portal",

        address:
          configuration.user,
      },

      to,
      subject,
      text,
      html,
    });

  return {
    sent: true,
    skipped: false,
    messageId:
      result.messageId,
  };
}

export async function sendDealerVerificationEmail(
  userId: string,
) {
  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        email: true,
        emailVerified: true,

        dealerProfile: {
          select: {
            contactName: true,
          },
        },
      },
    });

  if (
    !user ||
    !user.dealerProfile
  ) {
    return {
      sent: false,
      skipped: true,
    };
  }

  if (user.emailVerified) {
    return {
      sent: false,
      skipped: true,
      alreadyVerified: true,
    };
  }

  const rawToken =
    createRawToken();

  const tokenHash =
    hashAccountToken(rawToken);

  const expiresAt =
    new Date(
      Date.now() +
        VERIFICATION_EXPIRY_HOURS *
          60 *
          60 *
          1000,
    );

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({
      where: {
        userId: user.id,
      },
    }),

    prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  const verificationUrl =
    `${siteUrl()}/dealer/verify-email?token=${encodeURIComponent(
      rawToken,
    )}`;

  const result =
    await sendAccountEmail({
      to: user.email,

      contactName:
        user.dealerProfile.contactName,

      subject:
        "Verify your Dingsheng dealer email",

      heading:
        "Verify Your Email Address",

      description:
        "Please verify your business email address to secure your dealer account and receive important account notifications.",

      buttonLabel:
        "Verify Email Address",

      url:
        verificationUrl,

      expiryText:
        `This verification link expires in ${VERIFICATION_EXPIRY_HOURS} hours and can only be used once.`,
    });

  console.info(
    `Dealer verification email processed for ${user.email}.`,
  );

  return result;
}

export async function sendDealerPasswordResetEmail(
  userId: string,
) {
  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        email: true,

        dealerProfile: {
          select: {
            contactName: true,
          },
        },
      },
    });

  if (
    !user ||
    !user.dealerProfile
  ) {
    return {
      sent: false,
      skipped: true,
    };
  }

  const rawToken =
    createRawToken();

  const tokenHash =
    hashAccountToken(rawToken);

  const expiresAt =
    new Date(
      Date.now() +
        PASSWORD_RESET_EXPIRY_MINUTES *
          60 *
          1000,
    );

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    }),

    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  const resetUrl =
    `${siteUrl()}/dealer/reset-password?token=${encodeURIComponent(
      rawToken,
    )}`;

  const result =
    await sendAccountEmail({
      to: user.email,

      contactName:
        user.dealerProfile.contactName,

      subject:
        "Reset your Dingsheng dealer password",

      heading:
        "Reset Your Dealer Password",

      description:
        "A password reset was requested for your Dingsheng Energy dealer account. Use the button below to choose a new password.",

      buttonLabel:
        "Reset Password",

      url:
        resetUrl,

      expiryText:
        `This password-reset link expires in ${PASSWORD_RESET_EXPIRY_MINUTES} minutes and can only be used once.`,
    });

  console.info(
    `Dealer password-reset email processed for ${user.email}.`,
  );

  return result;
}