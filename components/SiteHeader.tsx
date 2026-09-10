import Link from "next/link";

import {
  Brand,
} from "./Brand";

import {
  MobileProductMenu,
} from "./MobileProductMenu";

import {
  ProductMegaMenu,
  type NavigationProductCategory,
} from "./ProductMegaMenu";

import {
  MobileServiceMenu,
} from "./MobileServiceMenu";

import {
  ServiceMegaMenu,
  type NavigationService,
} from "./ServiceMegaMenu";


import {
  nav,
} from "@/data/site";

import {
  isAdminSession,
} from "@/lib/adminAuth";

import {
  getCurrentDealer,
} from "@/lib/dealerAuth";

import {
  buildCategoryHref,
  getPublicProductCategories,
} from "@/lib/publicProductTree";

import {
  buildServiceHref,
  getPublicServices,
} from "@/lib/publicServiceTree";



type PortalSession =
  | {
      type: "admin";
    }
  | {
      type: "dealer";
      companyName: string;
    }
  | null;

export async function SiteHeader() {
  const [
    adminLoggedIn,
    dealer,
    productCategories,
    services,
  ] = await Promise.all([
    isAdminSession(),

    getCurrentDealer(),

    getPublicProductCategories().catch(
      () => [],
    ),

    getPublicServices().catch(
      () => [],
    ),
  ]);

  /*
   * We still detect the current
   * session so the public header
   * can avoid showing Dealer Login
   * to an already authenticated
   * admin or dealer.
   */
  const session: PortalSession =
    adminLoggedIn
      ? {
          type: "admin",
        }
      : dealer
        ? {
            type: "dealer",

            companyName:
              dealer.companyName,
          }
        : null;

  /*
   * Build canonical recursive
   * category URLs on the server.
   */
  const productNavigation: NavigationProductCategory[] =
    productCategories.map(
      (category) => ({
        id: category.id,

        name: category.name,

        slug: category.slug,

        shortName:
          category.shortName,

        summary:
          category.summary,

        parentId:
          category.parentId,

        position:
          category.position,

        href:
          buildCategoryHref(
            productCategories,
            category.id,
          ),
      }),
    );


    const serviceNavigation: NavigationService[] =
  services.map(
    (service) => ({
      id: service.id,

      name: service.name,

      parentId:
        service.parentId,

      position:
        service.position,

      href:
        buildServiceHref(
          services,
          service.id,
        ),
    }),
  );

  return (
    <header className="sticky top-0 z-50 border-b border-[#e5ece9] bg-white/95 backdrop-blur">
      <div className="container-shell flex h-[76px] items-center justify-between gap-6">
        <Brand />

        {/* Desktop navigation */}
        <nav className="hidden h-[76px] items-center gap-6 text-[13px] font-bold text-[#2d444e] lg:flex">
          {nav.map(
            (item) =>
              item.href ===
              "/products" ? (
                <ProductMegaMenu
                  key={item.href}
                  categories={
                    productNavigation
                  }
                />
              ) : item.href ===
                "/services" ? (
                <ServiceMegaMenu
                  key={item.href}
                  services={
                    serviceNavigation
                  }
                />
              ) : (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex h-full items-center text-[13px] font-bold text-[#2d444e] transition-colors duration-200 hover:text-[#0a9c63] after:absolute after:bottom-[18px] after:left-0 after:h-[2px] after:w-0 after:bg-[#0a9c63] after:transition-all after:duration-200 hover:after:w-full"
              >
                {item.label}
              </Link>
              ),
          )}
        </nav>

        {/* Desktop right side */}
        <div className="hidden items-center md:flex">
          {!session && (
            <Link
              className="btn btn-secondary"
              href="/dealer/login"
            >
              Dealer Login
            </Link>
          )}
        </div>

        {/* Mobile navigation */}
        <details className="relative lg:hidden">
          <summary className="cursor-pointer list-none rounded border border-[#d7e4df] px-3 py-2 text-sm font-bold">
            Menu
          </summary>

          <div className="absolute right-0 top-12 max-h-[calc(100vh-100px)] w-[min(320px,calc(100vw-24px))] overflow-y-auto rounded-xl border border-[#dce7e2] bg-white p-4 shadow-2xl">
            <div className="grid gap-2">
              {nav.map(
                (item) =>
                  item.href ===
                  "/products" ? (
                    <MobileProductMenu
                      key={
                        item.href
                      }
                      categories={
                        productNavigation
                      }
                    />
                  ) : item.href ===
                    "/services" ? (
                    <MobileServiceMenu
                      key={
                        item.href
                      }
                      services={
                        serviceNavigation
                      }
                    />
                  ) : (
                    <Link
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      className="rounded-md px-3 py-2 text-sm font-bold hover:bg-[#edf7f2]"
                    >
                      {
                        item.label
                      }
                    </Link>
                  ),
              )}

              {!session && (
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