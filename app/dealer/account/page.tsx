import Link from "next/link";

import DealerAccountManager from "@/components/dealer/DealerAccountManager";

import {
  PortalShell,
} from "@/components/PortalShell";

import {
  requireDealer,
} from "@/lib/dealerAuth";

import {
  prisma,
} from "@/lib/prisma";

export const dynamic =
  "force-dynamic";

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
function activityLabel(
  event: string,
) {
  switch (event) {
    case "DEALER_PROFILE_UPDATED":
      return "Company profile updated";

    case "DEALER_PASSWORD_CHANGED":
      return "Account password changed";

    case "DEALER_PASSWORD_RESET":
      return "Account password reset";

    case "DEALER_EMAIL_VERIFIED":
      return "Business email verified";

    case "DEALER_LOGIN":
    case "DEALER_LOGGED_IN":
      return "Signed in to dealer portal";

    case "RFQ_CREATED":
    case "DEALER_RFQ_CREATED":
      return "RFQ submitted";

    case "ORDER_CREATED":
    case "DEALER_ORDER_CREATED":
      return "Order submitted";

    case "CONTACT_INQUIRY_CREATED":
    case "DEALER_CONTACT_CREATED":
      return "Support inquiry submitted";

    default:
      return statusLabel(event);
  }
}

function dateTime(
  value: Date,
) {
  return value.toLocaleString(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

export default async function DealerAccountPage() {
  const dealer =
    await requireDealer();

  const [
    orderCount,
    rfqCount,
    contactCount,
    activities,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        dealerId: dealer.id,
      },
    }),

    prisma.rfq.count({
      where: {
        dealerId: dealer.id,
      },
    }),

    prisma.contactInquiry.count({
      where: {
        dealerId: dealer.id,
      },
    }),

    prisma.activityLog.findMany({
      where: {
        userId: dealer.userId,
      },

      select: {
        id: true,
        event: true,
        entityType: true,
        createdAt: true,
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 10,
    }),
  ]);

  const accountProfile = {
    companyName:
      dealer.companyName,

    contactName:
      dealer.contactName,

    jobTitle:
      dealer.jobTitle,

    businessType:
      dealer.businessType,

    phone:
      dealer.phone,

    country:
      dealer.country,

    website:
      dealer.website,

    interests:
      dealer.interests,
  };

  return (
    <PortalShell title="Dealer Account">
      <section className="rounded-xl border border-[#cfe9dd] bg-[#edf9f3] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#0a7f55]">
              Approved dealer account
            </div>

            <h2 className="mt-2 text-2xl font-black">
              {dealer.companyName}
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#617b70]">
              Manage your company profile, account
              information and security settings.
            </p>
          </div>

          <span className="rounded-full bg-[#d9f3e6] px-4 py-2 text-[10px] font-black uppercase tracking-[.08em] text-[#087a50]">
            {statusLabel(
              dealer.status,
            )}
          </span>
        </div>
      </section>

      <section className="grid-4 mt-6">
        {[
          [
            "Orders",
            orderCount,
            "/dealer/orders",
          ],

          [
            "RFQs",
            rfqCount,
            "/dealer/rfq",
          ],

          [
            "Support Inquiries",
            contactCount,
            "/dealer/contact",
          ],

          [
            "Pricing Group",
            dealer.priceGroup?.name ??
              "Not assigned",
            "/dealer/products",
          ],
        ].map(
          ([label, value, href]) => (
            <Link
              key={label}
              href={String(href)}
              className="card p-5 transition hover:-translate-y-0.5 hover:border-[#a9d6c2]"
            >
              <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
                {label}
              </div>

              <div className="mt-2 break-words text-2xl font-black text-[#0a9c63]">
                {value}
              </div>
            </Link>
          ),
        )}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="card p-6 md:p-7">
          <div className="eyebrow">
            Account information
          </div>

          <h2 className="mt-2 text-xl font-black">
            Dealer access details
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e0e9e5] bg-[#f8fbf9] p-4">
              <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                Dealer ID
              </div>

              <div className="mt-2 break-all text-sm font-black">
                {dealer.id}
              </div>
            </div>

            <div className="rounded-xl border border-[#e0e9e5] bg-[#f8fbf9] p-4">
              <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                Login Email
              </div>

              <div className="mt-2 break-all text-sm font-black">
                {dealer.user.email}
              </div>
            </div>

            <div className="rounded-xl border border-[#e0e9e5] bg-[#f8fbf9] p-4">
              <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                Account Status
              </div>

              <div className="mt-2 text-sm font-black">
                {statusLabel(
                  dealer.status,
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#e0e9e5] bg-[#f8fbf9] p-4">
              <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                Price Group
              </div>

              <div className="mt-2 text-sm font-black">
                {dealer.priceGroup?.name ??
                  "Not assigned"}
              </div>

              {dealer.priceGroup && (
                <div className="mt-1 text-[10px] text-[#829198]">
                  {
                    dealer.priceGroup
                      .slug
                  }
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#e0e9e5] bg-[#f8fbf9] p-4">
              <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                Email Verification
              </div>

              <div className="mt-2 text-sm font-black">
                {dealer.user
                  .emailVerified
                  ? "Verified"
                  : "Not verified"}
              </div>
            </div>

            <div className="rounded-xl border border-[#e0e9e5] bg-[#f8fbf9] p-4">
              <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#829198]">
                Member Since
              </div>

              <div className="mt-2 text-sm font-black">
                {dealer.createdAt.toLocaleDateString(
                  "en-US",
                  {
                    dateStyle:
                      "medium",
                  },
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-[#e8d8aa] bg-[#fffaf0] p-4 text-xs leading-6 text-[#776e58]">
            Dealer ID, login email, status and pricing
            group are protected account fields. Contact
            Dingsheng Energy if any of these values need
            to be changed.
          </div>
        </div>

        <aside className="card p-6 md:p-7">
          <div className="eyebrow">
            Recent activity
          </div>

          <h2 className="mt-2 text-xl font-black">
            Account history
          </h2>

          {!activities.length ? (
            <div className="mt-6 rounded-xl border border-dashed border-[#cfded7] p-6 text-center text-sm text-[#71838b]">
              No account activity has been recorded yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
              {activities.map(
                (activity) => (
                  <div
                    key={activity.id}
                    className="rounded-xl border border-[#e2ebe7] bg-[#f8fbf9] p-4"
                  >
                    <div className="text-sm font-black text-[#17313d]">
                      {activityLabel(
                        activity.event,
                      )}
                    </div>

                    <div className="mt-1 text-[10px] leading-5 text-[#829198]">
                      {dateTime(
                        activity.createdAt,
                      )}

                      {activity.entityType
                        ? ` · ${activity.entityType}`
                        : ""}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </aside>
      </section>

      <div className="mt-6">
        <DealerAccountManager
          profile={accountProfile}
          email={dealer.user.email}
          emailVerified={Boolean(
            dealer.user.emailVerified,
          )}
        />
      </div>
    </PortalShell>
  );
}