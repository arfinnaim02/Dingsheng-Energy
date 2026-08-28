import Link from "next/link";

import DealerPaymentManager from "@/components/dealer/DealerPaymentManager";
import { PortalShell } from "@/components/PortalShell";
import { requireDealer } from "@/lib/dealerAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DealerPaymentsPage() {
  const dealer = await requireDealer();

  const payments = await prisma.payment.findMany({
    where: {
      order: {
        dealerId: dealer.id,
      },
    },

    include: {
      order: {
        select: {
          id: true,
          reference: true,
          status: true,
          totalAmount: true,
          currency: true,
          deliveryCountry: true,
          deliveryAddress: true,
          createdAt: true,

          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,

              product: {
                select: {
                  name: true,
                  slug: true,
                  sku: true,
                  unitLabel: true,
                },
              },
            },

            orderBy: {
              id: "asc",
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  const serializedPayments = payments.map(
    (payment) => ({
      ...payment,

      amount:
        payment.amount?.toString() ?? null,

      createdAt:
        payment.createdAt.toISOString(),

      updatedAt:
        payment.updatedAt.toISOString(),

      order: {
        ...payment.order,

        totalAmount:
          payment.order.totalAmount?.toString() ??
          null,

        createdAt:
          payment.order.createdAt.toISOString(),

        items: payment.order.items.map(
          (item) => ({
            ...item,

            unitPrice:
              item.unitPrice?.toString() ?? null,
          }),
        ),
      },
    }),
  );

  const pendingCount = payments.filter(
    (payment) =>
      payment.status === "PENDING" ||
      payment.status === "PROCESSING",
  ).length;

  const paidCount = payments.filter(
    (payment) =>
      payment.status === "PAID",
  ).length;

  const failedCount = payments.filter(
    (payment) =>
      payment.status === "FAILED",
  ).length;

  return (
    <PortalShell title="Payments">
      <section className="rounded-xl border border-[#cfe9dd] bg-[#edf9f3] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#0a7f55]">
              Payment history
            </div>

            <h2 className="mt-2 text-xl font-black">
              {dealer.companyName}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#617b70]">
              Review payment methods and verification
              statuses for submitted orders. Click a payment
              record to expand its complete details.
            </p>
          </div>

          <Link
            href="/dealer/orders"
            className="btn btn-primary"
          >
            View Orders →
          </Link>
        </div>
      </section>

      <section className="grid-4 mt-6">
        {[
          ["Payment Records", payments.length],
          ["Pending Verification", pendingCount],
          ["Paid", paidCount],
          ["Failed", failedCount],
        ].map(([label, value]) => (
          <div
            className="card p-5"
            key={label}
          >
            <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
              {label}
            </div>

            <div className="mt-2 text-2xl font-black text-[#0a9c63]">
              {value}
            </div>
          </div>
        ))}
      </section>

      <DealerPaymentManager
        payments={serializedPayments}
      />
    </PortalShell>
  );
}