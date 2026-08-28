"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  OrderPaymentControl,
} from "@/components/admin/OrderPaymentControl";

type OrderStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "PROCESSING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

type Order = {
  id: string;
  reference: string;
  status: OrderStatus;
  currency: string;

  totalAmount:
    | string
    | null;

  deliveryCountry:
    | string
    | null;

  deliveryAddress:
    | string
    | null;

  createdAt: string;

  dealer: {
    id: string;
    companyName: string;
    contactName: string;

    user: {
      email: string;
    };
  };

  items: Array<{
    id: string;
    quantity: number;

    unitPrice:
      | string
      | null;

    product: {
      name: string;
      slug: string;
    };
  }>;

  payments: Array<{
    id: string;
    status: PaymentStatus;

    provider:
      | string
      | null;

    providerRef:
      | string
      | null;

    amount:
      | string
      | null;

    currency: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

const statusOptions:
  OrderStatus[] = [
    "PENDING",
    "AWAITING_PAYMENT",
    "PROCESSING",
    "SHIPPED",
    "COMPLETED",
    "CANCELLED",
  ];

function money(
  amount:
    | string
    | null,
  currency: string,
) {
  if (amount === null) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency,
    },
  ).format(Number(amount));
}

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

function statusClass(
  status: OrderStatus,
) {
  switch (status) {
    case "PENDING":
      return "bg-[#fff6dc] text-[#926900]";

    case "AWAITING_PAYMENT":
      return "bg-[#fff0d9] text-[#9a5f00]";

    case "PROCESSING":
      return "bg-[#e7f2ff] text-[#27659a]";

    case "SHIPPED":
      return "bg-[#eeeaff] text-[#6550a3]";

    case "COMPLETED":
      return "bg-[#e7f7ef] text-[#087a50]";

    case "CANCELLED":
      return "bg-[#fbeaea] text-[#a43e3e]";
  }
}

function paymentStatusClass(
  status: PaymentStatus,
) {
  switch (status) {
    case "PAID":
      return "bg-[#e7f7ef] text-[#087a50]";

    case "FAILED":
      return "bg-[#fbeaea] text-[#a43e3e]";

    case "REFUNDED":
      return "bg-[#eeeaff] text-[#6550a3]";

    case "PROCESSING":
      return "bg-[#e7f2ff] text-[#27659a]";

    default:
      return "bg-[#fff6dc] text-[#926900]";
  }
}

