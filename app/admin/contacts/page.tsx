import type {
  ContactSource,
  ContactStatus,
  Prisma,
} from "@prisma/client";

import {
  ContactManager,
} from "@/components/admin/ContactManager";

import {
  PortalShell,
} from "@/components/PortalShell";

import {
  requireAdmin,
} from "@/lib/adminAuth";

import {
  prisma,
} from "@/lib/prisma";

export const dynamic =
  "force-dynamic";

const validStatuses:
  ContactStatus[] = [
    "NEW",
    "READ",
    "IN_PROGRESS",
    "RESOLVED",
    "ARCHIVED",
    "SPAM",
  ];

const validSources:
  ContactSource[] = [
    "PUBLIC",
    "DEALER",
  ];

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    source?: string;
  }>;
};

export default async function AdminContactsPage({
  searchParams,
}: PageProps) {
  await requireAdmin();

  const {
    q = "",
    status = "",
    source = "",
  } = await searchParams;

  const query = q.trim();

  const selectedStatus =
    validStatuses.includes(
      status as ContactStatus,
    )
      ? (status as ContactStatus)
      : undefined;

  const selectedSource =
    validSources.includes(
      source as ContactSource,
    )
      ? (source as ContactSource)
      : undefined;

  const where:
    Prisma.ContactInquiryWhereInput =
    {
      ...(selectedStatus
        ? {
            status:
              selectedStatus,
          }
        : {}),

      ...(selectedSource
        ? {
            source:
              selectedSource,
          }
        : {}),

      ...(query
        ? {
            OR: [
              {
                reference: {
                  contains: query,
                  mode: "insensitive",
                },
              },

              {
                fullName: {
                  contains: query,
                  mode: "insensitive",
                },
              },

              {
                company: {
                  contains: query,
                  mode: "insensitive",
                },
              },

              {
                email: {
                  contains: query,
                  mode: "insensitive",
                },
              },

              {
                phone: {
                  contains: query,
                  mode: "insensitive",
                },
              },

              {
                country: {
                  contains: query,
                  mode: "insensitive",
                },
              },

              {
                inquiryType: {
                  contains: query,
                  mode: "insensitive",
                },
              },

              {
                requirement: {
                  contains: query,
                  mode: "insensitive",
                },
              },

              {
                dealer: {
                  is: {
                    companyName: {
                      contains: query,
                      mode: "insensitive",
                    },
                  },
                },
              },

              {
                dealer: {
                  is: {
                    contactName: {
                      contains: query,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

  const [
    contacts,
    statusCounts,
    publicCount,
    dealerCount,
  ] = await Promise.all([
    prisma.contactInquiry.findMany({
      where,

      include: {
        dealer: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            status: true,
            businessType: true,

            priceGroup: {
              select: {
                name: true,
              },
            },
          },
        },
      },

      orderBy: [
        {
          createdAt: "desc",
        },
      ],

      take: 200,
    }),

    prisma.contactInquiry.groupBy({
      by: ["status"],

      _count: {
        _all: true,
      },
    }),

    prisma.contactInquiry.count({
      where: {
        source: "PUBLIC",
      },
    }),

    prisma.contactInquiry.count({
      where: {
        source: "DEALER",
      },
    }),
  ]);

  const counts =
    Object.fromEntries(
      statusCounts.map(
        (item) => [
          item.status,
          item._count._all,
        ],
      ),
    );

  const serializedContacts =
    contacts.map((contact) => ({
      id: contact.id,

      reference:
        contact.reference,

      source:
        contact.source,

      dealerId:
        contact.dealerId,

      fullName:
        contact.fullName,

      company:
        contact.company,

      email:
        contact.email,

      phone:
        contact.phone,

      country:
        contact.country,

      inquiryType:
        contact.inquiryType,

      requirement:
        contact.requirement,

      status:
        contact.status,

      priority:
        contact.priority,

      createdAt:
        contact.createdAt.toISOString(),

      dealer:
        contact.dealer
          ? {
              id:
                contact.dealer.id,

              companyName:
                contact.dealer
                  .companyName,

              contactName:
                contact.dealer
                  .contactName,

              status:
                contact.dealer
                  .status,

              businessType:
                contact.dealer
                  .businessType,

              priceGroupName:
                contact.dealer
                  .priceGroup
                  ?.name ??
                null,
            }
          : null,
    }));

  return (
    <PortalShell
      admin
      title="Contact Inquiries"
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#71838b]">
            Total Inquiries
          </div>

          <div className="mt-2 text-3xl font-black">
            {publicCount +
              dealerCount}
          </div>
        </div>

        <div className="card border-l-4 border-l-[#526872] p-5">
          <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#71838b]">
            Public Website
          </div>

          <div className="mt-2 text-3xl font-black">
            {publicCount}
          </div>
        </div>

        <div className="card border-l-4 border-l-[#0a9c63] p-5">
          <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#71838b]">
            Dealer Portal
          </div>

          <div className="mt-2 text-3xl font-black">
            {dealerCount}
          </div>
        </div>

        <div className="card border-l-4 border-l-blue-500 p-5">
          <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#71838b]">
            New Contacts
          </div>

          <div className="mt-2 text-3xl font-black">
            {counts.NEW ?? 0}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {validStatuses.map(
          (item) => (
            <div
              key={item}
              className="card p-4"
            >
              <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#71838b]">
                {item ===
                "IN_PROGRESS"
                  ? "Pending"
                  : item ===
                      "RESOLVED"
                    ? "Done"
                    : item.replaceAll(
                        "_",
                        " ",
                      )}
              </div>

              <div className="mt-2 text-2xl font-black">
                {counts[item] ??
                  0}
              </div>
            </div>
          ),
        )}
      </div>

      <form className="card mb-6 grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_190px_190px_auto]">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search reference, dealer, company, email or requirement..."
          className="rounded-md border border-[#d8e4df] px-4 py-3 text-sm outline-none focus:border-[#0a9c63]"
        />

        <select
          name="source"
          defaultValue={
            selectedSource ?? ""
          }
          className="rounded-md border border-[#d8e4df] bg-white px-4 py-3 text-sm outline-none focus:border-[#0a9c63]"
        >
          <option value="">
            All Sources
          </option>

          <option value="PUBLIC">
            Public Website
          </option>

          <option value="DEALER">
            Dealer Portal
          </option>
        </select>

        <select
          name="status"
          defaultValue={
            selectedStatus ?? ""
          }
          className="rounded-md border border-[#d8e4df] bg-white px-4 py-3 text-sm outline-none focus:border-[#0a9c63]"
        >
          <option value="">
            All Statuses
          </option>

          {validStatuses.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item ===
                "IN_PROGRESS"
                  ? "Pending"
                  : item ===
                      "RESOLVED"
                    ? "Done"
                    : item.replaceAll(
                        "_",
                        " ",
                      )}
              </option>
            ),
          )}
        </select>

        <button
          type="submit"
          className="btn btn-primary"
        >
          Filter
        </button>
      </form>

      <ContactManager
        contacts={
          serializedContacts
        }
      />
    </PortalShell>
  );
}