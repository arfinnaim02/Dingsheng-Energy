import Image from "next/image";

import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  Callout,
} from "@/components/Callout";

import {
  ResponsiveHeroMedia,
} from "@/components/ResponsiveHeroMedia";

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

import {
  SERVICE_RICH_TEXT_PREFIX,
  serviceRichTextParagraphs,
  storedServiceTextToDocument,
  storedServiceTextToPlainLines,
  type ServiceRichTextNode,
} from "@/lib/serviceRichText";

/* =========================================
   CATEGORY DESCRIPTION HELPERS
========================================= */

function categoryDescriptionValues(
  value:
    | string
    | null
    | undefined,
): string[] {
  const cleaned =
    value?.trim() ?? "";

  if (!cleaned) {
    return [];
  }

  /*
   * New rich-text descriptions are stored
   * as one serialized rich-text value.
   */
  if (
    cleaned.startsWith(
      SERVICE_RICH_TEXT_PREFIX,
    )
  ) {
    return [cleaned];
  }

  /*
   * Existing plain descriptions remain
   * backwards compatible.
   *
   * Multiple existing lines become
   * separate paragraphs.
   */
  return cleaned
    .split(/\r?\n+/)
    .map(
      (item) =>
        item.trim(),
    )
    .filter(Boolean);
}

function categoryTextClass(
  node:
    ServiceRichTextNode,
) {
  const marks =
    node.marks ?? [];

  const isBold =
    marks.some(
      (mark) =>
        mark.type ===
        "bold",
    );

  const isItalic =
    marks.some(
      (mark) =>
        mark.type ===
        "italic",
    );

  const fontSize =
    marks.find(
      (mark) =>
        mark.type ===
        "textStyle",
    )?.attrs?.fontSize;

  const sizeClass =
    fontSize ===
    "13px"
      ? "text-[13px]"
      : fontSize ===
          "18px"
        ? "text-[18px]"
        : "text-[15px]";

  return `${sizeClass} ${
    isBold
      ? "font-bold"
      : "font-normal"
  } ${
    isItalic
      ? "italic"
      : ""
  }`;
}

function renderCategoryInline(
  content:
    | ServiceRichTextNode[]
    | undefined,

  keyPrefix:
    string,
) {
  return (
    content ?? []
  ).map(
    (
      node,
      index,
    ) => {
      const key =
        `${keyPrefix}-${index}`;

      if (
        node.type ===
        "hardBreak"
      ) {
        return (
          <br
            key={key}
          />
        );
      }

      if (
        node.type !==
          "text" ||
        !node.text
      ) {
        return null;
      }

      return (
        <span
          key={key}
          className={
            categoryTextClass(
              node,
            )
          }
        >
          {node.text}
        </span>
      );
    },
  );
}

/* =========================================
   PAGE SETTINGS
========================================= */

export const dynamic =
  "force-dynamic";

type Props = {
  params: Promise<{
    segments: string[];
  }>;
};

/* =========================================
   METADATA
========================================= */

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

  /*
   * IMPORTANT:
   *
   * storedServiceTextToPlainLines()
   * expects string[] directly.
   *
   * Do NOT pass a ServiceRichTextDocument
   * into it.
   */
  const descriptionValues =
    categoryDescriptionValues(
      data.category.description,
    );

  const descriptionText =
    storedServiceTextToPlainLines(
      descriptionValues,
    ).join(" ");

  const description =
    data.category.summary ||
    descriptionText ||
    `Explore ${data.category.name} products and equipment from Dingsheng Energy Limited.`;

  return {
    title:
      `${data.category.name} | Dingsheng Energy Limited`,

    description,
  };
}

