import type {
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";


import Link from "next/link";

import {
  PaymentManager,
  type AdminPayment,
} from "@/components/admin/PaymentManager";

import {
  PortalShell,
} from "@/components/PortalShell";

import {
  prisma,
} from "@/lib/prisma";

export const dynamic =
  "force-dynamic";

const paymentStatuses:
  PaymentStatus[] = [
    "PENDING",
    "PROCESSING",
    "PAID",
    "FAILED",
    "REFUNDED",
  ];

const orderStatuses:
  OrderStatus[] = [
    "PENDING",
    "AWAITING_PAYMENT",
    "PROCESSING",
    "SHIPPED",
    "COMPLETED",
    "CANCELLED",
  ];

const paymentMethods = [
  "BANK_TRANSFER",
  "LETTER_OF_CREDIT",
  "APPROVED_CREDIT_TERMS",
  "MANUAL_COMMERCIAL_AGREEMENT",
];

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    method?: string;
    currency?: string;
    orderStatus?: string;
    dealer?: string;
    from?: string;
    to?: string;
    sort?: string;
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

function paymentMethodLabel(
  provider: string,
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
      return statusLabel(
        provider,
      );
  }
}

function validDate(
  value:
    | string
    | undefined,
) {
  if (!value) {
    return null;
  }

  const date = new Date(
    `${value}T00:00:00.000Z`,
  );

  return Number.isNaN(
    date.getTime(),
  )
    ? null
    : date;
}

