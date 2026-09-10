import Image from "next/image";

import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import type {
  Metadata,
} from "next";

import {
  PublicShell,
} from "@/components/PublicShell";

import {
  Icon,
} from "@/components/Icon";

import {
  getPublicResourceBySlug,
} from "@/lib/publicResources";

export const dynamic =
  "force-dynamic";

type PageProps = {
  params:
    Promise<{
      slug: string;
    }>;
};

function accessLabel(
  access: string,
) {
  if (
    access ===
    "DEALER"
  ) {
    return "Approved Dealer Only";
  }

  if (
    access ===
    "CONTROLLED"
  ) {
    return "Controlled Access";
  }

  return "Public";
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const {
    slug,
  } =
    await params;

  const resource =
    await getPublicResourceBySlug(
      slug,
    );

  if (!resource) {
    return {
      title:
        "Resource",
    };
  }

  return {
    title:
      resource.title,

    description:
      resource.summary ||
      resource.description ||
      undefined,
  };
}

export default async function ResourceDetailPage({
  params,
}: PageProps) {
  const {
    slug,
  } =
    await params;

  const resource =
    await getPublicResourceBySlug(
      slug,
    );

  if (!resource) {
    notFound();
  }

  return (
    <PublicShell>
      <section className="section bg-[#071f2c] text-white">
        <div className="container-shell">
          <Link
            href="/resources"
            className="text-xs font-bold text-white/60 hover:text-white"
          >
            ← Resources
          </Link>

          <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
            <div>
              <div className="eyebrow text-[#72d8ad]">
                Technical Resource
              </div>

              <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-[-.04em] md:text-5xl">
                {
                  resource.title
                }
              </h1>

              {resource.summary && (
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">
                  {
                    resource.summary
                  }
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="pill">
                  {accessLabel(
                    resource.access,
                  )}
                </span>

                <span className="pill">
                  {
                    resource.type
                  }
                </span>
              </div>
            </div>

            {resource.image && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white/5">
                <Image
                  src={
                    resource.image
                  }
                  alt={
                    resource.title
                  }
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 420px"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-shell grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="card p-7 md:p-9">
            <h2 className="text-2xl font-extrabold">
              Resource Information
            </h2>

            {resource.description ? (
              <div className="mt-5 whitespace-pre-line text-sm leading-7 text-[#536b76]">
                {
                  resource.description
                }
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#657983]">
                Detailed information is available through the resource download.
              </p>
            )}
          </div>

          <aside className="card h-fit p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9f7f0]">
              <Icon
                name="file"
                className="h-6 w-6 text-[#0a9c63]"
              />
            </div>

            <h3 className="mt-5 font-extrabold">
              Download Access
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#657983]">
              {resource.access ===
              "PUBLIC"
                ? "This resource is publicly available."
                : resource.access ===
                    "DEALER"
                  ? "This resource is available to approved Dingsheng Energy dealers."
                  : "This document is supplied according to approved project or commercial access."}
            </p>

            {resource.access ===
            "CONTROLLED" ? (
              <Link
                href="/contact"
                className="btn btn-primary mt-6 w-full justify-center"
              >
                Request Access
              </Link>
            ) : (
              <a
                href={`/api/resources/${resource.slug}/download`}
                className="btn btn-primary mt-6 w-full justify-center"
              >
                {resource.access ===
                "DEALER"
                  ? "Dealer Download"
                  : "Download Resource"}
              </a>
            )}

            {resource.originalFileName && (
              <p className="mt-4 break-all text-[10px] text-[#7d8f97]">
                {
                  resource.originalFileName
                }
              </p>
            )}
          </aside>
        </div>
      </section>
    </PublicShell>
  );
}