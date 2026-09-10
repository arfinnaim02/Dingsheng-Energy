"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

export type NavigationProductCategory = {
  id: string;
  name: string;
  slug: string;

  shortName: string | null;
  summary: string | null;

  parentId: string | null;
  position: number;

  href: string;
};

type Props = {
  categories: NavigationProductCategory[];
};

const MAX_MENU_LEVEL = 4;

export function ProductMegaMenu({
  categories,
}: Props) {
  const roots = useMemo(
    () =>
      categories
        .filter(
          (category) =>
            category.parentId === null,
        )
        .sort(
          (a, b) =>
            a.position - b.position ||
            a.name.localeCompare(b.name),
        ),
    [categories],
  );

  const [activePath, setActivePath] =
    useState<string[]>([]);

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

  function activate(
    categoryId: string,
    level: number,
  ) {
    setActivePath(
      (current) => {
        const next =
          current.slice(
            0,
            level,
          );

        next[level] =
          categoryId;

        return next;
      },
    );
  }

  const columns: NavigationProductCategory[][] =
    [roots];

  for (
    let level = 0;
    level < activePath.length;
    level += 1
  ) {
    /*
     * Column index 0 = Level 1
     * Column index 1 = Level 2
     * Column index 2 = Level 3
     * Column index 3 = Level 4
     *
     * Stop after Level 4.
     */
    if (
      columns.length >=
      MAX_MENU_LEVEL
    ) {
      break;
    }

    const categoryId =
      activePath[level];

    if (!categoryId) {
      break;
    }

    const children =
      childrenOf(
        categoryId,
      );

    if (!children.length) {
      break;
    }

    columns.push(
      children,
    );
  }

  return (
    <div
      className="group relative flex h-[76px] items-center"
      onMouseLeave={() =>
        setActivePath([])
      }
    >
            <Link
            href="/products"
            className="relative flex h-full items-center gap-1.5 text-[13px] font-bold text-[#2d444e] transition-colors duration-200 hover:text-[#0a9c63] after:absolute after:bottom-[18px] after:left-0 after:h-[2px] after:w-0 after:bg-[#0a9c63] after:transition-all after:duration-200 hover:after:w-full"
            >
            Products

            <span className="text-[9px] text-[#7b8d94] transition-transform duration-200 group-hover:rotate-180">
                ▾
            </span>
            </Link>

      <div className="pointer-events-none invisible absolute left-1/2 top-full z-[100] w-max -translate-x-1/2 pt-1 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100">
        <div className="overflow-hidden rounded-xl border border-[#dce7e2] bg-white shadow-[0_22px_60px_rgba(7,31,44,.18)]">
          <div className="flex items-center justify-between gap-10 border-b border-[#e5ece9] bg-[#f8fbf9] px-5 py-4">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.14em] text-[#0a9c63]">
                Product Systems
              </div>

              <div className="mt-1 text-sm font-black text-[#17313d]">
                Explore LPG Equipment
              </div>
            </div>

            <Link
              href="/products"
              className="shrink-0 text-[10px] font-black uppercase tracking-wide text-[#0a9c63] transition hover:opacity-70"
            >
              View All Products →
            </Link>
          </div>

          {roots.length > 0 ? (
            <div className="max-w-[min(1100px,calc(100vw-40px))] overflow-x-auto">
              <div className="flex min-h-[310px]">
                {columns.map(
                  (
                    column,
                    columnIndex,
                  ) => (
                    <div
                      key={
                        columnIndex
                      }
                      className="w-[250px] shrink-0 border-r border-[#e7eeea] p-3 last:border-r-0"
                    >
                      <div className="mb-2 px-3 pt-1 text-[9px] font-black uppercase tracking-[.12em] text-[#8a9a93]">
                        {columnIndex === 0
                          ? "Product Systems"
                          : `Level ${
                              columnIndex +
                              1
                            }`}
                      </div>

                      <div className="grid gap-1">
                        {column.map(
                          (category) => {
                            const children =
                              childrenOf(
                                category.id,
                              );

                            const hasChildren =
                              children.length >
                              0;

                            const canExpandFurther =
                              columnIndex <
                              MAX_MENU_LEVEL -
                                1;

                            const active =
                              activePath[
                                columnIndex
                              ] ===
                              category.id;

                            return (
                              <div
                                key={
                                  category.id
                                }
                                onMouseEnter={() =>
                                  activate(
                                    category.id,
                                    columnIndex,
                                  )
                                }
                                className={`rounded-lg transition ${
                                  active
                                    ? "bg-[#edf7f2]"
                                    : "hover:bg-[#f5f9f7]"
                                }`}
                              >
                                <Link
                                  href={
                                    category.href
                                  }
                                  className="flex min-h-[48px] items-center justify-between gap-3 px-3 py-2.5"
                                >
                                  <div className="min-w-0">
                                    <div
                                      className={`truncate text-[11px] font-black ${
                                        active
                                          ? "text-[#0a9c63]"
                                          : "text-[#29424c]"
                                      }`}
                                    >
                                      {
                                        category.name
                                      }
                                    </div>

                                    {category.summary && (
                                      <div className="mt-0.5 line-clamp-1 text-[9px] font-medium leading-4 text-[#81918a]">
                                        {
                                          category.summary
                                        }
                                      </div>
                                    )}
                                  </div>

                                  {hasChildren &&
                                  canExpandFurther ? (
                                    <span
                                      aria-hidden="true"
                                      className="shrink-0 text-sm font-black text-[#0a9c63]"
                                    >
                                      ›
                                    </span>
                                  ) : hasChildren ? (
                                    <span
                                      aria-hidden="true"
                                      title="More categories available on the category page"
                                      className="shrink-0 text-[9px] font-black uppercase tracking-wide text-[#8a9a93]"
                                    >
                                      More
                                    </span>
                                  ) : (
                                    <span
                                      aria-hidden="true"
                                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#cbd8d2]"
                                    />
                                  )}
                                </Link>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          ) : (
            <div className="w-[420px] p-8 text-center">
              <div className="text-sm font-black text-[#17313d]">
                Product Categories
              </div>

              <p className="mt-2 text-xs leading-6 text-[#71838b]">
                Product categories are
                currently being configured.
              </p>
            </div>
          )}

          <div className="border-t border-[#e5ece9] bg-[#071f2c] px-5 py-3.5">
            <p className="text-[10px] leading-5 text-white/60">
              Browse the first four category
              levels here. Deeper equipment
              categories remain available
              inside each product category
              page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}