import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  getPublicProductDocuments,
} from "@/lib/databaseProductDocuments";

import {
  prisma,
} from "@/lib/prisma";

import {
  PublicShell,
} from "@/components/PublicShell";

import {
  ProductGallery,
} from "@/components/ProductGallery";

import {
  ProductCard,
} from "@/components/ProductCard";

import {
  Callout,
} from "@/components/Callout";

import {
  Icon,
} from "@/components/Icon";

import type {
  Product,
} from "@/data/site";

import {
  getProduct,
  getRelatedProducts,
} from "@/lib/catalog";

import {
  getBreadcrumbs,
} from "@/lib/categoryTree";

import {
  buildCategoryHref,
  getPublicProductCategories,
} from "@/lib/publicProductTree";

import {
  SERVICE_RICH_TEXT_PREFIX,
  serviceRichTextParagraphs,
  storedServiceTextToDocument,
  storedServiceTextToPlainLines,
  type ServiceRichTextNode,
} from "@/lib/serviceRichText";

function productDescriptionValues(
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

  if (
    cleaned.startsWith(
      SERVICE_RICH_TEXT_PREFIX,
    )
  ) {
    return [
      cleaned,
    ];
  }

  return cleaned
    .split(
      /\r?\n+/,
    )
    .map(
      (item) =>
        item.trim(),
    )
    .filter(
      Boolean,
    );
}

function productTextClass(
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

function renderProductInline(
  content:
    | ServiceRichTextNode[]
    | undefined,

  keyPrefix:
    string,
) {
  return (
    content ??
    []
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
            key={
              key
            }
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
          key={
            key
          }
          className={
            productTextClass(
              node,
            )
          }
        >
          {
            node.text
          }
        </span>
      );
    },
  );
}

export const dynamic =
  "force-dynamic";

type Props = {
  params: Promise<{
    category: string;
    product: string;
  }>;
};

function commercialLabel(
  product: Product,
) {
  switch (
    product.commercialMode
  ) {
    case "rfq":
      return "Quotation Required";

    case "dealer-purchase":
      return "Dealer Purchase";

    case "dealer-purchase-rfq":
      return "Dealer Purchase / RFQ";

    default:
      return "Technical Information";
  }
}

export async function generateMetadata({
  params,
}: Props) {
  const {
    category:
      rawCategorySlug,

    product:
      rawProductSlug,
  } = await params;

  let categorySlug: string;
  let productSlug: string;

  try {
    categorySlug =
      decodeURIComponent(
        rawCategorySlug,
      );

    productSlug =
      decodeURIComponent(
        rawProductSlug,
      );
  } catch {
    return {
      title:
        "Product | Dingsheng Energy Limited",
    };
  }

  const [
    product,
    categories,
  ] = await Promise.all([
    getProduct(
      productSlug,
    ),

    getPublicProductCategories(),
  ]);

  const category =
    categories.find(
      (item) =>
        item.slug ===
        categorySlug,
    );

  if (
    !product ||
    product.active === false ||
    !category ||
    !product.categorySlugs.includes(
      categorySlug,
    )
  ) {
    return {
      title:
        "Product | Dingsheng Energy Limited",
    };
  }

  return {
    title:
      `${product.name} | Dingsheng Energy Limited`,

    description:
      product.summary,
  };
}

