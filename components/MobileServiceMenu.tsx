"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  NavigationService,
} from "@/components/ServiceMegaMenu";

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

export function MobileServiceMenu({
  services,
}: Props) {
  const [open, setOpen] =
    useState(false);

  const [expanded, setExpanded] =
    useState<Set<string>>(
      () => new Set(),
    );

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

  function toggle(
    id: string,
  ) {
    setExpanded((current) => {
      const next =
        new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function closeMenu() {
    setOpen(false);
  }

  function renderServices(
    parentId: string | null,
    level: number,
  ): React.ReactNode {
    if (
      level >
      MAX_MENU_LEVEL
    ) {
      return null;
    }

    const items =
      childrenByParent.get(
        parentId,
      ) ?? [];

    if (!items.length) {
      return null;
    }

    return (
      <div
        className={
          level === 1
            ? "space-y-1"
            : "mt-1 space-y-1"
        }
      >
        {items.map(
          (service) => {
            const children =
              childrenByParent.get(
                service.id,
              ) ?? [];

            const canExpand =
              children.length >
                0 &&
              level <
                MAX_MENU_LEVEL;

            const hasDeeper =
              children.length >
              0;

            const isExpanded =
              expanded.has(
                service.id,
              );

            return (
              <div
                key={
                  service.id
                }
                style={{
                  marginLeft: `${
                    Math.max(
                      0,
                      level - 1,
                    ) * 14
                  }px`,
                }}
              >
                <div className="flex items-center rounded-lg border border-transparent hover:border-[#dce7e2] hover:bg-[#f7faf8]">
                  <Link
                    href={
                      service.href
                    }
                    onClick={
                      closeMenu
                    }
                    className="min-w-0 flex-1 px-3 py-2.5 text-xs font-black text-[#19313d]"
                  >
                    <span className="block truncate">
                      {
                        service.name
                      }
                    </span>

                    {level ===
                      MAX_MENU_LEVEL &&
                      hasDeeper && (
                        <span className="mt-1 block text-[9px] font-black uppercase tracking-wide text-[#0a9c63]">
                          More
                        </span>
                      )}
                  </Link>

                  {canExpand && (
                    <button
                      type="button"
                      onClick={() =>
                        toggle(
                          service.id,
                        )
                      }
                      aria-label={
                        isExpanded
                          ? `Collapse ${service.name}`
                          : `Expand ${service.name}`
                      }
                      className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-black text-[#61766f]"
                    >
                      {isExpanded
                        ? "−"
                        : "+"}
                    </button>
                  )}
                </div>

                {canExpand &&
                  isExpanded &&
                  renderServices(
                    service.id,
                    level + 1,
                  )}
              </div>
            );
          },
        )}
      </div>
    );
  }

  return (
    <div className="border-b border-[#e5ece9]">
      <div className="flex items-center">
        <Link
          href="/services"
          onClick={
            closeMenu
          }
          className="min-w-0 flex-1 py-3 text-sm font-black text-[#18313d]"
        >
          Services
        </Link>

        {services.length >
          0 && (
          <button
            type="button"
            onClick={() =>
              setOpen(
                (current) =>
                  !current,
              )
            }
            aria-label="Toggle Services menu"
            className="flex h-10 w-10 items-center justify-center text-base font-black text-[#61766f]"
          >
            {open
              ? "−"
              : "+"}
          </button>
        )}
      </div>

      {open && (
        <div className="pb-4">
          {renderServices(
            null,
            1,
          )}

          <Link
            href="/services"
            onClick={
              closeMenu
            }
            className="mt-3 block px-3 text-[10px] font-black uppercase tracking-[.1em] text-[#0a9c63]"
          >
            View All Services →
          </Link>
        </div>
      )}
    </div>
  );
}