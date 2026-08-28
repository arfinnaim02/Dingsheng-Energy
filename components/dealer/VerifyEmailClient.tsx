"use client";

import Link from "next/link";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type Props = {
  token: string;
};

type VerificationState =
  | "loading"
  | "success"
  | "error";

export default function VerifyEmailClient({
  token,
}: Props) {
  const started = useRef(false);

  const [
    state,
    setState,
  ] = useState<VerificationState>(
    "loading",
  );

  const [
    message,
    setMessage,
  ] = useState(
    "Checking your verification link...",
  );

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    async function verify() {
      if (!token) {
        setState("error");

        setMessage(
          "The verification link is incomplete or invalid.",
        );

        return;
      }

      try {
        const response = await fetch(
          "/api/dealer/email-verification/verify",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              token,
            }),
          },
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Unable to verify your email.",
          );
        }

        setState("success");

        setMessage(
          result.message ||
            "Your email address has been verified successfully.",
        );
      } catch (error) {
        setState("error");

        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to verify your email.",
        );
      }
    }

    void verify();
  }, [token]);

  return (
    <div className="card mt-10 p-8 text-center">
      {state === "loading" && (
        <>
          <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-[#edf7f2] text-2xl text-[#0a9c63]">
            …
          </div>

          <div className="eyebrow mt-5">
            Email verification
          </div>

          <h1 className="mt-2 text-3xl font-extrabold">
            Verifying your email
          </h1>

          <p className="mt-4 text-sm leading-7 text-[#657983]">
            {message}
          </p>
        </>
      )}

      {state === "success" && (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e7f7ef] text-2xl font-black text-[#087a50]">
            ✓
          </div>

          <div className="eyebrow mt-5">
            Verification complete
          </div>

          <h1 className="mt-2 text-3xl font-extrabold">
            Email verified
          </h1>

          <p
            role="status"
            className="mt-4 text-sm leading-7 text-[#657983]"
          >
            {message}
          </p>

          <p className="mt-3 text-xs leading-6 text-[#829198]">
            If your dealer application is still pending,
            you will be able to sign in after administrator
            approval.
          </p>

          <Link
            href="/dealer/login"
            className="btn btn-primary mt-7 w-full"
          >
            Continue to Dealer Login →
          </Link>
        </>
      )}

      {state === "error" && (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl font-black text-red-600">
            !
          </div>

          <div className="mt-5 text-[10px] font-black uppercase tracking-[.12em] text-red-600">
            Verification unsuccessful
          </div>

          <h1 className="mt-2 text-3xl font-extrabold">
            Link could not be verified
          </h1>

          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-7 text-red-700"
          >
            {message}
          </div>

          <p className="mt-4 text-xs leading-6 text-[#829198]">
            If the link expired, sign in to your approved
            dealer account and request another verification
            email from the Account page.
          </p>

          <Link
            href="/dealer/login"
            className="btn btn-secondary mt-7 w-full"
          >
            Go to Dealer Login
          </Link>
        </>
      )}
    </div>
  );
}