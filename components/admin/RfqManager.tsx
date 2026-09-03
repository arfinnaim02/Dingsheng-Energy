"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RfqStatus =
  | "SUBMITTED"
  | "REVIEWING"
  | "ACCEPTED"
  | "REJECTED";

type Rfq = {
  id: string;
  reference: string;
  projectName: string | null;
  deliveryCountry: string | null;
  requiredDate: string | null;
  requirement: string | null;
  status: RfqStatus;
  createdAt: string;
  updatedAt: string;

  dealer: {
    companyName: string;
    contactName: string;
    phone: string | null;
    country: string | null;

    user: {
      email: string;
    };

    priceGroup: {
      name: string;
      slug: string;
    } | null;
  };

  items: Array<{
    id: string;
    quantity: number;
    notes: string | null;

    product: {
      name: string;
      slug: string;
      sku: string | null;
      unitLabel: string | null;
    };
  }>;
};

const statusOptions: RfqStatus[] = [
  "SUBMITTED",
  "REVIEWING",
  "ACCEPTED",
  "REJECTED",
];

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function statusClass(status: RfqStatus) {
  switch (status) {
    case "SUBMITTED":
      return "bg-[#fff6dc] text-[#926900]";

    case "REVIEWING":
      return "bg-[#e7f2ff] text-[#27659a]";

    case "ACCEPTED":
      return "bg-[#e7f7ef] text-[#087a50]";

    case "REJECTED":
      return "bg-[#fbeaea] text-[#a43e3e]";
  }
}

