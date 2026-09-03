import Link from "next/link";

import {
  Brand,
} from "./Brand";

import {
  nav,
} from "@/data/site";

import {
  isAdminSession,
} from "@/lib/adminAuth";

import {
  getCurrentDealer,
} from "@/lib/dealerAuth";

type PortalSession =
  | {
      type: "admin";
      href: string;
      label: string;
      logoutUrl: string;
    }
  | {
      type: "dealer";
      href: string;
      label: string;
      logoutUrl: string;
      companyName: string;
    }
  | null;

export async function SiteHeader() {
  const [
    adminLoggedIn,
    dealer,
  ] = await Promise.all([
    isAdminSession(),
    getCurrentDealer(),
  ]);

  /*
   * If both cookies exist, admin access takes priority.
   */
  const session: PortalSession =
    adminLoggedIn
      ? {
          type: "admin",
          href: "/admin",
          label: "Admin Dashboard",
          logoutUrl:
            "/api/admin/logout",
        }
      : dealer
        ? {
            type: "dealer",
            href:
              "/dealer/dashboard",
            label:
              "Dealer Dashboard",
            logoutUrl:
              "/api/dealer/logout",
            companyName:
              dealer.companyName,
          }
        : null;

  return (
    <header className="sticky top-0 z-50 border-b border-[#e5ece9] bg-white/95 backdrop-blur">
      <div className="container-shell flex h-[76px] items-center justify-between gap-6">
        <Brand />

        <nav className="hidden items-center gap-6 text-[13px] font-bold text-[#2d444e] lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-[#0a9c63]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <Link
                className="btn btn-secondary"
                href={session.href}
              >
                {session.label} →
              </Link>

              <form
                action={session.logoutUrl}
                method="post"
              >
                <button
                  type="submit"
                  className="rounded-md border border-red-200 bg-white px-4 py-3 text-xs font-extrabold text-red-600 transition hover:bg-red-50"
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <Link
              className="btn btn-secondary"
              href="/dealer/login"
            >
              Dealer Login
            </Link>
          )}

          <Link
            className="btn btn-gold"
            href="/contact#rfq"
          >
            Request Quote →
          </Link>
        </div>

        <details className="relative lg:hidden">
          <summary className="cursor-pointer list-none rounded border border-[#d7e4df] px-3 py-2 text-sm font-bold">
            Menu
          </summary>

          <div className="absolute right-0 top-12 w-[280px] rounded-xl border border-[#dce7e2] bg-white p-4 shadow-2xl">
            {session?.type ===
              "dealer" && (
              <div className="mb-3 rounded-md bg-[#edf7f2] px-3 py-2.5">
                <div className="text-[9px] font-black uppercase tracking-[.1em] text-[#0a9c63]">
                  Signed in dealer
                </div>

                <div className="mt-1 truncate text-xs font-black text-[#17313d]">
                  {
                    session.companyName
                  }
                </div>
              </div>
            )}

            {session?.type ===
              "admin" && (
              <div className="mb-3 rounded-md bg-[#edf7f2] px-3 py-2.5">
                <div className="text-[9px] font-black uppercase tracking-[.1em] text-[#0a9c63]">
                  Administrator session
                </div>

                <div className="mt-1 text-xs font-black text-[#17313d]">
                  Administration access
                </div>
              </div>
            )}

            <div className="grid gap-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-bold hover:bg-[#edf7f2]"
                >
                  {item.label}
                </Link>
              ))}

              {session ? (
                <>
                  <Link
                    className="btn btn-primary mt-2"
                    href={session.href}
                  >
                    {session.label} →
                  </Link>

                  <form
                    action={
                      session.logoutUrl
                    }
                    method="post"
                  >
                    <button
                      type="submit"
                      className="w-full rounded-md border border-red-200 px-4 py-3 text-xs font-black text-red-600 transition hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  className="btn btn-primary mt-2"
                  href="/dealer/login"
                >
                  Dealer Login
                </Link>
              )}
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}