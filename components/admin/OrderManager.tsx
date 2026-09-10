"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { OrderPaymentControl } from "@/components/admin/OrderPaymentControl";

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

export type AdminOrder = {
  id: string;
  reference: string;
  status: OrderStatus;

  currency: string;
  totalAmount: string | null;

  deliveryCountry: string | null;
  deliveryAddress: string | null;

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
    unitPrice: string | null;

    product: {
      name: string;
      slug: string;
    };
  }>;

  payments: Array<{
    id: string;
    status: PaymentStatus;
    provider: string | null;
    providerRef: string | null;
    amount: string | null;
    currency: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

const statusOptions: OrderStatus[] = [
  "PENDING",
  "AWAITING_PAYMENT",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

type BulkAction =
  | ""
  | "DELETE"
  | OrderStatus;

function money(
  amount: string | null,
  currency: string,
) {
  if (amount === null) {
    return "—";
  }

  const numeric = Number(amount);

  if (!Number.isFinite(numeric)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(numeric);
}

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function orderStatusClass(
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

    case "PENDING":
    default:
      return "bg-[#fff6dc] text-[#926900]";
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

export function OrderManager({
  orders,
}: {
  orders: AdminOrder[];
}) {
  const router = useRouter();

  /*
   * Status values inside the expanded
   * management panel.
   */
  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState<
    Record<string, OrderStatus>
  >(
    Object.fromEntries(
      orders.map((order) => [
        order.id,
        order.status,
      ]),
    ),
  );

  /*
   * Expanded order rows.
   */
  const [
    expanded,
    setExpanded,
  ] = useState<Set<string>>(
    () => new Set(),
  );

  /*
   * Selected orders for bulk actions.
   */
  const [
    selectedIds,
    setSelectedIds,
  ] = useState<Set<string>>(
    () => new Set(),
  );

  const [
    bulkAction,
    setBulkAction,
  ] = useState<BulkAction>("");

  const [
    workingId,
    setWorkingId,
  ] = useState<string | null>(
    null,
  );

  const [
    bulkWorking,
    setBulkWorking,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const allSelected =
    orders.length > 0 &&
    selectedIds.size ===
      orders.length;

  const selectedOrders =
    useMemo(
      () =>
        orders.filter((order) =>
          selectedIds.has(
            order.id,
          ),
        ),
      [orders, selectedIds],
    );

  function clearNotices() {
    setMessage("");
    setError("");
  }

  function toggleExpanded(
    orderId: string,
  ) {
    setExpanded((current) => {
      const next =
        new Set(current);

      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }

      return next;
    });
  }

  function toggleSelected(
    orderId: string,
  ) {
    setSelectedIds(
      (current) => {
        const next =
          new Set(current);

        if (
          next.has(orderId)
        ) {
          next.delete(
            orderId,
          );
        } else {
          next.add(
            orderId,
          );
        }

        return next;
      },
    );
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(
        new Set(),
      );

      return;
    }

    setSelectedIds(
      new Set(
        orders.map(
          (order) =>
            order.id,
        ),
      ),
    );
  }

  async function updateStatus(
    orderId: string,
  ) {
    clearNotices();

    setWorkingId(
      orderId,
    );

    try {
      const status =
        selectedStatus[
          orderId
        ];

      const response =
        await fetch(
          `/api/admin/orders/${encodeURIComponent(
            orderId,
          )}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  status,
                },
              ),
          },
        );

      const result =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to update order status.",
        );
      }

      setMessage(
        `Order ${
          result.reference ??
          ""
        } updated to ${statusLabel(
          result.status,
        )}.`,
      );

      router.refresh();
    } catch (
      updateError
    ) {
      setError(
        updateError instanceof
          Error
          ? updateError.message
          : "Unable to update order status.",
      );
    } finally {
      setWorkingId(
        null,
      );
    }
  }

  async function deleteOrder(
    order: AdminOrder,
  ) {
    clearNotices();

    const confirmed =
      window.confirm(
        `Permanently delete order ${order.reference}?\n\nDealer: ${order.dealer.companyName}\nTotal: ${money(
          order.totalAmount,
          order.currency,
        )}\n\nThe order, its items and payment records will be permanently deleted.\n\nThis cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    setWorkingId(
      order.id,
    );

    try {
      const response =
        await fetch(
          `/api/admin/orders/${encodeURIComponent(
            order.id,
          )}`,
          {
            method:
              "DELETE",
          },
        );

      const result =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to delete order.",
        );
      }

      setSelectedIds(
        (current) => {
          const next =
            new Set(current);

          next.delete(
            order.id,
          );

          return next;
        },
      );

      setExpanded(
        (current) => {
          const next =
            new Set(current);

          next.delete(
            order.id,
          );

          return next;
        },
      );

      setMessage(
        `Order ${order.reference} deleted successfully.`,
      );

      router.refresh();
    } catch (
      deleteError
    ) {
      setError(
        deleteError instanceof
          Error
          ? deleteError.message
          : "Unable to delete order.",
      );
    } finally {
      setWorkingId(
        null,
      );
    }
  }

  async function applyBulkAction() {
    clearNotices();

    if (
      selectedIds.size ===
      0
    ) {
      setError(
        "Select at least one order.",
      );

      return;
    }

    if (!bulkAction) {
      setError(
        "Choose a bulk action first.",
      );

      return;
    }

    if (
      bulkAction ===
      "DELETE"
    ) {
      const preview =
        selectedOrders
          .slice(0, 6)
          .map(
            (order) =>
              order.reference,
          )
          .join(", ");

      const remaining =
        selectedOrders.length >
        6
          ? ` and ${
              selectedOrders
                .length - 6
            } more`
          : "";

      const confirmed =
        window.confirm(
          `Permanently delete ${selectedOrders.length} selected order${
            selectedOrders.length ===
            1
              ? ""
              : "s"
          }?\n\n${preview}${remaining}\n\nAssociated payment records and order items will also be removed.\n\nThis cannot be undone.`,
        );

      if (!confirmed) {
        return;
      }
    }

    setBulkWorking(true);

    try {
      const response =
        await fetch(
          "/api/admin/orders/bulk",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  ids: [
                    ...selectedIds,
                  ],

                  action:
                    bulkAction ===
                    "DELETE"
                      ? "DELETE"
                      : "STATUS",

                  status:
                    bulkAction ===
                    "DELETE"
                      ? undefined
                      : bulkAction,
                },
              ),
          },
        );

      const result =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to apply bulk action.",
        );
      }

      const affected =
        typeof result.count ===
        "number"
          ? result.count
          : selectedIds.size;

      if (
        bulkAction ===
        "DELETE"
      ) {
        setMessage(
          `${affected} order${
            affected === 1
              ? ""
              : "s"
          } deleted successfully.`,
        );
      } else {
        setMessage(
          `${affected} order${
            affected === 1
              ? ""
              : "s"
          } updated to ${statusLabel(
            bulkAction,
          )}.`,
        );
      }

      setSelectedIds(
        new Set(),
      );

      setExpanded(
        new Set(),
      );

      setBulkAction("");

      router.refresh();
    } catch (
      bulkError
    ) {
      setError(
        bulkError instanceof
          Error
          ? bulkError.message
          : "Unable to apply bulk action.",
      );
    } finally {
      setBulkWorking(false);
    }
  }

  if (!orders.length) {
    return (
      <section className="card p-10 text-center">
        <h2 className="text-xl font-black text-[#17313d]">
          No orders yet
        </h2>

        <p className="mt-3 text-sm text-[#71838b]">
          Submitted dealer
          orders will appear
          here.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {/* BULK TOOLBAR */}
      <section className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-black text-[#526872]">
              <input
                type="checkbox"
                checked={
                  allSelected
                }
                onChange={
                  toggleSelectAll
                }
                className="h-4 w-4 accent-[#0a9c63]"
              />

              Select All
            </label>

            <span className="hidden h-5 w-px bg-[#dce7e2] sm:block" />

            <span className="text-xs font-bold text-[#71838b]">
              {
                selectedIds.size
              }{" "}
              selected
            </span>

            <span className="text-xs text-[#a1ada8]">
              ·
            </span>

            <span className="text-xs font-bold text-[#71838b]">
              {
                orders.length
              }{" "}
              total
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={
                bulkAction
              }
              disabled={
                bulkWorking
              }
              onChange={(
                event,
              ) =>
                setBulkAction(
                  event.target
                    .value as BulkAction,
                )
              }
              className="min-w-[220px] rounded-md border border-[#d8e4df] bg-white px-3 py-2.5 text-xs font-bold text-[#526872]"
            >
              <option value="">
                Bulk Actions
              </option>

              <optgroup label="Change order status">
                {statusOptions.map(
                  (status) => (
                    <option
                      key={
                        status
                      }
                      value={
                        status
                      }
                    >
                      Set:{" "}
                      {statusLabel(
                        status,
                      )}
                    </option>
                  ),
                )}
              </optgroup>

              <optgroup label="Danger zone">
                <option value="DELETE">
                  Delete Permanently
                </option>
              </optgroup>
            </select>

            <button
              type="button"
              disabled={
                bulkWorking ||
                selectedIds.size ===
                  0 ||
                !bulkAction
              }
              onClick={
                applyBulkAction
              }
              className={`rounded-md px-4 py-2.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
                bulkAction ===
                "DELETE"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-[#0a9c63] text-white hover:bg-[#087c50]"
              }`}
            >
              {bulkWorking
                ? "Applying..."
                : "Apply"}
            </button>
          </div>
        </div>
      </section>

      {/* TABLE-LIKE COMPACT LIST */}
      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1120px]">
            {/* HEADER */}
            <div className="grid grid-cols-[42px_38px_130px_minmax(190px,1fr)_135px_130px_145px_125px_80px_145px] items-center gap-3 border-b border-[#e1ebe7] bg-[#f7faf8] px-4 py-3 text-[9px] font-black uppercase tracking-[.08em] text-[#829198]">
              <span />

              <span />

              <span>
                Reference
              </span>

              <span>
                Dealer
              </span>

              <span>
                Date
              </span>

              <span>
                Total
              </span>

              <span>
                Order Status
              </span>

              <span>
                Payment
              </span>

              <span>
                Items
              </span>

              <span className="text-right">
                Actions
              </span>
            </div>

            {orders.map(
              (order) => {
                const latestPayment =
                  order
                    .payments[0];

                const paymentStatus:
                  PaymentStatus =
                  latestPayment
                    ?.status ??
                  "PENDING";

                const isExpanded =
                  expanded.has(
                    order.id,
                  );

                const isSelected =
                  selectedIds.has(
                    order.id,
                  );

                const busy =
                  workingId ===
                  order.id;

                return (
                  <article
                    key={
                      order.id
                    }
                    className={`border-b border-[#e8efec] last:border-b-0 ${
                      isSelected
                        ? "bg-[#f5fbf8]"
                        : "bg-white"
                    }`}
                  >
                    {/* COLLAPSED ONE-LINE ROW */}
                    <div
                      className={`grid min-h-[68px] grid-cols-[42px_38px_130px_minmax(190px,1fr)_135px_130px_145px_125px_80px_145px] items-center gap-3 px-4 transition ${
                        isExpanded
                          ? "bg-[#f9fbfa]"
                          : "hover:bg-[#fafcfb]"
                      }`}
                    >
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={
                            isSelected
                          }
                          onChange={() =>
                            toggleSelected(
                              order.id,
                            )
                          }
                          className="h-4 w-4 accent-[#0a9c63]"
                          aria-label={`Select ${order.reference}`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          toggleExpanded(
                            order.id,
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-md text-lg font-black text-[#637971] transition hover:bg-[#edf7f2] hover:text-[#0a9c63]"
                        aria-label={
                          isExpanded
                            ? `Collapse ${order.reference}`
                            : `Expand ${order.reference}`
                        }
                      >
                        <span
                          className={`block transition-transform duration-200 ${
                            isExpanded
                              ? "rotate-90"
                              : ""
                          }`}
                        >
                          ›
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleExpanded(
                            order.id,
                          )
                        }
                        className="whitespace-nowrap text-left text-xs font-black text-[#17313d] transition hover:text-[#0a9c63]"
                      >
                        {
                          order.reference
                        }
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleExpanded(
                            order.id,
                          )
                        }
                        className="min-w-0 text-left"
                      >
                        <div className="truncate text-sm font-black text-[#17313d]">
                          {
                            order
                              .dealer
                              .companyName
                          }
                        </div>

                        <div className="mt-0.5 truncate text-[10px] text-[#829198]">
                          {
                            order
                              .dealer
                              .user
                              .email
                          }
                        </div>
                      </button>

                      <div className="whitespace-nowrap text-xs font-bold text-[#64777f]">
                        {new Date(
                          order.createdAt,
                        ).toLocaleDateString(
                          "en-US",
                          {
                            year:
                              "numeric",
                            month:
                              "short",
                            day:
                              "2-digit",
                          },
                        )}
                      </div>

                      <div className="whitespace-nowrap text-sm font-black text-[#08774f]">
                        {money(
                          order.totalAmount,
                          order.currency,
                        )}
                      </div>

                      <div>
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.05em] ${orderStatusClass(
                            order.status,
                          )}`}
                        >
                          {statusLabel(
                            order.status,
                          )}
                        </span>
                      </div>

                      <div>
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.05em] ${paymentStatusClass(
                            paymentStatus,
                          )}`}
                        >
                          {statusLabel(
                            paymentStatus,
                          )}
                        </span>
                      </div>

                      <div className="whitespace-nowrap text-xs font-black text-[#526872]">
                        {
                          order
                            .items
                            .length
                        }{" "}
                        {
                          order.items
                            .length ===
                          1
                            ? "item"
                            : "items"
                        }
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            toggleExpanded(
                              order.id,
                            )
                          }
                          className="rounded-md border border-[#d7e4df] px-3 py-1.5 text-[10px] font-black text-[#526872] transition hover:border-[#0a9c63] hover:bg-[#edf7f2] hover:text-[#0a9c63]"
                        >
                          {isExpanded
                            ? "Close"
                            : "View"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            deleteOrder(
                              order,
                            )
                          }
                          className="rounded-md border border-red-200 px-3 py-1.5 text-[10px] font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED CONTENT */}
                    {isExpanded && (
                      <div className="border-t border-[#dfe8e4] bg-[#fbfcfc]">
                        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                          <div className="min-w-0">
                            {/* SUMMARY BOXES */}
                            <div className="grid gap-4 md:grid-cols-3">
                              <div className="rounded-xl border border-[#e0e9e5] bg-white p-4">
                                <div className="text-[9px] font-black uppercase tracking-[.08em] text-[#829198]">
                                  Dealer Contact
                                </div>

                                <div className="mt-2 text-sm font-black text-[#17313d]">
                                  {
                                    order
                                      .dealer
                                      .contactName
                                  }
                                </div>

                                <div className="mt-1 break-all text-xs text-[#71838b]">
                                  {
                                    order
                                      .dealer
                                      .user
                                      .email
                                  }
                                </div>
                              </div>

                              <div className="rounded-xl border border-[#e0e9e5] bg-white p-4">
                                <div className="text-[9px] font-black uppercase tracking-[.08em] text-[#829198]">
                                  Delivery
                                </div>

                                <div className="mt-2 text-sm font-black text-[#17313d]">
                                  {order.deliveryCountry ||
                                    "Not provided"}
                                </div>

                                <div className="mt-1 text-xs leading-5 text-[#71838b]">
                                  {order.deliveryAddress ||
                                    "No delivery address provided."}
                                </div>
                              </div>

                              <div className="rounded-xl border border-[#e0e9e5] bg-white p-4">
                                <div className="text-[9px] font-black uppercase tracking-[.08em] text-[#829198]">
                                  Payment
                                </div>

                                <div className="mt-2 text-sm font-black text-[#17313d]">
                                  {paymentMethodLabel(
                                    latestPayment?.provider ??
                                      null,
                                  )}
                                </div>

                                <div className="mt-1 text-xs text-[#71838b]">
                                  {money(
                                    latestPayment?.amount ??
                                      order.totalAmount,
                                    latestPayment?.currency ??
                                      order.currency,
                                  )}
                                </div>

                                <div className="mt-1 text-xs font-bold text-[#71838b]">
                                  {statusLabel(
                                    paymentStatus,
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* ORDER ITEMS */}
                            <div className="mt-6">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <div className="eyebrow">
                                    Order Items
                                  </div>

                                  <h3 className="mt-2 text-lg font-black text-[#17313d]">
                                    Products in{" "}
                                    {
                                      order.reference
                                    }
                                  </h3>
                                </div>

                                <span className="status">
                                  {
                                    order
                                      .items
                                      .length
                                  }{" "}
                                  {
                                    order
                                      .items
                                      .length ===
                                    1
                                      ? "item"
                                      : "items"
                                  }
                                </span>
                              </div>

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
                                            null &&
                                          Number.isFinite(
                                            unitPrice,
                                          )
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
                                              <div className="font-black text-[#17313d]">
                                                {
                                                  item
                                                    .product
                                                    .name
                                                }
                                              </div>

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
                                                    String(
                                                      subtotal,
                                                    ),
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
                          </div>

                          {/* MANAGEMENT SIDEBAR */}
                          <aside className="h-fit rounded-xl border border-[#dfe8e4] bg-white p-5">
                            <div className="eyebrow">
                              Order Management
                            </div>

                            <h3 className="mt-2 text-lg font-black text-[#17313d]">
                              Update Order
                            </h3>

                            <label className="mt-5 block text-xs font-black text-[#526872]">
                              Order Status
                            </label>

                            <select
                              value={
                                selectedStatus[
                                  order.id
                                ]
                              }
                              disabled={
                                busy
                              }
                              onChange={(
                                event,
                              ) =>
                                setSelectedStatus(
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
                                busy
                              }
                              onClick={() =>
                                updateStatus(
                                  order.id,
                                )
                              }
                              className="btn btn-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {busy
                                ? "Updating..."
                                : "Update Order Status"}
                            </button>

                            <div className="mt-5 border-t border-[#e5ece9] pt-5">
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
                                  latestPayment?.provider ??
                                  null
                                }
                              />
                            </div>

                            <div className="mt-5 border-t border-[#e5ece9] pt-5">
                              <div className="text-[10px] font-black uppercase tracking-[.08em] text-red-500">
                                Danger Zone
                              </div>

                              <p className="mt-2 text-xs leading-5 text-[#71838b]">
                                Permanent
                                deletion removes
                                this order,
                                related order
                                items and its
                                payment records.
                              </p>

                              <button
                                type="button"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  deleteOrder(
                                    order,
                                  )
                                }
                                className="mt-4 w-full rounded-md border border-red-200 bg-white px-4 py-3 text-xs font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {busy
                                  ? "Working..."
                                  : "Delete Order Permanently"}
                              </button>
                            </div>

                            <p className="mt-4 text-xs leading-5 text-[#829198]">
                              Completed and
                              cancelled orders
                              remain editable
                              when an
                              administrative
                              correction is
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
        </div>
      </section>
    </div>
  );
}