export default async function ProductDetail({
  params,
}: Props) {
  const {
    category:
      rawCategorySlug,

    product:
      rawProductSlug,
  } = await params;

  let categorySlug: string;
  let productSlug: string;

  try {
    categorySlug =
      decodeURIComponent(
        rawCategorySlug,
      );

    productSlug =
      decodeURIComponent(
        rawProductSlug,
      );
  } catch {
    notFound();
  }

    const [
      product,
      categories,
      sectionVisibility,
    ] = await Promise.all([
      getProduct(
        productSlug,
      ),

      getPublicProductCategories(),

      prisma.product.findUnique({
        where: {
          slug:
            productSlug,
        },

        select: {
          showApplications:
            true,

          showStandards:
            true,
        },
      }),
    ]);

  if (
    !product ||
    product.active === false ||
    !product.categorySlugs.includes(
      categorySlug,
    )
  ) {
    notFound();
  }

  /*
   * Resolve the product's actual
   * public category from the new
   * recursive Neon category tree.
   */
  const category =
    categories.find(
      (item) =>
        item.slug ===
        categorySlug,
    );

  if (!category) {
    notFound();
  }

  const [
    relatedAll,
    productDocuments,
  ] =
    await Promise.all([
      getRelatedProducts(
        product,
      ),

      getPublicProductDocuments(
        product.slug,
      ),
    ]);

  const related =
    relatedAll
      .filter(
        (item) =>
          item.active !==
          false,
      )
      .slice(
        0,
        4,
      );

  /*
   * Build the complete category
   * ancestry:
   *
   * LPG
   * > Filling Plant
   * > Storage Tank
   * > ...
   */
  const categoryBreadcrumbs =
    getBreadcrumbs(
      categories,
      category.id,
    );

  const categoryHref =
    buildCategoryHref(
      categories,
      category.id,
    );

  const descriptionValues =
    productDescriptionValues(
      product.description,
    );

  const descriptionDocument =
    storedServiceTextToDocument(
      descriptionValues,
    );

  const descriptionParagraphs =
    serviceRichTextParagraphs(
      descriptionDocument,
    );

  const descriptionPlainText =
    storedServiceTextToPlainLines(
      descriptionValues,
    )
      .join(" ")
      .replace(
        /\s+/g,
        " ",
      )
      .trim();

  const summaryPlainText =
    (
      product.summary ??
      ""
    )
      .replace(
        /\s+/g,
        " ",
      )
      .trim();

  const showDescription =
    descriptionParagraphs.length >
      0 &&
    descriptionPlainText !==
      summaryPlainText;

  return (
    <PublicShell>
      {/* Breadcrumb */}
      <div className="border-b border-[#e3ebe7] bg-white">
        <div className="container-shell flex min-h-[58px] flex-wrap items-center gap-2 text-xs font-semibold text-[#7b8d94]">
          <Link
            href="/"
            className="transition hover:text-[#0a9c63]"
          >
            Home
          </Link>

          <span>›</span>

          <Link
            href="/products"
            className="transition hover:text-[#0a9c63]"
          >
            Products
          </Link>

          {categoryBreadcrumbs.map(
            (
              breadcrumb,
            ) => (
              <div
                key={
                  breadcrumb.id
                }
                className="contents"
              >
                <span>
                  ›
                </span>

                <Link
                  href={buildCategoryHref(
                    categories,
                    breadcrumb.id,
                  )}
                  className="transition hover:text-[#0a9c63]"
                >
                  {
                    breadcrumb.name
                  }
                </Link>
              </div>
            ),
          )}

          <span>›</span>

          <span className="text-[#18313d]">
            {product.name}
          </span>
        </div>
      </div>

      {/* Product hero */}
      <section className="bg-white py-14 lg:py-18">
        <div className="container-shell grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
          <ProductGallery
            product={product}
          />

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[.15em] text-[#0a9c63]">
                {product.eyebrow ||
                  product.categoryGroups?.[
                    category.slug
                  ] ||
                  product.subcategory ||
                  category.shortName ||
                  category.name}
              </span>

              <span className="h-1 w-1 rounded-full bg-[#c3d0cb]" />

              <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#899990]">
                {
                  category.name
                }
              </span>
            </div>

            <h1 className="mt-4 text-[38px] font-black leading-[1.08] tracking-[-.04em] text-[#0b2230] md:text-[48px]">
              {product.name}
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-8 text-[#687c85]">
              {product.summary}
            </p>

            {showDescription && (
              <div className="mt-3 max-w-xl space-y-3 text-[#7a8c94]">
                {descriptionParagraphs.map(
                  (
                    paragraph,
                    index,
                  ) => (
                    <p
                      key={`product-description-${index}`}
                      className="leading-7"
                    >
                      {renderProductInline(
                        paragraph.content,
                        `product-description-${index}`,
                      )}
                    </p>
                  ),
                )}
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#d7e6df] bg-[#eff8f3] px-3 py-1.5 text-[9px] font-black uppercase tracking-[.1em] text-[#197456]">
                {commercialLabel(
                  product,
                )}
              </span>

              {product.availability && (
                <span className="rounded-full border border-[#dfe7e3] bg-[#f7f9f8] px-3 py-1.5 text-[9px] font-black uppercase tracking-[.1em] text-[#63776f]">
                  {
                    product.availability
                  }
                </span>
              )}
            </div>

            {/* Technical Specifications */}
            <div
              id="specifications"
              className="mt-8 scroll-mt-28 overflow-hidden rounded-xl border border-[#dfe8e4] bg-white"
            >
              <div className="flex items-end justify-between gap-4 border-b border-[#e5ece8] bg-[#fafcfb] px-5 py-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[.12em] text-[#0a9c63]">
                    Technical Data
                  </div>

                  <h2 className="mt-1 text-lg font-black text-[#17313d]">
                    Technical Specifications
                  </h2>
                </div>
              </div>

              {product.specs.length ? (
                <div>
                  {product.specs.map(
                    (
                      [
                        label,
                        value,
                      ],
                      i,
                    ) => (
                      <div
                        key={`${label}-${value}`}
                        className={`grid gap-2 px-5 py-3.5 sm:grid-cols-[.42fr_.58fr] ${
                          i !==
                          product.specs
                            .length -
                            1
                            ? "border-b border-[#e5ece8]"
                            : ""
                        } ${
                          i % 2 ===
                          0
                            ? "bg-white"
                            : "bg-[#fafcfb]"
                        }`}
                      >
                        <div className="text-[11px] font-black text-[#536b75]">
                          {
                            label
                          }
                        </div>

                        <div className="text-[12px] font-semibold leading-6 text-[#1e3741]">
                          {
                            value
                          }
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="p-5 text-xs leading-6 text-[#71858d]">
                  Detailed specifications
                  have not yet been supplied
                  in the client technical
                  material. Contact Dingsheng
                  Energy for product-specific
                  information.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Technical information */}
      <section className="bg-[#f5f8f6] py-20">
        <div className="container-shell">
          {/* Product support information */}
          <aside className="grid gap-6 md:grid-cols-2">
            {/* Applications */}
            {/* Applications */}
{sectionVisibility
  ?.showApplications ===
  true && (
  <div className="rounded-xl border border-[#dfe8e4] bg-white p-6">
    <Icon
      name="factory"
      className="h-7 w-7 text-[#0a9c63]"
    />

    <div className="eyebrow mt-5">
      Applications
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {(product.applications
        ?.length
        ? product.applications
        : [
            category.name,
          ]
      ).map(
        (item) => (
          <span
            key={
              item
            }
            className="pill"
          >
            {
              item
            }
          </span>
        ),
      )}
    </div>
  </div>
)}
            {/* Standards */}
            {/* Standards */}
{sectionVisibility
  ?.showStandards ===
  true && (
  <div className="rounded-xl border border-[#dfe8e4] bg-white p-6">
    <Icon
      name="shield"
      className="h-7 w-7 text-[#0a9c63]"
    />

    <div className="eyebrow mt-5">
      Standards / References
    </div>

    <p className="mt-3 text-[11px] leading-6 text-[#71838b]">
      Displayed standards are
      product-specific references
      from supplied technical
      material, not company-wide
      certifications.
    </p>

    <div className="mt-4 grid gap-2">
      {product.standards
        ?.length ? (
        product.standards.map(
          (
            standard,
          ) => (
            <div
              key={
                standard
              }
              className="flex items-center gap-3 border border-[#dfe8e4] bg-[#f8fbf9] px-4 py-3 text-[11px] font-black"
            >
              <Icon
                name="check"
                className="h-4 w-4 text-[#0a9c63]"
              />

              {
                standard
              }
            </div>
          ),
        )
      ) : (
        <div className="border border-[#e1e8e4] bg-[#fafcfb] p-4 text-[11px] text-[#75878f]">
          Product-specific standard
          information has not yet
          been provided.
        </div>
      )}
    </div>
  </div>
)}

            {/* Downloads */}
            <div className="rounded-xl border border-[#dfe8e4] bg-white p-6">
              <Icon
                name="download"
                className="h-7 w-7 text-[#0a9c63]"
              />

              <div className="eyebrow mt-5">
                Product Downloads
              </div>

              {productDocuments.length ? (
                <div className="mt-4 grid gap-2">
                  {productDocuments.map(
                    (
                      document,
                      index,
                    ) => (
                      <a
                        key={
                          document.id
                        }
                        href={`/api/products/${encodeURIComponent(
                          product.slug,
                        )}/documents/${encodeURIComponent(
                          document.id,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-lg border border-[#dfe8e4] px-4 py-3 text-sm font-bold text-[#173a48] transition hover:border-[#0a9c63] hover:text-[#0a9c63]"
                      >
                        <span>
                          {document.title ||
                            document.originalFileName ||
                            `Public document ${index + 1}`}
                        </span>

                        <span
                          aria-hidden="true"
                        >
                          ↗
                        </span>
                      </a>
                    ),
                  )}
                </div>
              ) : (
                <div className="mt-4 border border-[#dfe8e4] bg-[#fafcfb] p-4 text-[11px] leading-6 text-[#71838b]">
                  Public product documents
                  have not yet been added.
                </div>
              )}

              <div className="mt-3 border border-[#eadfbd] bg-[#fff9e9] p-4">
                <div className="flex items-center gap-2 text-[11px] font-black text-[#9a6900]">
                  <Icon
                    name="lock"
                    className="h-4 w-4"
                  />

                  Dealer Resources
                </div>

                <p className="mt-2 text-[10px] leading-5 text-[#81765d]">
                  Protected commercial
                  documents require an
                  approved dealer account.
                </p>
              </div>
            </div>

            {/* Technical Assistance */}
            <div className="rounded-xl bg-[#071f2c] p-6 text-white">
              <Icon
                name="handshake"
                className="h-8 w-8 text-[#4fdba4]"
              />

              <h3 className="mt-5 text-lg font-black">
                Need Technical Assistance?
              </h3>

              <p className="mt-3 text-[11px] leading-6 text-white/60">
                Contact Dingsheng Energy
                with operating conditions,
                project scope or equipment
                requirements.
              </p>

              <Link
                href="/contact"
                className="group mt-5 flex min-h-11 items-center justify-between rounded-md bg-[#0a9c63] px-4 text-[10px] font-black uppercase tracking-[.05em] text-white transition hover:bg-[#0b8756]"
              >
                <span>
                  Contact Technical Team
                </span>

                <Icon
                  name="arrow"
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Commercial access */}
      <section className="border-y border-[#e4ece8] bg-white py-16 lg:py-20">
        <div className="container-shell">
          <div className="mb-8 max-w-3xl">
            <div className="eyebrow">
              Commercial Support
            </div>

            <h2 className="h2 mt-3">
              Pricing, Dealer Access &
              Project Enquiries
            </h2>

            <p className="mt-4 text-sm leading-7 text-[#687c85]">
              Access protected dealer
              pricing or contact Dingsheng
              Energy for quotation,
              availability, delivery and
              project-specific support.
            </p>
          </div>

          <div
            className={`grid gap-6 ${
              product.dealerPriceProtected
                ? "lg:grid-cols-2"
                : "lg:grid-cols-1"
            }`}
          >
            {/* Dealer pricing */}
            {product.dealerPriceProtected && (
              <div className="overflow-hidden rounded-xl border border-[#e8d8aa] bg-[#fffaf0]">
                <div className="border-b border-[#eadfbd] bg-[#fff5d9] px-6 py-4">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[.08em] text-[#a66f00]">
                    <Icon
                      name="lock"
                      className="h-4 w-4"
                    />

                    Dealer Commercial
                    Access
                  </div>
                </div>

                <div className="p-6">
                  <div className="text-[11px] font-bold uppercase tracking-[.1em] text-[#8b8064]">
                    Dealer Price
                  </div>

                  <div className="mt-2 text-2xl font-black text-[#17313d]">
                    Login to View Pricing
                  </div>

                  <p className="mt-3 max-w-xl text-[12px] leading-6 text-[#776e58]">
                    Commercial pricing and
                    applicable dealer
                    information are available
                    only to approved dealer
                    accounts.
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Link
                      href="/dealer/login"
                      className="flex min-h-12 items-center justify-center rounded-md bg-[#0a9c63] px-5 text-[10px] font-black uppercase tracking-[.05em] text-white transition hover:bg-[#087e50]"
                    >
                      Dealer Login →
                    </Link>

                    <Link
                      href="/dealer/apply"
                      className="flex min-h-12 items-center justify-center rounded-md border border-[#0a9c63] bg-white px-5 text-[10px] font-black uppercase tracking-[.05em] text-[#0a9c63] transition hover:bg-[#edf8f3]"
                    >
                      Apply for Access
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Commercial contact */}
            <div className="rounded-xl bg-[#071f2c] p-6 text-white lg:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0a9c63]/15">
                  <Icon
                    name="handshake"
                    className="h-5 w-5 text-[#59dfa8]"
                  />
                </span>

                <div className="text-[10px] font-black uppercase tracking-[.13em] text-[#59dfa8]">
                  Commercial Requirement
                </div>
              </div>

              <h3 className="mt-5 text-2xl font-black leading-tight">
                {commercialLabel(
                  product,
                )}
              </h3>

              <p className="mt-3 max-w-xl text-[12px] leading-6 text-white/65">
                Share quantity, delivery
                destination, operating
                conditions and project
                requirements with our
                commercial team for a formal
                quotation and technical
                review.
              </p>

              <Link
                href="/contact#rfq"
                className="group mt-6 flex min-h-12 w-full items-center justify-between rounded-md bg-[#0a9c63] px-5 text-[10px] font-black uppercase tracking-[.06em] text-white transition hover:bg-[#0b8756] sm:w-auto sm:min-w-[260px]"
              >
                <span>
                  Contact Commercial Team
                </span>

                <Icon
                  name="arrow"
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related products */}
      {related.length >
        0 && (
        <section className="section bg-white">
          <div className="container-shell">
            <div className="flex items-end justify-between gap-5">
              <div>
                <div className="eyebrow">
                  Related Equipment
                </div>

                <h2 className="h2 mt-3">
                  Related Products
                </h2>
              </div>

              <Link
                href={
                  categoryHref
                }
                className="text-xs font-black uppercase text-[#0a9c63]"
              >
                View{" "}
                {category.shortName ||
                  category.name}{" "}
                →
              </Link>
            </div>

            <div className="grid-4 mt-9">
              {related.map(
                (item) => (
                  <ProductCard
                    key={
                      item.slug
                    }
                    product={
                      item
                    }
                    contextCategorySlug={
                      category.slug
                    }
                  />
                ),
              )}
            </div>
          </div>
        </section>
      )}

      <section className="section-sm soft-section">
        <div className="container-shell">
          <Callout
            title={`Interested in ${product.name}?`}
            copy="Share technical, commercial or project requirements with Dingsheng Energy for product selection and quotation support."
          />
        </div>
      </section>
    </PublicShell>
  );
}