"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useState,
} from "react";

type DealerStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "REJECTED"
  | "INACTIVE";

export type PriceGroup = {
  id: string;
  slug: string;
  name: string;
};

export type AdminDealer = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string | null;
  country: string | null;
  businessType: string | null;
  website: string | null;
  jobTitle: string | null;
  interests: string | null;
  status: DealerStatus;
  priceGroupId: string | null;
  createdAt: string;

  user: {
    email: string;
    role: string;
  };
};

type Props = {
  dealers: AdminDealer[];
  priceGroups: PriceGroup[];
};

const statusOptions: DealerStatus[] = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "REJECTED",
  "INACTIVE",
];

type BulkAction =
  | ""
  | DealerStatus
  | "PRICE_GROUP"
  | "DELETE";

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
  status: DealerStatus,
) {
  switch (status) {
    case "ACTIVE":
      return "bg-[#e7f7ef] text-[#087a50]";

    case "PENDING":
      return "bg-[#fff6dc] text-[#926900]";

    case "SUSPENDED":
      return "bg-[#fff0e6] text-[#a14f12]";

    case "REJECTED":
      return "bg-[#fbeaea] text-[#a43e3e]";

    case "INACTIVE":
      return "bg-[#eef1f2] text-[#657983]";
  }
}

export function DealerManager({
  dealers,
  priceGroups,
}: Props) {
  const router =
    useRouter();

  const [
    expanded,
    setExpanded,
  ] =
    useState<Set<string>>(
      () => new Set(),
    );

  const [
    selectedIds,
    setSelectedIds,
  ] =
    useState<Set<string>>(
      () => new Set(),
    );

  const [
    selectedGroups,
    setSelectedGroups,
  ] = useState<
    Record<string, string>
  >(
    Object.fromEntries(
      dealers.map(
        (dealer) => [
          dealer.id,
          dealer.priceGroupId ??
            "",
        ],
      ),
    ),
  );

  const [
    bulkAction,
    setBulkAction,
  ] =
    useState<BulkAction>(
      "",
    );

  const [
    bulkPriceGroup,
    setBulkPriceGroup,
  ] =
    useState("");

  const [
    workingId,
    setWorkingId,
  ] =
    useState<
      string | null
    >(null);

  const [
    bulkWorking,
    setBulkWorking,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const allSelected =
    dealers.length > 0 &&
    selectedIds.size ===
      dealers.length;

  const selectedDealers =
    useMemo(
      () =>
        dealers.filter(
          (dealer) =>
            selectedIds.has(
              dealer.id,
            ),
        ),
      [
        dealers,
        selectedIds,
      ],
    );

  function clearNotices() {
    setMessage("");
    setError("");
  }

  function toggleExpanded(
    dealerId: string,
  ) {
    setExpanded(
      (current) => {
        const next =
          new Set(
            current,
          );

        if (
          next.has(
            dealerId,
          )
        ) {
          next.delete(
            dealerId,
          );
        } else {
          next.add(
            dealerId,
          );
        }

        return next;
      },
    );
  }

  function toggleSelected(
    dealerId: string,
  ) {
    setSelectedIds(
      (current) => {
        const next =
          new Set(
            current,
          );

        if (
          next.has(
            dealerId,
          )
        ) {
          next.delete(
            dealerId,
          );
        } else {
          next.add(
            dealerId,
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
        dealers.map(
          (dealer) =>
            dealer.id,
        ),
      ),
    );
  }

  async function updateDealer(
    dealerId: string,
    status?: DealerStatus,
  ) {
    clearNotices();

    setWorkingId(
      dealerId,
    );

    try {
      const response =
        await fetch(
          `/api/admin/dealers/${encodeURIComponent(
            dealerId,
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

                  priceGroupId:
                    selectedGroups[
                      dealerId
                    ] ||
                    null,
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
            "Unable to update dealer.",
        );
      }

      setMessage(
        status
          ? `Dealer status updated to ${statusLabel(
              status,
            )}.`
          : "Dealer price group updated.",
      );

      router.refresh();
    } catch (
      updateError
    ) {
      setError(
        updateError instanceof
          Error
          ? updateError.message
          : "Unable to update dealer.",
      );
    } finally {
      setWorkingId(
        null,
      );
    }
  }

  async function deleteDealer(
    dealer: AdminDealer,
  ) {
    clearNotices();

    const confirmed =
      window.confirm(
        `Permanently delete dealer "${dealer.companyName}"?\n\nContact: ${dealer.contactName}\nEmail: ${dealer.user.email}\n\nThis permanently removes the dealer login, profile, Orders, Payments, RFQs, Quotations and Dealer Notes.\n\nThis action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    setWorkingId(
      dealer.id,
    );

    try {
      const response =
        await fetch(
          `/api/admin/dealers/${encodeURIComponent(
            dealer.id,
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
            "Unable to permanently delete dealer.",
        );
      }

      setSelectedIds(
        (current) => {
          const next =
            new Set(
              current,
            );

          next.delete(
            dealer.id,
          );

          return next;
        },
      );

      setExpanded(
        (current) => {
          const next =
            new Set(
              current,
            );

          next.delete(
            dealer.id,
          );

          return next;
        },
      );

      setMessage(
        `Dealer "${dealer.companyName}" permanently deleted.`,
      );

      router.refresh();
    } catch (
      deleteError
    ) {
      setError(
        deleteError instanceof
          Error
          ? deleteError.message
          : "Unable to permanently delete dealer.",
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
        "Select at least one dealer.",
      );

      return;
    }

    if (!bulkAction) {
      setError(
        "Choose a bulk action.",
      );

      return;
    }

    if (
      bulkAction ===
        "PRICE_GROUP" &&
      !bulkPriceGroup
    ) {
      setError(
        "Choose a price group.",
      );

      return;
    }

    if (
      bulkAction ===
      "DELETE"
    ) {
      const names =
        selectedDealers
          .slice(0, 5)
          .map(
            (dealer) =>
              dealer.companyName,
          )
          .join(", ");

      const additional =
        selectedDealers.length >
        5
          ? ` and ${
              selectedDealers.length -
              5
            } more`
          : "";

      const confirmed =
        window.confirm(
          `Permanently delete ${selectedDealers.length} selected dealer${
            selectedDealers.length ===
            1
              ? ""
              : "s"
          }?\n\n${names}${additional}\n\nTheir login accounts, profiles, Orders, Payments, RFQs, Quotations and Dealer Notes will be permanently removed.\n\nThis action cannot be undone.`,
        );

      if (!confirmed) {
        return;
      }
    }

    setBulkWorking(
      true,
    );

    try {
      const response =
        await fetch(
          "/api/admin/dealers/bulk",
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
                      : bulkAction ===
                          "PRICE_GROUP"
                        ? "PRICE_GROUP"
                        : "STATUS",

                  status:
                    bulkAction ===
                      "DELETE" ||
                    bulkAction ===
                      "PRICE_GROUP"
                      ? undefined
                      : bulkAction,

                  priceGroupId:
                    bulkAction ===
                    "PRICE_GROUP"
                      ? bulkPriceGroup
                      : undefined,
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
            "Unable to apply bulk dealer action.",
        );
      }

      const count =
        typeof result.count ===
        "number"
          ? result.count
          : selectedIds.size;

      if (
        bulkAction ===
        "DELETE"
      ) {
        setMessage(
          `${count} dealer${
            count === 1
              ? ""
              : "s"
          } permanently deleted.`,
        );
      } else if (
        bulkAction ===
        "PRICE_GROUP"
      ) {
        const group =
          priceGroups.find(
            (item) =>
              item.id ===
              bulkPriceGroup,
          );

        setSelectedGroups(
          (current) => {
            const next = {
              ...current,
            };

            for (
              const dealerId of selectedIds
            ) {
              next[
                dealerId
              ] =
                bulkPriceGroup;
            }

            return next;
          },
        );

        setMessage(
          `${count} dealer${
            count === 1
              ? ""
              : "s"
          } assigned to ${
            group?.name ??
            "the selected price group"
          }.`,
        );
      } else {
        setMessage(
          `${count} dealer${
            count === 1
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

      setBulkAction("");
      setBulkPriceGroup("");

      router.refresh();
    } catch (
      bulkError
    ) {
      setError(
        bulkError instanceof
          Error
          ? bulkError.message
          : "Unable to apply bulk dealer action.",
      );
    } finally {
      setBulkWorking(
        false,
      );
    }
  }

  if (!dealers.length) {
    return (
      <div className="card p-10 text-center">
        <div className="eyebrow">
          Dealer applications
        </div>

        <h2 className="mt-3 text-2xl font-extrabold">
          No dealer applications yet
        </h2>

        <p className="mt-3 text-sm text-[#657983]">
          New registrations
          will appear here
          automatically.
        </p>
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

            <span className="text-xs font-bold text-[#71838b]">
              {
                selectedIds.size
              }{" "}
              selected ·{" "}
              {
                dealers.length
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
              ) => {
                const nextAction =
                  event.target
                    .value as BulkAction;

                setBulkAction(
                  nextAction,
                );

                if (
                  nextAction !==
                  "PRICE_GROUP"
                ) {
                  setBulkPriceGroup(
                    "",
                  );
                }
              }}
              className="min-w-[210px] rounded-md border border-[#d8e4df] bg-white px-3 py-2.5 text-xs font-bold"
            >
              <option value="">
                Bulk Actions
              </option>

              <optgroup label="Status">
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

              <optgroup label="Pricing">
                <option value="PRICE_GROUP">
                  Assign Price Group
                </option>
              </optgroup>

              <optgroup label="Danger Zone">
                <option value="DELETE">
                  Delete Permanently
                </option>
              </optgroup>
            </select>

            {bulkAction ===
              "PRICE_GROUP" && (
              <select
                value={
                  bulkPriceGroup
                }
                disabled={
                  bulkWorking
                }
                onChange={(
                  event,
                ) =>
                  setBulkPriceGroup(
                    event.target
                      .value,
                  )
                }
                className="min-w-[200px] rounded-md border border-[#d8e4df] bg-white px-3 py-2.5 text-xs font-bold"
              >
                <option value="">
                  Select Price Group
                </option>

                {priceGroups.map(
                  (group) => (
                    <option
                      key={
                        group.id
                      }
                      value={
                        group.id
                      }
                    >
                      {
                        group.name
                      }
                    </option>
                  ),
                )}
              </select>
            )}

            <button
              type="button"
              disabled={
                bulkWorking ||
                selectedIds.size ===
                  0 ||
                !bulkAction ||
                (bulkAction ===
                  "PRICE_GROUP" &&
                  !bulkPriceGroup)
              }
              onClick={
                applyBulkAction
              }
              className={`rounded-md px-4 py-2.5 text-xs font-black text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
                bulkAction ===
                "DELETE"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-[#0a9c63] hover:bg-[#087c50]"
              }`}
            >
              {bulkWorking
                ? "Applying..."
                : "Apply"}
            </button>
          </div>
        </div>
      </section>

      {/* COMPACT LIST */}
      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1180px]">
            <div className="grid grid-cols-[42px_38px_minmax(220px,1fr)_170px_130px_145px_150px_230px] items-center gap-3 border-b border-[#e1ebe7] bg-[#f7faf8] px-4 py-3 text-[9px] font-black uppercase tracking-[.08em] text-[#829198]">
              <span />
              <span />

              <span>
                Dealer
              </span>

              <span>
                Contact
              </span>

              <span>
                Country
              </span>

              <span>
                Status
              </span>

              <span>
                Price Group
              </span>

              <span className="text-right">
                Actions
              </span>
            </div>

            {dealers.map(
              (dealer) => {
                const working =
                  workingId ===
                  dealer.id;

                const open =
                  expanded.has(
                    dealer.id,
                  );

                const checked =
                  selectedIds.has(
                    dealer.id,
                  );

                const group =
                  priceGroups.find(
                    (item) =>
                      item.id ===
                      dealer.priceGroupId,
                  );

                return (
                  <article
                    key={
                      dealer.id
                    }
                    className="border-b border-[#e8efec] last:border-b-0"
                  >
                    {/* COLLAPSED ROW */}
                    <div
                      className={`grid min-h-[68px] grid-cols-[42px_38px_minmax(220px,1fr)_170px_130px_145px_150px_230px] items-center gap-3 px-4 transition ${
                        checked
                          ? "bg-[#f5fbf8]"
                          : open
                            ? "bg-[#f9fbfa]"
                            : "hover:bg-[#fafcfb]"
                      }`}
                    >
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={
                            checked
                          }
                          onChange={() =>
                            toggleSelected(
                              dealer.id,
                            )
                          }
                          className="h-4 w-4 accent-[#0a9c63]"
                          aria-label={`Select ${dealer.companyName}`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          toggleExpanded(
                            dealer.id,
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-md text-lg font-black text-[#637971] transition hover:bg-[#edf7f2] hover:text-[#0a9c63]"
                        aria-label={
                          open
                            ? `Collapse ${dealer.companyName}`
                            : `Expand ${dealer.companyName}`
                        }
                      >
                        <span
                          className={`block transition-transform duration-200 ${
                            open
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
                            dealer.id,
                          )
                        }
                        className="min-w-0 text-left"
                      >
                        <div className="truncate text-sm font-black text-[#17313d]">
                          {
                            dealer.companyName
                          }
                        </div>

                        <div className="mt-0.5 truncate text-[10px] text-[#829198]">
                          {
                            dealer.user.email
                          }
                        </div>
                      </button>

                      <div className="truncate text-xs font-bold text-[#526872]">
                        {
                          dealer.contactName
                        }
                      </div>

                      <div className="truncate text-xs text-[#64777f]">
                        {dealer.country ||
                          "—"}
                      </div>

                      <div>
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.05em] ${statusClass(
                            dealer.status,
                          )}`}
                        >
                          {statusLabel(
                            dealer.status,
                          )}
                        </span>
                      </div>

                      <div className="truncate text-xs font-bold text-[#526872]">
                        {group?.name ||
                          "Not assigned"}
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/dealers/${dealer.id}`}
                          className="whitespace-nowrap rounded-md border border-[#d7e4df] px-3 py-1.5 text-[10px] font-black text-[#526872] transition hover:border-[#0a9c63] hover:bg-[#edf7f2] hover:text-[#0a9c63]"
                        >
                          Full Profile
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            toggleExpanded(
                              dealer.id,
                            )
                          }
                          className="rounded-md border border-[#d7e4df] px-3 py-1.5 text-[10px] font-black text-[#526872] transition hover:border-[#0a9c63] hover:bg-[#edf7f2] hover:text-[#0a9c63]"
                        >
                          {open
                            ? "Close"
                            : "View"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            working
                          }
                          onClick={() =>
                            deleteDealer(
                              dealer,
                            )
                          }
                          className="rounded-md border border-red-200 px-3 py-1.5 text-[10px] font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED DETAILS */}
                    {open && (
                      <div className="border-t border-[#dfe8e4] bg-[#fbfcfc] p-6">
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border border-[#e0e9e5] bg-white p-4">
                              <div className="text-[9px] font-black uppercase tracking-[.08em] text-[#829198]">
                                Phone
                              </div>

                              <div className="mt-2 break-words text-sm font-bold text-[#17313d]">
                                {dealer.phone ||
                                  "Not provided"}
                              </div>
                            </div>

                            <div className="rounded-xl border border-[#e0e9e5] bg-white p-4">
                              <div className="text-[9px] font-black uppercase tracking-[.08em] text-[#829198]">
                                Country
                              </div>

                              <div className="mt-2 break-words text-sm font-bold text-[#17313d]">
                                {dealer.country ||
                                  "Not provided"}
                              </div>
                            </div>

                            <div className="rounded-xl border border-[#e0e9e5] bg-white p-4">
                              <div className="text-[9px] font-black uppercase tracking-[.08em] text-[#829198]">
                                Business Type
                              </div>

                              <div className="mt-2 break-words text-sm font-bold text-[#17313d]">
                                {dealer.businessType ||
                                  "Not provided"}
                              </div>
                            </div>

                            <div className="rounded-xl border border-[#e0e9e5] bg-white p-4">
                              <div className="text-[9px] font-black uppercase tracking-[.08em] text-[#829198]">
                                Job Title
                              </div>

                              <div className="mt-2 break-words text-sm font-bold text-[#17313d]">
                                {dealer.jobTitle ||
                                  "Not provided"}
                              </div>
                            </div>

                            <div className="rounded-xl border border-[#e0e9e5] bg-white p-4">
                              <div className="text-[9px] font-black uppercase tracking-[.08em] text-[#829198]">
                                Website
                              </div>

                              <div className="mt-2 break-all text-sm font-bold text-[#17313d]">
                                {dealer.website ||
                                  "Not provided"}
                              </div>
                            </div>

                            <div className="rounded-xl border border-[#e0e9e5] bg-white p-4">
                              <div className="text-[9px] font-black uppercase tracking-[.08em] text-[#829198]">
                                Registered
                              </div>

                              <div className="mt-2 text-sm font-bold text-[#17313d]">
                                {new Date(
                                  dealer.createdAt,
                                ).toLocaleDateString()}
                              </div>
                            </div>

                            <div className="sm:col-span-2 rounded-xl border border-[#e0e9e5] bg-white p-4">
                              <div className="text-[9px] font-black uppercase tracking-[.08em] text-[#829198]">
                                Products & Services of Interest
                              </div>

                              <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#526872]">
                                {dealer.interests ||
                                  "Not provided"}
                              </div>
                            </div>
                          </div>

                          {/* MANAGEMENT SIDEBAR */}
                          <aside className="h-fit rounded-xl border border-[#dfe8e4] bg-white p-5">
                            <div className="eyebrow">
                              Dealer Management
                            </div>

                            <h3 className="mt-2 text-lg font-black text-[#17313d]">
                              {
                                dealer.companyName
                              }
                            </h3>

                            <label className="mt-5 block text-xs font-black text-[#526872]">
                              Price Group
                            </label>

                            <select
                              value={
                                selectedGroups[
                                  dealer.id
                                ] ?? ""
                              }
                              disabled={
                                working
                              }
                              onChange={(
                                event,
                              ) =>
                                setSelectedGroups(
                                  (
                                    current,
                                  ) => ({
                                    ...current,

                                    [dealer.id]:
                                      event
                                        .target
                                        .value,
                                  }),
                                )
                              }
                              className="mt-2 w-full rounded-md border border-[#d8e4df] bg-white px-3 py-3 text-sm"
                            >
                              <option value="">
                                Select Price Group
                              </option>

                              {priceGroups.map(
                                (
                                  priceGroup,
                                ) => (
                                  <option
                                    key={
                                      priceGroup.id
                                    }
                                    value={
                                      priceGroup.id
                                    }
                                  >
                                    {
                                      priceGroup.name
                                    }
                                  </option>
                                ),
                              )}
                            </select>

                            <button
                              type="button"
                              disabled={
                                working
                              }
                              onClick={() =>
                                updateDealer(
                                  dealer.id,
                                )
                              }
                              className="btn btn-secondary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {working
                                ? "Updating..."
                                : "Save Price Group"}
                            </button>

                            <div className="mt-5 border-t border-[#e5ece9] pt-5">
                              <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                                Account Status
                              </div>

                              <div className="mt-3 grid gap-2">
                                {statusOptions.map(
                                  (
                                    status,
                                  ) => (
                                    <button
                                      key={
                                        status
                                      }
                                      type="button"
                                      disabled={
                                        working ||
                                        dealer.status ===
                                          status
                                      }
                                      onClick={() =>
                                        updateDealer(
                                          dealer.id,
                                          status,
                                        )
                                      }
                                      className="rounded-md border border-[#d8e4df] px-3 py-2 text-xs font-black text-[#526872] transition hover:border-[#0a9c63] hover:bg-[#edf7f2] hover:text-[#0a9c63] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      Set{" "}
                                      {statusLabel(
                                        status,
                                      )}
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>

                            <div className="mt-5 border-t border-[#e5ece9] pt-5">
                              <div className="text-[10px] font-black uppercase tracking-[.08em] text-red-500">
                                Danger Zone
                              </div>

                              <p className="mt-2 text-xs leading-5 text-[#71838b]">
                                Permanently removes
                                this dealer login,
                                profile, Orders,
                                Payments, RFQs,
                                Quotations and
                                Dealer Notes from
                                the database.
                              </p>

                              <button
                                type="button"
                                disabled={
                                  working
                                }
                                onClick={() =>
                                  deleteDealer(
                                    dealer,
                                  )
                                }
                                className="mt-4 w-full rounded-md border border-red-200 bg-white px-4 py-3 text-xs font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {working
                                  ? "Working..."
                                  : "Delete Dealer Permanently"}
                              </button>
                            </div>

                            {working && (
                              <p className="mt-4 text-xs font-bold text-[#0a9c63]">
                                Updating dealer account...
                              </p>
                            )}
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