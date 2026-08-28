"use client";

import Link from "next/link";

type DealerSummary = {
  id: string;
  companyName: string;
  contactName: string;
  status: string;

  businessType:
    | string
    | null;

  priceGroupName:
    | string
    | null;
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
  createdAt: string;

  dealer:
    | DealerSummary
    | null;
};

type Props = {
  contacts: ContactInquiry[];
};

const statusStyles:
  Record<string, string> = {
    NEW:
      "bg-blue-50 text-blue-700",

    READ:
      "bg-slate-100 text-slate-700",

    IN_PROGRESS:
      "bg-amber-50 text-amber-700",

    RESOLVED:
      "bg-emerald-50 text-emerald-700",

    ARCHIVED:
      "bg-zinc-100 text-zinc-600",

    SPAM:
      "bg-red-50 text-red-700",
  };

function statusLabel(
  status: string,
) {
  if (
    status === "IN_PROGRESS"
  ) {
    return "Pending";
  }

  if (
    status === "RESOLVED"
  ) {
    return "Done";
  }

  if (status === "READ") {
    return "Viewed";
  }

  return status.replaceAll(
    "_",
    " ",
  );
}

export function ContactManager({
  contacts,
}: Props) {
  if (!contacts.length) {
    return (
      <div className="card p-10 text-center">
        <div className="eyebrow">
          Contact inbox
        </div>

        <h2 className="mt-3 text-2xl font-extrabold">
          No inquiries found
        </h2>

        <p className="mt-3 text-sm text-[#657983]">
          New public and dealer
          contact submissions will
          appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {contacts.map(
        (contact) => {
          const isDealer =
            contact.source ===
            "DEALER";

          return (
            <article
              key={contact.id}
              className={`card overflow-hidden ${
                contact.status ===
                "NEW"
                  ? "border-l-4 border-l-[#0a9c63]"
                  : ""
              }`}
            >
              <div className="p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/contacts/${contact.id}`}
                        className="text-lg font-extrabold transition hover:text-[#0a9c63]"
                      >
                        {contact.fullName}
                      </Link>

                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[.06em] ${
                          isDealer
                            ? "bg-[#e7f7ef] text-[#087a50]"
                            : "bg-[#edf1f3] text-[#526872]"
                        }`}
                      >
                        {isDealer
                          ? "Dealer Portal"
                          : "Public Website"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[.06em] ${
                          statusStyles[
                            contact.status
                          ] ??
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {statusLabel(
                          contact.status,
                        )}
                      </span>

                      {contact.priority !==
                        "NORMAL" && (
                        <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[.06em] text-orange-700">
                          {
                            contact.priority
                          }
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm font-bold text-[#526872]">
                      {contact.company} ·{" "}
                      {
                        contact.inquiryType
                      }
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#71838b]">
                      {contact.email}

                      {contact.phone
                        ? ` · ${contact.phone}`
                        : ""}

                      {contact.country
                        ? ` · ${contact.country}`
                        : ""}
                    </p>

                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#657983]">
                      {
                        contact.requirement
                      }
                    </p>
                  </div>

                  <Link
                    href={`/admin/contacts/${contact.id}`}
                    className="btn btn-secondary whitespace-nowrap"
                  >
                    View Details
                  </Link>
                </div>
              </div>

              {isDealer &&
                contact.dealer && (
                  <div className="border-t border-[#e1ebe7] bg-[#f4faf7] px-5 py-4 md:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#5f8272]">
                          Verified Dealer
                        </div>

                        <div className="mt-1 text-sm font-extrabold text-[#17313d]">
                          {
                            contact
                              .dealer
                              .companyName
                          }
                        </div>

                        <div className="mt-1 text-xs text-[#657983]">
                          Contact:{" "}
                          {
                            contact
                              .dealer
                              .contactName
                          }

                          {" · "}

                          Status:{" "}
                          {
                            contact
                              .dealer
                              .status
                          }

                          {contact.dealer
                            .priceGroupName
                            ? ` · Price Group: ${contact.dealer.priceGroupName}`
                            : ""}
                        </div>
                      </div>

                      <Link
                        href={`/admin/dealers/${contact.dealer.id}`}
                        className="text-xs font-extrabold text-[#0a7c55] hover:underline"
                      >
                        View Dealer Profile →
                      </Link>
                    </div>
                  </div>
                )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf2ef] px-5 py-3 text-xs text-[#829198] md:px-6">
                <span>
                  {contact.reference}
                </span>

                <span>
                  {new Date(
                    contact.createdAt,
                  ).toLocaleString()}
                </span>
              </div>
            </article>
          );
        },
      )}
    </div>
  );
}