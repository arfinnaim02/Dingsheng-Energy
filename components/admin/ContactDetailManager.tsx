"use client";

import {
  useRouter,
} from "next/navigation";

import {
  useState,
} from "react";

type DealerDetails = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  role: string;

  phone:
    | string
    | null;

  country:
    | string
    | null;

  businessType:
    | string
    | null;

  website:
    | string
    | null;

  jobTitle:
    | string
    | null;

  status: string;

  interests:
    | string
    | null;

  priceGroup: {
    id: string;
    slug: string;
    name: string;
  } | null;
};

type ContactInquiry = {
  id: string;
  reference: string;
  source: string;

  dealerId:
    | string
    | null;

  fullName: string;
  company: string;
  email: string;

  phone:
    | string
    | null;

  country:
    | string
    | null;

  inquiryType: string;
  requirement: string;
  status: string;
  priority: string;

  internalNotes:
    | string
    | null;

  ipAddress:
    | string
    | null;

  userAgent:
    | string
    | null;

  createdAt: string;
  updatedAt: string;

  dealer:
    | DealerDetails
    | null;
};

type Props = {
  contact: ContactInquiry;
};

function statusLabel(
  status: string,
) {
  switch (status) {
    case "NEW":
      return "New";

    case "READ":
      return "Viewed";

    case "IN_PROGRESS":
      return "Pending";

    case "RESOLVED":
      return "Done";

    case "ARCHIVED":
      return "Archived";

    case "SPAM":
      return "Spam";

    default:
      return status;
  }
}

