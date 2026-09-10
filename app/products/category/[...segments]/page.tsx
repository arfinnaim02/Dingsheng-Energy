import Image from "next/image";

import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  Callout,
} from "@/components/Callout";

import {
  ProductCard,
} from "@/components/ProductCard";

import {
  PublicShell,
} from "@/components/PublicShell";

import {
  buildCategoryHref,
  getPublicCategoryPageData,
} from "@/lib/publicProductTree";

export const dynamic =
  "force-dynamic";

type Props = {
  params: Promise<{
    segments: string[];
  }>;
};

export async function generateMetadata({
  params,
}: Props) {
  const {
    segments,
  } = await params;

  const data =
    await getPublicCategoryPageData(
      segments,
    );

  if (!data) {
    return {
      title:
        "Product Category | Dingsheng Energy Limited",
    };
  }

  const description =
    data.category.description ||
    data.category.summary ||
    `Explore ${data.category.name} products and LPG equipment from Dingsheng Energy Limited.`;

  return {
    title:
      `${data.category.name} | Dingsheng Energy Limited`,

    description,
  };
}

export default async function RecursiveCategoryPage({
  params,
}: Props) {
  const {
    segments,
  } = await params;

  const data =
    await getPublicCategoryPageData(
      segments,
    );

  if (!data) {
    notFound();
  }

  const {
    category,
    categories,
    breadcrumbs,
    children,
    products,
  } = data;

  const heroImage =
    category.heroImage ||
    category.image ||
    "/media/products/hero-products.jpg";

  const cardImage =
    category.image ||
    category.heroImage ||
    "/media/products/hero-products.jpg";

  return (
    <PublicShell>
      <section className="relative min-h-[430px] overflow-hidden bg-[#061f2d]">
        <Image
          src={heroImage}
          alt={category.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#061f2d]/97 via-[#061f2d]/82 to-[#061f2d]/25" />

        <div className="container-shell relative z-10 flex min-h-[430px] items-center py-16">
          <div className="max-w-[760px]">
            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.16em] text-[#49d79e]">
              <span className="h-[2px] w-8 bg-[#49d79e]" />

              Product Category
            </div>

            <h1 className="mt-4 text-[42px] font-black leading-[1.03] tracking-[-.04em] text-white md:text-[58px]">
              {category.name}
            </h1>

            {(category.description ||
              category.summary) && (
              <p className="mt-6 max-w-[680px] text-base leading-8 text-white/75">
                {category.description ||
                  category.summary}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#equipment"
                className="btn btn-primary"
              >
                Explore Equipment →
              </Link>

              <Link
                href="/contact#rfq"
                className="btn border border-white/35 text-white"
              >
                Request a Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="border-b border-[#e3ebe7] bg-white">
        <div className="container-shell flex min-h-[58px] flex-wrap items-center gap-2 text-xs font-semibold text-[#7a8d94]">
          <Link
            href="/"
            className="hover:text-[#0a9c63]"
          >
            Home
          </Link>

          <span>›</span>

          <Link
            href="/products"
            className="hover:text-[#0a9c63]"
          >
            Products
          </Link>

          {breadcrumbs.map(
            (
              breadcrumb,
              index,
            ) => {
              const last =
                index ===
                breadcrumbs.length -
                  1;

              return (
                <div
                  key={
                    breadcrumb.id
                  }
                  className="contents"
                >
                  <span>›</span>

                  {last ? (
                    <span className="text-[#18313d]">
                      {
                        breadcrumb.name
                      }
                    </span>
                  ) : (
                    <Link
                      href={buildCategoryHref(
                        categories,
                        breadcrumb.id,
                      )}
                      className="hover:text-[#0a9c63]"
                    >
                      {
                        breadcrumb.name
                      }
                    </Link>
                  )}
                </div>
              );
            },
          )}
        </div>
      </div>

      {/* Overview */}
      <section className="section bg-white">
        <div className="container-shell grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="eyebrow">
              Category Overview
            </div>

            <h2 className="h2 mt-3">
              {category.name}
            </h2>

            <p className="mt-5 text-[15px] leading-8 text-[#687c85]">
              {category.description ||
                category.summary ||
                "Explore equipment and solutions available within this product category."}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <span className="pill">
                {children.length} child{" "}
                {children.length === 1
                  ? "category"
                  : "categories"}
              </span>

              <span className="pill">
                {products.length}{" "}
                {products.length === 1
                  ? "product"
                  : "products"}
              </span>
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden rounded-xl border border-[#dde8e3]">
            <Image
              src={cardImage}
              alt={category.name}
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover object-center"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#061f2d]/65 to-transparent" />

            <div className="absolute bottom-6 left-6 text-white">
              <div className="eyebrow !text-[#61e1af]">
                Dingsheng Energy
              </div>

              <div className="mt-2 text-xl font-black">
                {category.name}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Child categories */}
      {children.length > 0 && (
        <section className="border-y border-[#e4ebe7] bg-[#f5f8f6] py-14">
          <div className="container-shell">
            <div className="max-w-3xl">
              <div className="eyebrow">
                Subcategories
              </div>

              <h2 className="h2 mt-3">
                Explore {category.name}
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#687b84]">
                Continue through the
                product structure to
                find the most relevant
                equipment group.
              </p>
            </div>

            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {children.map(
                (child) => (
                  <Link
                    key={child.id}
                    href={buildCategoryHref(
                      categories,
                      child.id,
                    )}
                    className="group overflow-hidden rounded-xl border border-[#dfe8e4] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#0a9c63]/40 hover:shadow-xl"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-[#eef3f0]">
                      <Image
                        src={
                          child.image ||
                          child.heroImage ||
                          "/media/products/hero-products.jpg"
                        }
                        alt={
                          child.name
                        }
                        fill
                        sizes="(max-width: 639px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-[#071f2c]/70 via-transparent to-transparent" />
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-black text-[#17313d]">
                        {child.name}
                      </h3>

                      {child.summary && (
                        <p className="mt-2 line-clamp-3 text-xs leading-6 text-[#687c85]">
                          {
                            child.summary
                          }
                        </p>
                      )}

                      <div className="mt-5 text-[10px] font-black uppercase tracking-wide text-[#0a9c63]">
                        Explore Category →
                      </div>
                    </div>
                  </Link>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {/* Products */}
      <section
        id="equipment"
        className="section scroll-mt-24 bg-white"
      >
        <div className="container-shell">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="eyebrow">
                Equipment Catalogue
              </div>

              <h2 className="h2 mt-3">
                {category.name} Products
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#687c84]">
                Products assigned to this
                category and its child
                categories are included
                automatically.
              </p>
            </div>

            <span className="pill">
              {products.length}{" "}
              {products.length === 1
                ? "product"
                : "products"}
            </span>
          </div>

          {products.length > 0 ? (
            <div className="mt-10 grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map(
                (product) => (
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
            <div className="mt-10 rounded-xl border border-[#dfe8e4] bg-[#f8faf9] p-10 text-center">
              <h3 className="text-xl font-black">
                Catalogue Expansion
                in Progress
              </h3>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#687c85]">
                Products will appear
                here as approved
                technical records are
                assigned to this
                category or one of its
                child categories.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="section-sm bg-[#f5f8f6]">
        <div className="container-shell">
          <Callout
            title={`Need Help With ${category.name}?`}
            copy="Share your project, equipment or technical requirements with Dingsheng Energy for product selection and quotation support."
          />
        </div>
      </section>
    </PublicShell>
  );
}