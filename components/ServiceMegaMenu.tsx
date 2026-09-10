"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type NavigationService = {
  id: string;
  name: string;
  parentId: string | null;
  position: number;
  href: string;
};

type Props = {
  services: NavigationService[];
};

const MAX_MENU_LEVEL = 4;

function sortServices(
  services: NavigationService[],
) {
  return [...services].sort(
    (a, b) =>
      a.position - b.position ||
      a.name.localeCompare(b.name),
  );
}

export function ServiceMegaMenu({
  services,
}: Props) {
  const [activePath, setActivePath] =
    useState<string[]>([]);

  const childrenByParent = useMemo(() => {
    const map = new Map<
      string | null,
      NavigationService[]
    >();

    for (const service of services) {
      const current =
        map.get(service.parentId) ?? [];

      current.push(service);

      map.set(
        service.parentId,
        current,
      );
    }

    for (const [key, items] of map) {
      map.set(
        key,
        sortServices(items),
      );
    }

    return map;
  }, [services]);

  const roots =
    childrenByParent.get(null) ?? [];

  function childrenOf(
    id: string,
  ) {
    return childrenByParent.get(id) ?? [];
  }

  function activate(
    service: NavigationService,
    level: number,
  ) {
    setActivePath((current) => {
      const next =
        current.slice(
          0,
          level - 1,
        );

      next[level - 1] =
        service.id;

      return next;
    });
  }

  /*
   * Level 1 is always the first column.
   * Each active parent can open one
   * additional column through Level 4.
   */
  const columns: NavigationService[][] = [
    roots,
  ];

  for (
    let level = 1;
    level < MAX_MENU_LEVEL;
    level += 1
  ) {
    const parentId =
      activePath[level - 1];

    if (!parentId) {
      break;
    }

    const children =
      childrenOf(parentId);

    if (!children.length) {
      break;
    }

    columns.push(children);
  }

  return (
    <div
      className="group relative flex h-full items-center"
      onMouseLeave={() =>
        setActivePath([])
      }
    >
        <Link
        href="/services"
        className="relative flex h-full items-center gap-1.5 text-[13px] font-bold text-[#2d444e] transition-colors duration-200 hover:text-[#0a9c63] after:absolute after:bottom-[18px] after:left-0 after:h-[2px] after:w-0 after:bg-[#0a9c63] after:transition-all after:duration-200 hover:after:w-full"
        >
        Services

        <span className="text-[9px] text-[#7b8d94] transition-transform duration-200 group-hover:rotate-180">
            ▾
        </span>
        </Link>

      {roots.length > 0 && (
        <div className="invisible absolute left-1/2 top-full z-[80] -translate-x-1/2 translate-y-2 pt-3 opacity-0 transition duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
          <div className="overflow-hidden rounded-xl border border-[#dce7e2] bg-white shadow-[0_22px_60px_rgba(6,31,45,.18)]">
            <div className="flex min-w-max">
              {columns.map(
                (
                  column,
                  columnIndex,
                ) => {
                  const level =
                    columnIndex + 1;

                  return (
                    <div
                      key={level}
                      className={`w-[260px] p-3 ${
                        columnIndex > 0
                          ? "border-l border-[#e4ece8]"
                          : ""
                      }`}
                    >
                      <div className="px-3 pb-2 pt-1 text-[9px] font-black uppercase tracking-[.14em] text-[#91a19b]">
                        {level === 1
                          ? "Services"
                          : `Level ${level}`}
                      </div>

                      <div className="space-y-1">
                        {column.map(
                          (service) => {
                            const children =
                              childrenOf(
                                service.id,
                              );

                            const hasVisibleNext =
                              children.length >
                                0 &&
                              level <
                                MAX_MENU_LEVEL;

                            const hasDeeper =
                              children.length >
                              0;

                            const active =
                              activePath[
                                level - 1
                              ] ===
                              service.id;

                            return (
                              <div
                                key={
                                  service.id
                                }
                                onMouseEnter={() =>
                                  activate(
                                    service,
                                    level,
                                  )
                                }
                                className={`group/item flex items-center rounded-lg transition ${
                                  active
                                    ? "bg-[#edf7f2]"
                                    : "hover:bg-[#f6faf8]"
                                }`}
                              >
                                <Link
                                  href={
                                    service.href
                                  }
                                  className="min-w-0 flex-1 px-3 py-3"
                                >
                                  <span
                                    className={`block truncate text-xs font-black ${
                                      active
                                        ? "text-[#087b52]"
                                        : "text-[#19313d]"
                                    }`}
                                  >
                                    {
                                      service.name
                                    }
                                  </span>

                                  {level ===
                                    MAX_MENU_LEVEL &&
                                    hasDeeper && (
                                      <span className="mt-1 block text-[9px] font-bold uppercase tracking-wide text-[#0a9c63]">
                                        More
                                      </span>
                                    )}
                                </Link>

                                {hasVisibleNext && (
                                  <span className="pr-3 text-xs font-black text-[#8a9b94]">
                                    ›
                                  </span>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>

                      {level === 1 && (
                        <div className="mt-3 border-t border-[#e5ece9] px-3 pt-3">
                          <Link
                            href="/services"
                            className="text-[10px] font-black uppercase tracking-[.08em] text-[#0a9c63]"
                          >
                            View All Services →
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}