import Image from "next/image";

import Link from "next/link";

import {
  PublicShell,
} from "@/components/PublicShell";

import {
  PageHero,
} from "@/components/PageHero";

import {
  Icon,
} from "@/components/Icon";

import {
  getPublicResources,
} from "@/lib/publicResources";

export const metadata = {
  title:
    "Resources",
};

export const dynamic =
  "force-dynamic";

function accessLabel(
  access: string,
) {
  if (
    access ===
    "DEALER"
  ) {
    return "Approved Dealer";
  }

  if (
    access ===
    "CONTROLLED"
  ) {
    return "Controlled Access";
  }

  return "Public";
}

export default async function ResourcesPage() {
  const resources =
    await getPublicResources();

  return (
    <PublicShell>
      <PageHero
        eyebrow="Technical resources"
        title="Resources & Downloads"
        description="Access company information, product catalogues and approved technical documentation."
        image="/media/hero-resources.jpg"
        imageAlt="Energy technical documentation and engineering resources"
        imagePosition="right"
      />

      <section className="section">
        <div className="container-shell">
          {resources.length ===
          0 ? (
            <div className="card p-8 text-center">
              <h2 className="text-xl font-extrabold">
                Resources coming soon
              </h2>

              <p className="mt-2 text-sm text-[#657983]">
                Technical documents and company resources are currently being prepared.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {resources.map(
                (resource) => (
                  <div
                    className="card overflow-hidden md:flex md:items-center"
                    key={
                      resource.id
                    }
                  >
                    {resource.image ? (
                      <div className="relative h-44 w-full shrink-0 bg-[#edf3f0] md:h-36 md:w-48">
                        <Image
                          src={
                            resource.image
                          }
                          alt={
                            resource.title
                          }
                          fill
                          sizes="(max-width: 768px) 100vw, 192px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-32 w-full shrink-0 items-center justify-center bg-[#e9f7f0] md:h-36 md:w-40">
                        <Icon
                          name="file"
                          className="h-9 w-9 text-[#0a9c63]"
                        />
                      </div>
                    )}

                    <div className="flex-1 p-6 md:flex md:items-center md:justify-between md:gap-8">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold">
                            {
                              resource.title
                            }
                          </h3>

                          {resource.featured && (
                            <span className="pill">
                              Featured
                            </span>
                          )}
                        </div>

                        {resource.summary && (
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657983]">
                            {
                              resource.summary
                            }
                          </p>
                        )}
                      </div>

                      <div className="mt-5 flex shrink-0 flex-wrap items-center gap-3 md:mt-0">
                        <span className="pill">
                          {accessLabel(
                            resource.access,
                          )}
                        </span>

                        <Link
                          href={`/resources/${resource.slug}`}
                          className="btn btn-secondary"
                        >
                          View Resource
                        </Link>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </section>
    </PublicShell>
  );
}