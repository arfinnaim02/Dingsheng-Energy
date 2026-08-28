"use client";

import Link from "next/link";

import {
  type FormEvent,
  useState,
} from "react";

type Props = {
  token: string;
};

export default function ResetPasswordClient({
  token,
}: Props) {
  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

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

    if (
      loading ||
      success ||
      !token
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (
        password !== confirmPassword
      ) {
        throw new Error(
          "The passwords do not match.",
        );
      }

      const response = await fetch(
        "/api/dealer/reset-password",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            token,
            password,
            confirmPassword,
          }),
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to reset your password.",
        );
      }

      setPassword("");
      setConfirmPassword("");

      setSuccess(
        result.message ||
          "Your password has been reset successfully.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to reset your password.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="card mt-10 p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl font-black text-red-700">
          !
        </div>

        <div className="eyebrow mt-6">
          Password reset
        </div>

        <h1 className="mt-2 text-3xl font-extrabold">
          Invalid reset link
        </h1>

        <p className="mt-4 text-sm leading-7 text-[#657983]">
          This password-reset link does not contain a valid
          security token.
        </p>

        <Link
          href="/dealer/forgot-password"
          className="btn btn-primary mt-7 w-full"
        >
          Request Another Link
        </Link>
      </div>
    );
  }

  return (
    <div className="card mt-10 p-8">
      <div className="eyebrow">
        Account recovery
      </div>

      <h1 className="mt-2 text-3xl font-extrabold">
        Choose a new password
      </h1>

      <p className="mt-3 text-sm leading-6 text-[#657983]">
        Your password must contain at least eight
        characters, including uppercase, lowercase and a
        number.
      </p>

      {success ? (
        <div className="mt-7 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-black text-emerald-700">
            ✓
          </div>

          <h2 className="mt-5 text-xl font-black">
            Password updated
          </h2>

          <p className="mt-3 text-sm leading-7 text-[#657983]">
            {success}
          </p>

          <Link
            href="/dealer/login"
            className="btn btn-primary mt-6 w-full"
          >
            Sign In With New Password →
          </Link>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="mt-7 grid gap-4"
        >
          <div className="field">
            <label htmlFor="new-password">
              New Password
            </label>

            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
              autoComplete="new-password"
              minLength={8}
              disabled={loading}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="confirm-password">
              Confirm New Password
            </label>

            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value,
                )
              }
              autoComplete="new-password"
              minLength={8}
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

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Resetting Password..."
              : "Reset Password →"}
          </button>

          <Link
            href="/dealer/login"
            className="text-center text-xs font-extrabold text-[#0a9c63]"
          >
            Cancel and Return to Login
          </Link>
        </form>
      )}
    </div>
  );
}