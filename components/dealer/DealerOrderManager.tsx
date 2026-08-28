"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { formatMoney } from "@/lib/pricing";

type DealerOrder = {
  id: string;
  reference: string;
  status: string;
  currency: string;
  totalAmount: string | null;
  deliveryCountry: string | null;
  deliveryAddress: string | null;
  createdAt: string;
  updatedAt: string;

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

  payments: Array<{
    id: string;
    status: string;
    amount: string | null;
    currency: string;
    provider: string | null;
    createdAt: string;
  }>;
};

type Props = {
  orders: DealerOrder[];
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

    default:
      return "bg-[#eef1f2] text-[#657983]";
  }
}

function statusDescription(status: string) {
  switch (status) {
    case "PENDING":
      return "Your order has been received and is awaiting commercial review.";

    case "AWAITING_PAYMENT":
      return "The order is awaiting payment or confirmation of commercial terms.";

    case "PROCESSING":
      return "Your order has been approved and is currently being processed.";

    case "SHIPPED":
      return "Your order has been dispatched.";

    case "COMPLETED":
      return "This order has been completed.";

    case "CANCELLED":
      return "This order has been cancelled.";

    default:
      return "Contact Dingsheng Energy for the latest order information.";
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

export default function DealerOrderManager({
  orders,
}: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [dateRange, setDateRange] = useState("ALL");
  const [sort, setSort] = useState("NEWEST");

  const [expandedId, setExpandedId] = useState<
    string | null
  >(null);

  const filteredOrders = useMemo(() => {
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

    const filtered = orders.filter((order) => {
      if (
        status !== "ALL" &&
        order.status !== status
      ) {
        return false;
      }

      if (days !== null) {
        const createdTime = new Date(
          order.createdAt,
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
        order.reference,
        order.status,
        order.deliveryCountry ?? "",
        order.deliveryAddress ?? "",
        ...order.items.flatMap((item) => [
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
      if (sort === "OLDEST") {
        return (
          new Date(first.createdAt).getTime() -
          new Date(second.createdAt).getTime()
        );
      }

      if (sort === "AMOUNT_HIGH") {
        return (
          Number(second.totalAmount ?? 0) -
          Number(first.totalAmount ?? 0)
        );
      }

      if (sort === "AMOUNT_LOW") {
        return (
          Number(first.totalAmount ?? 0) -
          Number(second.totalAmount ?? 0)
        );
      }

      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      );
    });
  }, [orders, search, status, dateRange, sort]);

  function clearFilters() {
    setSearch("");
    setStatus("ALL");
    setDateRange("ALL");
    setSort("NEWEST");
  }

  if (!orders.length) {
    return (
      <section className="card mt-7 p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf7f2] text-2xl text-[#0a9c63]">
          □
        </div>

        <h2 className="mt-5 text-2xl font-black">
          No orders submitted yet
        </h2>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#71838b]">
          Browse products with approved dealer pricing,
          add them to your cart and complete checkout to
          create your first order.
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
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_190px_170px_190px_auto]">
          <div className="field">
            <label>Search orders</label>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Order ID, product, SKU..."
            />
          </div>

          <div className="field">
            <label>Order status</label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="AWAITING_PAYMENT">
                Awaiting Payment
              </option>
              <option value="PROCESSING">
                Processing
              </option>
              <option value="SHIPPED">Shipped</option>
              <option value="COMPLETED">
                Completed
              </option>
              <option value="CANCELLED">
                Cancelled
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
              {filteredOrders.length}
            </strong>{" "}
            of{" "}
            <strong className="text-[#17313d]">
              {orders.length}
            </strong>{" "}
            orders
          </span>

          <span>
            Click an order to view its complete details.
          </span>
        </div>
      </div>

      {!filteredOrders.length ? (
        <div className="card mt-5 p-10 text-center">
          <h2 className="text-xl font-black">
            No matching orders
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
          {filteredOrders.map((order) => {
            const expanded =
              expandedId === order.id;

            const totalAmount =
              order.totalAmount !== null
                ? Number(order.totalAmount)
                : null;

            const latestPayment =
              order.payments[0];

            const itemCount =
              order.items.reduce(
                (total, item) =>
                  total + item.quantity,
                0,
              );

            const firstProduct =
              order.items[0]?.product.name ??
              "Order";

            return (
              <article
                key={order.id}
                className="card overflow-hidden"
              >
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() =>
                    setExpandedId(
                      expanded ? null : order.id,
                    )
                  }
                  className="grid w-full gap-4 p-5 text-left transition hover:bg-[#f8fbf9] md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm text-[#17313d]">
                        {order.reference}
                      </strong>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.07em] ${statusClass(
                          order.status,
                        )}`}
                      >
                        {statusLabel(order.status)}
                      </span>
                    </div>

                    <div className="mt-1 truncate text-xs text-[#657983]">
                      {firstProduct}
                      {order.items.length > 1
                        ? ` + ${
                            order.items.length - 1
                          } more`
                        : ""}
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
                      {totalAmount !== null
                        ? formatMoney(
                            totalAmount,
                            order.currency,
                          )
                        : "Review required"}
                    </strong>

                    {new Date(
                      order.createdAt,
                    ).toLocaleDateString()}
                  </div>

                  <span className="text-lg font-black text-[#0a9c63]">
                    {expanded ? "−" : "+"}
                  </span>
                </button>

                {expanded && (
                  <div className="border-t border-[#e1ebe7]">
                    <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_.8fr]">
                      <div>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="eyebrow">
                              Order details
                            </div>

                            <h2 className="mt-2 text-xl font-black">
                              {order.reference}
                            </h2>

                            <p className="mt-2 text-xs text-[#71838b]">
                              Submitted{" "}
                              {new Date(
                                order.createdAt,
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
                          </div>

                          <div className="text-right">
                            <span
                              className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[.08em] ${statusClass(
                                order.status,
                              )}`}
                            >
                              {statusLabel(
                                order.status,
                              )}
                            </span>

                            <div className="mt-3 text-2xl font-black text-[#08774f]">
                              {totalAmount !== null
                                ? formatMoney(
                                    totalAmount,
                                    order.currency,
                                  )
                                : "Review required"}
                            </div>
                          </div>
                        </div>

                        <h3 className="mt-7 font-black">
                          Ordered products
                        </h3>

                        <div className="table-wrap mt-4">
                          <table>
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Subtotal</th>
                              </tr>
                            </thead>

                            <tbody>
                              {order.items.map(
                                (item) => {
                                  const unitPrice =
                                    item.unitPrice !==
                                    null
                                      ? Number(
                                          item.unitPrice,
                                        )
                                      : null;

                                  const subtotal =
                                    unitPrice !== null
                                      ? unitPrice *
                                        item.quantity
                                      : null;

                                  return (
                                    <tr key={item.id}>
                                      <td>
                                        <Link
                                          href={`/dealer/products/${item.product.slug}`}
                                          className="font-black hover:text-[#0a9c63]"
                                        >
                                          {
                                            item
                                              .product
                                              .name
                                          }
                                        </Link>

                                        <div className="mt-1 text-[10px] text-[#82938c]">
                                          {item
                                            .product
                                            .sku ||
                                            item
                                              .product
                                              .slug}
                                          {" · "}
                                          {item
                                            .product
                                            .unitLabel ||
                                            "Unit"}
                                        </div>
                                      </td>

                                      <td>
                                        {item.quantity}
                                      </td>

                                      <td>
                                        {unitPrice !==
                                        null
                                          ? formatMoney(
                                              unitPrice,
                                              order.currency,
                                            )
                                          : "—"}
                                      </td>

                                      <td className="font-black">
                                        {subtotal !==
                                        null
                                          ? formatMoney(
                                              subtotal,
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
                      </div>

                      <div className="space-y-5">
                        <div className="rounded-xl border border-[#dfe8e4] bg-[#f8fbf9] p-5">
                          <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
                            Current status
                          </div>

                          <div className="mt-2 font-black">
                            {statusLabel(
                              order.status,
                            )}
                          </div>

                          <p className="mt-2 text-xs leading-6 text-[#657983]">
                            {statusDescription(
                              order.status,
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#dfe8e4] bg-white p-5">
                          <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
                            Delivery
                          </div>

                          <div className="mt-3 text-sm font-bold">
                            {order.deliveryCountry ||
                              "Not provided"}
                          </div>

                          <p className="mt-2 whitespace-pre-line text-xs leading-6 text-[#657983]">
                            {order.deliveryAddress ||
                              "No delivery address provided."}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#dfe8e4] bg-white p-5">
                          <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
                            Payment
                          </div>

                          {latestPayment ? (
                            <>
                              <div className="mt-3 font-black">
                                {statusLabel(
                                  latestPayment.status,
                                )}
                              </div>

                              <p className="mt-2 text-xs leading-6 text-[#657983]">
                                Method:{" "}
                                {paymentMethodLabel(
                                  latestPayment.provider,
                                )}
                              </p>

                              <p className="mt-1 text-xs text-[#657983]">
                                {latestPayment.amount !==
                                null
                                  ? formatMoney(
                                      Number(
                                        latestPayment.amount,
                                      ),
                                      latestPayment.currency,
                                    )
                                  : "Payment amount pending"}
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="mt-3 font-black">
                                Commercial review
                              </div>

                              <p className="mt-2 text-xs leading-6 text-[#657983]">
                                Payment instructions
                                will be provided after
                                order review.
                              </p>
                            </>
                          )}

                          <Link
                            href="/dealer/payments"
                            className="mt-4 inline-block text-xs font-black text-[#0a9c63]"
                          >
                            View Payments →
                          </Link>
                        </div>
                      </div>
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