export default async function AdminPaymentsPage({
  searchParams,
}: PageProps) {
  const filters =
    await searchParams;

  const query =
    filters.q?.trim() ||
    "";

  const selectedStatus =
    paymentStatuses.includes(
      filters.status as PaymentStatus,
    )
      ? (filters.status as PaymentStatus)
      : undefined;

  const selectedMethod =
    paymentMethods.includes(
      filters.method || "",
    )
      ? filters.method
      : undefined;

  const selectedOrderStatus =
    orderStatuses.includes(
      filters.orderStatus as OrderStatus,
    )
      ? (filters.orderStatus as OrderStatus)
      : undefined;

  const selectedCurrency =
    filters.currency
      ?.trim()
      .toUpperCase() ||
    "";

  const selectedDealer =
    filters.dealer?.trim() ||
    "";

  const fromDate =
    validDate(filters.from);

  const toDate =
    validDate(filters.to);

  if (toDate) {
    toDate.setUTCHours(
      23,
      59,
      59,
      999,
    );
  }

  const sort =
    filters.sort ||
    "newest";

  const orderBy:
    Prisma.PaymentOrderByWithRelationInput =
    sort === "oldest"
      ? {
          createdAt: "asc",
        }
      : sort === "amount_high"
        ? {
            amount: "desc",
          }
        : sort === "amount_low"
          ? {
              amount: "asc",
            }
          : {
              createdAt:
                "desc",
            };

  const where:
    Prisma.PaymentWhereInput =
    {
      ...(selectedStatus
        ? {
            status:
              selectedStatus,
          }
        : {}),

      ...(selectedMethod
        ? {
            provider:
              selectedMethod,
          }
        : {}),

      ...(selectedCurrency
        ? {
            currency:
              selectedCurrency,
          }
        : {}),

      ...(selectedOrderStatus ||
      selectedDealer
        ? {
            order: {
              ...(selectedOrderStatus
                ? {
                    status:
                      selectedOrderStatus,
                  }
                : {}),

              ...(selectedDealer
                ? {
                    dealerId:
                      selectedDealer,
                  }
                : {}),
            },
          }
        : {}),

      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate
                ? {
                    gte:
                      fromDate,
                  }
                : {}),

              ...(toDate
                ? {
                    lte:
                      toDate,
                  }
                : {}),
            },
          }
        : {}),

      ...(query
        ? {
            OR: [
              {
                id: {
                  contains: query,
                  mode: "insensitive",
                },
              },

              {
                providerRef: {
                  contains: query,
                  mode: "insensitive",
                },
              },

              {
                order: {
                  reference: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },

              {
                order: {
                  deliveryCountry: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },

              {
                order: {
                  dealer: {
                    companyName: {
                      contains: query,
                      mode: "insensitive",
                    },
                  },
                },
              },

              {
                order: {
                  dealer: {
                    contactName: {
                      contains: query,
                      mode: "insensitive",
                    },
                  },
                },
              },

              {
                order: {
                  dealer: {
                    user: {
                      email: {
                        contains: query,
                        mode: "insensitive",
                      },
                    },
                  },
                },
              },

              {
                order: {
                  items: {
                    some: {
                      product: {
                        name: {
                          contains:
                            query,

                          mode:
                            "insensitive",
                        },
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

  const [
    payments,
    dealers,
    currencyRows,
    totalPayments,
  ] = await Promise.all([
    prisma.payment.findMany({
      where,

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
        },
      },

      orderBy,

      take: 200,
    }),

    prisma.dealerProfile.findMany({
      select: {
        id: true,
        companyName: true,
        contactName: true,
      },

      orderBy: {
        companyName: "asc",
      },
    }),

    prisma.payment.findMany({
      select: {
        currency: true,
      },

      distinct: [
        "currency",
      ],

      orderBy: {
        currency: "asc",
      },
    }),

    prisma.payment.count(),
  ]);

  const serializedPayments: AdminPayment[] =
    payments.map(
      (payment) => ({
        id: payment.id,
        status:
          payment.status,

        provider:
          payment.provider,

        providerRef:
          payment.providerRef,

        amount:
          payment.amount
            ?.toString() ??
          null,

        currency:
          payment.currency,

        createdAt:
          payment.createdAt.toISOString(),

        updatedAt:
          payment.updatedAt.toISOString(),

        order: {
          id:
            payment.order.id,

          reference:
            payment.order
              .reference,

          status:
            payment.order.status,

          totalAmount:
            payment.order
              .totalAmount
              ?.toString() ??
            null,

          deliveryCountry:
            payment.order
              .deliveryCountry,

          deliveryAddress:
            payment.order
              .deliveryAddress,

          dealer: {
            id:
              payment.order
                .dealer.id,

            companyName:
              payment.order
                .dealer
                .companyName,

            contactName:
              payment.order
                .dealer
                .contactName,

            phone:
              payment.order
                .dealer.phone,

            country:
              payment.order
                .dealer.country,

            user: {
              email:
                payment.order
                  .dealer.user
                  .email,
            },
          },

          items:
            payment.order.items.map(
              (item) => ({
                id:
                  item.id,

                quantity:
                  item.quantity,

                product: {
                  name:
                    item.product
                      .name,

                  slug:
                    item.product
                      .slug,
                },
              }),
            ),
        },
      }),
    );

  const pendingCount =
    payments.filter(
      (payment) =>
        payment.status ===
          "PENDING" ||
        payment.status ===
          "PROCESSING",
    ).length;

  const paidCount =
    payments.filter(
      (payment) =>
        payment.status ===
        "PAID",
    ).length;

  const exceptionCount =
    payments.filter(
      (payment) =>
        payment.status ===
          "FAILED" ||
        payment.status ===
          "REFUNDED",
    ).length;

  const paidTotals =
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
      paidTotals.set(
        payment.currency,

        (paidTotals.get(
          payment.currency,
        ) || 0) +
          Number(
            payment.amount,
          ),
      );
    }
  }

  const activeFilters =
    Boolean(
      query ||
        selectedStatus ||
        selectedMethod ||
        selectedCurrency ||
        selectedOrderStatus ||
        selectedDealer ||
        fromDate ||
        toDate ||
        sort !== "newest",
    );

  return (
    <PortalShell
      admin
      title="Payment Management"
    >
      <section className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            "Results",
            payments.length,
          ],

          [
            "Pending Verification",
            pendingCount,
          ],

          [
            "Paid",
            paidCount,
          ],

          [
            "Exceptions",
            exceptionCount,
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

              <div className="mt-2 text-3xl font-black text-[#0a9c63]">
                {value}
              </div>
            </div>
          ),
        )}
      </section>

      {paidTotals.size >
        0 && (
        <section className="card mb-7 p-5">
          <div className="eyebrow">
            Verified Value in
            Current Results
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {[
              ...paidTotals.entries(),
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
                  <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
                    Paid ·{" "}
                    {currency}
                  </div>

                  <div className="mt-1 text-xl font-black text-[#08774f]">
                    {new Intl.NumberFormat(
                      "en-US",
                      {
                        style:
                          "currency",

                        currency,
                      },
                    ).format(
                      total,
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      )}

      <section className="card mb-7 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="eyebrow">
              Search and Filters
            </div>

            <h2 className="mt-2 text-xl font-black">
              Find Payment
              Records
            </h2>

            <p className="mt-2 text-xs text-[#71838b]">
              Showing{" "}
              {payments.length} of{" "}
              {totalPayments} total
              payment records.
            </p>
          </div>

          {activeFilters && (
            <Link
              href="/admin/payments"
              className="btn btn-secondary"
            >
              Clear Filters
            </Link>
          )}
        </div>

        <form className="mt-6 grid gap-4 lg:grid-cols-4">
          <div className="field lg:col-span-2">
            <label>Search</label>

            <input
              name="q"
              defaultValue={
                query
              }
              placeholder="Order reference, dealer, email, payment ID, provider reference or product..."
            />
          </div>

          <div className="field">
            <label>
              Payment Status
            </label>

            <select
              name="status"
              defaultValue={
                selectedStatus ||
                ""
              }
            >
              <option value="">
                All Payment
                Statuses
              </option>

              {paymentStatuses.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {statusLabel(
                      status,
                    )}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="field">
            <label>
              Payment Method
            </label>

            <select
              name="method"
              defaultValue={
                selectedMethod ||
                ""
              }
            >
              <option value="">
                All Methods
              </option>

              {paymentMethods.map(
                (method) => (
                  <option
                    key={method}
                    value={method}
                  >
                    {paymentMethodLabel(
                      method,
                    )}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="field">
            <label>Currency</label>

            <select
              name="currency"
              defaultValue={
                selectedCurrency
              }
            >
              <option value="">
                All Currencies
              </option>

              {currencyRows.map(
                (row) => (
                  <option
                    key={
                      row.currency
                    }
                    value={
                      row.currency
                    }
                  >
                    {
                      row.currency
                    }
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="field">
            <label>
              Order Status
            </label>

            <select
              name="orderStatus"
              defaultValue={
                selectedOrderStatus ||
                ""
              }
            >
              <option value="">
                All Order
                Statuses
              </option>

              {orderStatuses.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {statusLabel(
                      status,
                    )}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="field">
            <label>Dealer</label>

            <select
              name="dealer"
              defaultValue={
                selectedDealer
              }
            >
              <option value="">
                All Dealers
              </option>

              {dealers.map(
                (dealer) => (
                  <option
                    key={
                      dealer.id
                    }
                    value={
                      dealer.id
                    }
                  >
                    {
                      dealer.companyName
                    }{" "}
                    —{" "}
                    {
                      dealer.contactName
                    }
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="field">
            <label>Sort By</label>

            <select
              name="sort"
              defaultValue={
                sort
              }
            >
              <option value="newest">
                Newest First
              </option>

              <option value="oldest">
                Oldest First
              </option>

              <option value="amount_high">
                Highest Amount
              </option>

              <option value="amount_low">
                Lowest Amount
              </option>
            </select>
          </div>

          <div className="field">
            <label>
              Date From
            </label>

            <input
              type="date"
              name="from"
              defaultValue={
                filters.from ||
                ""
              }
            />
          </div>

          <div className="field">
            <label>Date To</label>

            <input
              type="date"
              name="to"
              defaultValue={
                filters.to ||
                ""
              }
            />
          </div>

          <div className="flex items-end lg:col-span-2">
            <button
              type="submit"
              className="btn btn-primary w-full"
            >
              Apply Search and
              Filters
            </button>
          </div>
        </form>
      </section>

      <PaymentManager
        payments={
          serializedPayments
        }
      />
    </PortalShell>
  );
}