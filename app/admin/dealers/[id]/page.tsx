import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  DealerManager,
} from "@/components/admin/DealerManager";

import {
  OrderPaymentControl,
} from "@/components/admin/OrderPaymentControl";

import {
  PortalShell,
} from "@/components/PortalShell";

import {
  prisma,
} from "@/lib/prisma";

import {
  formatMoney,
} from "@/lib/pricing";

export const dynamic =
  "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function statusLabel(
  status: string,
) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function contactStatusLabel(
  status: string,
) {
  switch (status) {
    case "NEW":
      return "New";

    case "READ":
      return "Viewed";

    case "IN_PROGRESS":
      return "Pending";

    case "RESOLVED":
      return "Done";

    case "ARCHIVED":
      return "Archived";

    case "SPAM":
      return "Spam";

    default:
      return statusLabel(
        status,
      );
  }
}

function contactStatusClass(
  status: string,
) {
  switch (status) {
    case "NEW":
      return "bg-blue-50 text-blue-700";

    case "READ":
      return "bg-slate-100 text-slate-700";

    case "IN_PROGRESS":
      return "bg-amber-50 text-amber-700";

    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700";

    case "ARCHIVED":
      return "bg-zinc-100 text-zinc-600";

    case "SPAM":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function priorityClass(
  priority: string,
) {
  switch (priority) {
    case "URGENT":
      return "bg-red-50 text-red-700";

    case "HIGH":
      return "bg-orange-50 text-orange-700";

    case "LOW":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-[#eef7f3] text-[#527061]";
  }
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

export default async function AdminDealerDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  const [
    dealer,
    priceGroups,
  ] = await Promise.all([
    prisma.dealerProfile.findUnique({
      where: {
        id,
      },

      include: {
        user: {
          select: {
            email: true,
            role: true,
            emailVerified: true,
          },
        },

        priceGroup: true,

        contactInquiries: {
          orderBy: {
            createdAt: "desc",
          },
        },

        orders: {
          include: {
            payments: {
              orderBy: {
                createdAt:
                  "desc",
              },

              take: 1,
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
          },

          orderBy: {
            createdAt:
              "desc",
          },
        },

        rfqs: {
          include: {
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
          },

          orderBy: {
            createdAt:
              "desc",
          },
        },
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
  ]);

  if (!dealer) {
    notFound();
  }

  const payments =
    dealer.orders.flatMap(
      (order) =>
        order.payments.map(
          (payment) => ({
            ...payment,
            order,
          }),
        ),
    );

  const contactCounts = {
    total:
      dealer.contactInquiries
        .length,

    new:
      dealer.contactInquiries.filter(
        (contact) =>
          contact.status ===
          "NEW",
      ).length,

    pending:
      dealer.contactInquiries.filter(
        (contact) =>
          contact.status ===
          "IN_PROGRESS",
      ).length,

    done:
      dealer.contactInquiries.filter(
        (contact) =>
          contact.status ===
          "RESOLVED",
      ).length,
  };

  const totalPaidByCurrency =
    new Map<
      string,
      number
    >();

  for (
    const payment of payments
  ) {
    if (
      payment.status ===
        "PAID" &&
      payment.amount !== null
    ) {
      totalPaidByCurrency.set(
        payment.currency,

        (totalPaidByCurrency.get(
          payment.currency,
        ) || 0) +
          Number(
            payment.amount,
          ),
      );
    }
  }

  const serializedDealer = {
    id: dealer.id,

    companyName:
      dealer.companyName,

    contactName:
      dealer.contactName,

    phone:
      dealer.phone,

    country:
      dealer.country,

    businessType:
      dealer.businessType,

    website:
      dealer.website,

    jobTitle:
      dealer.jobTitle,

    interests:
      dealer.interests,

    status:
      dealer.status,

    priceGroupId:
      dealer.priceGroupId,

    createdAt:
      dealer.createdAt.toISOString(),

    user: {
      email:
        dealer.user.email,

      role:
        dealer.user.role,

      emailVerified:
        dealer.user.emailVerified?.toISOString() ??
        null,
    },
  };

  return (
    <PortalShell
      admin
      title={
        dealer.companyName
      }
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/dealers"
          className="text-xs font-black text-[#0a9c63]"
        >
          ← Back to Dealer
          Management
        </Link>

        <span className="status">
          {statusLabel(
            dealer.status,
          )}
        </span>
      </div>

      <section className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[
          [
            "Orders",
            dealer.orders.length,
          ],

          [
            "RFQs",
            dealer.rfqs.length,
          ],

          [
            "Payments",
            payments.length,
          ],

          [
            "Contacts",
            contactCounts.total,
          ],

          [
            "Price Group",
            dealer.priceGroup
              ?.name ||
              "Not assigned",
          ],
        ].map(
          ([
            label,
            value,
          ]) => (
            <div
              className="card p-6"
              key={label}
            >
              <div className="text-xs font-black uppercase tracking-[.08em] text-[#71838b]">
                {label}
              </div>

              <div className="mt-2 text-2xl font-black text-[#0a9c63]">
                {value}
              </div>
            </div>
          ),
        )}
      </section>

      <section>
        <div className="eyebrow">
          Account management
        </div>

        <h2 className="mt-2 text-2xl font-black">
          Dealer details and
          access
        </h2>

        <div className="mt-5">
          <DealerManager
            dealers={[
              serializedDealer,
            ]}
            priceGroups={
              priceGroups
            }
          />
        </div>
      </section>

      <section className="mt-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow">
              Dealer contacts
            </div>

            <h2 className="mt-2 text-2xl font-black">
              Contact and support
              history
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#71838b]">
              Messages submitted
              from this authenticated
              dealer account.
            </p>
          </div>

          <Link
            href={`/admin/contacts?source=DEALER&q=${encodeURIComponent(
              dealer.companyName,
            )}`}
            className="btn btn-secondary"
          >
            Open Contact Inbox
          </Link>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5">
            <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#71838b]">
              Total Contacts
            </div>

            <div className="mt-2 text-3xl font-black">
              {
                contactCounts.total
              }
            </div>
          </div>

          <div className="card border-l-4 border-l-blue-500 p-5">
            <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#71838b]">
              New
            </div>

            <div className="mt-2 text-3xl font-black text-blue-700">
              {contactCounts.new}
            </div>
          </div>

          <div className="card border-l-4 border-l-amber-500 p-5">
            <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#71838b]">
              Pending
            </div>

            <div className="mt-2 text-3xl font-black text-amber-700">
              {
                contactCounts.pending
              }
            </div>
          </div>

          <div className="card border-l-4 border-l-emerald-500 p-5">
            <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#71838b]">
              Done
            </div>

            <div className="mt-2 text-3xl font-black text-emerald-700">
              {contactCounts.done}
            </div>
          </div>
        </div>

        {!dealer
          .contactInquiries
          .length ? (
          <div className="card mt-5 p-8 text-center">
            <div className="text-sm font-bold text-[#526872]">
              This dealer has not
              submitted any contact
              messages.
            </div>

            <p className="mt-2 text-xs text-[#829198]">
              New messages from the
              dealer Contact Support
              page will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {dealer.contactInquiries.map(
              (contact) => (
                <article
                  key={contact.id}
                  className={`card overflow-hidden ${
                    contact.status ===
                    "NEW"
                      ? "border-l-4 border-l-blue-500"
                      : ""
                  }`}
                >
                  <div className="p-5 md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/contacts/${contact.id}`}
                            className="text-lg font-black transition hover:text-[#0a9c63]"
                          >
                            {
                              contact.inquiryType
                            }
                          </Link>

                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[.06em] ${contactStatusClass(
                              contact.status,
                            )}`}
                          >
                            {contactStatusLabel(
                              contact.status,
                            )}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[.06em] ${priorityClass(
                              contact.priority,
                            )}`}
                          >
                            {
                              contact.priority
                            }
                          </span>
                        </div>

                        <p className="mt-2 text-xs font-bold text-[#71838b]">
                          {
                            contact.reference
                          }
                        </p>

                        <p className="mt-4 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[#657983]">
                          {
                            contact.requirement
                          }
                        </p>

                        {contact.internalNotes && (
                          <div className="mt-4 rounded-lg border border-[#e0e9e5] bg-[#f8faf9] p-4">
                            <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                              Latest Admin
                              Notes
                            </div>

                            <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-xs leading-5 text-[#657983]">
                              {
                                contact.internalNotes
                              }
                            </p>
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/admin/contacts/${contact.id}`}
                        className="btn btn-secondary whitespace-nowrap"
                      >
                        View Contact
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf2ef] px-5 py-3 text-xs text-[#829198] md:px-6">
                    <span>
                      Submitted by{" "}
                      {
                        contact.fullName
                      }
                    </span>

                    <span>
                      {new Date(
                        contact.createdAt,
                      ).toLocaleString()}
                    </span>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>

      <section className="mt-9">
        <div className="eyebrow">
          Payment management
        </div>

        <h2 className="mt-2 text-2xl font-black">
          Dealer payment records
        </h2>

        {!payments.length ? (
          <div className="card mt-5 p-8 text-center text-sm text-[#71838b]">
            This dealer has no
            payment records.
          </div>
        ) : (
          <div className="mt-5 grid gap-5">
            {payments.map(
              (payment) => {
                const amount =
                  payment.amount !==
                  null
                    ? Number(
                        payment.amount,
                      )
                    : payment.order
                          .totalAmount !==
                        null
                      ? Number(
                          payment
                            .order
                            .totalAmount,
                        )
                      : null;

                return (
                  <article
                    key={
                      payment.id
                    }
                    className="card p-6"
                  >
                    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                      <div>
                        <div className="eyebrow">
                          {
                            payment
                              .order
                              .reference
                          }
                        </div>

                        <h3 className="mt-2 text-xl font-black">
                          {paymentMethodLabel(
                            payment.provider,
                          )}
                        </h3>

                        <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                          <div className="rounded-lg bg-[#f6f8f7] p-4">
                            <div className="text-[10px] font-black uppercase text-[#829198]">
                              Amount
                            </div>

                            <div className="mt-2 font-black">
                              {amount !==
                              null
                                ? formatMoney(
                                    amount,
                                    payment.currency,
                                  )
                                : "Pending"}
                            </div>
                          </div>

                          <div className="rounded-lg bg-[#f6f8f7] p-4">
                            <div className="text-[10px] font-black uppercase text-[#829198]">
                              Payment
                            </div>

                            <div className="mt-2 font-black">
                              {statusLabel(
                                payment.status,
                              )}
                            </div>
                          </div>

                          <div className="rounded-lg bg-[#f6f8f7] p-4">
                            <div className="text-[10px] font-black uppercase text-[#829198]">
                              Order
                            </div>

                            <div className="mt-2 font-black">
                              {statusLabel(
                                payment
                                  .order
                                  .status,
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <OrderPaymentControl
                        orderId={
                          payment
                            .order.id
                        }
                        initialStatus={
                          payment.status ===
                          "PAID"
                            ? "PAID"
                            : "PENDING"
                        }
                        provider={
                          payment.provider
                        }
                      />
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}

        {totalPaidByCurrency.size >
          0 && (
          <div className="card mt-5 p-6">
            <div className="eyebrow">
              Verified payments
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {[
                ...totalPaidByCurrency.entries(),
              ].map(
                ([
                  currency,
                  total,
                ]) => (
                  <div
                    key={
                      currency
                    }
                    className="rounded-lg bg-[#edf9f3] px-5 py-4"
                  >
                    <div className="text-[10px] font-black uppercase text-[#71838b]">
                      Total paid ·{" "}
                      {currency}
                    </div>

                    <div className="mt-1 text-xl font-black text-[#08774f]">
                      {formatMoney(
                        total,
                        currency,
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </section>

      <section className="mt-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow">
              Commercial activity
            </div>

            <h2 className="mt-2 text-2xl font-black">
              Orders and RFQs
            </h2>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/orders"
              className="btn btn-secondary"
            >
              Manage All Orders
            </Link>

            <Link
              href="/admin/rfqs"
              className="btn btn-secondary"
            >
              Manage All RFQs
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="card overflow-hidden">
            <div className="border-b border-[#e1ebe7] p-6">
              <h3 className="text-lg font-black">
                Recent orders
              </h3>
            </div>

            {!dealer.orders
              .length ? (
              <div className="p-6 text-sm text-[#71838b]">
                No orders submitted.
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>
                        Reference
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {dealer.orders
                      .slice(0, 5)
                      .map(
                        (
                          order,
                        ) => (
                          <tr
                            key={
                              order.id
                            }
                          >
                            <td className="font-black">
                              {
                                order.reference
                              }
                            </td>

                            <td>
                              {statusLabel(
                                order.status,
                              )}
                            </td>

                            <td>
                              {order.totalAmount !==
                              null
                                ? formatMoney(
                                    Number(
                                      order.totalAmount,
                                    ),
                                    order.currency,
                                  )
                                : "—"}
                            </td>
                          </tr>
                        ),
                      )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-[#e1ebe7] p-6">
              <h3 className="text-lg font-black">
                Recent RFQs
              </h3>
            </div>

            {!dealer.rfqs
              .length ? (
              <div className="p-6 text-sm text-[#71838b]">
                No RFQs submitted.
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>
                        Reference
                      </th>

                      <th>
                        Project
                      </th>

                      <th>
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {dealer.rfqs
                      .slice(0, 5)
                      .map(
                        (rfq) => (
                          <tr
                            key={
                              rfq.id
                            }
                          >
                            <td className="font-black">
                              {
                                rfq.reference
                              }
                            </td>

                            <td>
                              {rfq.projectName ||
                                "General"}
                            </td>

                            <td>
                              {statusLabel(
                                rfq.status,
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </PortalShell>
  );
}