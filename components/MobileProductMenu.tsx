import Link from "next/link";

import type {
  NavigationProductCategory,
} from "@/components/ProductMegaMenu";

type Props = {
  categories: NavigationProductCategory[];
};

const MAX_MENU_LEVEL = 4;

export function MobileProductMenu({
  categories,
}: Props) {
  const roots =
    categories
      .filter(
        (category) =>
          category.parentId === null,
      )
      .sort(
        (a, b) =>
          a.position - b.position ||
          a.name.localeCompare(b.name),
      );

  function childrenOf(
    parentId: string,
  ) {
    return categories
      .filter(
        (category) =>
          category.parentId === parentId,
      )
      .sort(
        (a, b) =>
          a.position - b.position ||
          a.name.localeCompare(b.name),
      );
  }

  function renderCategory(
    category: NavigationProductCategory,
    depth: number,
  ) {
    const children =
      childrenOf(
        category.id,
      );

    const level =
      depth + 1;

    /*
     * At Level 4, stop recursion.
     *
     * The category itself remains
     * clickable so users can open
     * its category page and continue
     * browsing deeper levels there.
     */
    if (
      level >=
      MAX_MENU_LEVEL
    ) {
      return (
        <Link
          key={category.id}
          href={category.href}
          className="flex min-h-[42px] items-center justify-between gap-3 rounded-md py-2 pr-3 text-xs font-bold text-[#536a75] transition hover:bg-[#edf7f2] hover:text-[#0a9c63]"
          style={{
            paddingLeft: `${
              12 +
              depth * 14
            }px`,
          }}
        >
          <span className="min-w-0">
            {
              category.name
            }
          </span>

          {children.length >
            0 && (
            <span className="shrink-0 text-[9px] font-black uppercase tracking-wide text-[#8a9a93]">
              More
            </span>
          )}
        </Link>
      );
    }

    /*
     * Leaf category before Level 4.
     */
    if (!children.length) {
      return (
        <Link
          key={category.id}
          href={category.href}
          className="flex min-h-[42px] items-center gap-2 rounded-md py-2 pr-3 text-xs font-bold text-[#536a75] transition hover:bg-[#edf7f2] hover:text-[#0a9c63]"
          style={{
            paddingLeft: `${
              12 +
              depth * 14
            }px`,
          }}
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0a9c63]"
          />

          <span className="min-w-0">
            {
              category.name
            }
          </span>
        </Link>
      );
    }

    return (
      <details
        key={category.id}
        className="group/mobile-category"
      >
        <summary
          className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-md py-2 pr-3 text-xs font-black text-[#29424c] transition hover:bg-[#edf7f2]"
          style={{
            paddingLeft: `${
              12 +
              depth * 14
            }px`,
          }}
        >
          <span className="min-w-0">
            {
              category.name
            }
          </span>

          <span
            aria-hidden="true"
            className="shrink-0 text-sm font-black text-[#0a9c63] transition-transform duration-200 group-open/mobile-category:rotate-45"
          >
            +
          </span>
        </summary>

        <div className="mt-1 grid gap-1">
          <Link
            href={category.href}
            className="rounded-md py-2 pr-3 text-[10px] font-black uppercase tracking-wide text-[#0a9c63] transition hover:bg-[#edf7f2]"
            style={{
              paddingLeft: `${
                26 +
                depth * 14
              }px`,
            }}
          >
            View Category →
          </Link>

          {children.map(
            (child) =>
              renderCategory(
                child,
                depth + 1,
              ),
          )}
        </div>
      </details>
    );
  }

  return (
    <details className="group/mobile-products rounded-lg border border-[#dfe8e4]">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 text-sm font-black text-[#17313d] transition hover:bg-[#edf7f2]">
        <span>
          Products
        </span>

        <span
          aria-hidden="true"
          className="text-[#0a9c63] transition-transform duration-200 group-open/mobile-products:rotate-45"
        >
          +
        </span>
      </summary>

      <div className="border-t border-[#e4ebe7] p-2">
        <Link
          href="/products"
          className="mb-2 flex min-h-[42px] items-center justify-between rounded-md bg-[#071f2c] px-3 py-2 text-xs font-black text-white transition hover:bg-[#0a2a3b]"
        >
          <span>
            View All Products
          </span>

          <span
            aria-hidden="true"
          >
            →
          </span>
        </Link>

        {roots.length > 0 ? (
          <div className="grid gap-1">
            {roots.map(
              (category) =>
                renderCategory(
                  category,
                  0,
                ),
            )}
          </div>
        ) : (
          <div className="px-3 py-4 text-xs leading-5 text-[#71838b]">
            Product categories are
            currently being configured.
          </div>
        )}
      </div>
    </details>
  );
}