"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type DealerStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "REJECTED"
  | "INACTIVE";

type PriceGroup = {
  id: string;
  slug: string;
  name: string;
};

type Dealer = {
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
    emailVerified: string | null;
  };
};

type Props = {
  dealers: Dealer[];
  priceGroups: PriceGroup[];
};

function statusClass(status: DealerStatus) {
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
  const router = useRouter();

  const [selectedGroups, setSelectedGroups] = useState<
    Record<string, string>
  >(
    Object.fromEntries(
      dealers.map((dealer) => [
        dealer.id,
        dealer.priceGroupId ?? "",
      ]),
    ),
  );

  const [workingId, setWorkingId] = useState<string | null>(
    null,
  );

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function updateDealer(
    dealerId: string,
    status?: DealerStatus,
  ) {
    setWorkingId(dealerId);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/dealers/${dealerId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            priceGroupId:
              selectedGroups[dealerId] || null,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to update dealer.",
        );
      }

      setMessage(
        status
          ? `Dealer status updated to ${status}.`
          : "Dealer price group updated.",
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update dealer.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  if (!dealers.length) {
    return (
      <div className="card p-10 text-center">
        <div className="eyebrow">Dealer applications</div>

        <h2 className="mt-3 text-2xl font-extrabold">
          No dealer applications yet
        </h2>

        <p className="mt-3 text-sm text-[#657983]">
          New registrations will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div>
      {message && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {dealers.map((dealer) => {
          const working = workingId === dealer.id;

          return (
            <article
              key={dealer.id}
              className="card overflow-hidden"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e1ebe7] p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-extrabold">
                      <Link
                        href={`/admin/dealers/${dealer.id}`}
                        className="transition hover:text-[#0a9c63]"
                      >
                        {dealer.companyName}
                      </Link>
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[.08em] ${statusClass(
                        dealer.status,
                      )}`}
                    >
                      {dealer.status}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="text-sm text-[#657983]">
                      {dealer.contactName} · {dealer.user.email}
                    </p>

                    <span
                      title={
                        dealer.user.emailVerified
                          ? `Email verified ${new Date(
                              dealer.user.emailVerified,
                            ).toLocaleString()}`
                          : "Dealer has not verified this email address"
                      }
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.07em] ${
                        dealer.user.emailVerified
                          ? "bg-[#e7f7ef] text-[#087a50]"
                          : "bg-[#fff6dc] text-[#926900]"
                      }`}
                    >
                      {dealer.user.emailVerified
                        ? "✓ Email Verified"
                        : "Email Not Verified"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-[#829198]">
                    Registered{" "}
                    {new Date(
                      dealer.createdAt,
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div className="min-w-56">
                  <label className="text-xs font-extrabold text-[#526872]">
                    Assigned price group
                  </label>

                  <select
                    className="mt-2 w-full rounded-md border border-[#d8e4df] bg-white px-3 py-2 text-sm"
                    value={selectedGroups[dealer.id] ?? ""}
                    disabled={working}
                    onChange={(event) =>
                      setSelectedGroups((current) => ({
                        ...current,
                        [dealer.id]: event.target.value,
                      }))
                    }
                  >
                    <option value="">
                      Select price group
                    </option>

                    {priceGroups.map((group) => (
                      <option
                        key={group.id}
                        value={group.id}
                      >
                        {group.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={working}
                    onClick={() =>
                      updateDealer(dealer.id)
                    }
                    className="mt-2 text-xs font-black text-[#0a9c63] disabled:opacity-50"
                  >
                    Save Price Group
                  </button>
                </div>
              </div>

              <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1fr]">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs font-bold text-[#829198]">
                      Phone
                    </div>
                    <div className="mt-1 font-bold">
                      {dealer.phone || "Not provided"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-[#829198]">
                      Country
                    </div>
                    <div className="mt-1 font-bold">
                      {dealer.country || "Not provided"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-[#829198]">
                      Business type
                    </div>
                    <div className="mt-1 font-bold">
                      {dealer.businessType || "Not provided"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-[#829198]">
                      Job title
                    </div>
                    <div className="mt-1 font-bold">
                      {dealer.jobTitle || "Not provided"}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="text-xs font-bold text-[#829198]">
                      Website
                    </div>
                    <div className="mt-1 break-all font-bold">
                      {dealer.website || "Not provided"}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="text-xs font-bold text-[#829198]">
                      Products and services of interest
                    </div>
                    <div className="mt-1 leading-6">
                      {dealer.interests || "Not provided"}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-extrabold uppercase tracking-[.08em] text-[#829198]">
                    Account actions
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {dealer.status !== "ACTIVE" && (
                      <button
                        type="button"
                        disabled={working}
                        onClick={() =>
                          updateDealer(
                            dealer.id,
                            "ACTIVE",
                          )
                        }
                        className="btn btn-primary disabled:opacity-50"
                      >
                        Approve & Activate
                      </button>
                    )}

                    {dealer.status === "ACTIVE" && (
                      <button
                        type="button"
                        disabled={working}
                        onClick={() =>
                          updateDealer(
                            dealer.id,
                            "SUSPENDED",
                          )
                        }
                        className="btn btn-secondary disabled:opacity-50"
                      >
                        Suspend
                      </button>
                    )}

                    {(dealer.status === "SUSPENDED" ||
                      dealer.status === "INACTIVE") && (
                      <button
                        type="button"
                        disabled={working}
                        onClick={() =>
                          updateDealer(
                            dealer.id,
                            "ACTIVE",
                          )
                        }
                        className="btn btn-primary disabled:opacity-50"
                      >
                        Reactivate
                      </button>
                    )}

                    {dealer.status === "PENDING" && (
                      <button
                        type="button"
                        disabled={working}
                        onClick={() =>
                          updateDealer(
                            dealer.id,
                            "REJECTED",
                          )
                        }
                        className="rounded-md border border-red-200 px-5 py-3 text-xs font-black text-red-600 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}

                    {dealer.status !== "INACTIVE" &&
                      dealer.status !== "PENDING" && (
                        <button
                          type="button"
                          disabled={working}
                          onClick={() =>
                            updateDealer(
                              dealer.id,
                              "INACTIVE",
                            )
                          }
                          className="rounded-md border border-[#d8e4df] px-5 py-3 text-xs font-black text-[#657983] disabled:opacity-50"
                        >
                          Mark Inactive
                        </button>
                      )}
                  </div>

                  {working && (
                    <p className="mt-4 text-xs font-bold text-[#0a9c63]">
                      Updating dealer account...
                    </p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}