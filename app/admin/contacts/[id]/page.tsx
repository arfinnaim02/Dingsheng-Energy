import {
  notFound,
} from "next/navigation";

import {
  ContactDetailManager,
} from "@/components/admin/ContactDetailManager";

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

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ContactDetailPage({
  params,
}: PageProps) {
  await requireAdmin();

  const { id } = await params;

  const existing =
    await prisma.contactInquiry.findUnique({
      where: {
        id,
      },

      include: {
        dealer: {
          include: {
            user: {
              select: {
                email: true,
                role: true,
              },
            },

            priceGroup: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
        },
      },
    });

  if (!existing) {
    notFound();
  }

  if (
    existing.status === "NEW"
  ) {
    await prisma.contactInquiry.update({
      where: {
        id,
      },

      data: {
        status: "READ",

        adminLastViewed:
          new Date(),
      },
    });
  } else {
    await prisma.contactInquiry.update({
      where: {
        id,
      },

      data: {
        adminLastViewed:
          new Date(),
      },
    });
  }

  const contact =
    await prisma.contactInquiry.findUnique({
      where: {
        id,
      },

      include: {
        dealer: {
          include: {
            user: {
              select: {
                email: true,
                role: true,
              },
            },

            priceGroup: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
        },
      },
    });

  if (!contact) {
    notFound();
  }

  const serializedContact = {
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

    internalNotes:
      contact.internalNotes,

    ipAddress:
      contact.ipAddress,

    userAgent:
      contact.userAgent,

    createdAt:
      contact.createdAt.toISOString(),

    updatedAt:
      contact.updatedAt.toISOString(),

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

            email:
              contact.dealer
                .user.email,

            role:
              contact.dealer
                .user.role,

            phone:
              contact.dealer
                .phone,

            country:
              contact.dealer
                .country,

            businessType:
              contact.dealer
                .businessType,

            website:
              contact.dealer
                .website,

            jobTitle:
              contact.dealer
                .jobTitle,

            status:
              contact.dealer
                .status,

            interests:
              contact.dealer
                .interests,

            priceGroup:
              contact.dealer
                .priceGroup
                ? {
                    id:
                      contact
                        .dealer
                        .priceGroup
                        .id,

                    slug:
                      contact
                        .dealer
                        .priceGroup
                        .slug,

                    name:
                      contact
                        .dealer
                        .priceGroup
                        .name,
                  }
                : null,
          }
        : null,
  };

  return (
    <PortalShell
      admin
      title={`Contact: ${contact.reference}`}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <a
          href="/admin/contacts"
          className="text-sm font-extrabold text-[#0a7c55] hover:underline"
        >
          ← Back to Contact Inbox
        </a>

        <span
          className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[.08em] ${
            contact.source ===
            "DEALER"
              ? "bg-[#e7f7ef] text-[#087a50]"
              : "bg-[#edf1f3] text-[#526872]"
          }`}
        >
          {contact.source ===
          "DEALER"
            ? "Dealer Portal Contact"
            : "Public Website Contact"}
        </span>
      </div>

      <ContactDetailManager
        contact={
          serializedContact
        }
      />
    </PortalShell>
  );
}