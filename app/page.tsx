import Image from "next/image";
import Link from "next/link";

import { Callout } from "@/components/Callout";
import { Icon } from "@/components/Icon";
import { PublicShell } from "@/components/PublicShell";

import {
  coreValues,
  industries,
  suppliers,
} from "@/data/site";

import {
  ResponsiveHeroMedia,
} from "@/components/ResponsiveHeroMedia";

import {
  buildCategoryHref,
  getPublicProductCategories,
} from "@/lib/publicProductTree";

import {
  buildServiceHref,
  getPublicServiceImage,
  getPublicServices,
  getServiceChildren,
} from "@/lib/publicServiceTree";

export const dynamic = "force-dynamic";

const coreSolutions = [
  [
    "globe",
    "Energy Trading & Logistics",
    "International sourcing, import/export coordination, shipping, port support and distribution for energy projects and supply chains.",
    "/energy-trading",
  ],
  [
    "gear",
    "Engineering & EPC",
    "Project engineering, procurement, installation, testing, commissioning, infrastructure integration and technical support.",
    "/services",
  ],
  [
    "box",
    "Equipment Supply",
    "Industrial equipment, storage systems, transfer equipment, machinery, controls, instrumentation and project components.",
    "/products",
  ],
  [
    "wrench",
    "After-Sales Support",
    "Inspection, maintenance, troubleshooting, repair, servicing and long-term technical support for energy equipment.",
    "/services",
  ],
] as const;

