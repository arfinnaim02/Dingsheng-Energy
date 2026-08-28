"use client";

import Image from "next/image";
import Link from "next/link";

import {
  type FormEvent,
  useState,
} from "react";

import {
  Brand,
} from "@/components/Brand";

export default function DealerForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/dealer/forgot-password",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email:
              email.trim(),
          }),
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to process your request.",
        );
      }

      setSuccess(
        result.message ||
          "If a dealer account exists for this email, a reset link has been sent.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to process your request.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f4f8f6] lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden lg:block">
        <Image
          src="/media/dealer-login.jpg"
          alt="Dingsheng Energy industrial equipment"
          fill
          priority
          sizes="54vw"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-[#061f2d]/85 to-[#0a9c63]/35" />

        <div className="absolute inset-0 flex items-end p-14 text-white">
          <div>
            <div className="hero-kicker">
              Account recovery
            </div>

            <h1 className="mt-4 max-w-xl text-5xl font-extrabold tracking-[-.04em]">
              Recover access to your protected dealer
              workspace.
            </h1>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Brand />

          <div className="card mt-10 p-8">
            <div className="eyebrow">
              Password assistance
            </div>

            <h1 className="mt-2 text-3xl font-extrabold">
              Forgot your password?
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#657983]">
              Enter your registered business email. If a
              dealer account exists, we will send a secure
              password-reset link.
            </p>

            <form
              onSubmit={submit}
              className="mt-7 grid gap-4"
            >
              <div className="field">
                <label htmlFor="forgot-email">
                  Business Email
                </label>

                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  placeholder="name@company.com"
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-700"
                >
                  {success}

                  <div className="mt-2">
                    Check your inbox and spam folder.
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  Boolean(success)
                }
                className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Sending Reset Link..."
                  : success
                    ? "Reset Link Requested"
                    : "Send Reset Link →"}
              </button>
            </form>

            <div className="mt-6 border-t border-[#e2ebe7] pt-5 text-center">
              <Link
                href="/dealer/login"
                className="text-xs font-extrabold text-[#0a9c63]"
              >
                ← Return to Dealer Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}