import Image from "next/image";
import Link from "next/link";

import { Callout } from "@/components/Callout";
import { Icon } from "@/components/Icon";
import { ProductCard } from "@/components/ProductCard";
import { PublicShell } from "@/components/PublicShell";
import {
  getCategories,
  getProducts,
} from "@/lib/catalog";

export const metadata = {
  title:
    "Products | Dingsheng Energy Limited",

  description:
    "LPG filling plant, transport and distribution, autogas and industrial LPG equipment from Dingsheng Energy Limited.",
};

export const dynamic =
  "force-dynamic";

export default async function ProductsPage() {
  const [
    categories,
    products,
  ] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  return (
    <PublicShell>
      <section className="relative flex min-h-[470px] overflow-hidden bg-[#061f2d] sm:min-h-[500px] lg:min-h-[540px]">
  <Image
    src="/media/products/hero-products.jpg"
    alt="Dingsheng Energy LPG equipment and integrated industrial solutions"
    fill
    priority
    quality={90}
    sizes="100vw"
    className="object-cover object-[68%_center] sm:object-[64%_center] lg:object-center"
  />

  <div className="absolute inset-0 bg-gradient-to-r from-[#061f2d]/98 via-[#061f2d]/84 to-[#061f2d]/30 sm:from-[#061f2d]/97 sm:via-[#061f2d]/78 sm:to-[#061f2d]/18 lg:via-[#061f2d]/72 lg:to-[#061f2d]/10" />

  <div className="absolute inset-0 bg-gradient-to-t from-[#061f2d]/45 via-transparent to-[#061f2d]/15" />

  <div className="container-shell relative z-10 flex min-h-[470px] items-center py-16 sm:min-h-[500px] sm:py-20 lg:min-h-[540px]">
    <div className="max-w-[720px]">
      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[.14em] text-[#48d49c] sm:text-xs sm:tracking-[.17em]">
        <span className="h-[2px] w-7 shrink-0 bg-[#48d49c] sm:w-8" />

        Premium LPG Equipment
      </div>

      <h1 className="mt-4 max-w-[680px] text-[42px] font-black leading-[1.03] tracking-[-.04em] text-white sm:text-[52px] md:text-[64px]">
        Our Products
      </h1>

      <p className="mt-5 max-w-[650px] text-sm leading-7 text-white/80 sm:mt-6 sm:text-base sm:leading-8">
        Integrated LPG equipment and components for
        storage, filling, transfer, transport,
        autogas refueling and industrial
        applications.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
        <Link
          href="#catalogue"
          className="btn btn-primary justify-center"
        >
          Browse Catalogue →
        </Link>

        <Link
          href="/contact#rfq"
          className="btn justify-center border border-white/35 text-white transition hover:border-white/60 hover:bg-white/10"
        >
          Request Assistance
        </Link>
      </div>
    </div>
  </div>
</section>

      <div className="border-b border-[#e4ebe7] bg-white">
        <div className="container-shell flex min-h-[58px] items-center gap-2 text-xs font-semibold text-[#7a8c94]">
          <Link
            href="/"
            className="hover:text-[#0a9c63]"
          >
            Home
          </Link>

          <span>›</span>

          <span className="text-[#18313d]">
            Products
          </span>
        </div>
      </div>

      <section className="section bg-white">
        <div className="container-shell">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="eyebrow">
                Product Categories
              </div>

              <h2 className="h2 mt-3">
                Four Integrated LPG Product Systems
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#687b84]">
                Browse equipment by application so related
                storage, transfer, safety, instrumentation
                and operating equipment stay organized
                within the same system.
              </p>
            </div>

            <Link
              href="/dealer/login"
              className="btn btn-secondary self-start lg:self-auto"
            >
              Dealer Login →
            </Link>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map(
              (
                category,
                index,
              ) => (
                <Link
                  key={category.slug}
                  href={`/products/${category.slug}`}
                  className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-[#dfe8e4] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#eef3f0]">
                    <Image
                      src={
                        category.image ||
                        "/media/hero-products.jpg"
                      }
                      alt={category.name}
                      fill
                      sizes="
                        (max-width: 639px) calc(100vw - 32px),
                        (max-width: 1279px) 50vw,
                        25vw
                      "
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                    />

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

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h3 className="text-lg font-black uppercase leading-tight sm:text-xl">
                      {category.name}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-[#697d86]">
                      {category.summary}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {category.groups
                        .slice(
                          0,
                          3,
                        )
                        .map(
                          (
                            group,
                          ) => (
                            <span
                              key={
                                group
                              }
                              className="rounded-full bg-[#edf8f2] px-2.5 py-1 text-[10px] font-bold text-[#16805b]"
                            >
                              {
                                group
                              }
                            </span>
                          ),
                        )}
                    </div>

                    <div className="mt-auto pt-6 text-xs font-extrabold text-[#0a9c63]">
                      Explore products →
                    </div>
                  </div>
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      <section
        id="catalogue"
        className="section scroll-mt-20 bg-[#f5f8f6]"
      >
        <div className="container-shell">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="eyebrow">
                Equipment Catalogue
              </div>

              <h2 className="h2 mt-3">
                Explore LPG Equipment
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#687b84]">
                Technical product information is public.
                Commercial pricing remains protected for
                approved dealers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="pill">
                {products.length} products
              </span>

              <Link
                href="/dealer/login"
                className="btn btn-primary"
              >
                View Dealer Pricing →
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-7 lg:grid-cols-[245px_minmax(0,1fr)]">
            <aside className="self-start rounded-xl border border-[#dfe8e4] bg-white p-5 lg:sticky lg:top-24">
              <div className="text-xs font-black uppercase tracking-[.12em]">
                Browse Systems
              </div>

              <div className="mt-4 grid gap-1">
                {categories.map(
                  (
                    category,
                  ) => (
                    <Link
                      key={
                        category.slug
                      }
                      href={`/products/${category.slug}`}
                      className="flex items-center justify-between rounded-md px-3 py-3 text-xs font-bold text-[#536a75] hover:bg-[#edf7f2] hover:text-[#0a9c63]"
                    >
                      <span>
                        {category.shortName ||
                          category.name}
                      </span>

                      <span>›</span>
                    </Link>
                  ),
                )}
              </div>

              <div className="my-5 border-t border-[#e4ebe7]" />

              <div className="rounded-lg bg-[#fff8e7] p-4">
                <div className="flex items-center gap-2 text-xs font-black text-[#9a6900]">
                  <Icon
                    name="lock"
                    className="h-4 w-4"
                  />

                  Dealer Pricing
                </div>

                <p className="mt-2 text-[11px] leading-5 text-[#81765d]">
                  Approved dealers can access commercial
                  pricing through the secure portal.
                </p>
              </div>

              <Link
                href="/dealer/apply"
                className="mt-4 flex min-h-10 items-center justify-center border border-[#0a9c63] px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-wide text-[#0a9c63]"
              >
                Apply for Dealer Access
              </Link>
            </aside>

            <div className="min-w-0">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#dfe8e4] bg-white px-4 py-3 text-xs text-[#6c7f87]">
                <span>
                  Showing active catalogue products
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-[#fff6db] px-3 py-1 text-[10px] font-black text-[#c58d00]">
                  <Icon
                    name="lock"
                    className="h-3 w-3"
                  />

                  Dealer Protected
                </span>
              </div>

              <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map(
                  (
                    product,
                  ) => (
                    <ProductCard
                      key={
                        product.slug
                      }
                      product={
                        product
                      }
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-shell">
          <div className="mx-auto max-w-3xl text-center">
            <div className="eyebrow">
              Complete Product Coverage
            </div>

            <h2 className="h2 mt-3">
              Equipment Across the LPG Value Chain
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {categories.map(
              (
                category,
              ) => (
                <div
                  key={
                    category.slug
                  }
                  className="rounded-xl border border-[#dee8e3] p-6 sm:p-7"
                >
                  <h3 className="text-xl font-black">
                    {category.name}
                  </h3>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {category.groups.map(
                      (
                        group,
                      ) => (
                        <div
                          key={
                            group
                          }
                          className="flex items-center gap-3 border-b border-[#edf1ef] py-2 text-xs font-semibold text-[#526b76]"
                        >
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0a9c63]" />

                          {group}
                        </div>
                      ),
                    )}
                  </div>

                  <Link
                    href={`/products/${category.slug}`}
                    className="mt-6 inline-flex text-xs font-extrabold uppercase tracking-wide text-[#0a9c63]"
                  >
                    Explore category →
                  </Link>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="section-sm bg-[#f5f8f6]">
        <div className="container-shell">
          <Callout
            title="Can't Find the Equipment You Need?"
            copy="Tell our team about your application, technical requirements or LPG project and we can help identify the appropriate solution."
          />
        </div>
      </section>
    </PublicShell>
  );
}