export function RfqManager({
  rfqs,
}: {
  rfqs: Rfq[];
}) {
  const router = useRouter();

  const [selectedStatuses, setSelectedStatuses] =
    useState<Record<string, RfqStatus>>(
      Object.fromEntries(
        rfqs.map((rfq) => [
          rfq.id,
          rfq.status,
        ]),
      ),
    );

  const [workingId, setWorkingId] = useState<
    string | null
  >(null);
  const [deletingId, setDeletingId] = useState<
  string | null
>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function updateStatus(rfqId: string) {
    setWorkingId(rfqId);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/rfqs/${rfqId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: selectedStatuses[rfqId],
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to update RFQ status.",
        );
      }

      setMessage(
        `${result.rfq.reference} updated to ${statusLabel(
          result.rfq.status,
        )}.`,
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update RFQ status.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function deleteRfq(
  rfq: Rfq,
) {
  if (
    rfq.status !== "REJECTED"
  ) {
    setError(
      "Reject this RFQ before permanently deleting it.",
    );

    return;
  }

  const confirmed = window.confirm(
    `Permanently delete RFQ ${rfq.reference}?\n\nThis will remove the RFQ and its requested product items. This action cannot be undone.`,
  );

  if (!confirmed) {
    return;
  }

  setDeletingId(rfq.id);
  setMessage("");
  setError("");

  try {
    const response = await fetch(
      `/api/admin/rfqs/${encodeURIComponent(
        rfq.id,
      )}`,
      {
        method: "DELETE",
      },
    );

    const result =
      await response
        .json()
        .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.error ||
          "Unable to delete RFQ.",
      );
    }

    setMessage(
      `${result.deleted.reference} was permanently deleted.`,
    );

    router.refresh();
  } catch (deleteError) {
    setError(
      deleteError instanceof Error
        ? deleteError.message
        : "Unable to delete RFQ.",
    );
  } finally {
    setDeletingId(null);
  }
}

  if (!rfqs.length) {
    return (
      <div className="card p-10 text-center">
        <h2 className="text-xl font-black">
          No RFQs submitted
        </h2>

        <p className="mt-3 text-sm text-[#71838b]">
          Dealer RFQs will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
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

      {rfqs.map((rfq) => (
        <article
          key={rfq.id}
          className="card overflow-hidden"
        >
          <header className="flex flex-wrap items-start justify-between gap-5 border-b border-[#e1ebe7] p-6">
            <div>
              <div className="eyebrow">
                {rfq.reference}
              </div>

              <h2 className="mt-2 text-xl font-black">
                {rfq.projectName ||
                  "General Product Requirement"}
              </h2>

              <p className="mt-2 text-sm font-bold text-[#526872]">
                {rfq.dealer.companyName}
              </p>

              <p className="mt-1 text-xs text-[#71838b]">
                {rfq.dealer.contactName} ·{" "}
                {rfq.dealer.user.email}
              </p>

              <p className="mt-1 text-xs text-[#829198]">
                Submitted{" "}
                {new Date(
                  rfq.createdAt,
                ).toLocaleString()}
              </p>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[.08em] ${statusClass(
                  rfq.status,
                )}`}
              >
                {statusLabel(rfq.status)}
              </span>

              <div className="mt-3 text-xs font-bold text-[#71838b]">
                {rfq.items.length} product
                {rfq.items.length === 1 ? "" : "s"}
              </div>
            </div>
          </header>

          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_340px]">
            <div>
              <h3 className="font-black">
                Requested products
              </h3>

              <div className="table-wrap mt-4">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rfq.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <Link
                            href={`/admin/products/${item.product.slug}`}
                            className="font-black hover:text-[#0a9c63]"
                          >
                            {item.product.name}
                          </Link>

                          <div className="mt-1 text-[10px] text-[#82938c]">
                            {item.product.sku ||
                              item.product.slug}
                          </div>
                        </td>

                        <td>{item.quantity}</td>

                        <td>
                          {item.product.unitLabel ||
                            "Unit"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-[#f6f8f7] p-4 text-xs leading-6 text-[#657983]">
                  <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                    Delivery
                  </div>

                  <div className="mt-2">
                    <strong>Country:</strong>{" "}
                    {rfq.deliveryCountry ||
                      "Not provided"}
                  </div>

                  <div className="mt-1">
                    <strong>Required date:</strong>{" "}
                    {rfq.requiredDate
                      ? new Date(
                          rfq.requiredDate,
                        ).toLocaleDateString()
                      : "Not specified"}
                  </div>
                </div>

                <div className="rounded-lg bg-[#f6f8f7] p-4 text-xs leading-6 text-[#657983]">
                  <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                    Dealer profile
                  </div>

                  <div className="mt-2">
                    <strong>Price group:</strong>{" "}
                    {rfq.dealer.priceGroup?.name ||
                      "Not assigned"}
                  </div>

                  <div className="mt-1">
                    <strong>Phone:</strong>{" "}
                    {rfq.dealer.phone ||
                      "Not provided"}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-[#dfe8e4] bg-white p-4">
                <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                  Requirement details
                </div>

                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#657983]">
                  {rfq.requirement ||
                    "No additional requirements were provided."}
                </p>
              </div>
            </div>

            <aside>
              <div className="text-xs font-black uppercase tracking-[.08em] text-[#71838b]">
                RFQ management
              </div>

              <label className="mt-4 block text-xs font-black text-[#526872]">
                RFQ status
              </label>

              <select
                value={selectedStatuses[rfq.id]}
                disabled={
                  workingId === rfq.id ||
                  deletingId === rfq.id
                }
                onChange={(event) =>
                  setSelectedStatuses((current) => ({
                    ...current,
                    [rfq.id]:
                      event.target.value as RfqStatus,
                  }))
                }
                className="mt-2 w-full rounded-md border border-[#d8e4df] bg-white px-3 py-3 text-sm"
              >
                {statusOptions.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {statusLabel(status)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={
                  workingId === rfq.id ||
                  deletingId === rfq.id
                }
                onClick={() =>
                  updateStatus(rfq.id)
                }
                className="btn btn-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {workingId === rfq.id
                  ? "Updating RFQ..."
                  : "Update RFQ Status"}
              </button>

              {rfq.status === "REJECTED" ? (
                <button
                  type="button"
                  disabled={
                    workingId === rfq.id ||
                    deletingId === rfq.id
                  }
                  onClick={() =>
                    void deleteRfq(rfq)
                  }
                  className="mt-3 w-full rounded-md border border-red-200 bg-white px-4 py-3 text-xs font-black text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === rfq.id
                    ? "Deleting RFQ..."
                    : "Delete RFQ Permanently"}
                </button>
              ) : (
                <div className="mt-3 rounded-md border border-[#eadfbd] bg-[#fffaf0] p-3 text-[10px] leading-5 text-[#81765d]">
                  Reject this RFQ before permanent deletion becomes
                  available.
                </div>
              )}

              <div className="mt-5 rounded-lg border border-[#dfe8e4] bg-[#f8fbf9] p-4 text-xs leading-6 text-[#657983]">
                <strong>Dealer contact</strong>

                <div className="mt-2">
                  {rfq.dealer.contactName}
                </div>

                <div>{rfq.dealer.user.email}</div>

                <div>
                  {rfq.dealer.phone ||
                    "No phone provided"}
                </div>
              </div>
            </aside>
          </div>
        </article>
      ))}
    </div>
  );
}