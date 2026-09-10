"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import type {
  DealerPortalSettings,
  PriceGroup,
  Product,
} from "@/data/site";

type Props = {
  initialGroups: PriceGroup[];
  products: Product[];
  dealerPortal: DealerPortalSettings;
};

type ProductBasePricing = {
  basePrice?: number;
  baseCurrency: string;
  minimumQty?: number;
  leadTimeText?: string;
  pricingNote?: string;
};

function parseOptionalNumber(
  value: string,
): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsed =
    Number(value);

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : undefined;
}

function roundMoney(
  value: number,
) {
  return (
    Math.round(
      (value +
        Number.EPSILON) *
        100,
    ) / 100
  );
}

function calculatedPrice(
  basePrice:
    | number
    | undefined,
  discountPercent:
    | number
    | undefined,
) {
  if (
    typeof basePrice !==
      "number" ||
    !Number.isFinite(
      basePrice,
    )
  ) {
    return undefined;
  }

  const discount =
    typeof discountPercent ===
      "number" &&
    Number.isFinite(
      discountPercent,
    )
      ? discountPercent
      : 0;

  return roundMoney(
    basePrice *
      (1 -
        discount /
          100),
  );
}

export function PricingManager({
  initialGroups,
  products,
  dealerPortal:
    initialPortal,
}: Props) {
  const router =
    useRouter();

  const [groups, setGroups] =
    useState<PriceGroup[]>(
      structuredClone(
        initialGroups,
      ),
    );

  const [dealerPortal] =
    useState<DealerPortalSettings>(
      structuredClone(
        initialPortal,
      ),
    );

  const initialSelectedGroup =
    initialGroups.find(
      (group) =>
        group.slug ===
          initialPortal.demoPriceGroupSlug &&
        group.active !==
          false,
    ) ??
    initialGroups.find(
      (group) =>
        group.active !==
        false,
    ) ??
    initialGroups[0];

  const [
    selectedGroup,
    setSelectedGroup,
  ] = useState(
    initialSelectedGroup?.slug ??
      "standard",
  );

  const [
    basePricing,
    setBasePricing,
  ] = useState<
    Record<
      string,
      ProductBasePricing
    >
  >(
    Object.fromEntries(
      products.map(
        (product) => [
          product.slug,

          {
            basePrice:
              product.basePrice,

            baseCurrency:
              product.baseCurrency ||
              "USD",

            minimumQty:
              product.minimumQty,

            leadTimeText:
              product.leadTimeText,

            pricingNote:
              product.pricingNote,
          },
        ],
      ),
    ),
  );

  const [search, setSearch] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const activeGroups =
    groups.filter(
      (group) =>
        group.active !==
        false,
    );

  const selectedGroupData =
    groups.find(
      (group) =>
        group.slug ===
        selectedGroup,
    );

  const visibleProducts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return products;
      }

      return products.filter(
        (product) =>
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
    }, [
      products,
      search,
    ]);

  function patchGroup(
    index: number,
    key: keyof PriceGroup,
    value:
      | string
      | boolean
      | number,
  ) {
    setGroups(
      (current) =>
        current.map(
          (
            group,
            groupIndex,
          ) =>
            groupIndex ===
            index
              ? {
                  ...group,
                  [key]:
                    value,
                }
              : group,
        ),
    );
  }

  function patchBasePrice(
    productSlug: string,
    key:
      keyof ProductBasePricing,
    value: string,
  ) {
    setBasePricing(
      (current) => {
        const existing =
          current[
            productSlug
          ] ?? {
            baseCurrency:
              "USD",
          };

        const next = {
          ...existing,
        };

        if (
          key ===
            "basePrice" ||
          key ===
            "minimumQty"
        ) {
          next[key] =
            parseOptionalNumber(
              value,
            );
        } else if (
          key ===
          "baseCurrency"
        ) {
          next.baseCurrency =
            value.toUpperCase();
        } else {
          next[key] =
            value;
        }

        return {
          ...current,

          [productSlug]:
            next,
        };
      },
    );
  }

  function addGroup() {
    let suffix =
      groups.length +
      1;

    let slug =
      `custom-${suffix}`;

    while (
      groups.some(
        (group) =>
          group.slug ===
          slug,
      )
    ) {
      suffix += 1;

      slug =
        `custom-${suffix}`;
    }

    const newGroup:
      PriceGroup = {
      slug,

      name:
        `Custom ${suffix}`,

      description: "",

      discountPercent:
        0,

      active: true,
    };

    setGroups(
      (current) => [
        ...current,
        newGroup,
      ],
    );

    setSelectedGroup(
      newGroup.slug,
    );

    setMessage("");
    setError("");
  }

  function deleteGroup(
    index: number,
  ) {
    const group =
      groups[index];

    if (!group) {
      return;
    }

    if (
      groups.length <= 1
    ) {
      setError(
        "At least one price group must remain.",
      );

      setMessage("");

      return;
    }

    const confirmed =
      window.confirm(
        `Delete the "${group.name}" price group?\n\nDealers assigned to this group must be reassigned before deletion.`,
      );

    if (!confirmed) {
      return;
    }

    const remainingGroups =
      groups.filter(
        (
          _,
          groupIndex,
        ) =>
          groupIndex !==
          index,
      );

    setGroups(
      remainingGroups,
    );

    if (
      selectedGroup ===
      group.slug
    ) {
      const replacement =
        remainingGroups.find(
          (
            remainingGroup,
          ) =>
            remainingGroup.active !==
            false,
        ) ??
        remainingGroups[0];

      if (replacement) {
        setSelectedGroup(
          replacement.slug,
        );
      }
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
    const group =
      groups[index];

    if (!group) {
      return;
    }

    if (
      !active &&
      groups.filter(
        (
          candidate,
          candidateIndex,
        ) =>
          candidateIndex !==
            index &&
          candidate.active !==
            false,
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
      selectedGroup ===
        group.slug
    ) {
      const replacement =
        groups.find(
          (
            candidate,
            candidateIndex,
          ) =>
            candidateIndex !==
              index &&
            candidate.active !==
              false,
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
      groups.map(
        (group) =>
          group.name.trim(),
      );

    if (
      normalizedNames.some(
        (name) =>
          !name,
      )
    ) {
      setError(
        "Every price group requires a name.",
      );

      setSaving(false);

      return;
    }

    const uniqueNames =
      new Set(
        normalizedNames.map(
          (name) =>
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

    for (
      const group of groups
    ) {
      const discount =
        Number(
          group.discountPercent ??
            0,
        );

      if (
        !Number.isFinite(
          discount,
        ) ||
        discount < 0 ||
        discount > 100
      ) {
        setError(
          `Discount for "${group.name}" must be between 0% and 100%.`,
        );

        setSaving(false);

        return;
      }
    }

    if (
      !groups.some(
        (group) =>
          group.active !==
          false,
      )
    ) {
      setError(
        "At least one active price group is required.",
      );

      setSaving(false);

      return;
    }

    try {
      const response =
        await fetch(
          "/api/admin/pricing",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  priceGroups:
                    groups,

                  dealerPortal:
                    {
                      ...dealerPortal,

                      demoPriceGroupSlug:
                        selectedGroup,
                    },

                  productBasePrices:
                    basePricing,
                },
              ),
          },
        );

      const result =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Unable to save pricing.",
        );
      }

      setMessage(
        "Base prices and dealer tier discounts saved to Neon. Dealer prices are now calculated automatically.",
      );

      router.refresh();
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof
          Error
          ? saveError.message
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
              Price groups &
              automatic discounts
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#71838b]">
              Each product has one
              base price. Dealer
              prices are calculated
              automatically from the
              discount assigned to
              each price group.
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
            (
              group,
              index,
            ) => (
              <div
                key={`${group.slug}-${index}`}
                className={`rounded-xl border bg-[#fafcfb] p-5 ${
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
                      group.active !==
                      false
                        ? "rounded-full bg-[#e7f7ef] px-3 py-1 text-[10px] font-black uppercase text-[#087a50]"
                        : "rounded-full bg-[#eef1f2] px-3 py-1 text-[10px] font-black uppercase text-[#657983]"
                    }
                  >
                    {group.active !==
                    false
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
                      value={
                        group.name
                      }
                      onChange={(
                        event,
                      ) =>
                        patchGroup(
                          index,
                          "name",
                          event
                            .target
                            .value,
                        )
                      }
                    />
                  </div>

                  <div className="field">
                    <label>
                      Slug
                    </label>

                    <input
                      value={
                        group.slug
                      }
                      readOnly
                      className="!bg-[#f1f5f3] !text-[#7a8d84]"
                    />
                  </div>

                  <div className="field">
                    <label>
                      Dealer
                      discount %
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={
                        group.discountPercent ??
                        0
                      }
                      onChange={(
                        event,
                      ) =>
                        patchGroup(
                          index,
                          "discountPercent",
                          Number(
                            event
                              .target
                              .value,
                          ),
                        )
                      }
                    />

                    <small className="text-[10px] text-[#82938c]">
                      Example: 7.5 =
                      7.5% below base
                      price.
                    </small>
                  </div>

                  <div className="field">
                    <label>
                      Description
                    </label>

                    <input
                      value={
                        group.description ??
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        patchGroup(
                          index,
                          "description",
                          event
                            .target
                            .value,
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
                        group.active !==
                        false
                      }
                      onChange={(
                        event,
                      ) =>
                        changeGroupActive(
                          index,
                          event
                            .target
                            .checked,
                        )
                      }
                    />

                    Active price group
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={
                        group.active ===
                        false
                      }
                      onClick={() =>
                        setSelectedGroup(
                          group.slug,
                        )
                      }
                      className={
                        selectedGroup ===
                        group.slug
                          ? "rounded-md bg-[#0a9c63] px-3 py-2 text-[10px] font-black uppercase tracking-[.06em] text-white"
                          : "rounded-md border border-[#cfe1d9] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[.06em] text-[#0a9c63] disabled:opacity-40"
                      }
                    >
                      {selectedGroup ===
                      group.slug
                        ? "Preview Tier"
                        : "Preview"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteGroup(
                          index,
                        )
                      }
                      className="rounded-md border border-red-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[.06em] text-red-600 hover:bg-red-50"
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
              Base product pricing
            </div>

            <h2 className="mt-2 text-xl font-black">
              One price per
              product
            </h2>

            <p className="mt-2 max-w-3xl text-sm text-[#71838b]">
              Enter the base
              commercial price once.
              Dealer prices are then
              generated automatically.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="field !gap-1">
              <label>
                Preview tier
              </label>

              <select
                value={
                  selectedGroup
                }
                onChange={(
                  event,
                ) =>
                  setSelectedGroup(
                    event
                      .target
                      .value,
                  )
                }
              >
                {activeGroups.map(
                  (group) => (
                    <option
                      key={
                        group.slug
                      }
                      value={
                        group.slug
                      }
                    >
                      {group.name}{" "}
                      (
                      {group.discountPercent ??
                        0}
                      %)
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
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Product name or SKU..."
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left">
            <thead>
              <tr className="bg-[#f6f9f7] text-[10px] font-black uppercase tracking-[.08em] text-[#71838b]">
                <th className="px-5 py-4">
                  Product
                </th>

                <th className="px-3 py-4">
                  Currency
                </th>

                <th className="px-3 py-4">
                  Base Price
                </th>

                <th className="px-3 py-4">
                  {selectedGroupData?.name ??
                    "Dealer"}{" "}
                  Price
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
                  const pricing =
                    basePricing[
                      product
                        .slug
                    ] ?? {
                      baseCurrency:
                        "USD",
                    };

                  const preview =
                    calculatedPrice(
                      pricing.basePrice,
                      selectedGroupData?.discountPercent,
                    );

                  return (
                    <tr
                      key={
                        product.slug
                      }
                      className="border-t border-[#edf2ef] align-top"
                    >
                      <td className="px-5 py-4">
                        <strong className="block text-sm text-[#17313d]">
                          {
                            product.name
                          }
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
                          maxLength={
                            3
                          }
                          value={
                            pricing.baseCurrency
                          }
                          onChange={(
                            event,
                          ) =>
                            patchBasePrice(
                              product.slug,
                              "baseCurrency",
                              event
                                .target
                                .value,
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
                            pricing.basePrice ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            patchBasePrice(
                              product.slug,
                              "basePrice",
                              event
                                .target
                                .value,
                            )
                          }
                          placeholder="Not set"
                        />
                      </td>

                      <td className="px-3 py-4">
                        <div className="min-w-32 rounded-md border border-[#dcebe4] bg-[#f3faf6] px-3 py-2 text-sm font-black text-[#087a50]">
                          {preview ===
                          undefined
                            ? "RFQ"
                            : `${pricing.baseCurrency} ${preview.toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits:
                                    2,
                                  maximumFractionDigits:
                                    2,
                                },
                              )}`}
                        </div>

                        <div className="mt-1 text-[9px] font-bold text-[#82938c]">
                          {selectedGroupData?.discountPercent ??
                            0}
                          % discount
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <input
                          className="w-24 rounded-md border border-[#d8e4df] px-3 py-2 text-sm"
                          type="number"
                          min="1"
                          step="1"
                          value={
                            pricing.minimumQty ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            patchBasePrice(
                              product.slug,
                              "minimumQty",
                              event
                                .target
                                .value,
                            )
                          }
                          placeholder="—"
                        />
                      </td>

                      <td className="px-3 py-4">
                        <input
                          className="w-36 rounded-md border border-[#d8e4df] px-3 py-2 text-sm"
                          value={
                            pricing.leadTimeText ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            patchBasePrice(
                              product.slug,
                              "leadTimeText",
                              event
                                .target
                                .value,
                            )
                          }
                          placeholder="—"
                        />
                      </td>

                      <td className="px-3 py-4">
                        <input
                          className="w-64 rounded-md border border-[#d8e4df] px-3 py-2 text-sm"
                          value={
                            pricing.pricingNote ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            patchBasePrice(
                              product.slug,
                              "pricingNote",
                              event
                                .target
                                .value,
                            )
                          }
                          placeholder="Optional dealer note"
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

      {(message ||
        error) && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ||
            message}
        </div>
      )}

      <div className="sticky bottom-4 z-20 flex justify-end">
        <button
          disabled={saving}
          type="submit"
          className="btn btn-primary min-w-48 shadow-xl disabled:opacity-60"
        >
          {saving
            ? "Saving Pricing..."
            : "Save Pricing to Neon"}
        </button>
      </div>
    </form>
  );
}