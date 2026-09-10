import Image from "next/image";

import { PublicShell } from "@/components/PublicShell";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { Callout } from "@/components/Callout";

export const metadata = {
  title: "LPG Trading",
};

const steps = [
  "Sourcing",
  "Vessel Chartering",
  "Port Coordination",
  "Loading",
  "Unloading",
  "Final Delivery",
];

const capabilities = [
  "International LPG import & export",
  "Vessel chartering",
  "Port booking & coordination",
  "Domestic bulk LPG distribution by road tanker & bobtail",
  "LPG cylinder distribution for household and industry",
  "Customs, terminal and delivery coordination",
];

export default function TradingPage() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="Global & local LPG distribution"
        title="LPG Trading & Logistics"
        description="International LPG sourcing, import and export, vessel chartering, port coordination and domestic distribution."
        image="/media/hero-trading.jpg"
      />

      {/* =====================================
          END-TO-END SUPPLY CHAIN
      ===================================== */}

      <section className="section">
        <div className="container-shell grid-2 items-center">
          <div>
            <SectionHeading
              eyebrow="End-to-end supply chain"
              title="Coordinated from sourcing to delivery"
              copy="Dingsheng Energy manages LPG trading operations across international markets, connecting producing regions in the Middle East and Asia with customers in Bangladesh, India, Sri Lanka, the Maldives and other international markets."
            />

            <div className="mt-8 flex flex-wrap gap-2">
              {steps.map((step, index) => (
                <span
                  className="pill"
                  key={step}
                >
                  <strong className="text-[#0a9c63]">
                    {index + 1}
                  </strong>

                  {step}
                </span>
              ))}
            </div>
          </div>

          <div className="relative min-h-[410px] overflow-hidden rounded-2xl bg-[#071f2c]">
            <Image
              src="/media/trading-terminal.jpg"
              alt="LPG vessel and terminal"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* =====================================
          TRADING CAPABILITIES
      ===================================== */}

      <section className="section dark-section">
        <div className="container-shell">
          <SectionHeading
            eyebrow="Trading capabilities"
            title="Commercial and logistics coordination across the LPG supply chain"
          />

          <div className="grid-3 mt-9">
            {capabilities.map(
              (capability, index) => (
                <div
                  className="rounded-xl bg-white p-7 text-[#0c2230]"
                  key={capability}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e9f7f0] font-extrabold text-[#0a9c63]">
                    {index + 1}
                  </span>

                  <p className="mt-6 text-sm font-bold leading-6">
                    {capability}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* =====================================
          DISTRIBUTION CHAIN
      ===================================== */}

      <section className="section">
        <div className="container-shell">
          <SectionHeading
            center
            eyebrow="Distribution chain"
            title="From supply source to customer application"
          />

          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              "Source / Terminal",
              "Bulk Transport",
              "LPG Filling / Storage",
              "Industrial / Autogas Use",
            ].map((item, index) => (
              <div
                className="card p-6 text-center"
                key={item}
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e9f7f0] font-extrabold text-[#0a9c63]">
                  0{index + 1}
                </div>

                <strong className="mt-4 block">
                  {item}
                </strong>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Callout title="Discuss your LPG supply requirement" />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}