export default async function HomePage() {
  const [categories, services] =
    await Promise.all([
      getPublicProductCategories(),
      getPublicServices(),
    ]);

  const rootCategories = categories
    .filter(
      (category) =>
        category.parentId === null,
    )
    .sort(
      (a, b) =>
        a.position - b.position ||
        a.name.localeCompare(b.name),
    );

  const rootServices =
    getServiceChildren(services, null);

  const highlightedService =
    rootServices.find(
      (service) =>
        service.featured &&
        Boolean(
          getPublicServiceImage(
            service,
            "hero",
          ),
        ),
    ) ??
    rootServices.find((service) =>
      Boolean(
        getPublicServiceImage(
          service,
          "hero",
        ),
      ),
    ) ??
    rootServices[0] ??
    null;

  const highlightedServiceImage =
    highlightedService
      ? getPublicServiceImage(
          highlightedService,
          "hero",
        )
      : null;

  return (
    <PublicShell>
      {/* =====================================
          HERO
      ===================================== */}

      <section className="bg-[#061e2b] text-white">

  {/* =====================================================
      DESKTOP HERO
  ===================================================== */}
  <div className="relative hidden w-full aspect-[16/9] overflow-hidden lg:block">

    <ResponsiveHeroMedia
      src="/media/home/hero-home.jpg"
      alt="Dingsheng Energy international energy infrastructure, equipment, engineering and logistics"
      priority
      position="center"
    />

    {/* Overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-[#061e2b]/92 via-[#061e2b]/55 to-[#061e2b]/5" />

    {/* Content */}
    <div className="container-shell absolute inset-0 z-10 flex items-center">

      <div className="max-w-[770px] pb-32">

        <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.18em] text-[#4dd8a1]">
          <span className="h-[2px] w-8 bg-[#4dd8a1]" />

          Global Energy Trading, Engineering
          & Complete Project Solutions
        </div>

        <h1 className="mt-5 text-[48px] font-black uppercase leading-[.98] tracking-[-.045em] sm:text-[60px] lg:text-[72px]">
          Complete Energy
          <br />
          Solutions
        </h1>

        <p className="mt-7 max-w-[650px] text-[17px] leading-8 text-white/76">
          Reliable energy trading,
          engineering, equipment supply
          and end-to-end project support
          for international, industrial
          and infrastructure markets.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">

          <Link
            href="/products"
            className="btn btn-primary"
          >
            Explore Products →
          </Link>

          <Link
            href="/services"
            className="btn border border-white/35 text-white"
          >
            Our Services
          </Link>

        </div>

      </div>

    </div>


    {/* Feature strip */}
    <div className="absolute bottom-0 left-0 right-0 z-20">

      <div className="container-shell">

        <div className="grid overflow-hidden border border-white/10 bg-[#071f2c]/92 backdrop-blur-md md:grid-cols-4">

          {[
            [
              "shield",
              "Safety First",
              "International standards and careful engineering",
            ],
            [
              "globe",
              "Global Supply",
              "Trading and logistics across international markets",
            ],
            [
              "gear",
              "Engineering",
              "End-to-end energy project capability",
            ],
            [
              "handshake",
              "Trusted Partner",
              "Long-term technical and commercial relationships",
            ],
          ].map(([icon, title, copy]) => (

            <div
              key={title}
              className="flex min-h-[108px] items-start gap-4 border-white/10 px-6 py-6 md:border-r last:border-r-0"
            >

              <Icon
                name={icon as any}
                className="h-7 w-7 shrink-0 text-[#49d89e]"
              />

              <div>

                <strong className="text-sm">
                  {title}
                </strong>

                <span className="mt-1 block text-xs leading-5 text-white/52">
                  {copy}
                </span>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  </div>


  {/* =====================================================
      MOBILE + TABLET
  ===================================================== */}
  <div className="lg:hidden">

    {/* FULL IMAGE */}
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#061e2b]">

      <ResponsiveHeroMedia
        src="/media/home/hero-home.jpg"
        alt="Dingsheng Energy international energy infrastructure, equipment, engineering and logistics"
        priority
        position="center"
      />

    </div>


    {/* MOBILE CONTENT */}
    <div className="container-shell py-10">

      <div className="flex items-start gap-3 text-[10px] font-black uppercase leading-5 tracking-[.14em] text-[#4dd8a1]">

        <span className="mt-2 h-[2px] w-6 shrink-0 bg-[#4dd8a1]" />

        <span>
          Global Energy Trading, Engineering
          & Complete Project Solutions
        </span>

      </div>

      <h1 className="mt-5 text-[40px] font-black uppercase leading-[.98] tracking-[-.04em] sm:text-[52px]">
        Complete Energy
        <br />
        Solutions
      </h1>

      <p className="mt-6 max-w-xl text-[15px] leading-7 text-white/70">
        Reliable energy trading,
        engineering, equipment supply
        and end-to-end project support
        for international, industrial
        and infrastructure markets.
      </p>

      <div className="mt-7 flex flex-wrap gap-3">

        <Link
          href="/products"
          className="btn btn-primary"
        >
          Explore Products →
        </Link>

        <Link
          href="/services"
          className="btn border border-white/35 text-white"
        >
          Our Services
        </Link>

      </div>

    </div>


    {/* MOBILE FEATURE CARDS */}
    <div className="container-shell pb-8">

      <div className="grid overflow-hidden border border-white/10 bg-[#071f2c] sm:grid-cols-2">

        {[
          [
            "shield",
            "Safety First",
            "International standards and careful engineering",
          ],
          [
            "globe",
            "Global Supply",
            "Trading and logistics across international markets",
          ],
          [
            "gear",
            "Engineering",
            "End-to-end energy project capability",
          ],
          [
            "handshake",
            "Trusted Partner",
            "Long-term technical and commercial relationships",
          ],
        ].map(([icon, title, copy]) => (

          <div
            key={title}
            className="flex gap-4 border-b border-white/10 p-5"
          >

            <Icon
              name={icon as any}
              className="h-6 w-6 shrink-0 text-[#49d89e]"
            />

            <div>

              <strong className="text-sm">
                {title}
              </strong>

              <span className="mt-1 block text-xs leading-5 text-white/50">
                {copy}
              </span>

            </div>

          </div>

        ))}

      </div>

    </div>

  </div>

</section>

      {/* =====================================
          CORE SOLUTIONS
      ===================================== */}

      <section className="section bg-white">
        <div className="container-shell">
          <div className="mx-auto max-w-3xl text-center">
            <div className="eyebrow">
              Our Core Solutions
            </div>

            <h2 className="h2 mt-3">
              Integrated Solutions Across the
              Energy Value Chain
            </h2>

            <p className="mt-4 text-sm leading-7 text-[#687b84]">
              From international trading and
              logistics to engineering,
              equipment supply and after-sales
              support, Dingsheng Energy provides
              coordinated solutions from project
              planning through operation.
            </p>
          </div>

          <div className="grid-4 mt-10 items-stretch">
            {coreSolutions.map(
              (
                [
                  icon,
                  title,
                  copy,
                  href,
                ],
                index,
              ) => (
                <Link
                  href={href}
                  key={title}
                  className="card card-hover flex h-full min-h-[300px] flex-col p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f6ef] text-[#0a9c63]">
                      <Icon
                        name={icon as any}
                        className="h-6 w-6"
                      />
                    </div>

                    <span className="text-4xl font-black text-[#0a9c63]/10">
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </span>
                  </div>

                  <h3 className="h3 mt-5">
                    {title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[#647983]">
                    {copy}
                  </p>

                  <div className="mt-auto pt-6 text-xs font-extrabold text-[#0a9c63]">
                    Learn more →
                  </div>
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      {/* =====================================
          ADMIN-MANAGED PRODUCT CATEGORIES
      ===================================== */}

      <section className="section dark-section">
        <div className="container-shell">
          <div className="mx-auto max-w-3xl text-center">
            <div className="eyebrow !text-[#55dea8]">
              Product Solutions
            </div>

            <h2 className="h2 mt-3">
              Equipment & Systems for Modern
              Energy Applications
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/60">
              Explore our active product
              categories covering equipment,
              systems and components for
              industrial and infrastructure
              energy projects.
            </p>
          </div>

          {rootCategories.length > 0 ? (
            <div className="grid-4 mt-10">
              {rootCategories.map(
                (
                  category,
                  index,
                ) => {
                  const categoryImage =
                    category.image?.trim() ||
                    category.heroImage?.trim() ||
                    null;

                  return (
                    <Link
                      key={category.id}
                      href={buildCategoryHref(
                        categories,
                        category.id,
                      )}
                      className="group overflow-hidden rounded-xl bg-white text-[#0c2230]"
                    >
                      <div className="relative h-48 overflow-hidden bg-[#dfe8e4]">
                        {categoryImage ? (
                          <Image
                            src={
                              categoryImage
                            }
                            alt={
                              category.name
                            }
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                            className="object-cover object-center transition duration-500 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#e8f0ec] to-[#cfded7] px-6 text-center">
                            <span className="text-[10px] font-black uppercase tracking-[.12em] text-[#71877d]">
                              Image managed from
                              Admin
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-[#071f2c]/80 via-transparent to-transparent" />

                        <div className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-[#0a9c63] text-xs font-black text-white">
                          {String(
                            index + 1,
                          ).padStart(
                            2,
                            "0",
                          )}
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-black uppercase leading-tight">
                          {category.name}
                        </h3>

                        {category.summary && (
                          <p className="mt-3 text-sm leading-6 text-[#647983]">
                            {
                              category.summary
                            }
                          </p>
                        )}

                        <div className="mt-5 text-xs font-extrabold text-[#0a9c63]">
                          Explore products →
                        </div>
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          ) : (
            <div className="mt-10 rounded-xl border border-white/10 bg-white/[.04] p-10 text-center text-sm text-white/60">
              Product categories will appear
              here when they are enabled from
              the admin panel.
            </div>
          )}
        </div>
      </section>

      {/* =====================================
          ADMIN-MANAGED SERVICES
      ===================================== */}

      <section className="section bg-white">
        <div className="container-shell grid-2 items-center">
          <div>
            <div className="eyebrow">
              Engineering & Technical Services
            </div>

            <h2 className="h2 mt-3">
              From Concept to Commissioning
            </h2>

            <p className="lead mt-5">
              Dingsheng Energy provides
              engineering, procurement,
              installation, testing,
              commissioning, infrastructure
              integration, maintenance and
              technical support for energy
              projects.
            </p>

            {rootServices.length > 0 ? (
              <div className="mt-7 grid gap-3">
                {rootServices
                  .slice(0, 5)
                  .map(
                    (
                      service,
                      index,
                    ) => (
                      <Link
                        key={service.id}
                        href={buildServiceHref(
                          services,
                          service.id,
                        )}
                        className="flex items-center justify-between border-b border-[#dce7e2] py-3 font-bold"
                      >
                        <span>
                          <span className="mr-4 text-[#0a9c63]">
                            {String(
                              index + 1,
                            ).padStart(
                              2,
                              "0",
                            )}
                          </span>

                          {service.name}
                        </span>

                        <span>→</span>
                      </Link>
                    ),
                  )}
              </div>
            ) : (
              <div className="mt-7 rounded-lg border border-dashed border-[#dce7e2] bg-[#f8fbfa] p-5 text-sm text-[#687b84]">
                Active services will appear
                here when configured in the
                admin panel.
              </div>
            )}

            <Link
              href="/services"
              className="btn btn-secondary mt-7"
            >
              View All Services →
            </Link>
          </div>

          <div className="relative min-h-[470px] overflow-hidden rounded-2xl bg-[#071f2c] shadow-xl">
            {highlightedServiceImage ? (
              <Image
                src={
                  highlightedServiceImage
                }
                alt={
                  highlightedService?.name ||
                  "Dingsheng Energy engineering and technical services"
                }
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#0b3342] via-[#082936] to-[#061e2b]" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#071f2c]/88 via-[#071f2c]/12 to-transparent" />

            <div className="absolute bottom-7 left-7 right-7 text-white">
              <div className="eyebrow !text-[#69dfb0]">
                {highlightedService
                  ? "Featured Service"
                  : "Engineering Delivery"}
              </div>

              <p className="mt-2 text-2xl font-black">
                {highlightedService?.name ||
                  "Engineering · Procurement · Installation · Commissioning"}
              </p>

              {highlightedService?.summary && (
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                  {
                    highlightedService.summary
                  }
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          ENERGY TRADING & LOGISTICS
      ===================================== */}

      <section className="section dark-section">
        <div className="container-shell grid-2 items-center">
          <div className="relative min-h-[430px] overflow-hidden rounded-2xl bg-[#061e2b] shadow-xl">
            <Image
              src="/media/home/trading-logistics.jpg"
              alt="International energy shipping, logistics and distribution"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
          </div>

          <div>
            <div className="eyebrow !text-[#5bdca8]">
              Energy Trading & Logistics
            </div>

            <h2 className="h2 mt-3">
              Coordinated from Sourcing to
              Delivery
            </h2>

            <p className="mt-5 text-lg leading-8 text-white/68">
              International energy sourcing,
              import/export coordination,
              shipping support, port operations,
              loading, unloading and distribution
              for project and commercial
              requirements.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {[
                "Sourcing",
                "Shipping Coordination",
                "Port Coordination",
                "Loading",
                "Unloading",
                "Final Delivery",
              ].map((item) => (
                <span
                  className="pill !border-white/15 !bg-white/5 !text-white/75"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>

            <Link
              href="/energy-trading"
              className="btn btn-primary mt-8"
            >
              Explore Trading & Logistics →
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================
          CORE VALUES / SUPPLIERS
      ===================================== */}

      <section className="section soft-section">
        <div className="container-shell">
          <div className="mx-auto max-w-3xl text-center">
            <div className="eyebrow">
              Our Core Values
            </div>

            <h2 className="h2 mt-3">
              Built on Safety, Reliability and
              Partnership
            </h2>
          </div>

          <div className="grid-3 mt-9">
            {coreValues.map(
              ([title, copy]) => (
                <div
                  className="card p-6"
                  key={title}
                >
                  <h3 className="text-lg font-extrabold">
                    {title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#657983]">
                    {copy}
                  </p>
                </div>
              ),
            )}
          </div>

          <div className="mt-12 text-center">
            <div className="eyebrow">
              Our Trusted Suppliers
            </div>

            <div className="mt-7 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-extrabold text-[#52666f]">
              {suppliers.map(
                (supplier) => (
                  <span key={supplier}>
                    {supplier}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          FINAL CTA
      ===================================== */}

      <section className="section-sm bg-white">
        <div className="container-shell">
          <Callout
            title="Planning an Energy Project?"
            copy="Talk with Dingsheng Energy about equipment, engineering, EPC, trading, logistics or complete project requirements."
          />
        </div>
      </section>
    </PublicShell>
  );
}