"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export type AdminPayment = {
  id: string;
  provider: string | null;
  providerRef: string | null;
  status: PaymentStatus;
  amount: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;

  order: {
    id: string;
    reference: string;
    status: string;

    dealer: {
      id: string;
      companyName: string;
      contactName: string;

      user: {
        email: string;
      };
    };
  };
};

const statusOptions: PaymentStatus[] = [
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

type BulkAction =
  | ""
  | "DELETE"
  | PaymentStatus;

function statusLabel(
  status: string,
) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function statusClass(
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

function providerLabel(
  provider: string | null,
) {
  switch (provider) {
    case "BANK_TRANSFER":
      return "Bank Transfer";

    case "LETTER_OF_CREDIT":
      return "Letter of Credit (L/C)";

    case "APPROVED_CREDIT_TERMS":
      return "Approved Credit Terms";

    case "MANUAL_COMMERCIAL_AGREEMENT":
      return "Manual Agreement";

    default:
      return "Not specified";
  }
}

function money(
  amount: string | null,
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
  ).format(
    Number(amount),
  );
}

export function PaymentManager({
  payments,
}: {
  payments: AdminPayment[];
}) {
  const router =
    useRouter();

  const [expanded, setExpanded] =
    useState<Set<string>>(
      () => new Set(),
    );

  const [selectedIds, setSelectedIds] =
    useState<Set<string>>(
      () => new Set(),
    );

  const [selectedStatus, setSelectedStatus] =
    useState<
      Record<
        string,
        PaymentStatus
      >
    >(
      Object.fromEntries(
        payments.map(
          (payment) => [
            payment.id,
            payment.status,
          ],
        ),
      ),
    );

  const [bulkAction, setBulkAction] =
    useState<BulkAction>("");

  const [workingId, setWorkingId] =
    useState<string | null>(
      null,
    );

  const [bulkWorking, setBulkWorking] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const allSelected =
    payments.length >
      0 &&
    selectedIds.size ===
      payments.length;

  const selectedPayments =
    useMemo(
      () =>
        payments.filter(
          (payment) =>
            selectedIds.has(
              payment.id,
            ),
        ),
      [
        payments,
        selectedIds,
      ],
    );

  function toggleExpanded(
    id: string,
  ) {
    setExpanded(
      (current) => {
        const next =
          new Set(current);

        next.has(id)
          ? next.delete(id)
          : next.add(id);

        return next;
      },
    );
  }

  function toggleSelected(
    id: string,
  ) {
    setSelectedIds(
      (current) => {
        const next =
          new Set(current);

        next.has(id)
          ? next.delete(id)
          : next.add(id);

        return next;
      },
    );
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(
        new Set(),
      );
    } else {
      setSelectedIds(
        new Set(
          payments.map(
            (payment) =>
              payment.id,
          ),
        ),
      );
    }
  }

  async function updatePayment(
    paymentId: string,
  ) {
    setWorkingId(
      paymentId,
    );

    setError("");
    setMessage("");

    try {
      const response =
        await fetch(
          `/api/admin/payments/${encodeURIComponent(
            paymentId,
          )}`,
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
                  selectedStatus[
                    paymentId
                  ],
              }),
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
            "Unable to update payment.",
        );
      }

      setMessage(
        "Payment updated successfully.",
      );

      router.refresh();
    } catch (
      updateError
    ) {
      setError(
        updateError instanceof
          Error
          ? updateError.message
          : "Unable to update payment.",
      );
    } finally {
      setWorkingId(
        null,
      );
    }
  }

  async function deletePayment(
    payment: AdminPayment,
  ) {
    const confirmed =
      window.confirm(
        `Delete payment for order ${payment.order.reference}?\n\n${money(
          payment.amount,
          payment.currency,
        )}\n\nThis cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    setWorkingId(
      payment.id,
    );

    setError("");
    setMessage("");

    try {
      const response =
        await fetch(
          `/api/admin/payments/${encodeURIComponent(
            payment.id,
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
            "Unable to delete payment.",
        );
      }

      setMessage(
        "Payment deleted successfully.",
      );

      router.refresh();
    } catch (
      deleteError
    ) {
      setError(
        deleteError instanceof
          Error
          ? deleteError.message
          : "Unable to delete payment.",
      );
    } finally {
      setWorkingId(
        null,
      );
    }
  }

  async function applyBulkAction() {
    if (
      !selectedIds.size ||
      !bulkAction
    ) {
      return;
    }

    if (
      bulkAction ===
      "DELETE"
    ) {
      const confirmed =
        window.confirm(
          `Delete ${selectedPayments.length} selected payment record${
            selectedPayments.length ===
            1
              ? ""
              : "s"
          }?\n\nThis cannot be undone.`,
        );

      if (!confirmed) {
        return;
      }
    }

    setBulkWorking(true);

    setError("");
    setMessage("");

    try {
      const response =
        await fetch(
          "/api/admin/payments/bulk",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
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
              }),
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
            "Unable to apply payment action.",
        );
      }

      setMessage(
        bulkAction ===
          "DELETE"
          ? `${result.count} payment records deleted.`
          : `${result.count} payments updated to ${statusLabel(
              bulkAction,
            )}.`,
      );

      setSelectedIds(
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
          : "Unable to apply payment action.",
      );
    } finally {
      setBulkWorking(false);
    }
  }

  if (!payments.length) {
    return (
      <div className="card p-10 text-center text-sm text-[#71838b]">
        No payment records
        are available.
      </div>
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

      <section className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-xs font-black">
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

            Select All ·{" "}
            {
              selectedIds.size
            }{" "}
            selected
          </label>

          <div className="flex gap-2">
            <select
              value={
                bulkAction
              }
              onChange={(
                event,
              ) =>
                setBulkAction(
                  event.target
                    .value as BulkAction,
                )
              }
              className="min-w-[210px] rounded-md border border-[#d8e4df] bg-white px-3 py-2.5 text-xs font-bold"
            >
              <option value="">
                Bulk Actions
              </option>

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

              <option value="DELETE">
                Delete Permanently
              </option>
            </select>

            <button
              type="button"
              disabled={
                bulkWorking ||
                !selectedIds.size ||
                !bulkAction
              }
              onClick={
                applyBulkAction
              }
              className="rounded-md bg-[#0a9c63] px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"
            >
              Apply
            </button>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1050px]">
            <div className="grid grid-cols-[42px_38px_140px_minmax(190px,1fr)_150px_130px_145px_130px] items-center gap-3 border-b border-[#e1ebe7] bg-[#f7faf8] px-4 py-3 text-[9px] font-black uppercase text-[#829198]">
              <span />
              <span />
              <span>
                Order
              </span>
              <span>
                Dealer
              </span>
              <span>
                Method
              </span>
              <span>
                Amount
              </span>
              <span>
                Status
              </span>
              <span className="text-right">
                Actions
              </span>
            </div>

            {payments.map(
              (payment) => {
                const open =
                  expanded.has(
                    payment.id,
                  );

                const busy =
                  workingId ===
                  payment.id;

                return (
                  <article
                    key={
                      payment.id
                    }
                    className="border-b border-[#e8efec] last:border-b-0"
                  >
                    <div className="grid min-h-[68px] grid-cols-[42px_38px_140px_minmax(190px,1fr)_150px_130px_145px_130px] items-center gap-3 px-4 hover:bg-[#fafcfb]">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.has(
                            payment.id,
                          )
                        }
                        onChange={() =>
                          toggleSelected(
                            payment.id,
                          )
                        }
                        className="h-4 w-4 accent-[#0a9c63]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          toggleExpanded(
                            payment.id,
                          )
                        }
                      >
                        ›
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleExpanded(
                            payment.id,
                          )
                        }
                        className="text-left text-xs font-black"
                      >
                        {
                          payment.order.reference
                        }
                      </button>

                      <div>
                        <Link
                          href={`/admin/dealers/${payment.order.dealer.id}`}
                          className="text-sm font-black hover:text-[#0a9c63]"
                        >
                          {
                            payment.order.dealer.companyName
                          }
                        </Link>

                        <div className="text-[10px] text-[#829198]">
                          {
                            payment.order.dealer.user.email
                          }
                        </div>
                      </div>

                      <div className="text-xs font-bold">
                        {providerLabel(
                          payment.provider,
                        )}
                      </div>

                      <div className="text-sm font-black text-[#08774f]">
                        {money(
                          payment.amount,
                          payment.currency,
                        )}
                      </div>

                      <span
                        className={`w-fit rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${statusClass(
                          payment.status,
                        )}`}
                      >
                        {statusLabel(
                          payment.status,
                        )}
                      </span>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            toggleExpanded(
                              payment.id,
                            )
                          }
                          className="rounded-md border px-3 py-1.5 text-[10px] font-black"
                        >
                          {open
                            ? "Close"
                            : "View"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            deletePayment(
                              payment,
                            )
                          }
                          className="rounded-md border border-red-200 px-3 py-1.5 text-[10px] font-black text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {open && (
                      <div className="border-t border-[#dfe8e4] bg-[#fbfcfc] p-6">
                        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="card p-4">
                              <div className="text-[9px] font-black uppercase text-[#829198]">
                                Provider Reference
                              </div>

                              <div className="mt-2 text-sm font-bold">
                                {payment.providerRef ||
                                  "Not provided"}
                              </div>
                            </div>

                            <div className="card p-4">
                              <div className="text-[9px] font-black uppercase text-[#829198]">
                                Created
                              </div>

                              <div className="mt-2 text-sm font-bold">
                                {new Date(
                                  payment.createdAt,
                                ).toLocaleString()}
                              </div>
                            </div>

                            <div className="card p-4">
                              <div className="text-[9px] font-black uppercase text-[#829198]">
                                Dealer Contact
                              </div>

                              <div className="mt-2 text-sm font-bold">
                                {
                                  payment.order.dealer.contactName
                                }
                              </div>
                            </div>

                            <div className="card p-4">
                              <div className="text-[9px] font-black uppercase text-[#829198]">
                                Order Status
                              </div>

                              <div className="mt-2 text-sm font-bold">
                                {statusLabel(
                                  payment.order.status,
                                )}
                              </div>
                            </div>
                          </div>

                          <aside className="rounded-xl border border-[#dfe8e4] bg-white p-5">
                            <div className="eyebrow">
                              Payment Management
                            </div>

                            <label className="mt-5 block text-xs font-black">
                              Payment Status
                            </label>

                            <select
                              value={
                                selectedStatus[
                                  payment.id
                                ]
                              }
                              onChange={(
                                event,
                              ) =>
                                setSelectedStatus(
                                  (
                                    current,
                                  ) => ({
                                    ...current,

                                    [payment.id]:
                                      event.target
                                        .value as PaymentStatus,
                                  }),
                                )
                              }
                              className="mt-2 w-full rounded-md border border-[#d8e4df] px-3 py-3 text-sm"
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
                                updatePayment(
                                  payment.id,
                                )
                              }
                              className="btn btn-primary mt-3 w-full"
                            >
                              Update Payment
                            </button>
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