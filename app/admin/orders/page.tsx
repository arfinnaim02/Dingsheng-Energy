import {
  OrderManager,
  type AdminOrder,
} from "@/components/admin/OrderManager";

import {
  PortalShell,
} from "@/components/PortalShell";

import {
  prisma,
} from "@/lib/prisma";

export const dynamic =
  "force-dynamic";

export default async function AdminOrdersPage() {
  const orders =
    await prisma.order.findMany({
      include: {
        dealer: {
          include: {
            user: {
              select: {
                email: true,
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
              },
            },
          },

          orderBy: {
            id: "asc",
          },
        },

        payments: {
          orderBy: {
            createdAt:
              "desc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  /*
   * Prisma Decimal and Date values
   * should be serialized before being
   * passed to the client component.
   */
  const serializedOrders: AdminOrder[] =
    orders.map(
      (order) => ({
        id:
          order.id,

        reference:
          order.reference,

        status:
          order.status,

        currency:
          order.currency,

        totalAmount:
          order.totalAmount !==
          null
            ? order.totalAmount.toString()
            : null,

        deliveryCountry:
          order.deliveryCountry,

        deliveryAddress:
          order.deliveryAddress,

        createdAt:
          order.createdAt.toISOString(),

        dealer: {
          id:
            order.dealer.id,

          companyName:
            order.dealer.companyName,

          contactName:
            order.dealer.contactName,

          user: {
            email:
              order.dealer.user.email,
          },
        },

        items:
          order.items.map(
            (item) => ({
              id:
                item.id,

              quantity:
                item.quantity,

              unitPrice:
                item.unitPrice !==
                null
                  ? item.unitPrice.toString()
                  : null,

              product: {
                name:
                  item.product.name,

                slug:
                  item.product.slug,
              },
            }),
          ),

        payments:
          order.payments.map(
            (payment) => ({
              id:
                payment.id,

              status:
                payment.status,

              provider:
                payment.provider,

              providerRef:
                payment.providerRef,

              amount:
                payment.amount !==
                null
                  ? payment.amount.toString()
                  : null,

              currency:
                payment.currency,

              createdAt:
                payment.createdAt.toISOString(),

              updatedAt:
                payment.updatedAt.toISOString(),
            }),
          ),
      }),
    );

  const pendingCount =
    orders.filter(
      (order) =>
        order.status ===
          "PENDING" ||
        order.status ===
          "AWAITING_PAYMENT",
    ).length;

  const activeCount =
    orders.filter(
      (order) =>
        order.status ===
          "PROCESSING" ||
        order.status ===
          "SHIPPED",
    ).length;

  const completedCount =
    orders.filter(
      (order) =>
        order.status ===
        "COMPLETED",
    ).length;

  return (
    <PortalShell
      admin
      title="Order Management"
    >
      <section className="mb-6">
        <div className="eyebrow">
          Dealer Orders
        </div>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#17313d]">
              Orders,
              fulfilment and
              payment management
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#71838b]">
              Review dealer
              orders in a compact
              list, expand any
              order for complete
              details, update
              fulfilment and
              payment status, or
              maintain records
              with individual and
              bulk actions.
            </p>
          </div>
        </div>
      </section>

      <section className="grid-4 mb-6">
        <div className="card p-5">
          <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
            Total Orders
          </div>

          <div className="mt-2 text-3xl font-black text-[#17313d]">
            {
              orders.length
            }
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
            Pending
          </div>

          <div className="mt-2 text-3xl font-black text-amber-700">
            {
              pendingCount
            }
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
            In Progress
          </div>

          <div className="mt-2 text-3xl font-black text-blue-700">
            {
              activeCount
            }
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
            Completed
          </div>

          <div className="mt-2 text-3xl font-black text-[#08774f]">
            {
              completedCount
            }
          </div>
        </div>
      </section>

      <OrderManager
        orders={
          serializedOrders
        }
      />
    </PortalShell>
  );
}