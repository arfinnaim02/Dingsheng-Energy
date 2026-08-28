import Image from "next/image";

import {
  Brand,
} from "@/components/Brand";

import ResetPasswordClient from "@/components/dealer/ResetPasswordClient";

export const metadata = {
  title:
    "Reset Dealer Password | Dingsheng Energy",
};

type PageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: PageProps) {
  const parameters =
    await searchParams;

  const token =
    typeof parameters.token ===
    "string"
      ? parameters.token
      : "";

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
              Secure account recovery
            </div>

            <h1 className="mt-4 max-w-xl text-5xl font-extrabold tracking-[-.04em]">
              Restore access to your protected dealer
              workspace.
            </h1>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Brand />

          <ResetPasswordClient
            token={token}
          />
        </div>
      </section>
    </main>
  );
}