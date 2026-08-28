"use client";

import Link from "next/link";
import { useState } from "react";

import {
  OrderPaymentControl,
} from "@/components/admin/OrderPaymentControl";

type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

type Payment = {
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

  order: {
    id: string;
    reference: string;
    status: string;

    totalAmount:
      | string
      | null;

    deliveryCountry:
      | string
      | null;

    deliveryAddress:
      | string
      | null;

    dealer: {
      id: string;
      companyName: string;
      contactName: string;

      phone:
        | string
        | null;

      country:
        | string
        | null;

      user: {
        email: string;
      };
    };

    items: Array<{
      id: string;
      quantity: number;

      product: {
        name: string;
        slug: string;
      };
    }>;
  };
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

function statusClass(
  status: PaymentStatus,
) {
  switch (status) {
    case "PAID":
      return "bg-[#e7f7ef] text-[#087a50]";

    case "PROCESSING":
      return "bg-[#e7f2ff] text-[#27659a]";

    case "FAILED":
      return "bg-[#fbeaea] text-[#a43e3e]";

    case "REFUNDED":
      return "bg-[#eeeaff] text-[#6550a3]";

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

function money(
  amount:
    | string
    | null,
  currency: string,
) {
  if (amount === null) {
    return "Amount pending";
  }

  try {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency,
      },
    ).format(Number(amount));
  } catch {
    return `${currency} ${Number(
      amount,
    ).toFixed(2)}`;
  }
}

export default function PaymentManager({
  payments,
}: {
  payments: Payment[];
}) {
  const [
    expandedId,
    setExpandedId,
  ] = useState<
    string | null
  >(null);

  function togglePayment(
    paymentId: string,
  ) {
    setExpandedId(
      (current) =>
        current === paymentId
          ? null
          : paymentId,
    );
  }

  if (!payments.length) {
    return (
      <div className="card p-10 text-center">
        <h2 className="text-xl font-black">
          No matching payments
        </h2>

        <p className="mt-3 text-sm text-[#71838b]">
          No payment records
          match the current search
          and filters.
        </p>

        <Link
          href="/admin/payments"
          className="btn btn-secondary mt-5 inline-flex"
        >
          Clear Filters
        </Link>
      </div>
    );
  }

  return (
    <section className="grid gap-4">
      {payments.map(
        (payment) => {
          const expanded =
            expandedId ===
            payment.id;

          const amount =
            payment.amount ??
            payment.order
              .totalAmount;

          const totalUnits =
            payment.order.items.reduce(
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
              key={payment.id}
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
                aria-controls={`payment-details-${payment.id}`}
                onClick={() =>
                  togglePayment(
                    payment.id,
                  )
                }
                className="grid w-full items-center gap-4 p-5 text-left transition hover:bg-[#f8fbf9] md:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-black text-[#17313d]">
                      {
                        payment.order
                          .reference
                      }
                    </span>

                    <span className="truncate text-sm font-bold text-[#526872]">
                      {
                        payment.order
                          .dealer
                          .companyName
                      }
                    </span>
                  </div>

                  <div className="mt-1 truncate text-xs text-[#829198]">
                    {paymentMethodLabel(
                      payment.provider,
                    )}{" "}
                    ·{" "}
                    {
                      payment.order
                        .dealer
                        .contactName
                    }{" "}
                    · {totalUnits}{" "}
                    unit
                    {totalUnits === 1
                      ? ""
                      : "s"}
                  </div>
                </div>

                <div className="text-left md:text-right">
                  <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                    Amount
                  </div>

                  <div className="mt-1 font-black text-[#08774f]">
                    {money(
                      amount,
                      payment.currency,
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[.06em] ${statusClass(
                      payment.status,
                    )}`}
                  >
                    {statusLabel(
                      payment.status,
                    )}
                  </span>

                  <span className="rounded-full bg-[#edf1f3] px-3 py-1 text-[10px] font-black uppercase tracking-[.06em] text-[#526872]">
                    Order:{" "}
                    {statusLabel(
                      payment.order
                        .status,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <span className="text-xs text-[#829198]">
                    {new Date(
                      payment.createdAt,
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
                  id={`payment-details-${payment.id}`}
                  className="border-t border-[#e1ebe7]"
                >
                  <header className="flex flex-wrap items-start justify-between gap-5 bg-[#fafcfb] px-6 py-5">
                    <div>
                      <div className="eyebrow">
                        Payment Record
                      </div>

                      <h2 className="mt-2 text-xl font-black">
                        <Link
                          href={`/admin/dealers/${payment.order.dealer.id}`}
                          className="transition hover:text-[#0a9c63]"
                        >
                          {
                            payment.order
                              .dealer
                              .companyName
                          }
                        </Link>
                      </h2>

                      <p className="mt-2 text-xs text-[#71838b]">
                        {
                          payment.order
                            .dealer
                            .contactName
                        }{" "}
                        ·{" "}
                        {
                          payment.order
                            .dealer.user
                            .email
                        }
                      </p>

                      <p className="mt-1 text-xs text-[#829198]">
                        Payment ID:{" "}
                        {payment.id}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-[#08774f]">
                        {money(
                          amount,
                          payment.currency,
                        )}
                      </div>

                      <span
                        className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[.08em] ${statusClass(
                          payment.status,
                        )}`}
                      >
                        {statusLabel(
                          payment.status,
                        )}
                      </span>
                    </div>
                  </header>

                  <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-2">
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
                              payment.provider,
                            )}
                          </div>

                          <div className="mt-1">
                            <strong>
                              Status:
                            </strong>{" "}
                            {statusLabel(
                              payment.status,
                            )}
                          </div>

                          <div className="mt-1">
                            <strong>
                              Currency:
                            </strong>{" "}
                            {
                              payment.currency
                            }
                          </div>

                          <div className="mt-1">
                            <strong>
                              Provider
                              Reference:
                            </strong>{" "}
                            {payment.providerRef ||
                              "Not provided"}
                          </div>

                          <div className="mt-1">
                            <strong>
                              Created:
                            </strong>{" "}
                            {new Date(
                              payment.createdAt,
                            ).toLocaleString()}
                          </div>

                          <div className="mt-1">
                            <strong>
                              Updated:
                            </strong>{" "}
                            {new Date(
                              payment.updatedAt,
                            ).toLocaleString()}
                          </div>
                        </div>

                        <div className="rounded-lg bg-[#f6f8f7] p-4 text-xs leading-6 text-[#657983]">
                          <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                            Related Order
                          </div>

                          <div className="mt-2">
                            <strong>
                              Reference:
                            </strong>{" "}
                            {
                              payment.order
                                .reference
                            }
                          </div>

                          <div className="mt-1">
                            <strong>
                              Order Status:
                            </strong>{" "}
                            {statusLabel(
                              payment.order
                                .status,
                            )}
                          </div>

                          <div className="mt-1">
                            <strong>
                              Total Units:
                            </strong>{" "}
                            {totalUnits}
                          </div>

                          <div className="mt-1">
                            <strong>
                              Delivery:
                            </strong>{" "}
                            {payment.order
                              .deliveryCountry ||
                              "Not provided"}
                          </div>

                          <Link
                            href={`/admin/orders?q=${encodeURIComponent(
                              payment.order
                                .reference,
                            )}`}
                            className="mt-3 inline-block font-black text-[#0a9c63] hover:underline"
                          >
                            View Related
                            Order →
                          </Link>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-black uppercase tracking-[.08em] text-[#71838b]">
                          Order Products
                        </div>

                        <div className="table-wrap mt-3">
                          <table>
                            <thead>
                              <tr>
                                <th>
                                  Product
                                </th>

                                <th>
                                  Quantity
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {payment.order.items.map(
                                (
                                  item,
                                ) => (
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

                                      <div className="mt-1 text-[10px] text-[#829198]">
                                        {
                                          item
                                            .product
                                            .slug
                                        }
                                      </div>
                                    </td>

                                    <td className="font-black">
                                      {
                                        item.quantity
                                      }
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="rounded-lg border border-[#e1ebe7] p-4 text-xs leading-6 text-[#657983]">
                        <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                          Dealer Contact
                        </div>

                        <div className="mt-2">
                          <strong>
                            Contact:
                          </strong>{" "}
                          {
                            payment.order
                              .dealer
                              .contactName
                          }
                        </div>

                        <div className="mt-1">
                          <strong>
                            Email:
                          </strong>{" "}
                          {
                            payment.order
                              .dealer.user
                              .email
                          }
                        </div>

                        <div className="mt-1">
                          <strong>
                            Phone:
                          </strong>{" "}
                          {payment.order
                            .dealer.phone ||
                            "Not provided"}
                        </div>

                        <div className="mt-1">
                          <strong>
                            Country:
                          </strong>{" "}
                          {payment.order
                            .dealer.country ||
                            "Not provided"}
                        </div>
                      </div>
                    </div>

                    <aside>
                      <OrderPaymentControl
                        orderId={
                          payment.order
                            .id
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

                      <Link
                        href={`/admin/dealers/${payment.order.dealer.id}`}
                        className="btn btn-secondary mt-4 block w-full text-center"
                      >
                        View Dealer
                        Profile
                      </Link>
                    </aside>
                  </div>
                </div>
              )}
            </article>
          );
        },
      )}
    </section>
  );
}