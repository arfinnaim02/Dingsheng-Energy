import Image from "next/image";
import Link from "next/link";

import {
  Callout,
} from "@/components/Callout";

import {
  ResponsiveHeroMedia,
} from "@/components/ResponsiveHeroMedia";

import {
  Icon,
} from "@/components/Icon";

import {
  PublicShell,
} from "@/components/PublicShell";

import {
  buildServiceHref,
  getPublicServiceImage,
  getPublicServices,
  getServiceChildren,
} from "@/lib/publicServiceTree";

export const metadata = {
  title:
    "Services | Dingsheng Energy Limited",

  description:
    "LPG engineering, EPC, autogas, reticulation, consultancy and machinery servicing from Dingsheng Energy Limited.",
};

export const dynamic =
  "force-dynamic";

const deliverySteps = [
  "Requirement Review",
  "Engineering",
  "Procurement",
  "Installation",
  "Testing",
  "Commissioning",
];

const serviceBenefits = [
  [
    "gear",
    "End-to-End Solutions",
    "Engineering and procurement through testing and commissioning.",
  ],

  [
    "shield",
    "Safety & Compliance",
    "Design decisions aligned to applicable standards and project requirements.",
  ],

  [
    "user",
    "Engineering Support",
    "Technical support for equipment selection and project delivery.",
  ],

  [
    "wrench",
    "After-Sales Support",
    "Inspection, maintenance, troubleshooting and servicing.",
  ],
] as const;

