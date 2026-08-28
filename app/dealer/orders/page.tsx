import Link from "next/link";

import DealerOrderManager from "@/components/dealer/DealerOrderManager";
import { PortalShell } from "@/components/PortalShell";
import { requireDealer } from "@/lib/dealerAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DealerOrdersPage() {
  const dealer = await requireDealer();

  const orders = await prisma.order.findMany({
    where: {
      dealerId: dealer.id,
    },

    include: {
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

        orderBy: {
          id: "asc",
        },
      },

      payments: {
        select: {
          id: true,
          status: true,
          amount: true,
          currency: true,
          provider: true,
          createdAt: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  const serializedOrders = orders.map((order) => ({
    ...order,

    totalAmount:
      order.totalAmount?.toString() ?? null,

    createdAt:
      order.createdAt.toISOString(),

    updatedAt:
      order.updatedAt.toISOString(),

    items: order.items.map((item) => ({
      ...item,

      unitPrice:
        item.unitPrice?.toString() ?? null,
    })),

    payments: order.payments.map((payment) => ({
      ...payment,

      amount:
        payment.amount?.toString() ?? null,

      createdAt:
        payment.createdAt.toISOString(),
    })),
  }));

  const pendingCount = orders.filter(
    (order) =>
      order.status === "PENDING" ||
      order.status === "AWAITING_PAYMENT",
  ).length;

  const activeCount = orders.filter(
    (order) =>
      order.status === "PROCESSING" ||
      order.status === "SHIPPED",
  ).length;

  const completedCount = orders.filter(
    (order) =>
      order.status === "COMPLETED",
  ).length;

  return (
    <PortalShell title="My Orders">
      <section className="rounded-xl border border-[#cfe9dd] bg-[#edf9f3] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#0a7f55]">
              Dealer order history
            </div>

            <h2 className="mt-2 text-xl font-black">
              {dealer.companyName}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#617b70]">
              Review submitted orders, current processing
              status, delivery details and ordered products.
              Click an order to expand its complete details.
            </p>
          </div>

          <Link
            href="/dealer/products"
            className="btn btn-primary"
          >
            Create New Order →
          </Link>
        </div>
      </section>

      <section className="grid-4 mt-6">
        {[
          ["Total Orders", orders.length],
          ["Pending Review", pendingCount],
          ["In Progress", activeCount],
          ["Completed", completedCount],
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

      <DealerOrderManager
        orders={serializedOrders}
      />
    </PortalShell>
  );
}