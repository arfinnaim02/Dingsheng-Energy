import Image from "next/image";

import {
  Callout,
} from "@/components/Callout";

import {
  Icon,
} from "@/components/Icon";

import {
  PageHero,
} from "@/components/PageHero";

import {
  PublicShell,
} from "@/components/PublicShell";

import {
  SectionHeading,
} from "@/components/SectionHeading";

export const metadata = {
  title:
    "About Dingsheng Energy | Dingsheng Energy Limited",

  description:
    "Dingsheng Energy Limited is a global energy trading and engineering company delivering reliable, safe and efficient solutions across LPG, LNG, petrochemicals and renewable energy markets.",
};

const mission = [
  "Deliver reliable and competitive energy trading solutions across international markets, covering LPG, LNG, petrochemicals, and renewable energy.",

  "Provide complete end-to-end supply chain and logistics solutions, including sourcing, transportation, vessel chartering, terminal coordination, loading, unloading, distribution, and regulatory compliance.",

  "Supply high-quality equipment, technologies, and engineering solutions designed to meet international standards and the evolving needs of the energy industry.",

  "Maintain the highest standards of safety, quality, environmental responsibility, and operational excellence across every project and operation.",

  "Build long-term partnerships through professionalism, integrity, technical expertise, innovation, and responsive customer service.",

  "Continuously improve our solutions and services through technology, innovation, sustainable practices, and operational excellence.",
];