export default async function ServicesPage() {
  const services =
    await getPublicServices();

  const roots =
    getServiceChildren(
      services,
      null,
    );

  return (
    <PublicShell>
      {/* =====================================
          PAGE HERO
      ===================================== */}

      <section className="bg-[#061f2d] text-white">

  {/* DESKTOP */}
  <div className="relative hidden aspect-[16/9] w-full overflow-hidden lg:block">

    <ResponsiveHeroMedia
      src="/media/services/hero-services.jpg"
      alt="Dingsheng Energy engineering and technical services"
      priority
      position="center"
    />

    <div className="absolute inset-0 bg-gradient-to-r from-[#061f2d]/94 via-[#061f2d]/58 to-[#061f2d]/5" />

    <div className="container-shell absolute inset-0 z-10 flex items-center">

      <div className="max-w-3xl">

        <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.17em] text-[#4ed7a1]">
          <span className="h-[2px] w-8 bg-[#4ed7a1]" />

          Engineering Excellence · Complete Solutions
        </div>

        <h1 className="mt-4 text-[64px] font-black leading-[1.05] tracking-[-.04em]">
          Our Services
        </h1>

        <p className="mt-6 max-w-[660px] text-base leading-8 text-white/74">
          From concept to commissioning,
          Dingsheng Energy delivers
          integrated engineering and
          technical services for safe,
          efficient and reliable operation.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">

          <Link
            href="#services"
            className="btn btn-primary"
          >
            Explore Services →
          </Link>

          <Link
            href="/contact#rfq"
            className="btn border border-white/35 text-white"
          >
            Discuss a Project
          </Link>

        </div>

      </div>

    </div>

  </div>


  {/* MOBILE */}
  <div className="lg:hidden">

    <div className="relative aspect-[16/9] w-full overflow-hidden">

      <ResponsiveHeroMedia
        src="/media/services/hero-services.jpg"
        alt="Dingsheng Energy engineering and technical services"
        priority
        position="center"
      />

    </div>

    <div className="container-shell py-10">

      <div className="text-[10px] font-black uppercase leading-5 tracking-[.14em] text-[#4ed7a1]">
        Engineering Excellence · Complete Solutions
      </div>

      <h1 className="mt-4 text-[40px] font-black leading-[1.05] tracking-[-.04em]">
        Our Services
      </h1>

      <p className="mt-5 text-[15px] leading-7 text-white/70">
        From concept to commissioning,
        Dingsheng Energy delivers integrated
        LPG engineering and technical services
        for safe, efficient and reliable operation.
      </p>

      <div className="mt-7 flex flex-wrap gap-3">

        <Link
          href="#services"
          className="btn btn-primary"
        >
          Explore Services →
        </Link>

        <Link
          href="/contact#rfq"
          className="btn border border-white/35 text-white"
        >
          Discuss a Project
        </Link>

      </div>

    </div>

  </div>

</section>

      {/* =====================================
          ROOT SERVICE CARDS
      ===================================== */}

      <section className="section bg-white">
        <div className="container-shell">
          <div className="mx-auto max-w-3xl text-center">
            <div className="eyebrow">
              What We Do
            </div>

            <h2 className="h2 mt-3">
              Comprehensive Engineering & Technical Services
            </h2>

            <p className="mt-4 text-sm leading-7 text-[#687b84]">
              Explore our engineering,
              technical and project-service
              capabilities across the complete
              energy infrastructure lifecycle.
            </p>
          </div>

          <div
            id="services"
            className="mt-10 grid scroll-mt-24 gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {roots.map(
              (
                service,
                index,
              ) => {
                const children =
                  getServiceChildren(
                    services,
                    service.id,
                  );

                const serviceImage =
                  getPublicServiceImage(
                    service,
                    "card",
                  );

                return (
                  <Link
                    key={service.id}
                    href={buildServiceHref(
                      services,
                      service.id,
                    )}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#dfe8e4] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative h-[210px] overflow-hidden bg-[#e8efeb] sm:h-[220px] xl:h-[200px]">
                      {serviceImage ? (
                        <Image
                          src={serviceImage}
                          alt={service.name}
                          fill
                          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                          className="object-cover object-center transition duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#edf4f0] to-[#dce9e3] px-6 text-center">
                          <span className="text-xs font-black uppercase tracking-[.12em] text-[#82968d]">
                            Image managed from Admin
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-[#071f2c]/80 via-[#071f2c]/10 to-transparent" />

                      <div className="absolute bottom-4 left-5 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-[#0a9c63] text-xs font-black text-white">
                        {String(
                          index + 1,
                        ).padStart(
                          2,
                          "0",
                        )}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="text-xl font-black leading-tight">
                        {service.name}
                      </h3>

                      {service.summary && (
                        <p className="mt-3 text-sm leading-6 text-[#657983]">
                          {service.summary}
                        </p>
                      )}

                      {children.length > 0 && (
                        <div className="mt-5 grid gap-2">
                          {children
                            .slice(
                              0,
                              4,
                            )
                            .map(
                              (
                                child,
                              ) => (
                                <div
                                  key={child.id}
                                  className="flex items-start gap-2 text-[10px] font-bold leading-5 text-[#5d746e]"
                                >
                                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0a9c63]" />

                                  <span>
                                    {child.name}
                                  </span>
                                </div>
                              ),
                            )}
                        </div>
                      )}

                      <div className="mt-auto pt-6 text-xs font-black text-[#0a9c63]">
                        Explore service →
                      </div>
                    </div>
                  </Link>
                );
              },
            )}
          </div>

          {!roots.length && (
            <div className="mt-10 rounded-xl border border-dashed border-[#d7e4df] bg-[#f8fbfa] p-10 text-center text-sm text-[#627780]">
              No public services are currently available.
            </div>
          )}
        </div>
      </section>

      {/* =====================================
          DELIVERY MODEL
      ===================================== */}

      <section className="section dark-section">
        <div className="container-shell">
          <div className="mx-auto max-w-3xl text-center">
            <div className="eyebrow !text-[#59dfa8]">
              Delivery Model
            </div>

            <h2 className="h2 mt-3">
              From Requirement Review to Operational Handover
            </h2>
          </div>

          <div className="mt-11 grid gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-0 xl:grid-cols-6">
            {deliverySteps.map(
              (
                step,
                index,
              ) => (
                <div
                  key={step}
                  className="relative border border-white/10 bg-white/[.025] p-5 text-center md:border-r-0 xl:last:border-r"
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#0a9c63] text-xs font-black">
                    {String(
                      index + 1,
                    ).padStart(
                      2,
                      "0",
                    )}
                  </div>

                  <div className="mt-4 text-xs font-black uppercase leading-5 tracking-wide">
                    {step}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* =====================================
          BENEFITS
      ===================================== */}

      <section className="section soft-section">
        <div className="container-shell">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {serviceBenefits.map(
              ([
                icon,
                title,
                copy,
              ]) => (
                <div
                  key={title}
                  className="card h-full p-6"
                >
                  <Icon
                    name={
                      icon as any
                    }
                    className="h-8 w-8 text-[#0a9c63]"
                  />

                  <h3 className="mt-4 font-black">
                    {title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#657983]">
                    {copy}
                  </p>
                </div>
              ),
            )}
          </div>

          <div className="mt-10">
            <Callout
              title="Have an LPG Project in Mind?"
              copy="Share your project location, operating requirement and technical documents for Dingsheng review."
            />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}