/* =========================================
   PAGE
========================================= */

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

  /*
   * Convert the stored category description
   * into the same rich-text document format
   * already used by Services.
   */
  const descriptionValues =
    categoryDescriptionValues(
      category.description,
    );

  const descriptionDocument =
    storedServiceTextToDocument(
      descriptionValues,
    );

  const descriptionParagraphs =
    serviceRichTextParagraphs(
      descriptionDocument,
    );

  return (
    <PublicShell>
      {/* =====================================
          HERO
      ===================================== */}

      <section className="bg-[#061f2d] text-white">
        {/* DESKTOP */}
        <div className="relative hidden aspect-[16/9] w-full overflow-hidden lg:block">
          <ResponsiveHeroMedia
            src={heroImage}
            alt={category.name}
            priority
            position="center"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#061f2d]/94 via-[#061f2d]/60 to-[#061f2d]/5" />

          <div className="container-shell absolute inset-0 z-10 flex items-center">
            <div className="max-w-[760px]">
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.16em] text-[#49d79e]">
                <span className="h-[2px] w-8 bg-[#49d79e]" />

                Product Category
              </div>

              <h1 className="mt-4 text-[58px] font-black leading-[1.03] tracking-[-.04em]">
                {category.name}
              </h1>

              {/* Rich Hero Description */}
              {descriptionParagraphs.length >
              0 ? (
                <div className="mt-6 max-w-[680px] space-y-3 text-white/75">
                  {descriptionParagraphs.map(
                    (
                      paragraph,
                      index,
                    ) => (
                      <p
                        key={`hero-description-${index}`}
                        className="leading-7"
                      >
                        {renderCategoryInline(
                          paragraph.content,
                          `hero-description-${index}`,
                        )}
                      </p>
                    ),
                  )}
                </div>
              ) : (
                category.summary && (
                  <p className="mt-6 max-w-[680px] text-base leading-8 text-white/75">
                    {category.summary}
                  </p>
                )
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
        </div>

        {/* MOBILE */}
        <div className="lg:hidden">
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <ResponsiveHeroMedia
              src={heroImage}
              alt={category.name}
              priority
              position="center"
            />
          </div>

          <div className="container-shell py-10">
            <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#49d79e]">
              Product Category
            </div>

            <h1 className="mt-4 text-[38px] font-black leading-[1.03] tracking-[-.04em]">
              {category.name}
            </h1>

            {/* Rich Hero Description */}
            {descriptionParagraphs.length >
            0 ? (
              <div className="mt-5 space-y-3 text-white/70">
                {descriptionParagraphs.map(
                  (
                    paragraph,
                    index,
                  ) => (
                    <p
                      key={`mobile-description-${index}`}
                      className="leading-7"
                    >
                      {renderCategoryInline(
                        paragraph.content,
                        `mobile-description-${index}`,
                      )}
                    </p>
                  ),
                )}
              </div>
            ) : (
              category.summary && (
                <p className="mt-5 text-[15px] leading-7 text-white/70">
                  {category.summary}
                </p>
              )
            )}

            <div className="mt-7 flex flex-wrap gap-3">
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

      {/* =====================================
          BREADCRUMBS
      ===================================== */}

      <div className="border-b border-[#e3ebe7] bg-white">
        <div className="container-shell flex min-h-[58px] flex-wrap items-center gap-2 text-xs font-semibold text-[#7a8d94]">
          <Link
            href="/"
            className="hover:text-[#0a9c63]"
          >
            Home
          </Link>

          <span>
            ›
          </span>

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
                  <span>
                    ›
                  </span>

                  {last ? (
                    <span className="text-[#18313d]">
                      {breadcrumb.name}
                    </span>
                  ) : (
                    <Link
                      href={buildCategoryHref(
                        categories,
                        breadcrumb.id,
                      )}
                      className="hover:text-[#0a9c63]"
                    >
                      {breadcrumb.name}
                    </Link>
                  )}
                </div>
              );
            },
          )}
        </div>
      </div>

      {/*
       * CATEGORY OVERVIEW REMOVED.
       *
       * The full category description now
       * appears only in the hero.
       */}

      {/* =====================================
          CHILD CATEGORIES
      ===================================== */}

      {children.length >
        0 && (
        <section className="border-y border-[#e4ebe7] bg-[#f5f8f6] py-14">
          <div className="container-shell">
            <div className="max-w-3xl">
              <div className="eyebrow">
                Subcategories
              </div>

              <h2 className="h2 mt-3">
                Explore{" "}
                {category.name}
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
                          {child.summary}
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

      {/* =====================================
          PRODUCTS
      ===================================== */}

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
            </div>
          </div>

          {products.length >
          0 ? (
            <div className="mt-10 grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
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

      {/* =====================================
          CTA
      ===================================== */}

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