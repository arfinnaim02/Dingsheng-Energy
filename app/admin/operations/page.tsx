import Link from "next/link";

import { DealerManager } from "@/components/admin/DealerManager";
import { OrderManager } from "@/components/admin/OrderManager";
import { OrderPaymentControl } from "@/components/admin/OrderPaymentControl";
import { RfqManager } from "@/components/admin/RfqManager";
import { PortalShell } from "@/components/PortalShell";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/pricing";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    view?: string;
  }>;
};

const allowedViews = [
  "overview",
  "dealers",
  "rfqs",
  "orders",
  "payments",
] as const;

type OperationView =
  (typeof allowedViews)[number];

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function paymentMethodLabel(
  provider: string | null,
) {
  switch (provider) {
    case "BANK_TRANSFER":
      return "Bank Transfer";

    case "LETTER_OF_CREDIT":
      return "Letter of Credit (L/C)";

    case "APPROVED_CREDIT_TERMS":
      return "Approved Dealer Credit Terms";

    case "MANUAL_COMMERCIAL_AGREEMENT":
      return "Manual Commercial Agreement";

    default:
      return "Not specified";
  }
}

function operationHref(view: OperationView) {
  return `/admin/operations?view=${view}`;
}

export default async function AdminOperationsPage({
  searchParams,
}: PageProps) {
  const parameters = await searchParams;

  const requestedView = parameters.view || "overview";

  const activeView = allowedViews.includes(
    requestedView as OperationView,
  )
    ? (requestedView as OperationView)
    : "overview";

  const [
    dealers,
    priceGroups,
    orders,
    rfqs,
    payments,
  ] = await Promise.all([
    prisma.dealerProfile.findMany({
      include: {
        user: {
          select: {
            email: true,
            role: true,
            emailVerified: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.priceGroup.findMany({
      where: {
        active: true,
      },

      select: {
        id: true,
        slug: true,
        name: true,
      },

      orderBy: {
        name: "asc",
      },
    }),

    prisma.order.findMany({
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
        },

        payments: {
          orderBy: {
            createdAt: "desc",
          },

          take: 1,
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.rfq.findMany({
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
    }),

    prisma.payment.findMany({
      include: {
        order: {
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
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const pendingDealers = dealers.filter(
    (dealer) => dealer.status === "PENDING",
  );

  const activeOrders = orders.filter(
    (order) =>
      order.status === "PENDING" ||
      order.status === "AWAITING_PAYMENT" ||
      order.status === "PROCESSING" ||
      order.status === "SHIPPED",
  );

  const openRfqs = rfqs.filter(
    (rfq) =>
      rfq.status === "SUBMITTED" ||
      rfq.status === "REVIEWING",
  );

  const pendingPayments = payments.filter(
    (payment) =>
      payment.status === "PENDING" ||
      payment.status === "PROCESSING",
  );

  const serializedDealers = dealers.map(
    (dealer) => ({
      id: dealer.id,
      companyName: dealer.companyName,
      contactName: dealer.contactName,
      phone: dealer.phone,
      country: dealer.country,
      businessType: dealer.businessType,
      website: dealer.website,
      jobTitle: dealer.jobTitle,
      interests: dealer.interests,
      status: dealer.status,
      priceGroupId: dealer.priceGroupId,
      createdAt: dealer.createdAt.toISOString(),

      user: {
        email:
          dealer.user.email,

        role:
          dealer.user.role,

        emailVerified:
          dealer.user.emailVerified?.toISOString() ??
          null,
      },
    }),
  );

  const serializedOrders = orders.map(
    (order) => ({
      id: order.id,
      reference: order.reference,
      status: order.status,
      currency: order.currency,

      totalAmount:
        order.totalAmount?.toString() ??
        null,

      deliveryCountry:
        order.deliveryCountry,

      deliveryAddress:
        order.deliveryAddress,

      createdAt:
        order.createdAt.toISOString(),

      dealer: {
        id: order.dealer.id,

        companyName:
          order.dealer.companyName,

        contactName:
          order.dealer.contactName,

        user: {
          email:
            order.dealer.user.email,
        },
      },

      items: order.items.map(
        (item) => ({
          id: item.id,
          quantity: item.quantity,

          unitPrice:
            item.unitPrice?.toString() ??
            null,

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
            id: payment.id,
            status: payment.status,
            provider:
              payment.provider,

            providerRef:
              payment.providerRef,

            amount:
              payment.amount?.toString() ??
              null,

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

  const serializedRfqs = rfqs.map((rfq) => ({
    id: rfq.id,
    reference: rfq.reference,
    projectName: rfq.projectName,
    deliveryCountry: rfq.deliveryCountry,
    requiredDate:
      rfq.requiredDate?.toISOString() ?? null,
    requirement: rfq.requirement,

    status: rfq.status as
      | "SUBMITTED"
      | "REVIEWING"
      | "ACCEPTED"
      | "REJECTED",

    createdAt: rfq.createdAt.toISOString(),
    updatedAt: rfq.updatedAt.toISOString(),

    dealer: {
      companyName: rfq.dealer.companyName,
      contactName: rfq.dealer.contactName,
      phone: rfq.dealer.phone,
      country: rfq.dealer.country,

      user: {
        email: rfq.dealer.user.email,
      },

      priceGroup: rfq.dealer.priceGroup
        ? {
            name: rfq.dealer.priceGroup.name,
            slug: rfq.dealer.priceGroup.slug,
          }
        : null,
    },

    items: rfq.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      notes: item.notes,

      product: {
        name: item.product.name,
        slug: item.product.slug,
        sku: item.product.sku,
        unitLabel: item.product.unitLabel,
      },
    })),
  }));

  return (
    <PortalShell admin title="Operations Center">
      <section className="mb-7 rounded-xl border border-[#cfe9dd] bg-[#edf9f3] p-5">
        <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#0a7f55]">
          Commercial operations
        </div>

        <h2 className="mt-2 text-xl font-black">
          Central management workspace
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#617b70]">
          Review dealer applications, manage RFQs, update
          orders and verify payments from one operations
          workspace.
        </p>
      </section>

      <nav className="mb-7 flex flex-wrap gap-2 rounded-xl border border-[#dfe8e4] bg-white p-2">
        {(
          [
            ["overview", "Overview"],
            ["dealers", "Dealers"],
            ["rfqs", "RFQs"],
            ["orders", "Orders"],
            ["payments", "Payments"],
          ] as Array<[OperationView, string]>
        ).map(([view, label]) => (
          <Link
            key={view}
            href={operationHref(view)}
            className={
              activeView === view
                ? "rounded-lg bg-[#0a9c63] px-5 py-3 text-xs font-black text-white"
                : "rounded-lg px-5 py-3 text-xs font-black text-[#526872] transition hover:bg-[#edf7f2] hover:text-[#0a9c63]"
            }
          >
            {label}
          </Link>
        ))}
      </nav>

      {activeView === "overview" && (
        <>
          <section className="grid-4">
            {(
                [
                    [
                    "Pending Dealers",
                    pendingDealers.length,
                    "dealers",
                    ],
                    [
                    "Open RFQs",
                    openRfqs.length,
                    "rfqs",
                    ],
                    [
                    "Active Orders",
                    activeOrders.length,
                    "orders",
                    ],
                    [
                    "Pending Payments",
                    pendingPayments.length,
                    "payments",
                    ],
                ] as Array<
                    [string, number, OperationView]
                >
                ).map(([label, value, view]) => (
              <Link
                key={label}
                href={operationHref(view)}
                className="card card-hover p-6"
              >
                <div className="text-xs font-black uppercase tracking-[.08em] text-[#71838b]">
                  {label}
                </div>

                <div className="mt-2 text-3xl font-black text-[#0a9c63]">
                  {value}
                </div>

                <div className="mt-3 text-xs font-black text-[#0a9c63]">
                  Manage →
                </div>
              </Link>
            ))}
          </section>

          <section className="mt-7 grid gap-6 lg:grid-cols-2">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#e1ebe7] p-6">
                <div>
                  <div className="eyebrow">
                    Dealer queue
                  </div>

                  <h3 className="mt-2 text-lg font-black">
                    Pending approvals
                  </h3>
                </div>

                <Link
                  href={operationHref("dealers")}
                  className="text-xs font-black text-[#0a9c63]"
                >
                  Manage All →
                </Link>
              </div>

              {!pendingDealers.length ? (
                <div className="p-6 text-sm text-[#71838b]">
                  No pending dealer applications.
                </div>
              ) : (
                <div className="divide-y divide-[#e8efec]">
                  {pendingDealers
                    .slice(0, 5)
                    .map((dealer) => (
                      <Link
                        key={dealer.id}
                        href={`/admin/dealers/${dealer.id}`}
                        className="flex items-center justify-between gap-4 p-5 transition hover:bg-[#f8fbf9]"
                      >
                        <div>
                          <div className="font-black">
                            {dealer.companyName}
                          </div>

                          <div className="mt-1 text-xs text-[#71838b]">
                            {dealer.contactName} ·{" "}
                            {dealer.user.email}
                          </div>
                        </div>

                        <span className="text-xs font-black text-[#0a9c63]">
                          Review →
                        </span>
                      </Link>
                    ))}
                </div>
              )}
            </div>

            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#e1ebe7] p-6">
                <div>
                  <div className="eyebrow">
                    Payment queue
                  </div>

                  <h3 className="mt-2 text-lg font-black">
                    Awaiting verification
                  </h3>
                </div>

                <Link
                  href={operationHref("payments")}
                  className="text-xs font-black text-[#0a9c63]"
                >
                  Manage All →
                </Link>
              </div>

              {!pendingPayments.length ? (
                <div className="p-6 text-sm text-[#71838b]">
                  No payments are awaiting verification.
                </div>
              ) : (
                <div className="divide-y divide-[#e8efec]">
                  {pendingPayments
                    .slice(0, 5)
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between gap-4 p-5"
                      >
                        <div>
                          <Link
                            href={`/admin/dealers/${payment.order.dealer.id}`}
                            className="font-black hover:text-[#0a9c63]"
                          >
                            {
                              payment.order.dealer
                                .companyName
                            }
                          </Link>

                          <div className="mt-1 text-xs text-[#71838b]">
                            {
                              payment.order
                                .reference
                            }{" "}
                            ·{" "}
                            {paymentMethodLabel(
                              payment.provider,
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-black text-[#08774f]">
                            {payment.amount !== null
                              ? formatMoney(
                                  Number(
                                    payment.amount,
                                  ),
                                  payment.currency,
                                )
                              : "Pending"}
                          </div>

                          <div className="mt-1 text-[10px] font-black uppercase text-[#926900]">
                            {statusLabel(
                              payment.status,
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#e1ebe7] p-6">
                <div>
                  <div className="eyebrow">
                    RFQ queue
                  </div>

                  <h3 className="mt-2 text-lg font-black">
                    Open requests
                  </h3>
                </div>

                <Link
                  href={operationHref("rfqs")}
                  className="text-xs font-black text-[#0a9c63]"
                >
                  Manage All →
                </Link>
              </div>

              {!openRfqs.length ? (
                <div className="p-6 text-sm text-[#71838b]">
                  No RFQs require attention.
                </div>
              ) : (
                <div className="divide-y divide-[#e8efec]">
                  {openRfqs.slice(0, 5).map((rfq) => (
                    <Link
                      key={rfq.id}
                      href={operationHref("rfqs")}
                      className="flex items-center justify-between gap-4 p-5 transition hover:bg-[#f8fbf9]"
                    >
                      <div>
                        <div className="font-black">
                          {rfq.reference}
                        </div>

                        <div className="mt-1 text-xs text-[#71838b]">
                          {rfq.dealer.companyName} ·{" "}
                          {rfq.projectName ||
                            "General requirement"}
                        </div>
                      </div>

                      <span className="text-xs font-black text-[#27659a]">
                        {statusLabel(rfq.status)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#e1ebe7] p-6">
                <div>
                  <div className="eyebrow">
                    Order queue
                  </div>

                  <h3 className="mt-2 text-lg font-black">
                    Active orders
                  </h3>
                </div>

                <Link
                  href={operationHref("orders")}
                  className="text-xs font-black text-[#0a9c63]"
                >
                  Manage All →
                </Link>
              </div>

              {!activeOrders.length ? (
                <div className="p-6 text-sm text-[#71838b]">
                  No active orders.
                </div>
              ) : (
                <div className="divide-y divide-[#e8efec]">
                  {activeOrders
                    .slice(0, 5)
                    .map((order) => (
                      <Link
                        key={order.id}
                        href={operationHref("orders")}
                        className="flex items-center justify-between gap-4 p-5 transition hover:bg-[#f8fbf9]"
                      >
                        <div>
                          <div className="font-black">
                            {order.reference}
                          </div>

                          <div className="mt-1 text-xs text-[#71838b]">
                            {
                              order.dealer
                                .companyName
                            }
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-black text-[#08774f]">
                            {order.totalAmount !==
                            null
                              ? formatMoney(
                                  Number(
                                    order.totalAmount,
                                  ),
                                  order.currency,
                                )
                              : "Review"}
                          </div>

                          <div className="mt-1 text-[10px] font-black uppercase text-[#71838b]">
                            {statusLabel(
                              order.status,
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {activeView === "dealers" && (
        <section>
          <div className="mb-5">
            <div className="eyebrow">
              Dealer operations
            </div>

            <h2 className="mt-2 text-2xl font-black">
              Accounts, approval and pricing groups
            </h2>
          </div>

          <DealerManager
            dealers={serializedDealers}
            priceGroups={priceGroups}
          />
        </section>
      )}

      {activeView === "rfqs" && (
        <section>
          <div className="mb-5">
            <div className="eyebrow">
              RFQ operations
            </div>

            <h2 className="mt-2 text-2xl font-black">
              Review product and project requests
            </h2>
          </div>

          <RfqManager rfqs={serializedRfqs} />
        </section>
      )}

      {activeView === "orders" && (
        <section>
          <div className="mb-5">
            <div className="eyebrow">
              Order operations
            </div>

            <h2 className="mt-2 text-2xl font-black">
              Fulfilment and payment management
            </h2>
          </div>

          <OrderManager
            orders={serializedOrders}
          />
        </section>
      )}

      {activeView === "payments" && (
        <section>
          <div className="mb-5">
            <div className="eyebrow">
              Payment operations
            </div>

            <h2 className="mt-2 text-2xl font-black">
              Manual payment verification
            </h2>
          </div>

          {!payments.length ? (
            <div className="card p-10 text-center text-sm text-[#71838b]">
              No payment records are available.
            </div>
          ) : (
            <div className="grid gap-5">
              {payments.map((payment) => (
                <article
                  key={payment.id}
                  className="card p-6"
                >
                  <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                    <div>
                      <div className="eyebrow">
                        {
                          payment.order
                            .reference
                        }
                      </div>

                      <Link
                        href={`/admin/dealers/${payment.order.dealer.id}`}
                        className="mt-2 block text-xl font-black hover:text-[#0a9c63]"
                      >
                        {
                          payment.order.dealer
                            .companyName
                        }
                      </Link>

                      <p className="mt-2 text-xs text-[#71838b]">
                        {
                          payment.order.dealer
                            .contactName
                        }{" "}
                        ·{" "}
                        {
                          payment.order.dealer
                            .user.email
                        }
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-lg bg-[#f6f8f7] p-4 text-xs">
                          <div className="font-black uppercase text-[#829198]">
                            Method
                          </div>

                          <div className="mt-2 font-bold">
                            {paymentMethodLabel(
                              payment.provider,
                            )}
                          </div>
                        </div>

                        <div className="rounded-lg bg-[#f6f8f7] p-4 text-xs">
                          <div className="font-black uppercase text-[#829198]">
                            Amount
                          </div>

                          <div className="mt-2 font-bold">
                            {payment.amount !== null
                              ? formatMoney(
                                  Number(
                                    payment.amount,
                                  ),
                                  payment.currency,
                                )
                              : "Pending"}
                          </div>
                        </div>

                        <div className="rounded-lg bg-[#f6f8f7] p-4 text-xs">
                          <div className="font-black uppercase text-[#829198]">
                            Status
                          </div>

                          <div className="mt-2 font-bold">
                            {statusLabel(
                              payment.status,
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <OrderPaymentControl
                      orderId={payment.order.id}
                      initialStatus={
                        payment.status === "PAID"
                          ? "PAID"
                          : "PENDING"
                      }
                      provider={payment.provider}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </PortalShell>
  );
}