export default function AboutPage() {
  return (
    <PublicShell>
      {/* =========================================
          HERO
      ========================================= */}

      <PageHero
        eyebrow="About Dingsheng Energy"
        title="Global Energy Trading, Engineering & Complete Energy Solutions"
        description="A global energy trading and engineering company delivering reliable, safe, and efficient solutions across LPG, LNG, petrochemicals, and renewable energy markets."
        image="/media/about/hero-about.jpg"
      />

      {/* =========================================
          WHO WE ARE
      ========================================= */}

      <section className="section bg-white">
        <div className="container-shell grid-2 items-start gap-12 lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Who we are"
              title="Integrated Expertise across the Energy Value Chain"
            />

            <div className="mt-6 space-y-5 text-[15px] leading-8 text-[#526872]">
              <p>
                Headquartered in Hong Kong,
                Dingsheng Energy Limited is a
                professional oil and gas
                industry enterprise integrating
                specialized energy engineering
                services, industrial equipment
                import and export, and bulk
                energy commodity trading.
              </p>

              <p>
                The company delivers
                comprehensive end-to-end
                engineering solutions for
                petroleum, LPG, and LNG sectors,
                covering full-cycle design,
                storage, transportation, and
                distribution system
                development. We provide turnkey
                services and technical support
                for refineries, LPG bottling
                plants, LNG facilities, and
                industrial fuel systems for
                boilers and burner-dependent
                manufacturing units.
              </p>

              <p>
                We source premium-grade oil and
                gas machinery, industrial
                equipment, and genuine spare
                parts from certified and
                renowned manufacturers across
                the USA, Germany, Turkey,
                Malaysia, China, and India. All
                supplied equipment is supported
                by professional on-site
                installation supervision,
                commissioning, and after-sales
                maintenance, ensuring stable,
                safe, and long-term plant
                operation for industrial
                clients.
              </p>

              <p>
                Beyond engineering and
                equipment supply, Dingsheng
                Energy actively engages in
                cross-border trading of bulk
                energy commodities, including
                LPG, LNG, crude oil, and various
                petroleum-based products,
                catering to growing energy
                demand across South Asia and
                Africa.
              </p>

              <p>
                Our core operational markets
                cover Bangladesh, Nepal, India,
                and Sri Lanka. Leveraging robust
                global supply chains and
                strategic industry partnerships,
                we are steadily expanding our
                project and trading footprint
                into Central Asia and Africa,
                collaborating with leading
                international oil and gas
                enterprises.
              </p>

              <p>
                Dedicated to quality
                engineering, reliable supply,
                and transparent trade services,
                Dingsheng Energy strives to
                deliver cost-effective,
                standardized, and sustainable
                energy solutions for emerging
                global markets.
              </p>
            </div>
          </div>

          {/* Image / capability card */}
          <div className="relative min-h-[560px] overflow-hidden rounded-2xl bg-[#071f2c] shadow-xl lg:sticky lg:top-28">
            <Image
              src="/media/about/integrated-expertise.jpg"
              alt="Dingsheng Energy integrated energy trading and engineering expertise"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#071f2c]/80 via-[#071f2c]/10 to-transparent" />

            <div className="absolute inset-x-5 bottom-5 rounded-xl border border-white/10 bg-[#071f2c]/90 p-5 text-white shadow-lg backdrop-blur">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  [
                    "globe",
                    "Global Energy Trading",
                  ],
                  [
                    "gear",
                    "Engineering Expertise",
                  ],
                  [
                    "shield",
                    "Safety & Quality",
                  ],
                  [
                    "handshake",
                    "Long-Term Partnerships",
                  ],
                ].map(
                  (
                    [
                      icon,
                      label,
                    ],
                  ) => (
                    <div
                      className="flex items-center gap-2 text-sm"
                      key={
                        label
                      }
                    >
                      <Icon
                        name={
                          icon as any
                        }
                        className="h-5 w-5 shrink-0 text-[#61dfad]"
                      />

                      <strong>
                        {
                          label
                        }
                      </strong>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          MISSION + VISION
      ========================================= */}

      <section className="section soft-section">
        <div className="container-shell grid gap-8 lg:grid-cols-2">
          {/* Mission */}
          <div className="card p-8 lg:p-9">
            <div className="eyebrow">
              Our mission
            </div>

            <h2 className="mt-3 text-2xl font-black text-[#17313d]">
              What Drives Our Work
            </h2>

            <div className="mt-7 grid gap-5">
              {mission.map(
                (
                  item,
                ) => (
                  <div
                    className="flex gap-3 text-sm leading-7 text-[#526872]"
                    key={
                      item
                    }
                  >
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e9f7f0]">
                      <Icon
                        name="check"
                        className="h-3.5 w-3.5 text-[#0a9c63]"
                      />
                    </span>

                    <span>
                      {item}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Vision */}
<div className="card p-8 lg:p-9">
  <div className="eyebrow">
    Our vision
  </div>

  <h2 className="mt-3 text-2xl font-black text-[#17313d]">
    Building Dependable Energy
    Partnerships
  </h2>

  <p className="mt-6 text-[15px] leading-8 text-[#526872]">
    To become a globally recognized
    leader in energy trading,
    logistics, engineering, and
    integrated energy solutions
    across LPG, LNG, petrochemicals,
    and renewable energy—delivering
    safe, innovative, sustainable,
    and reliable services that
    create long-term value for
    customers, partners, and
    communities worldwide.
  </p>

  <div className="mt-7 border-t border-[#e4ebe7] pt-6">
    <div className="flex items-start gap-3">
      <Icon
        name="globe"
        className="mt-1 h-5 w-5 shrink-0 text-[#0a9c63]"
      />

      <p className="text-sm leading-7 text-[#657983]">
        Building dependable global
        energy partnerships through
        responsible trading,
        technical expertise,
        efficient logistics,
        sustainable practices, and
        long-term customer value.
      </p>
    </div>
  </div>
</div>
        </div>
      </section>

      {/* =========================================
          CTA
      ========================================= */}

      <section className="section-sm bg-white">
        <div className="container-shell">
          <Callout
            title="Partner with Dingsheng Energy"
            copy="Discuss energy trading, engineering, equipment supply, logistics, project development or technical support requirements with our team."
          />
        </div>
      </section>
    </PublicShell>
  );
}