import type {
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";

import Link from "next/link";

import {
  OrderManager,
} from "@/components/admin/OrderManager";

import {
  PortalShell,
} from "@/components/PortalShell";

import {
  prisma,
} from "@/lib/prisma";

export const dynamic =
  "force-dynamic";

const orderStatuses:
  OrderStatus[] = [
    "PENDING",
    "AWAITING_PAYMENT",
    "PROCESSING",
    "SHIPPED",
    "COMPLETED",
    "CANCELLED",
  ];

const paymentStatuses:
  PaymentStatus[] = [
    "PENDING",
    "PROCESSING",
    "PAID",
    "FAILED",
    "REFUNDED",
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
    paymentStatus?: string;
    paymentMethod?: string;
    dealer?: string;
    country?: string;
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

export default async function AdminOrdersPage({
  searchParams,
}: PageProps) {
  const filters =
    await searchParams;

  const query =
    filters.q?.trim() ||
    "";

  const selectedStatus =
    orderStatuses.includes(
      filters.status as OrderStatus,
    )
      ? (filters.status as OrderStatus)
      : undefined;

  const selectedPaymentStatus =
    paymentStatuses.includes(
      filters.paymentStatus as PaymentStatus,
    )
      ? (filters.paymentStatus as PaymentStatus)
      : undefined;

  const selectedPaymentMethod =
    paymentMethods.includes(
      filters.paymentMethod ||
        "",
    )
      ? filters.paymentMethod
      : undefined;

  const selectedDealer =
    filters.dealer?.trim() ||
    "";

  const selectedCountry =
    filters.country?.trim() ||
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
    Prisma.OrderOrderByWithRelationInput =
    sort === "oldest"
      ? {
          createdAt: "asc",
        }
      : sort === "amount_high"
        ? {
            totalAmount:
              "desc",
          }
        : sort === "amount_low"
          ? {
              totalAmount:
                "asc",
            }
          : {
              createdAt:
                "desc",
            };

  const where:
    Prisma.OrderWhereInput =
    {
      ...(selectedStatus
        ? {
            status:
              selectedStatus,
          }
        : {}),

      ...(selectedDealer
        ? {
            dealerId:
              selectedDealer,
          }
        : {}),

      ...(selectedCountry
        ? {
            deliveryCountry:
              selectedCountry,
          }
        : {}),

      ...(selectedPaymentStatus ||
      selectedPaymentMethod
        ? {
            payments: {
              some: {
                ...(selectedPaymentStatus
                  ? {
                      status:
                        selectedPaymentStatus,
                    }
                  : {}),

                ...(selectedPaymentMethod
                  ? {
                      provider:
                        selectedPaymentMethod,
                    }
                  : {}),
              },
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
                reference: {
                  contains: query,
                  mode: "insensitive",
                },
              },

              {
                deliveryCountry: {
                  contains: query,
                  mode: "insensitive",
                },
              },

              {
                deliveryAddress: {
                  contains: query,
                  mode: "insensitive",
                },
              },

              {
                dealer: {
                  companyName: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },

              {
                dealer: {
                  contactName: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },

              {
                dealer: {
                  user: {
                    email: {
                      contains: query,
                      mode: "insensitive",
                    },
                  },
                },
              },

              {
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

              {
                items: {
                  some: {
                    product: {
                      slug: {
                        contains:
                          query,

                        mode:
                          "insensitive",
                      },
                    },
                  },
                },
              },

              {
                payments: {
                  some: {
                    providerRef: {
                      contains:
                        query,

                      mode:
                        "insensitive",
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

  const [
    orders,
    dealers,
    countryRows,
    totalOrders,
  ] = await Promise.all([
    prisma.order.findMany({
      where,

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
            createdAt:
              "desc",
          },

          take: 1,
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

    prisma.order.findMany({
      where: {
        deliveryCountry: {
          not: null,
        },
      },

      select: {
        deliveryCountry:
          true,
      },

      distinct: [
        "deliveryCountry",
      ],

      orderBy: {
        deliveryCountry:
          "asc",
      },
    }),

    prisma.order.count(),
  ]);

  const serializedOrders =
    orders.map((order) => ({
      ...order,

      totalAmount:
        order.totalAmount
          ?.toString() ??
        null,

      createdAt:
        order.createdAt.toISOString(),

      updatedAt:
        order.updatedAt.toISOString(),

      items:
        order.items.map(
          (item) => ({
            ...item,

            unitPrice:
              item.unitPrice
                ?.toString() ??
              null,
          }),
        ),

      payments:
        order.payments.map(
          (payment) => ({
            ...payment,

            amount:
              payment.amount
                ?.toString() ??
              null,

            createdAt:
              payment.createdAt.toISOString(),

            updatedAt:
              payment.updatedAt.toISOString(),
          }),
        ),
    }));

  const pending =
    orders.filter(
      (order) =>
        order.status ===
          "PENDING" ||
        order.status ===
          "AWAITING_PAYMENT",
    ).length;

  const processing =
    orders.filter(
      (order) =>
        order.status ===
        "PROCESSING",
    ).length;

  const completed =
    orders.filter(
      (order) =>
        order.status ===
        "COMPLETED",
    ).length;

  const filteredValue =
    orders.reduce(
      (
        total,
        order,
      ) =>
        total +
        Number(
          order.totalAmount ||
            0,
        ),

      0,
    );

  const activeFilters =
    Boolean(
      query ||
        selectedStatus ||
        selectedPaymentStatus ||
        selectedPaymentMethod ||
        selectedDealer ||
        selectedCountry ||
        fromDate ||
        toDate ||
        sort !== "newest",
    );

  return (
    <PortalShell
      admin
      title="Order Management"
    >
      <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          [
            "Results",
            orders.length,
          ],

          [
            "Pending",
            pending,
          ],

          [
            "Processing",
            processing,
          ],

          [
            "Completed",
            completed,
          ],

          [
            "Result Value",
            filteredValue.toLocaleString(
              "en-US",
              {
                maximumFractionDigits:
                  2,
              },
            ),
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
      </div>

      <section className="card mb-7 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="eyebrow">
              Search and filters
            </div>

            <h2 className="mt-2 text-xl font-black">
              Find dealer orders
            </h2>

            <p className="mt-2 text-xs text-[#71838b]">
              Showing{" "}
              {orders.length} of{" "}
              {totalOrders} total
              orders.
            </p>
          </div>

          {activeFilters && (
            <Link
              href="/admin/orders"
              className="btn btn-secondary"
            >
              Clear Filters
            </Link>
          )}
        </div>

        <form className="mt-6 grid gap-4 lg:grid-cols-4">
          <div className="field lg:col-span-2">
            <label>
              Search
            </label>

            <input
              name="q"
              defaultValue={
                query
              }
              placeholder="Order reference, dealer, email, product, country or payment reference..."
            />
          </div>

          <div className="field">
            <label>
              Order Status
            </label>

            <select
              name="status"
              defaultValue={
                selectedStatus ||
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
            <label>
              Payment Status
            </label>

            <select
              name="paymentStatus"
              defaultValue={
                selectedPaymentStatus ||
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
              name="paymentMethod"
              defaultValue={
                selectedPaymentMethod ||
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
            <label>
              Delivery Country
            </label>

            <select
              name="country"
              defaultValue={
                selectedCountry
              }
            >
              <option value="">
                All Countries
              </option>

              {countryRows.map(
                (row) =>
                  row.deliveryCountry && (
                    <option
                      key={
                        row.deliveryCountry
                      }
                      value={
                        row.deliveryCountry
                      }
                    >
                      {
                        row.deliveryCountry
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
                Highest Value
              </option>

              <option value="amount_low">
                Lowest Value
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

      <OrderManager
        orders={
          serializedOrders
        }
      />
    </PortalShell>
  );
}