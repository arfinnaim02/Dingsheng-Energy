"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { formatMoney } from "@/lib/pricing";

type DealerPayment = {
  id: string;
  status: string;
  provider: string | null;
  providerRef: string | null;
  amount: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;

  order: {
    id: string;
    reference: string;
    status: string;
    totalAmount: string | null;
    currency: string;
    deliveryCountry: string | null;
    deliveryAddress: string | null;
    createdAt: string;

    items: Array<{
      id: string;
      quantity: number;
      unitPrice: string | null;

      product: {
        name: string;
        slug: string;
        sku: string | null;
        unitLabel: string | null;
      };
    }>;
  };
};

type Props = {
  payments: DealerPayment[];
};

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function statusClass(status: string) {
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

function paymentMethodLabel(provider: string | null) {
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

export default function DealerPaymentManager({
  payments,
}: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [method, setMethod] = useState("ALL");
  const [dateRange, setDateRange] = useState("ALL");
  const [sort, setSort] = useState("NEWEST");

  const [expandedId, setExpandedId] = useState<
    string | null
  >(null);

  const filteredPayments = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    const now = Date.now();

    const days =
      dateRange === "30"
        ? 30
        : dateRange === "90"
          ? 90
          : dateRange === "365"
            ? 365
            : null;

    const filtered = payments.filter((payment) => {
      if (
        status !== "ALL" &&
        payment.status !== status
      ) {
        return false;
      }

      if (
        method !== "ALL" &&
        payment.provider !== method
      ) {
        return false;
      }

      if (days !== null) {
        const createdTime = new Date(
          payment.createdAt,
        ).getTime();

        const earliest =
          now - days * 24 * 60 * 60 * 1000;

        if (createdTime < earliest) {
          return false;
        }
      }

      if (!searchValue) {
        return true;
      }

      const searchable = [
        payment.id,
        payment.providerRef ?? "",
        payment.status,
        payment.provider ?? "",
        payment.order.reference,
        payment.order.status,
        payment.order.deliveryCountry ?? "",
        ...payment.order.items.flatMap((item) => [
          item.product.name,
          item.product.slug,
          item.product.sku ?? "",
        ]),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(searchValue);
    });

    return [...filtered].sort((first, second) => {
      const firstAmount = Number(
        first.amount ??
          first.order.totalAmount ??
          0,
      );

      const secondAmount = Number(
        second.amount ??
          second.order.totalAmount ??
          0,
      );

      if (sort === "OLDEST") {
        return (
          new Date(first.createdAt).getTime() -
          new Date(second.createdAt).getTime()
        );
      }

      if (sort === "AMOUNT_HIGH") {
        return secondAmount - firstAmount;
      }

      if (sort === "AMOUNT_LOW") {
        return firstAmount - secondAmount;
      }

      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      );
    });
  }, [
    payments,
    search,
    status,
    method,
    dateRange,
    sort,
  ]);

  function clearFilters() {
    setSearch("");
    setStatus("ALL");
    setMethod("ALL");
    setDateRange("ALL");
    setSort("NEWEST");
  }

  if (!payments.length) {
    return (
      <section className="card mt-7 p-10 text-center">
        <h2 className="text-2xl font-black">
          No payment records
        </h2>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#71838b]">
          A payment record will be created when you submit
          an order through checkout.
        </p>

        <Link
          href="/dealer/products"
          className="btn btn-primary mt-6"
        >
          Browse Dealer Products →
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-7">
      <div className="card p-5 md:p-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(230px,1fr)_170px_210px_160px_180px_auto]">
          <div className="field">
            <label>Search payments</label>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Order ID, product, reference..."
            />
          </div>

          <div className="field">
            <label>Status</label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">
                Processing
              </option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">
                Refunded
              </option>
            </select>
          </div>

          <div className="field">
            <label>Payment method</label>

            <select
              value={method}
              onChange={(event) =>
                setMethod(event.target.value)
              }
            >
              <option value="ALL">All methods</option>
              <option value="BANK_TRANSFER">
                Bank Transfer
              </option>
              <option value="LETTER_OF_CREDIT">
                Letter of Credit
              </option>
              <option value="APPROVED_CREDIT_TERMS">
                Approved Credit Terms
              </option>
              <option value="MANUAL_COMMERCIAL_AGREEMENT">
                Manual Agreement
              </option>
            </select>
          </div>

          <div className="field">
            <label>Date</label>

            <select
              value={dateRange}
              onChange={(event) =>
                setDateRange(event.target.value)
              }
            >
              <option value="ALL">All dates</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>

          <div className="field">
            <label>Sort</label>

            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value)
              }
            >
              <option value="NEWEST">
                Newest first
              </option>
              <option value="OLDEST">
                Oldest first
              </option>
              <option value="AMOUNT_HIGH">
                Highest amount
              </option>
              <option value="AMOUNT_LOW">
                Lowest amount
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="btn btn-secondary self-end"
          >
            Clear
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e5ece8] pt-4 text-xs text-[#71838b]">
          <span>
            Showing{" "}
            <strong className="text-[#17313d]">
              {filteredPayments.length}
            </strong>{" "}
            of{" "}
            <strong className="text-[#17313d]">
              {payments.length}
            </strong>{" "}
            payments
          </span>

          <span>
            Click a payment to view complete details.
          </span>
        </div>
      </div>

      {!filteredPayments.length ? (
        <div className="card mt-5 p-10 text-center">
          <h2 className="text-xl font-black">
            No matching payments
          </h2>

          <p className="mt-3 text-sm text-[#71838b]">
            Change your search or filters and try again.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="btn btn-secondary mt-5"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {filteredPayments.map((payment) => {
            const expanded =
              expandedId === payment.id;

            const amount =
              payment.amount !== null
                ? Number(payment.amount)
                : payment.order.totalAmount !== null
                  ? Number(
                      payment.order.totalAmount,
                    )
                  : null;

            const itemCount =
              payment.order.items.reduce(
                (total, item) =>
                  total + item.quantity,
                0,
              );

            return (
              <article
                key={payment.id}
                className="card overflow-hidden"
              >
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() =>
                    setExpandedId(
                      expanded
                        ? null
                        : payment.id,
                    )
                  }
                  className="grid w-full gap-4 p-5 text-left transition hover:bg-[#f8fbf9] md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm text-[#17313d]">
                        {payment.order.reference}
                      </strong>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.07em] ${statusClass(
                          payment.status,
                        )}`}
                      >
                        {statusLabel(
                          payment.status,
                        )}
                      </span>
                    </div>

                    <div className="mt-1 truncate text-xs text-[#657983]">
                      {paymentMethodLabel(
                        payment.provider,
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-[#71838b]">
                    <strong className="block text-[#17313d]">
                      {itemCount}
                    </strong>
                    item{itemCount === 1 ? "" : "s"}
                  </div>

                  <div className="text-xs text-[#71838b] md:text-right">
                    <strong className="block text-sm text-[#08774f]">
                      {amount !== null
                        ? formatMoney(
                            amount,
                            payment.currency,
                          )
                        : "Amount pending"}
                    </strong>

                    {new Date(
                      payment.createdAt,
                    ).toLocaleDateString()}
                  </div>

                  <span className="text-lg font-black text-[#0a9c63]">
                    {expanded ? "−" : "+"}
                  </span>
                </button>

                {expanded && (
                  <div className="border-t border-[#e1ebe7] p-6">
                    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                      <div>
                        <div className="eyebrow">
                          Payment details
                        </div>

                        <h2 className="mt-2 text-xl font-black">
                          {payment.order.reference}
                        </h2>

                        <p className="mt-2 text-xs text-[#71838b]">
                          Created{" "}
                          {new Date(
                            payment.createdAt,
                          ).toLocaleString(
                            "en-US",
                            {
                              dateStyle:
                                "medium",
                              timeStyle:
                                "short",
                            },
                          )}
                        </p>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                          <div className="rounded-xl border border-[#dfe8e4] bg-[#f8fbf9] p-5 text-xs leading-6 text-[#657983]">
                            <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                              Payment
                            </div>

                            <div className="mt-3">
                              <strong>Method:</strong>{" "}
                              {paymentMethodLabel(
                                payment.provider,
                              )}
                            </div>

                            <div className="mt-1">
                              <strong>Status:</strong>{" "}
                              {statusLabel(
                                payment.status,
                              )}
                            </div>

                            <div className="mt-1 break-all">
                              <strong>
                                Provider reference:
                              </strong>{" "}
                              {payment.providerRef ||
                                "Not provided"}
                            </div>
                          </div>

                          <div className="rounded-xl border border-[#dfe8e4] bg-[#f8fbf9] p-5 text-xs leading-6 text-[#657983]">
                            <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                              Related order
                            </div>

                            <div className="mt-3">
                              <strong>
                                Order status:
                              </strong>{" "}
                              {statusLabel(
                                payment.order.status,
                              )}
                            </div>

                            <div className="mt-1">
                              <strong>Items:</strong>{" "}
                              {itemCount}
                            </div>

                            <div className="mt-1">
                              <strong>Delivery:</strong>{" "}
                              {payment.order
                                .deliveryCountry ||
                                "Not provided"}
                            </div>
                          </div>
                        </div>

                        <h3 className="mt-6 font-black">
                          Order products
                        </h3>

                        <div className="table-wrap mt-4">
                          <table>
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                              </tr>
                            </thead>

                            <tbody>
                              {payment.order.items.map(
                                (item) => (
                                  <tr key={item.id}>
                                    <td>
                                      <Link
                                        href={`/dealer/products/${item.product.slug}`}
                                        className="font-black hover:text-[#0a9c63]"
                                      >
                                        {
                                          item.product
                                            .name
                                        }
                                      </Link>

                                      <div className="mt-1 text-[10px] text-[#82938c]">
                                        {item.product
                                          .sku ||
                                          item.product
                                            .slug}
                                      </div>
                                    </td>

                                    <td>
                                      {item.quantity}
                                    </td>

                                    <td>
                                      {item.unitPrice !==
                                      null
                                        ? formatMoney(
                                            Number(
                                              item.unitPrice,
                                            ),
                                            payment.order
                                              .currency,
                                          )
                                        : "—"}
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <aside className="space-y-5">
                        <div className="rounded-xl border border-[#cfe9dd] bg-[#edf9f3] p-5">
                          <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#0a7f55]">
                            Payment amount
                          </div>

                          <div className="mt-2 text-2xl font-black text-[#08774f]">
                            {amount !== null
                              ? formatMoney(
                                  amount,
                                  payment.currency,
                                )
                              : "Amount pending"}
                          </div>

                          <span
                            className={`mt-4 inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[.08em] ${statusClass(
                              payment.status,
                            )}`}
                          >
                            {statusLabel(
                              payment.status,
                            )}
                          </span>
                        </div>

                        <div className="rounded-xl border border-[#dfe8e4] bg-white p-5">
                          <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
                            Verification
                          </div>

                          <p className="mt-3 text-xs leading-6 text-[#657983]">
                            {payment.status ===
                            "PAID"
                              ? "Payment has been manually verified by Dingsheng Energy."
                              : payment.status ===
                                  "FAILED"
                                ? "Payment verification was unsuccessful. Contact the commercial team for assistance."
                                : payment.status ===
                                    "REFUNDED"
                                  ? "This payment has been marked as refunded."
                                  : "Payment is awaiting confirmation by the Dingsheng Energy commercial team."}
                          </p>
                        </div>

                        <Link
                          href="/dealer/orders"
                          className="btn btn-secondary w-full"
                        >
                          View Related Order →
                        </Link>
                      </aside>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}