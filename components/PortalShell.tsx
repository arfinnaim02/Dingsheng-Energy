import Link from "next/link";

import {
  Brand,
} from "./Brand";

import {
  DealerCartDrawer,
} from "./dealer/DealerCartDrawer";

const dealerNav = [
  [
    "Dashboard",
    "/dealer/dashboard",
  ],

  [
    "Products",
    "/dealer/products",
  ],

  [
    "RFQs",
    "/dealer/rfq",
  ],

  [
    "Cart",
    "/dealer/cart",
  ],

  [
    "Orders",
    "/dealer/orders",
  ],

  [
    "Payments",
    "/dealer/payments",
  ],

  [
    "Downloads",
    "/dealer/downloads",
  ],

  [
    "Contact Support",
    "/dealer/contact",
  ],

  [
    "Account",
    "/dealer/account",
  ],
];

const adminNav = [
  [
    "Dashboard",
    "/admin",
  ],

  [
    "Products",
    "/admin/products",
  ],

  [
    "Pricing",
    "/admin/pricing",
  ],

  [
    "Services",
    "/admin/services",
  ],

  [
    "Categories",
    "/admin/categories",
  ],

  [
    "Dealers",
    "/admin/dealers",
  ],

  [
    "Contacts",
    "/admin/contacts",
  ],

  [
    "RFQs",
    "/admin/rfqs",
  ],

  [
    "Orders",
    "/admin/orders",
  ],

  [
    "Payments",
    "/admin/payments",
  ],

  [
    "Operations",
    "/admin/operations",
  ],

  [
    "Activity",
    "/admin/activity",
  ],

  [
    "Settings",
    "/admin/settings",
  ],
];

export function PortalShell({
  children,
  admin = false,
  title,
}: {
  children:
    React.ReactNode;

  admin?: boolean;
  title?: string;
}) {
  const items =
    admin
      ? adminNav
      : dealerNav;

  return (
    <div className="sidebar-shell portal-grid">
      <aside className="portal-side">
        <Brand
          inverse
          compact
        />

        <div className="mt-6 text-[10px] font-extrabold uppercase tracking-[.16em] text-white/35">
          {admin
            ? "Control Center"
            : "Dealer Portal"}
        </div>

        <nav className="portal-nav">
          {items.map(
            ([
              label,
              href,
            ]) => (
              <Link
                key={href}
                href={href}
              >
                {label}
              </Link>
            ),
          )}
        </nav>

        <Link
          href="/"
          className="mt-8 block text-xs font-bold text-white/45 hover:text-white"
        >
          ← Public Website
        </Link>

        {admin ? (
          <form
            action="/api/admin/logout"
            method="post"
            className="mt-3"
          >
            <button className="text-xs font-bold text-white/45 hover:text-white">
              Sign out
            </button>
          </form>
        ) : (
          <form
            action="/api/dealer/logout"
            method="post"
            className="mt-3"
          >
            <button className="text-xs font-bold text-white/45 hover:text-white">
              Sign out
            </button>
          </form>
        )}
      </aside>

      <main className="portal-main">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="eyebrow">
              {admin
                ? "Dingsheng administration"
                : "Approved dealer workspace"}
            </div>

            <h1 className="mt-2 text-3xl font-extrabold tracking-[-.03em]">
              {title ||
                (admin
                  ? "Admin"
                  : "Dealer Portal")}
            </h1>
          </div>

          <span className="status">
            {admin
              ? "Local content manager"
              : "Protected commercial portal"}
          </span>
        </div>

        <div className="mock-note mb-7">
          {admin
            ? "Products, categories, services, contact inquiries and protected dealer pricing are managed from this administration workspace."
            : "This protected workspace displays the commercial access and pricing group assigned to your approved dealer account. Product availability, prices and commercial information may vary by dealer profile."}
        </div>

        {children}
      </main>

      {!admin && (
        <DealerCartDrawer />
      )}
    </div>
  );
}