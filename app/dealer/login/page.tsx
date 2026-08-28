"use client";

import Image from "next/image";
import Link from "next/link";

import {
  type FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Brand,
} from "@/components/Brand";

export default function DealerLoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [remember, setRemember] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/dealer/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email:
              email.trim(),

            password,
            remember,
          }),
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to sign in.",
        );
      }

      router.replace(
        "/dealer/dashboard",
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign in.",
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
          alt="LPG industrial equipment"
          fill
          priority
          sizes="54vw"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-[#061f2d]/85 to-[#0a9c63]/35" />

        <div className="absolute inset-0 flex items-end p-14 text-white">
          <div>
            <div className="hero-kicker">
              Dingsheng Dealer Portal
            </div>

            <h1 className="mt-4 max-w-xl text-5xl font-extrabold tracking-[-.04em]">
              Commercial access built for trusted energy
              partners.
            </h1>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Brand />

          <div className="card mt-10 p-8">
            <div className="eyebrow">
              Dealer login
            </div>

            <h1 className="mt-2 text-3xl font-extrabold">
              Welcome back
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#657983]">
              Sign in with your approved dealer account to
              access protected pricing, RFQs, orders,
              payments and commercial information.
            </p>

            <form
              onSubmit={submit}
              className="mt-7 grid gap-4"
            >
              <div className="field">
                <label htmlFor="dealer-email">
                  Business Email
                </label>

                <input
                  id="dealer-email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  disabled={loading}
                  required
                />
              </div>

              <div className="field">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="dealer-password">
                    Password
                  </label>

                  <Link
                    href="/dealer/forgot-password"
                    className="text-[11px] font-extrabold text-[#0a9c63] hover:text-[#087a50]"
                  >
                    Forgot password?
                  </Link>
                </div>

                <input
                  id="dealer-password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  disabled={loading}
                  required
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-[#647983]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) =>
                    setRemember(
                      event.target.checked,
                    )
                  }
                  disabled={loading}
                />

                Remember me on this device
              </label>

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Signing In..."
                  : "Sign In →"}
              </button>
            </form>

            <div className="mt-6 border-t border-[#e2ebe7] pt-5 text-center text-xs text-[#647983]">
              Need dealer access?{" "}
              <Link
                href="/dealer/apply"
                className="font-extrabold text-[#0a9c63]"
              >
                Register your company
              </Link>
            </div>
          </div>

          <p className="mt-5 text-center text-xs leading-6 text-[#71838b]">
            Access is available only to registered and
            administrator-approved dealer accounts.
          </p>
        </div>
      </section>
    </main>
  );
}