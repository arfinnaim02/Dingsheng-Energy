import { PortalShell } from "@/components/PortalShell";
import { RfqManager } from "@/components/admin/RfqManager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminRfqsPage() {
  const rfqs = await prisma.rfq.findMany({
    where: {
    status: {
        in: [
        "SUBMITTED",
        "REVIEWING",
        "ACCEPTED",
        "REJECTED",
        ],
    },
    },

    include: {
      dealer: {
        include: {
          user: {
            select: {
              email: true,
            },
          },

          priceGroup: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },

      items: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              sku: true,
              unitLabel: true,
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  const submittedCount = rfqs.filter(
    (rfq) => rfq.status === "SUBMITTED",
  ).length;

  const reviewingCount = rfqs.filter(
    (rfq) => rfq.status === "REVIEWING",
  ).length;

  const acceptedCount = rfqs.filter(
    (rfq) => rfq.status === "ACCEPTED",
  ).length;

  const rejectedCount = rfqs.filter(
    (rfq) => rfq.status === "REJECTED",
  ).length;

    const serializedRfqs = rfqs.map((rfq) => ({
    ...rfq,

    status: rfq.status as
        | "SUBMITTED"
        | "REVIEWING"
        | "ACCEPTED"
        | "REJECTED",

    requiredDate:
        rfq.requiredDate?.toISOString() ?? null,

    createdAt: rfq.createdAt.toISOString(),
    updatedAt: rfq.updatedAt.toISOString(),
    }));

  return (
    <PortalShell admin title="RFQ Management">
      <section className="grid-4 mb-7">
        {[
          ["Submitted", submittedCount],
          ["Under Review", reviewingCount],
          ["Accepted", acceptedCount],
          ["Rejected", rejectedCount],
        ].map(([label, value]) => (
          <div className="card p-6" key={label}>
            <div className="text-xs font-black uppercase tracking-[.08em] text-[#71838b]">
              {label}
            </div>

            <div className="mt-2 text-3xl font-black text-[#0a9c63]">
              {value}
            </div>
          </div>
        ))}
      </section>

      <RfqManager rfqs={serializedRfqs} />
    </PortalShell>
  );
}