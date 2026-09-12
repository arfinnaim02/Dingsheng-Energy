import Image from "next/image";

import Link from "next/link";

import {
  Callout,
} from "@/components/Callout";

import {
  Icon,
} from "@/components/Icon";

import {
  ProductCard,
} from "@/components/ProductCard";

import {
  PublicShell,
} from "@/components/PublicShell";

import {
  ResponsiveHeroMedia,
} from "@/components/ResponsiveHeroMedia";

import {
  getProducts,
} from "@/lib/catalog";

import {
  buildCategoryHref,
  getPublicCategoryImage,
  getPublicProductCategories,
} from "@/lib/publicProductTree";

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
    getPublicProductCategories(),

    getProducts(),
  ]);

  const rootCategories =
    categories
      .filter(
        (category) =>
          category.parentId ===
          null,
      )
      .sort(
        (a, b) =>
          a.position -
            b.position ||
          a.name.localeCompare(
            b.name,
          ),
      );

  return (
    <PublicShell>
      {/* =======================================
          HERO
      ======================================= */}

      <section className="bg-[#061f2d] text-white">
        {/* DESKTOP */}
        <div className="relative hidden aspect-[16/9] w-full overflow-hidden lg:block">
          <ResponsiveHeroMedia
            src="/media/products/hero-products.jpg"
            alt="Dingsheng Energy LPG equipment and integrated industrial solutions"
            priority
            position="center"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#061f2d]/94 via-[#061f2d]/58 to-[#061f2d]/5" />

          <div className="container-shell absolute inset-0 z-10 flex items-center">
            <div className="max-w-[720px]">
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.17em] text-[#48d49c]">
                <span className="h-[2px] w-8 bg-[#48d49c]" />

                Premium LPG Equipment
              </div>

              <h1 className="mt-4 text-[64px] font-black leading-[1.03] tracking-[-.04em]">
                Our Products
              </h1>

              <p className="mt-6 max-w-[650px] text-base leading-8 text-white/80">
                Integrated energy solutions and equipment for LPG, LNG, petrochemicals, and renewable energy across storage, processing, transportation, distribution, and industrial applications.
We provide reliable, safe, and efficient products and technologies tailored to meet the evolving energy needs of diverse industries.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#categories"
                  className="btn btn-primary"
                >
                  Browse Categories →
                </Link>

                <Link
                  href="/contact#rfq"
                  className="btn border border-white/35 text-white"
                >
                  Request Assistance
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE */}
        <div className="lg:hidden">
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <ResponsiveHeroMedia
              src="/media/products/hero-products.jpg"
              alt="Dingsheng Energy LPG equipment and integrated industrial solutions"
              priority
              position="center"
            />
          </div>

          <div className="container-shell py-10">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[.14em] text-[#48d49c]">
              <span className="h-[2px] w-7 bg-[#48d49c]" />

              Premium LPG Equipment
            </div>

            <h1 className="mt-4 text-[40px] font-black leading-[1.03] tracking-[-.04em]">
              Our Products
            </h1>

            <p className="mt-5 text-[15px] leading-7 text-white/75">
              Integrated LPG equipment and
              components for storage,
              filling, transfer, transport,
              autogas refueling and
              industrial applications.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="#categories"
                className="btn btn-primary"
              >
                Browse Categories →
              </Link>

              <Link
                href="/contact#rfq"
                className="btn border border-white/35 text-white"
              >
                Request Assistance
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =======================================
          BREADCRUMB
      ======================================= */}

      <div className="border-b border-[#e4ebe7] bg-white">
        <div className="container-shell flex min-h-[58px] items-center gap-2 text-xs font-semibold text-[#7a8c94]">
          <Link
            href="/"
            className="hover:text-[#0a9c63]"
          >
            Home
          </Link>

          <span>
            ›
          </span>

          <span className="text-[#18313d]">
            Products
          </span>
        </div>
      </div>

      {/* =======================================
          ROOT PRODUCT CATEGORIES
      ======================================= */}

      <section
        id="categories"
        className="section scroll-mt-20 bg-white"
      >
        <div className="container-shell">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="eyebrow">
                Product Categories
              </div>

              <h2 className="h2 mt-3">
                Explore Our Product Systems
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#687b84]">
                Browse  our comprehensive product portfolio across LPG, LNG, petrochemicals, and renewable energy—from complete systems and solutions to individual equipment, components, and technical products.
              </p>
            </div>

            <Link
              href="/dealer/login"
              className="btn btn-secondary self-start lg:self-auto"
            >
              Dealer Login →
            </Link>
          </div>

          {rootCategories.length >
          0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {rootCategories.map(
                (
                  category,
                  index,
                ) => {
                  const categoryImage =
                    getPublicCategoryImage(
                      category,
                      "card",
                    );

                  const categoryHref =
                    buildCategoryHref(
                      categories,
                      category.id,
                    );

                  return (
                    <Link
                      key={
                        category.id
                      }
                      href={
                        categoryHref
                      }
                      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#dfe8e4] bg-white shadow-[0_8px_28px_rgba(13,42,53,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#0a9c63]/40 hover:shadow-[0_18px_42px_rgba(13,42,53,0.13)]"
                    >
                      {/* Category image */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#edf2ef]">
                        <Image
                          src={
                            categoryImage
                          }
                          alt=""
                          fill
                          aria-hidden="true"
                          sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1279px) 50vw, 25vw"
                          className="scale-110 object-cover object-center opacity-30 blur-md transition-transform duration-700 group-hover:scale-[1.16]"
                        />

                        <div className="absolute inset-0 bg-white/15" />

                        <div className="absolute inset-3 sm:inset-4">
                          <Image
                            src={
                              categoryImage
                            }
                            alt={
                              category.name
                            }
                            fill
                            sizes="(max-width: 639px) calc(100vw - 56px), (max-width: 1279px) 45vw, 22vw"
                            className="object-contain object-center transition-transform duration-500 group-hover:scale-[1.035]"
                          />
                        </div>

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071f2c]/30 via-transparent to-white/10" />

                        <div className="absolute bottom-4 left-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-[#0a9c63] text-xs font-black text-white shadow-md">
                          {String(
                            index +
                              1,
                          ).padStart(
                            2,
                            "0",
                          )}
                        </div>
                      </div>

                      {/* Category information */}
                      <div className="flex flex-1 flex-col p-5 sm:p-6">
                        <h3 className="text-lg font-black leading-tight text-[#17313d] transition-colors group-hover:text-[#0a8b59] sm:text-xl">
                          {
                            category.name
                          }
                        </h3>

                        {category.summary && (
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#697d86]">
                            {
                              category.summary
                            }
                          </p>
                        )}

                        <div className="mt-auto flex items-center justify-between pt-6">
                          <span className="text-xs font-extrabold text-[#0a9c63]">
                            Explore Category
                          </span>

                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edf7f2] text-sm font-black text-[#0a9c63] transition-all group-hover:bg-[#0a9c63] group-hover:text-white">
                            →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          ) : (
            <div className="mt-10 rounded-xl border border-dashed border-[#d7e4df] bg-[#fafcfb] p-10 text-center">
              <h3 className="text-lg font-black text-[#17313d]">
                Product Categories
                Coming Soon
              </h3>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#71838b]">
                Active root product
                categories will appear here
                when configured through the
                admin panel.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =======================================
          PRODUCT CATALOGUE
      ======================================= */}

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
                Explore Equipment
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#687b84]">
                Technical product
                information is public.
                Commercial pricing remains
                protected for approved
                dealers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="pill">
                {products.length}{" "}
                {products.length ===
                1
                  ? "product"
                  : "products"}
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
            {/* Category sidebar */}
            <aside className="self-start rounded-xl border border-[#dfe8e4] bg-white p-5 lg:sticky lg:top-24">
              <div className="text-xs font-black uppercase tracking-[.12em]">
                Browse Categories
              </div>

              <div className="mt-4 grid gap-1">
                {rootCategories.map(
                  (
                    category,
                  ) => (
                    <Link
                      key={
                        category.id
                      }
                      href={buildCategoryHref(
                        categories,
                        category.id,
                      )}
                      className="flex items-center justify-between rounded-md px-3 py-3 text-xs font-bold text-[#536a75] transition hover:bg-[#edf7f2] hover:text-[#0a9c63]"
                    >
                      <span>
                        {category.shortName ||
                          category.name}
                      </span>

                      <span>
                        ›
                      </span>
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
                  Approved dealers can
                  access commercial pricing
                  through the secure portal.
                </p>
              </div>

              <Link
                href="/dealer/apply"
                className="mt-4 flex min-h-10 items-center justify-center border border-[#0a9c63] px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-wide text-[#0a9c63]"
              >
                Apply for Dealer
                Access
              </Link>
            </aside>

            {/* Products */}
            <div className="min-w-0">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#dfe8e4] bg-white px-4 py-3 text-xs text-[#6c7f87]">
                <span>
                  Showing active
                  catalogue products
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-[#fff6db] px-3 py-1 text-[10px] font-black text-[#c58d00]">
                  <Icon
                    name="lock"
                    className="h-3 w-3"
                  />

                  Dealer Protected
                </span>
              </div>

              {products.length >
              0 ? (
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
              ) : (
                <div className="rounded-xl border border-[#dfe8e4] bg-white p-10 text-center">
                  <h3 className="text-xl font-black text-[#17313d]">
                    Catalogue Expansion
                    in Progress
                  </h3>

                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#71838b]">
                    Active products will
                    appear here as they
                    are added through the
                    administration
                    system.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =======================================
          PRODUCT SYSTEM COVERAGE
      ======================================= */}

      {rootCategories.length >
        0 && (
        <section className="section bg-white">
          <div className="container-shell">
            <div className="mx-auto max-w-3xl text-center">
              <div className="eyebrow">
                Product Coverage
              </div>

              <h2 className="h2 mt-3">
                Equipment Across the
                LPG Value Chain
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#687b84]">
                Each product system can
                contain multiple levels of
                specialized equipment
                categories, helping you move
                from complete project
                requirements to specific
                components.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {rootCategories.map(
                (
                  category,
                ) => {
                  const directChildren =
                    categories
                      .filter(
                        (
                          item,
                        ) =>
                          item.parentId ===
                          category.id,
                      )
                      .sort(
                        (
                          a,
                          b,
                        ) =>
                          a.position -
                            b.position ||
                          a.name.localeCompare(
                            b.name,
                          ),
                      );

                  return (
                    <div
                      key={
                        category.id
                      }
                      className="rounded-xl border border-[#dee8e3] p-6 sm:p-7"
                    >
                      <h3 className="text-xl font-black text-[#17313d]">
                        {
                          category.name
                        }
                      </h3>

                      {category.summary && (
                        <p className="mt-3 text-xs leading-6 text-[#687c85]">
                          {
                            category.summary
                          }
                        </p>
                      )}

                      {directChildren.length >
                      0 ? (
                        <div className="mt-5 grid gap-2 sm:grid-cols-2">
                          {directChildren
                            .slice(
                              0,
                              8,
                            )
                            .map(
                              (
                                child,
                              ) => (
                                <Link
                                  key={
                                    child.id
                                  }
                                  href={buildCategoryHref(
                                    categories,
                                    child.id,
                                  )}
                                  className="flex items-center gap-3 border-b border-[#edf1ef] py-2 text-xs font-semibold text-[#526b76] transition hover:text-[#0a9c63]"
                                >
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0a9c63]" />

                                  {
                                    child.name
                                  }
                                </Link>
                              ),
                            )}
                        </div>
                      ) : (
                        <div className="mt-5 rounded-lg bg-[#f7faf8] p-4 text-xs leading-6 text-[#71838b]">
                          Products can be
                          assigned directly
                          to this category.
                        </div>
                      )}

                      <Link
                        href={buildCategoryHref(
                          categories,
                          category.id,
                        )}
                        className="mt-6 inline-flex text-xs font-extrabold uppercase tracking-wide text-[#0a9c63]"
                      >
                        Explore Category →
                      </Link>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </section>
      )}

      {/* =======================================
          CTA
      ======================================= */}

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