function paymentMethodLabel(
  provider:
    | string
    | null,
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

export function OrderManager({
  orders,
}: {
  orders: Order[];
}) {
  const router = useRouter();

  const [
    expandedId,
    setExpandedId,
  ] = useState<
    string | null
  >(null);

  const [
    selected,
    setSelected,
  ] = useState<
    Record<
      string,
      OrderStatus
    >
  >(
    Object.fromEntries(
      orders.map(
        (order) => [
          order.id,
          order.status,
        ],
      ),
    ),
  );

  const [
    workingId,
    setWorkingId,
  ] = useState<
    string | null
  >(null);

  const [error, setError] =
    useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  function toggleOrder(
    orderId: string,
  ) {
    setExpandedId(
      (current) =>
        current === orderId
          ? null
          : orderId,
    );
  }

  async function updateStatus(
    orderId: string,
  ) {
    setWorkingId(orderId);
    setError("");
    setMessage("");

    try {
      const response =
        await fetch(
          `/api/admin/orders/${orderId}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status:
                  selected[
                    orderId
                  ],
              }),
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to update order status.",
        );
      }

      setMessage(
        `Order ${result.reference || ""} updated to ${statusLabel(
          result.status,
        )}.`,
      );

      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof
          Error
          ? updateError.message
          : "Unable to update order status.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  if (!orders.length) {
    return (
      <div className="card p-10 text-center">
        <h2 className="text-xl font-black">
          No matching orders
        </h2>

        <p className="mt-3 text-sm text-[#71838b]">
          No orders match the
          current search and
          filters.
        </p>

        <Link
          href="/admin/orders"
          className="btn btn-secondary mt-5 inline-flex"
        >
          Clear Filters
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {orders.map(
        (order) => {
          const expanded =
            expandedId ===
            order.id;

          const latestPayment =
            order.payments[0];

          const paymentStatus:
            PaymentStatus =
            latestPayment
              ?.status ||
            "PENDING";

          const itemQuantity =
            order.items.reduce(
              (
                total,
                item,
              ) =>
                total +
                item.quantity,

              0,
            );

          return (
            <article
              key={order.id}
              className={`card overflow-hidden transition ${
                expanded
                  ? "ring-1 ring-[#b8d9ca]"
                  : "hover:border-[#b8d9ca]"
              }`}
            >
              <button
                type="button"
                aria-expanded={
                  expanded
                }
                aria-controls={`order-details-${order.id}`}
                onClick={() =>
                  toggleOrder(
                    order.id,
                  )
                }
                className="grid w-full items-center gap-4 p-5 text-left transition hover:bg-[#f8fbf9] md:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-black text-[#17313d]">
                      {
                        order.reference
                      }
                    </span>

                    <span className="truncate text-sm font-bold text-[#526872]">
                      {
                        order.dealer
                          .companyName
                      }
                    </span>
                  </div>

                  <div className="mt-1 truncate text-xs text-[#829198]">
                    {
                      order.dealer
                        .contactName
                    }{" "}
                    ·{" "}
                    {
                      order.dealer
                        .user.email
                    }{" "}
                    · {itemQuantity}{" "}
                    item
                    {itemQuantity === 1
                      ? ""
                      : "s"}
                  </div>
                </div>

                <div className="text-left md:text-right">
                  <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                    Total
                  </div>

                  <div className="mt-1 font-black text-[#08774f]">
                    {money(
                      order.totalAmount,
                      order.currency,
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[.06em] ${statusClass(
                      order.status,
                    )}`}
                  >
                    {statusLabel(
                      order.status,
                    )}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[.06em] ${paymentStatusClass(
                      paymentStatus,
                    )}`}
                  >
                    {statusLabel(
                      paymentStatus,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <span className="text-xs text-[#829198]">
                    {new Date(
                      order.createdAt,
                    ).toLocaleDateString()}
                  </span>

                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border border-[#d8e4df] text-lg font-black text-[#0a7c55] transition ${
                      expanded
                        ? "rotate-180 bg-[#eff9f4]"
                        : "bg-white"
                    }`}
                  >
                    ⌄
                  </span>
                </div>
              </button>

              {expanded && (
                <div
                  id={`order-details-${order.id}`}
                  className="border-t border-[#e1ebe7]"
                >
                  <header className="flex flex-wrap items-start justify-between gap-5 bg-[#fafcfb] px-6 py-5">
                    <div>
                      <div className="eyebrow">
                        Dealer
                      </div>

                      <h2 className="mt-2 text-xl font-black">
                        <Link
                          href={`/admin/dealers/${order.dealer.id}`}
                          className="transition hover:text-[#0a9c63]"
                        >
                          {
                            order
                              .dealer
                              .companyName
                          }
                        </Link>
                      </h2>

                      <p className="mt-2 text-xs text-[#71838b]">
                        {
                          order.dealer
                            .contactName
                        }{" "}
                        ·{" "}
                        {
                          order.dealer
                            .user.email
                        }
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-[#08774f]">
                        {money(
                          order.totalAmount,
                          order.currency,
                        )}
                      </div>

                      <p className="mt-2 text-xs text-[#829198]">
                        Created{" "}
                        {new Date(
                          order.createdAt,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </header>

                  <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div>
                      <h3 className="font-black">
                        Order Items
                      </h3>

                      <div className="table-wrap mt-4">
                        <table>
                          <thead>
                            <tr>
                              <th>
                                Product
                              </th>

                              <th>
                                Quantity
                              </th>

                              <th>
                                Unit Price
                              </th>

                              <th>
                                Subtotal
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {order.items.map(
                              (
                                item,
                              ) => {
                                const unitPrice =
                                  item.unitPrice !==
                                  null
                                    ? Number(
                                        item.unitPrice,
                                      )
                                    : null;

                                const subtotal =
                                  unitPrice !==
                                  null
                                    ? unitPrice *
                                      item.quantity
                                    : null;

                                return (
                                  <tr
                                    key={
                                      item.id
                                    }
                                  >
                                    <td>
                                      <strong>
                                        {
                                          item
                                            .product
                                            .name
                                        }
                                      </strong>

                                      <div className="mt-1 text-[10px] text-[#82938c]">
                                        {
                                          item
                                            .product
                                            .slug
                                        }
                                      </div>
                                    </td>

                                    <td>
                                      {
                                        item.quantity
                                      }
                                    </td>

                                    <td>
                                      {money(
                                        item.unitPrice,
                                        order.currency,
                                      )}
                                    </td>

                                    <td className="font-black">
                                      {subtotal !==
                                      null
                                        ? money(
                                            subtotal.toString(),
                                            order.currency,
                                          )
                                        : "—"}
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg bg-[#f6f8f7] p-4 text-xs leading-6 text-[#657983]">
                          <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                            Delivery
                          </div>

                          <div className="mt-2">
                            <strong>
                              {order.deliveryCountry ||
                                "Not provided"}
                            </strong>
                          </div>

                          <div className="mt-1 whitespace-pre-wrap">
                            {order.deliveryAddress ||
                              "No delivery address"}
                          </div>
                        </div>

                        <div className="rounded-lg bg-[#f6f8f7] p-4 text-xs leading-6 text-[#657983]">
                          <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                            Payment
                            Details
                          </div>

                          <div className="mt-2">
                            <strong>
                              Method:
                            </strong>{" "}
                            {paymentMethodLabel(
                              latestPayment
                                ?.provider ??
                                null,
                            )}
                          </div>

                          <div className="mt-1">
                            <strong>
                              Amount:
                            </strong>{" "}
                            {money(
                              latestPayment
                                ?.amount ??
                                order.totalAmount,

                              latestPayment
                                ?.currency ||
                                order.currency,
                            )}
                          </div>

                          <div className="mt-1">
                            <strong>
                              Status:
                            </strong>{" "}
                            {statusLabel(
                              paymentStatus,
                            )}
                          </div>

                          {latestPayment
                            ?.providerRef && (
                            <div className="mt-1">
                              <strong>
                                Reference:
                              </strong>{" "}
                              {
                                latestPayment.providerRef
                              }
                            </div>
                          )}

                          <Link
                            href={`/admin/payments?q=${encodeURIComponent(
                              order.reference,
                            )}`}
                            className="mt-3 inline-block font-black text-[#0a9c63] hover:underline"
                          >
                            View Payment
                            Record →
                          </Link>
                        </div>
                      </div>
                    </div>

                    <aside>
                      <div className="text-xs font-black uppercase tracking-[.08em] text-[#71838b]">
                        Order
                        Management
                      </div>

                      <label className="mt-4 block text-xs font-black text-[#526872]">
                        Order Status
                      </label>

                      <select
                        value={
                          selected[
                            order.id
                          ]
                        }
                        disabled={
                          workingId ===
                          order.id
                        }
                        onChange={(
                          event,
                        ) =>
                          setSelected(
                            (
                              current,
                            ) => ({
                              ...current,

                              [order.id]:
                                event
                                  .target
                                  .value as OrderStatus,
                            }),
                          )
                        }
                        className="mt-2 w-full rounded-md border border-[#d8e4df] bg-white px-3 py-3 text-sm"
                      >
                        {statusOptions.map(
                          (
                            status,
                          ) => (
                            <option
                              key={
                                status
                              }
                              value={
                                status
                              }
                            >
                              {statusLabel(
                                status,
                              )}
                            </option>
                          ),
                        )}
                      </select>

                      <button
                        type="button"
                        disabled={
                          workingId ===
                          order.id
                        }
                        onClick={() =>
                          void updateStatus(
                            order.id,
                          )
                        }
                        className="btn btn-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {workingId ===
                        order.id
                          ? "Updating Order..."
                          : "Update Order Status"}
                      </button>

                      <OrderPaymentControl
                        orderId={
                          order.id
                        }
                        initialStatus={
                          paymentStatus ===
                          "PAID"
                            ? "PAID"
                            : "PENDING"
                        }
                        provider={
                          latestPayment
                            ?.provider ??
                          null
                        }
                      />

                      <p className="mt-4 text-xs leading-5 text-[#71838b]">
                        Completed and
                        cancelled orders
                        remain editable if
                        a correction is
                        required.
                      </p>
                    </aside>
                  </div>
                </div>
              )}
            </article>
          );
        },
      )}
    </div>
  );
}