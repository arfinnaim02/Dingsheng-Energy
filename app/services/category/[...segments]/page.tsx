import Image from "next/image";

import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  PublicShell,
} from "@/components/PublicShell";

import {
  Icon,
} from "@/components/Icon";

import {
  ResponsiveHeroMedia,
} from "@/components/ResponsiveHeroMedia";

import {
  Callout,
} from "@/components/Callout";

import {
  buildServiceHref,
  getPublicServiceImage,
  getPublicServicePageData,
} from "@/lib/publicServiceTree";

import {
  SERVICE_RICH_TEXT_PREFIX,
  serviceRichTextParagraphs,
  storedServiceTextToDocument,
  type ServiceRichTextNode,
} from "@/lib/serviceRichText";

function serviceTextClass(
  node:
    ServiceRichTextNode,
) {
  const marks =
    node.marks ??
    [];

  const isBold =
    marks.some(
      (
        mark,
      ) =>
        mark.type ===
        "bold",
    );

  const isItalic =
    marks.some(
      (
        mark,
      ) =>
        mark.type ===
        "italic",
    );

  const fontSize =
    marks.find(
      (
        mark,
      ) =>
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

function renderServiceInline(
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
            serviceTextClass(
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

/*
 * Converts both:
 *
 * 1. existing plain service
 *    descriptions
 *
 * 2. new serialized rich-text
 *    descriptions
 *
 * into the same document structure.
 */
function serviceDescriptionValues(
  value:
    | string
    | null
    | undefined,
): string[] {
  const cleaned =
    value?.trim() ??
    "";

  if (
    !cleaned
  ) {
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
      (
        item,
      ) =>
        item.trim(),
    )
    .filter(
      Boolean,
    );
}

export const dynamic =
  "force-dynamic";

type Props = {
  params: Promise<{
    segments:
      string[];
  }>;
};

export async function generateMetadata({
  params,
}: Props) {
  const {
    segments,
  } =
    await params;

  const data =
    await getPublicServicePageData(
      segments,
    );

  if (
    !data
  ) {
    return {
      title:
        "Service | Dingsheng Energy Limited",
    };
  }

  return {
    title:
      `${data.service.name} | Dingsheng Energy Limited`,

    description:
      data.service.summary ||
      `Explore ${data.service.name} services from Dingsheng Energy Limited.`,
  };
}

export default async function ServiceCategoryPage({
  params,
}: Props) {
  const {
    segments,
  } =
    await params;

  const data =
    await getPublicServicePageData(
      segments,
    );

  if (
    !data
  ) {
    notFound();
  }

  const {
    service,
    services,
    children,
    breadcrumbs,
  } =
    data;

  const heroImage =
    getPublicServiceImage(
      service,
      "hero",
    );

  const detailImage =
    getPublicServiceImage(
      service,
      "card",
    );

  /*
   * Rich-text Description.
   *
   * Existing plain descriptions
   * continue to work automatically.
   */
  const descriptionDocument =
    storedServiceTextToDocument(
      serviceDescriptionValues(
        service.description,
      ),
    );

  const descriptionParagraphs =
    serviceRichTextParagraphs(
      descriptionDocument,
    );

  const scopeParagraphs =
    serviceRichTextParagraphs(
      service.scope,
    );

  const processParagraphs =
    serviceRichTextParagraphs(
      service.process,
    );

  const applicationParagraphs =
    serviceRichTextParagraphs(
      service.applications,
    );

  const siblingServices =
    services
      .filter(
        (
          item,
        ) =>
          item.parentId ===
            service.parentId &&
          item.id !==
            service.id,
      )
      .slice(
        0,
        3,
      );

  return (
    <PublicShell>
      <section className="bg-[#061f2d] text-white">
        {/* DESKTOP */}
        <div className="relative hidden aspect-[16/9] w-full overflow-hidden lg:block">
          {heroImage ? (
            <ResponsiveHeroMedia
              src={
                heroImage
              }
              alt={
                service.name
              }
              priority
              position="center"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#082d3b] to-[#061f2d]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-r from-[#061f2d]/94 via-[#061f2d]/58 to-[#061f2d]/5" />

          <div className="container-shell absolute inset-0 z-10 flex items-center">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.17em] text-[#4ed7a1]">
                <span className="h-[2px] w-8 bg-[#4ed7a1]" />

                Engineering Service
              </div>

              <h1 className="mt-4 text-[58px] font-black leading-[1.03] tracking-[-.04em]">
                {
                  service.name
                }
              </h1>

              {service.summary && (
                <p className="mt-6 max-w-[670px] text-base leading-8 text-white/74">
                  {
                    service.summary
                  }
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#overview"
                  className="btn btn-primary"
                >
                  Explore Service →
                </Link>

                <Link
                  href="/contact#rfq"
                  className="btn border border-white/35 text-white"
                >
                  Discuss This Project
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE */}
        <div className="lg:hidden">
          {heroImage ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <ResponsiveHeroMedia
                src={
                  heroImage
                }
                alt={
                  service.name
                }
                priority
                position="center"
              />
            </div>
          ) : (
            <div className="aspect-[16/9] w-full bg-gradient-to-br from-[#082d3b] to-[#061f2d]" />
          )}

          <div className="container-shell py-10">
            <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#4ed7a1]">
              Engineering Service
            </div>

            <h1 className="mt-4 text-[38px] font-black leading-[1.03] tracking-[-.04em]">
              {
                service.name
              }
            </h1>

            {service.summary && (
              <p className="mt-5 text-[15px] leading-7 text-white/70">
                {
                  service.summary
                }
              </p>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="#overview"
                className="btn btn-primary"
              >
                Explore Service →
              </Link>

              <Link
                href="/contact#rfq"
                className="btn border border-white/35 text-white"
              >
                Discuss This Project
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-[#e3ebe7] bg-white">
        <div className="container-shell flex min-h-[58px] flex-wrap items-center gap-2 py-3 text-xs font-semibold text-[#7b8d94]">
          <Link
            href="/"
          >
            Home
          </Link>

          <span>
            ›
          </span>

          <Link
            href="/services"
          >
            Services
          </Link>

          {breadcrumbs.map(
            (
              item,
              index,
            ) => {
              const isLast =
                index ===
                breadcrumbs.length -
                  1;

              return (
                <span
                  key={
                    item.id
                  }
                  className="flex items-center gap-2"
                >
                  <span>
                    ›
                  </span>

                  {isLast ? (
                    <span className="text-[#18313d]">
                      {
                        item.name
                      }
                    </span>
                  ) : (
                    <Link
                      href={buildServiceHref(
                        services,
                        item.id,
                      )}
                    >
                      {
                        item.name
                      }
                    </Link>
                  )}
                </span>
              );
            },
          )}
        </div>
      </div>

      {/* Child Services */}
      {children.length >
        0 && (
        <section
          id="overview"
          className="section bg-white"
        >
          <div className="container-shell">
            <div className="max-w-3xl">
              <div className="eyebrow">
                Service Coverage
              </div>

              <h2 className="h2 mt-3">
                Explore{" "}
                {
                  service.name
                }
              </h2>

              {descriptionParagraphs.length >
                0 && (
                <div className="mt-4 space-y-3 text-[#687c85]">
                  {descriptionParagraphs.map(
                    (
                      paragraph,
                      index,
                    ) => (
                      <p
                        key={`coverage-description-${index}`}
                        className="leading-8"
                      >
                        {renderServiceInline(
                          paragraph.content,
                          `coverage-description-${index}`,
                        )}
                      </p>
                    ),
                  )}
                </div>
              )}
            </div>

            <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {children.map(
                (
                  child,
                ) => {
                  const childImage =
                    getPublicServiceImage(
                      child,
                      "card",
                    );

                  return (
                    <Link
                      key={
                        child.id
                      }
                      href={buildServiceHref(
                        services,
                        child.id,
                      )}
                      className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#dfe8e4] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="relative h-[200px] overflow-hidden bg-[#e8efeb]">
                        {childImage ? (
                          <Image
                            src={
                              childImage
                            }
                            alt={
                              child.name
                            }
                            fill
                            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                            className="object-cover transition duration-500 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#edf4f0] to-[#dce9e3] px-6 text-center">
                            <span className="text-xs font-black uppercase tracking-[.12em] text-[#82968d]">
                              Image managed from Admin
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-[#071f2c]/75 via-transparent to-transparent" />
                      </div>

                      <div className="flex flex-1 flex-col p-6">
                        <h3 className="text-xl font-black leading-tight">
                          {
                            child.name
                          }
                        </h3>

                        {child.summary && (
                          <p className="mt-3 text-sm leading-6 text-[#657983]">
                            {
                              child.summary
                            }
                          </p>
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
          </div>
        </section>
      )}

      {/* Service Detail */}
      <section
        id={
          children.length
            ? undefined
            : "overview"
        }
        className={`section ${
          children.length
            ? "soft-section"
            : "bg-white"
        }`}
      >
        <div className="container-shell grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <div className="eyebrow">
              Service Overview
            </div>

            {descriptionParagraphs.length >
            0 ? (
              <div className="mt-5 space-y-3 text-[#687c85]">
                {descriptionParagraphs.map(
                  (
                    paragraph,
                    index,
                  ) => (
                    <p
                      key={`description-${index}`}
                      className="leading-8"
                    >
                      {renderServiceInline(
                        paragraph.content,
                        `description-${index}`,
                      )}
                    </p>
                  ),
                )}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-8 text-[#687c85]">
                {service.summary ||
                  `Dingsheng Energy provides ${service.name} technical and engineering support according to project requirements.`}
              </p>
            )}

            {scopeParagraphs.length >
              0 && (
              <div className="mt-8 grid gap-3">
                {scopeParagraphs.map(
                  (
                    paragraph,
                    index,
                  ) => (
                    <div
                      className="flex items-start gap-3 border-b border-[#e1e9e6] py-3"
                      key={`scope-${index}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e9f7f0] text-xs font-black text-[#0a9c63]">
                        {String(
                          index +
                            1,
                        ).padStart(
                          2,
                          "0",
                        )}
                      </span>

                      <p className="pt-1 leading-7 text-[#18313d]">
                        {renderServiceInline(
                          paragraph.content,
                          `scope-${index}`,
                        )}
                      </p>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          <div className="relative min-h-[460px] overflow-hidden rounded-2xl">
            {detailImage ? (
              <Image
                src={
                  detailImage
                }
                alt={
                  service.name
                }
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#e7f0ec] to-[#cfded7]" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#071f2c]/82 to-transparent" />

            <div className="absolute bottom-7 left-7 right-7 text-white">
              <div className="eyebrow !text-[#69dfb0]">
                Project Approach
              </div>

              <h3 className="mt-2 text-2xl font-black">
                Engineering ·
                Procurement ·
                Installation · Testing ·
                Commissioning
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      {processParagraphs.length >
        0 && (
        <section className="section dark-section">
          <div className="container-shell">
            <div className="mx-auto max-w-3xl text-center">
              <div className="eyebrow !text-[#59dfa8]">
                Delivery Process
              </div>

              <h2 className="h2 mt-3">
                A Controlled Path from
                Requirement to Handover
              </h2>
            </div>

            <div className="mt-11 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              {processParagraphs.map(
                (
                  paragraph,
                  index,
                ) => (
                  <div
                    key={`process-${index}`}
                    className="border border-white/10 bg-white/[.04] p-5"
                  >
                    <div className="text-3xl font-black text-[#59dfa8]/35">
                      {String(
                        index +
                          1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </div>

                    <p className="mt-5 leading-6 text-white/90">
                      {renderServiceInline(
                        paragraph.content,
                        `process-${index}`,
                      )}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      )}

  

      {/* Related / sibling services */}
      {siblingServices.length >
        0 && (
        <section className="section bg-white">
          <div className="container-shell">
            <div className="flex items-end justify-between gap-5">
              <div>
                <div className="eyebrow">
                  Related Services
                </div>

                <h2 className="h2 mt-3">
                  Explore More
                  Capabilities
                </h2>
              </div>

              <Link
                href="/services"
                className="text-xs font-black uppercase text-[#0a9c63]"
              >
                All Services →
              </Link>
            </div>

            <div className="mt-9 grid gap-5 md:grid-cols-3">
              {siblingServices.map(
                (
                  item,
                ) => {
                  const itemImage =
                    getPublicServiceImage(
                      item,
                      "card",
                    );

                  return (
                    <Link
                      href={buildServiceHref(
                        services,
                        item.id,
                      )}
                      key={
                        item.id
                      }
                      className="card card-hover overflow-hidden"
                    >
                      <div className="relative h-40 overflow-hidden bg-[#e8efeb]">
                        {itemImage ? (
                          <Image
                            src={
                              itemImage
                            }
                            alt={
                              item.name
                            }
                            fill
                            sizes="(max-width: 767px) 100vw, 33vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#edf4f0] to-[#dce9e3] px-5 text-center">
                            <span className="text-[10px] font-black uppercase tracking-[.12em] text-[#82968d]">
                              Image managed from Admin
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-[#071f2c]/70 to-transparent" />
                      </div>

                      <div className="p-6">
                        <h3 className="text-lg font-black">
                          {
                            item.name
                          }
                        </h3>

                        {item.summary && (
                          <p className="mt-2 text-xs leading-6 text-[#687c85]">
                            {
                              item.summary
                            }
                          </p>
                        )}

                        <div className="mt-4 text-xs font-black text-[#0a9c63]">
                          Learn more →
                        </div>
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white pb-16">
        <div className="container-shell">
          <Callout
            title={`Discuss ${service.name}`}
            copy="Share project location, operating requirement and available technical documents for review."
          />
        </div>
      </section>
    </PublicShell>
  );
}