export function ContactDetailManager({
  contact,
}: Props) {
  const router = useRouter();

  const [status, setStatus] =
    useState(contact.status);

  const [priority, setPriority] =
    useState(contact.priority);

  const [notes, setNotes] =
    useState(
      contact.internalNotes ??
        "",
    );

  const [working, setWorking] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function save() {
    setWorking(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/contacts/${contact.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            status,
            priority,
            internalNotes: notes,
          }),
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to save the inquiry.",
        );
      }

      setMessage(
        "Contact inquiry updated successfully.",
      );

      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the inquiry.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function quickStatus(
    nextStatus:
      | "IN_PROGRESS"
      | "RESOLVED",
  ) {
    setStatus(nextStatus);
    setWorking(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/contacts/${contact.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            status: nextStatus,
            priority,
            internalNotes: notes,
          }),
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to update status.",
        );
      }

      setMessage(
        nextStatus ===
          "RESOLVED"
          ? "Contact marked as Done."
          : "Contact marked as Pending.",
      );

      router.refresh();
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Unable to update status.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function remove() {
    const confirmed =
      confirm(
        `Permanently delete ${contact.reference}? This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    setWorking(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/contacts/${contact.id}`,
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
            "Unable to delete the inquiry.",
        );
      }

      router.push(
        "/admin/contacts",
      );

      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete the inquiry.",
      );

      setWorking(false);
    }
  }

  const emailSubject =
    encodeURIComponent(
      `Re: ${contact.reference} - ${contact.inquiryType}`,
    );

  const whatsappNumber =
    contact.phone?.replace(
      /\D/g,
      "",
    );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
      <div className="space-y-6">
        <section className="card p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="eyebrow">
                  {contact.reference}
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[.07em] ${
                    contact.source ===
                    "DEALER"
                      ? "bg-[#e7f7ef] text-[#087a50]"
                      : "bg-[#edf1f3] text-[#526872]"
                  }`}
                >
                  {contact.source ===
                  "DEALER"
                    ? "Dealer Portal"
                    : "Public Website"}
                </span>
              </div>

              <h2 className="mt-3 text-2xl font-black">
                {contact.fullName}
              </h2>

              <p className="mt-2 text-sm font-bold text-[#526872]">
                {contact.company} ·{" "}
                {contact.inquiryType}
              </p>
            </div>

            <span className="status">
              {statusLabel(status)}
            </span>
          </div>

          <div className="mt-7 grid gap-5 border-y border-[#e1ebe7] py-6 sm:grid-cols-2">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                Email
              </div>

              <a
                href={`mailto:${contact.email}?subject=${emailSubject}`}
                className="mt-1 block break-all font-bold text-[#0a7c55]"
              >
                {contact.email}
              </a>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                Phone / WhatsApp
              </div>

              <div className="mt-1 font-bold">
                {contact.phone ||
                  "Not provided"}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                Country
              </div>

              <div className="mt-1 font-bold">
                {contact.country ||
                  "Not provided"}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                Submitted
              </div>

              <div className="mt-1 font-bold">
                {new Date(
                  contact.createdAt,
                ).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-7">
            <div className="eyebrow">
              Requirement details
            </div>

            <div className="mt-4 whitespace-pre-wrap rounded-xl bg-[#f7faf8] p-5 text-sm leading-7 text-[#526872]">
              {contact.requirement}
            </div>
          </div>
        </section>

        {contact.source ===
          "DEALER" &&
          contact.dealer && (
            <section className="card overflow-hidden">
              <div className="border-b border-[#dce9e3] bg-[#eff9f4] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="eyebrow">
                      Verified dealer
                      profile
                    </div>

                    <h2 className="mt-2 text-xl font-black">
                      {
                        contact.dealer
                          .companyName
                      }
                    </h2>

                    <p className="mt-2 text-sm text-[#5f756b]">
                      This message was
                      submitted from an
                      authenticated dealer
                      account.
                    </p>
                  </div>

                  <span className="status">
                    {
                      contact.dealer
                        .status
                    }
                  </span>
                </div>
              </div>

              <div className="grid gap-6 p-6 sm:grid-cols-2">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                    Contact Person
                  </div>

                  <div className="mt-1 font-bold">
                    {
                      contact.dealer
                        .contactName
                    }
                  </div>

                  {contact.dealer
                    .jobTitle && (
                    <div className="mt-1 text-xs text-[#71838b]">
                      {
                        contact.dealer
                          .jobTitle
                      }
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                    Dealer Email
                  </div>

                  <a
                    href={`mailto:${contact.dealer.email}`}
                    className="mt-1 block break-all font-bold text-[#0a7c55]"
                  >
                    {
                      contact.dealer
                        .email
                    }
                  </a>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                    Phone
                  </div>

                  <div className="mt-1 font-bold">
                    {contact.dealer
                      .phone ||
                      "Not provided"}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                    Country
                  </div>

                  <div className="mt-1 font-bold">
                    {contact.dealer
                      .country ||
                      "Not provided"}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                    Business Type
                  </div>

                  <div className="mt-1 font-bold">
                    {contact.dealer
                      .businessType ||
                      "Not provided"}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                    Price Group
                  </div>

                  <div className="mt-1 font-bold">
                    {contact.dealer
                      .priceGroup
                      ?.name ||
                      "Not assigned"}
                  </div>

                  {contact.dealer
                    .priceGroup && (
                    <div className="mt-1 text-xs text-[#71838b]">
                      {
                        contact.dealer
                          .priceGroup
                          .slug
                      }
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                    Dealer Status
                  </div>

                  <div className="mt-1 font-bold">
                    {
                      contact.dealer
                        .status
                    }
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                    Account Role
                  </div>

                  <div className="mt-1 font-bold">
                    {
                      contact.dealer
                        .role
                    }
                  </div>
                </div>

                {contact.dealer
                  .website && (
                  <div className="sm:col-span-2">
                    <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                      Website
                    </div>

                    <a
                      href={
                        contact.dealer
                          .website
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block break-all font-bold text-[#0a7c55] hover:underline"
                    >
                      {
                        contact.dealer
                          .website
                      }
                    </a>
                  </div>
                )}

                {contact.dealer
                  .interests && (
                  <div className="sm:col-span-2">
                    <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                      Dealer Interests
                    </div>

                    <div className="mt-2 whitespace-pre-wrap rounded-lg bg-[#f7faf8] p-4 text-sm leading-6 text-[#657983]">
                      {
                        contact.dealer
                          .interests
                      }
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[#e1ebe7] px-6 py-4">
                <a
                  href={`/admin/dealers/${contact.dealer.id}`}
                  className="btn btn-secondary inline-flex"
                >
                  View Complete Dealer
                  Profile →
                </a>
              </div>
            </section>
          )}

        <section className="card p-6">
          <div className="eyebrow">
            Submission metadata
          </div>

          <div className="mt-4 grid gap-3 text-xs leading-6 text-[#71838b]">
            <p>
              <strong>
                Contact source:
              </strong>{" "}
              {contact.source ===
              "DEALER"
                ? "Authenticated Dealer Portal"
                : "Public Website"}
            </p>

            {contact.dealerId && (
              <p>
                <strong>
                  Dealer profile ID:
                </strong>{" "}
                {contact.dealerId}
              </p>
            )}

            <p>
              <strong>
                IP address:
              </strong>{" "}
              {contact.ipAddress ||
                "Unavailable"}
            </p>

            <p className="break-all">
              <strong>
                Browser:
              </strong>{" "}
              {contact.userAgent ||
                "Unavailable"}
            </p>

            <p>
              <strong>
                Last updated:
              </strong>{" "}
              {new Date(
                contact.updatedAt,
              ).toLocaleString()}
            </p>
          </div>
        </section>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <section className="card p-6">
          <div className="eyebrow">
            Quick actions
          </div>

          <h2 className="mt-2 text-lg font-black">
            Contact progress
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={working}
              onClick={() =>
                void quickStatus(
                  "IN_PROGRESS",
                )
              }
              className={`rounded-lg border px-4 py-3 text-xs font-extrabold transition disabled:opacity-50 ${
                status ===
                "IN_PROGRESS"
                  ? "border-amber-400 bg-amber-50 text-amber-700"
                  : "border-[#d8e4df] hover:bg-amber-50"
              }`}
            >
              Pending
            </button>

            <button
              type="button"
              disabled={working}
              onClick={() =>
                void quickStatus(
                  "RESOLVED",
                )
              }
              className={`rounded-lg border px-4 py-3 text-xs font-extrabold transition disabled:opacity-50 ${
                status ===
                "RESOLVED"
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-[#d8e4df] hover:bg-emerald-50"
              }`}
            >
              Done
            </button>
          </div>

          <div className="field mt-6">
            <label>
              Detailed Status
            </label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value,
                )
              }
            >
              <option value="NEW">
                New
              </option>

              <option value="READ">
                Viewed
              </option>

              <option value="IN_PROGRESS">
                Pending
              </option>

              <option value="RESOLVED">
                Done
              </option>

              <option value="ARCHIVED">
                Archived
              </option>

              <option value="SPAM">
                Spam
              </option>
            </select>
          </div>

          <div className="field mt-4">
            <label>Priority</label>

            <select
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target.value,
                )
              }
            >
              <option value="LOW">
                Low
              </option>

              <option value="NORMAL">
                Normal
              </option>

              <option value="HIGH">
                High
              </option>

              <option value="URGENT">
                Urgent
              </option>
            </select>
          </div>

          <div className="field mt-4">
            <label>
              Internal Admin Notes
            </label>

            <textarea
              className="!min-h-[180px]"
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value,
                )
              }
              placeholder="Follow-up notes, call result, assigned person or next action..."
            />

            <p className="mt-2 text-[11px] leading-5 text-[#829198]">
              These notes are private and
              are never shown to the
              customer.
            </p>
          </div>

          {message && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={working}
            onClick={() =>
              void save()
            }
            className="btn btn-primary mt-5 w-full disabled:opacity-50"
          >
            {working
              ? "Saving..."
              : "Save Changes"}
          </button>

          <a
            href={`mailto:${contact.email}?subject=${emailSubject}`}
            className="btn btn-secondary mt-3 block w-full text-center"
          >
            Reply by Email
          </a>

          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary mt-3 block w-full text-center"
            >
              Open WhatsApp
            </a>
          )}

          {contact.source ===
            "DEALER" &&
            contact.dealer && (
              <a
                href={`/admin/dealers/${contact.dealer.id}`}
                className="btn btn-secondary mt-3 block w-full text-center"
              >
                Open Dealer Profile
              </a>
            )}

          <button
            type="button"
            disabled={working}
            onClick={() =>
              void remove()
            }
            className="mt-5 w-full rounded-md border border-red-200 py-3 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            Delete Permanently
          </button>
        </section>
      </aside>
    </div>
  );
}