"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import type {
  DealerPortalSettings,
  DealerPrice,
  PriceGroup,
  Product,
} from "@/data/site";

type Props = {
  initialGroups: PriceGroup[];
  products: Product[];
  dealerPortal: DealerPortalSettings;
};

function parseOptionalNumber(
  value: string,
): number | undefined {
  if (!value.trim()) return undefined;

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : undefined;
}

export function PricingManager({
  initialGroups,
  products,
  dealerPortal: initialPortal,
}: Props) {
  const router = useRouter();

  const [groups, setGroups] = useState<
    PriceGroup[]
  >(structuredClone(initialGroups));

  const [dealerPortal] =
    useState<DealerPortalSettings>(
      structuredClone(initialPortal),
    );

  const initialSelectedGroup =
    initialGroups.find(
      (group) =>
        group.slug ===
          initialPortal.demoPriceGroupSlug &&
        group.active !== false,
    ) ??
    initialGroups.find(
      (group) =>
        group.active !== false,
    ) ??
    initialGroups[0];

  const [selectedGroup, setSelectedGroup] =
    useState(
      initialSelectedGroup?.slug ??
        "standard",
    );

  const [prices, setPrices] = useState<
    Record<string, DealerPrice[]>
  >(
    Object.fromEntries(
      products.map((product) => [
        product.slug,

        structuredClone(
          product.dealerPrices ?? [],
        ),
      ]),
    ),
  );

  const [search, setSearch] = useState("");
  const [saving, setSaving] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [error, setError] =
    useState("");

  const activeGroups = groups.filter(
    (group) =>
      group.active !== false,
  );

  const visibleProducts = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) =>
      [
        product.name,
        product.slug,
        product.sku,
        product.subcategory,
        product.summary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [products, search]);

  function currentPrice(
    productSlug: string,
    groupSlug = selectedGroup,
  ): DealerPrice {
    return (
      prices[productSlug]?.find(
        (price) =>
          price.priceGroupSlug ===
          groupSlug,
      ) ?? {
        priceGroupSlug: groupSlug,
        currency: "USD",
      }
    );
  }

  function patchPrice(
    productSlug: string,
    key: keyof DealerPrice,
    value: string,
  ) {
    setPrices((current) => {
      const next =
        structuredClone(current);

      const productPrices = [
        ...(next[productSlug] ?? []),
      ];

      const index =
        productPrices.findIndex(
          (price) =>
            price.priceGroupSlug ===
            selectedGroup,
        );

      const row: DealerPrice =
        index >= 0
          ? {
              ...productPrices[index],
            }
          : {
              priceGroupSlug:
                selectedGroup,
              currency: "USD",
            };

      if (
        key === "amount" ||
        key === "minimumQty"
      ) {
        row[key] =
          parseOptionalNumber(value);
      } else {
        row[key] = value;
      }

      if (index >= 0) {
        productPrices[index] = row;
      } else {
        productPrices.push(row);
      }

      next[productSlug] =
        productPrices;

      return next;
    });
  }

  function patchGroup(
    index: number,
    key: keyof PriceGroup,
    value: string | boolean,
  ) {
    setGroups((current) =>
      current.map(
        (group, groupIndex) =>
          groupIndex === index
            ? {
                ...group,
                [key]: value,
              }
            : group,
      ),
    );
  }

  function addGroup() {
    let suffix = groups.length + 1;
    let slug = `custom-${suffix}`;

    while (
      groups.some(
        (group) =>
          group.slug === slug,
      )
    ) {
      suffix += 1;
      slug = `custom-${suffix}`;
    }

    const newGroup: PriceGroup = {
      slug,
      name: `Custom ${suffix}`,
      description: "",
      active: true,
    };

    setGroups((current) => [
      ...current,
      newGroup,
    ]);

    setSelectedGroup(newGroup.slug);
    setMessage("");
    setError("");
  }

  function deleteGroup(index: number) {
    const group = groups[index];

    if (!group) return;

    if (groups.length <= 1) {
      setError(
        "At least one price group must remain.",
      );

      setMessage("");
      return;
    }

    const confirmed = window.confirm(
      `Delete the "${group.name}" price group?\n\nThis removes its configured product prices. A group assigned to a dealer cannot be deleted until those dealers are reassigned.`,
    );

    if (!confirmed) return;

    const remainingGroups =
      groups.filter(
        (_, groupIndex) =>
          groupIndex !== index,
      );

    setGroups(remainingGroups);

    setPrices((current) =>
      Object.fromEntries(
        Object.entries(current).map(
          ([
            productSlug,
            productPrices,
          ]) => [
            productSlug,

            productPrices.filter(
              (price) =>
                price.priceGroupSlug !==
                group.slug,
            ),
          ],
        ),
      ),
    );

    if (
      selectedGroup === group.slug
    ) {
      const replacement =
        remainingGroups.find(
          (remainingGroup) =>
            remainingGroup.active !==
            false,
        ) ?? remainingGroups[0];

      setSelectedGroup(
        replacement.slug,
      );
    }

    setError("");

    setMessage(
      `"${group.name}" is marked for deletion. Click Save Pricing to confirm.`,
    );
  }

  function changeGroupActive(
    index: number,
    active: boolean,
  ) {
    const group = groups[index];

    if (!group) return;

    if (
      !active &&
      groups.filter(
        (candidate, candidateIndex) =>
          candidateIndex !== index &&
          candidate.active !== false,
      ).length === 0
    ) {
      setError(
        "At least one active price group is required.",
      );

      return;
    }

    patchGroup(
      index,
      "active",
      active,
    );

    if (
      !active &&
      selectedGroup === group.slug
    ) {
      const replacement = groups.find(
        (candidate, candidateIndex) =>
          candidateIndex !== index &&
          candidate.active !== false,
      );

      if (replacement) {
        setSelectedGroup(
          replacement.slug,
        );
      }
    }

    setError("");
  }

  async function save(
    event: FormEvent,
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    const normalizedNames =
      groups.map((group) =>
        group.name.trim(),
      );

    if (
      normalizedNames.some(
        (name) => !name,
      )
    ) {
      setError(
        "Every price group requires a name.",
      );

      setSaving(false);
      return;
    }

    const uniqueNames = new Set(
      normalizedNames.map((name) =>
        name.toLowerCase(),
      ),
    );

    if (
      uniqueNames.size !==
      normalizedNames.length
    ) {
      setError(
        "Price group names must be unique.",
      );

      setSaving(false);
      return;
    }

    if (
      !groups.some(
        (group) =>
          group.active !== false,
      )
    ) {
      setError(
        "At least one active price group is required.",
      );

      setSaving(false);
      return;
    }

    try {
      const response = await fetch(
        "/api/admin/pricing",
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            priceGroups: groups,
            dealerPortal: {
              ...dealerPortal,

              demoPriceGroupSlug:
                selectedGroup,
            },

            productPrices: prices,
          }),
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to save pricing.",
        );
      }

      setMessage(
        "Dealer pricing saved to Neon. Dealer products, cart and checkout now use the updated values.",
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save pricing.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="space-y-6"
    >
      <section className="card p-6 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="eyebrow">
              Dealer pricing engine
            </div>

            <h2 className="mt-2 text-xl font-black">
              Price groups and protected dealer
              pricing
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#71838b]">
              Create, edit, select, disable or
              delete dealer price groups. Neon is
              the authoritative source for all
              protected prices.
            </p>
          </div>

          <button
            type="button"
            onClick={addGroup}
            className="btn btn-secondary"
          >
            + Add Price Group
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {groups.map(
            (group, index) => (
              <div
                key={`${group.slug}-${index}`}
                className={`rounded-xl border bg-[#fafcfb] p-5 transition ${
                  selectedGroup ===
                  group.slug
                    ? "border-[#0a9c63] ring-2 ring-[#0a9c63]/15"
                    : "border-[#dfe8e4]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
                      Price group
                    </div>

                    <div className="mt-1 font-black">
                      {group.name ||
                        "Unnamed Group"}
                    </div>
                  </div>

                  <span
                    className={
                      group.active !== false
                        ? "rounded-full bg-[#e7f7ef] px-3 py-1 text-[10px] font-black uppercase text-[#087a50]"
                        : "rounded-full bg-[#eef1f2] px-3 py-1 text-[10px] font-black uppercase text-[#657983]"
                    }
                  >
                    {group.active !== false
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="field">
                    <label>
                      Group name
                    </label>

                    <input
                      value={group.name}
                      onChange={(event) =>
                        patchGroup(
                          index,
                          "name",
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="field">
                    <label>Slug</label>

                    <input
                      value={group.slug}
                      readOnly
                      className="!bg-[#f1f5f3] !text-[#7a8d84]"
                    />
                  </div>

                  <div className="field sm:col-span-2">
                    <label>
                      Description
                    </label>

                    <input
                      value={
                        group.description ??
                        ""
                      }
                      onChange={(event) =>
                        patchGroup(
                          index,
                          "description",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e3ebe7] pt-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#526a75]">
                    <input
                      type="checkbox"
                      checked={
                        group.active !== false
                      }
                      onChange={(event) =>
                        changeGroupActive(
                          index,
                          event.target.checked,
                        )
                      }
                    />

                    Active price group
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedGroup(
                          group.slug,
                        )
                      }
                      disabled={
                        group.active === false
                      }
                      className={
                        selectedGroup ===
                        group.slug
                          ? "rounded-md bg-[#0a9c63] px-3 py-2 text-[10px] font-black uppercase tracking-[.06em] text-white"
                          : "rounded-md border border-[#cfe1d9] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[.06em] text-[#0a9c63] disabled:cursor-not-allowed disabled:opacity-40"
                      }
                    >
                      {selectedGroup ===
                      group.slug
                        ? "Selected"
                        : "Edit Prices"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteGroup(index)
                      }
                      className="rounded-md border border-red-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[.06em] text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e3ebe7] p-6">
          <div>
            <div className="eyebrow">
              Neon price matrix
            </div>

            <h2 className="mt-2 text-xl font-black">
              Dealer product prices
            </h2>

            <p className="mt-2 text-sm text-[#71838b]">
              Enter only approved commercial
              values. Blank prices remain
              unconfigured and continue through
              RFQ.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="field !gap-1">
              <label>
                Edit price group
              </label>

              <select
                value={selectedGroup}
                onChange={(event) =>
                  setSelectedGroup(
                    event.target.value,
                  )
                }
              >
                {activeGroups.map(
                  (group) => (
                    <option
                      key={group.slug}
                      value={group.slug}
                    >
                      {group.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="field !gap-1">
              <label>
                Search products
              </label>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Product name or SKU..."
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left">
            <thead>
              <tr className="bg-[#f6f9f7] text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
                <th className="px-5 py-4">
                  Product
                </th>

                <th className="px-3 py-4">
                  Currency
                </th>

                <th className="px-3 py-4">
                  Unit Price
                </th>

                <th className="px-3 py-4">
                  MOQ
                </th>

                <th className="px-3 py-4">
                  Lead Time
                </th>

                <th className="px-3 py-4">
                  Commercial Note
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleProducts.map(
                (product) => {
                  const price =
                    currentPrice(
                      product.slug,
                    );

                  return (
                    <tr
                      key={product.slug}
                      className="border-t border-[#edf2ef] align-top"
                    >
                      <td className="px-5 py-4">
                        <strong className="block text-sm text-[#17313d]">
                          {product.name}
                        </strong>

                        <span className="mt-1 block text-[10px] text-[#82938c]">
                          {product.sku ||
                            product.slug}{" "}
                          ·{" "}
                          {product.unitLabel ||
                            "Unit"}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <input
                          className="w-20 rounded-md border border-[#d8e4df] px-2 py-2 text-sm uppercase"
                          value={
                            price.currency ||
                            "USD"
                          }
                          onChange={(event) =>
                            patchPrice(
                              product.slug,
                              "currency",
                              event.target.value.toUpperCase(),
                            )
                          }
                        />
                      </td>

                      <td className="px-3 py-4">
                        <input
                          className="w-32 rounded-md border border-[#d8e4df] px-3 py-2 text-sm"
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            price.amount ?? ""
                          }
                          onChange={(event) =>
                            patchPrice(
                              product.slug,
                              "amount",
                              event.target.value,
                            )
                          }
                          placeholder="Not set"
                        />
                      </td>

                      <td className="px-3 py-4">
                        <input
                          className="w-24 rounded-md border border-[#d8e4df] px-3 py-2 text-sm"
                          type="number"
                          min="1"
                          step="1"
                          value={
                            price.minimumQty ??
                            ""
                          }
                          onChange={(event) =>
                            patchPrice(
                              product.slug,
                              "minimumQty",
                              event.target.value,
                            )
                          }
                          placeholder="—"
                        />
                      </td>

                      <td className="px-3 py-4">
                        <input
                          className="w-36 rounded-md border border-[#d8e4df] px-3 py-2 text-sm"
                          value={
                            price.leadTimeText ??
                            ""
                          }
                          onChange={(event) =>
                            patchPrice(
                              product.slug,
                              "leadTimeText",
                              event.target.value,
                            )
                          }
                          placeholder="—"
                        />
                      </td>

                      <td className="px-3 py-4">
                        <input
                          className="w-64 rounded-md border border-[#d8e4df] px-3 py-2 text-sm"
                          value={
                            price.note ?? ""
                          }
                          onChange={(event) =>
                            patchPrice(
                              product.slug,
                              "note",
                              event.target.value,
                            )
                          }
                          placeholder="Optional protected note"
                        />
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      </section>

      {(message || error) && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="sticky bottom-4 z-20 flex justify-end">
        <button
          disabled={saving}
          className="btn btn-primary min-w-48 shadow-xl disabled:opacity-60"
          type="submit"
        >
          {saving
            ? "Saving Pricing..."
            : "Save Pricing to Neon"}
        </button>
      </div>
    </form>
  );
}