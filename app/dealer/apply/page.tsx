import Link from "next/link";
import { DealerRegistrationForm } from "@/components/dealer/DealerRegistrationForm";
import { PageHero } from "@/components/PageHero";
import { PublicShell } from "@/components/PublicShell";

export const metadata = {
  title: "Dealer Registration",
};

export default function DealerApplyPage() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="Dealer access"
        title="Apply for the Dingsheng Dealer Portal"
        description="Register your company for protected commercial pricing and dealer services."
        image="/media/dealer-partner.jpg"
      />

      <section className="section">
        <div className="container-shell max-w-4xl">
          <DealerRegistrationForm />

          <div className="mt-5 text-center text-sm">
            Already approved?{" "}
            <Link
              href="/dealer/login"
              className="font-extrabold text-[#0a9c63]"
            >
              Dealer Login
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}