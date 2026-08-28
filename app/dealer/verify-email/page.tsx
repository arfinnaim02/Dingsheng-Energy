import Image from "next/image";

import {
  Brand,
} from "@/components/Brand";

import VerifyEmailClient from "@/components/dealer/VerifyEmailClient";

export const metadata = {
  title:
    "Verify Dealer Email | Dingsheng Energy",
};

type PageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function VerifyEmailPage({
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
              Dingsheng Dealer Portal
            </div>

            <h1 className="mt-4 max-w-xl text-5xl font-extrabold tracking-[-.04em]">
              Secure commercial access for trusted energy
              partners.
            </h1>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Brand />

          <VerifyEmailClient
            token={token}
          />
        </div>
      </section>
    </main>
  );
}