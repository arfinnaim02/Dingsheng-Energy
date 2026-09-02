import Image from "next/image";

import { Callout } from "@/components/Callout";
import { Icon } from "@/components/Icon";
import { PageHero } from "@/components/PageHero";
import { PublicShell } from "@/components/PublicShell";
import { SectionHeading } from "@/components/SectionHeading";

import {
  coreValues,
  mission,
  vision,
} from "@/data/site";

export const metadata = {
  title: "About Us | Dingsheng Energy Limited",
  description:
    "Learn about Dingsheng Energy Limited, our international LPG trading, engineering, equipment supply and integrated project capabilities.",
};

export default function AboutPage() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="About Dingsheng Energy"
        title="Global LPG Trading, Engineering & Complete Energy Solutions"
        description="A global LPG trading and engineering company committed to reliable, safe and efficient energy solutions across international markets."
        image="/media/about/hero-about.jpg"
      />

      <section className="section bg-white">
        <div className="container-shell grid-2 items-center">
          <div>
            <SectionHeading
              eyebrow="Who we are"
              title="Integrated expertise across the LPG value chain"
            />

            <div className="mt-6 space-y-5 text-[15px] leading-7 text-[#526872]">
              <p>
                Dingsheng Energy Limited combines LPG
                trading, logistics, engineering and
                equipment supply to provide end-to-end
                solutions for the LPG industry.
              </p>

              <p>
                Trading operations connect major
                LPG-producing regions in the Middle East
                and Asia with customers throughout
                Bangladesh, India, Sri Lanka, the Maldives
                and other international markets. The
                company coordinates sourcing, vessel
                chartering, terminal operations, customs
                support, loading, unloading and final
                delivery.
              </p>

              <p>
                Beyond trading, Dingsheng Energy supplies
                LPG filling machines, carousel and inline
                systems, compressors, pumps, vaporizers,
                storage and handling systems, and other
                specialized equipment for bottling plants,
                terminals and industrial applications.
              </p>
            </div>
          </div>

          <div className="relative min-h-[500px] overflow-hidden rounded-2xl bg-[#071f2c] shadow-xl">
            <Image
              src="/media/about/integrated-expertise.jpg"
              alt="Dingsheng Energy engineering expertise at an LPG facility"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#071f2c]/65 via-transparent to-transparent" />

            <div className="absolute inset-x-5 bottom-5 rounded-xl border border-white/10 bg-[#071f2c]/90 p-5 text-white shadow-lg backdrop-blur">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  [
                    "globe",
                    "International trading",
                  ],
                  [
                    "shield",
                    "Safety focus",
                  ],
                  [
                    "gear",
                    "Engineering capability",
                  ],
                  [
                    "handshake",
                    "Long-term partnership",
                  ],
                ].map(([icon, label]) => (
                  <div
                    className="flex items-center gap-2 text-sm"
                    key={label}
                  >
                    <Icon
                      name={icon as any}
                      className="h-5 w-5 shrink-0 text-[#61dfad]"
                    />

                    <strong>{label}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section soft-section">
        <div className="container-shell grid-2">
          <div className="card p-8">
            <div className="eyebrow">
              Our mission
            </div>

            <h2 className="mt-3 text-2xl font-black">
              What drives our work
            </h2>

            <div className="mt-6 grid gap-4">
              {mission.map((item) => (
                <div
                  className="flex gap-3 text-sm leading-6 text-[#526872]"
                  key={item}
                >
                  <Icon
                    name="check"
                    className="mt-1 h-4 w-4 shrink-0 text-[#0a9c63]"
                  />

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-8">
            <div className="eyebrow">
              Our vision
            </div>

            <h2 className="mt-3 text-2xl font-black">
              Building dependable energy partnerships
            </h2>

            <p className="mt-6 text-xl font-bold leading-9">
              {vision}
            </p>

            <div className="mt-10 rounded-xl bg-[#edf7f2] p-6 text-sm leading-7 text-[#50656f]">
              Driven by innovation, operational excellence
              and customer satisfaction, Dingsheng Energy
              focuses on quality products, dependable
              services and sustainable energy solutions.
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-shell">
          <SectionHeading
            center
            eyebrow="Our core values"
            title="Principles that guide every relationship"
          />

          <div className="grid-3 mt-10">
            {coreValues.map(
              ([title, copy], index) => (
                <div
                  className="card p-7"
                  key={title}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e9f7f0] font-extrabold text-[#0a9c63]">
                    {String(index + 1).padStart(
                      2,
                      "0",
                    )}
                  </div>

                  <h3 className="mt-5 text-lg font-extrabold">
                    {title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#657983]">
                    {copy}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container-shell">
          <Callout
            title="Partner with Dingsheng Energy"
            copy="Discuss LPG trading, equipment, EPC or technical support requirements with our team."
          />
        </div>
      </section>
    </PublicShell>
  );
}