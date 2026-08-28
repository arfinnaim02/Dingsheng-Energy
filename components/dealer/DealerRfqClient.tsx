"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Product } from "@/data/site";
import {
  formatMoney,
  getDealerPrice,
} from "@/lib/pricing";

const RFQ_KEY = "dingsheng-dealer-rfq-v3";

type StoredItem = {
  slug: string;
  quantity: number;
};

type Props = {
  products: Product[];
  priceGroupSlug: string;
  priceGroupName: string;
  defaultCountry: string;
};

function readItems(): StoredItem[] {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(RFQ_KEY) || "[]",
    ) as StoredItem[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function DealerRfqClient({
  products,
  priceGroupSlug,
  priceGroupName,
  defaultCountry,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<StoredItem[]>([]);
  const [projectName, setProjectName] = useState("");
  const [deliveryCountry, setDeliveryCountry] =
    useState(defaultCountry);
  const [requiredDate, setRequiredDate] = useState("");
  const [requirement, setRequirement] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittedReference, setSubmittedReference] =
    useState("");

  useEffect(() => {
    const storedItems = readItems();
    const queryProduct = searchParams.get("product");

    if (
      queryProduct &&
      products.some(
        (product) => product.slug === queryProduct,
      ) &&
      !storedItems.some(
        (item) => item.slug === queryProduct,
      )
    ) {
      storedItems.push({
        slug: queryProduct,
        quantity: 1,
      });

      localStorage.setItem(
        RFQ_KEY,
        JSON.stringify(storedItems),
      );
    }

    setItems(storedItems);
  }, [products, searchParams]);

  function persist(nextItems: StoredItem[]) {
    setItems(nextItems);

    localStorage.setItem(
      RFQ_KEY,
      JSON.stringify(nextItems),
    );

    window.dispatchEvent(
      new Event("dingsheng-commerce-update"),
    );
  }

  function updateQuantity(
    slug: string,
    quantity: number,
  ) {
    persist(
      items.map((item) =>
        item.slug === slug
          ? {
              ...item,
              quantity: Math.max(1, quantity || 1),
            }
          : item,
      ),
    );
  }

  function removeItem(slug: string) {
    persist(
      items.filter((item) => item.slug !== slug),
    );
  }

  const rows = useMemo(
    () =>
      items
        .map((item) => {
          const product = products.find(
            (candidate) =>
              candidate.slug === item.slug,
          );

          if (!product) return null;

          return {
            item,
            product,
            price: getDealerPrice(
              product,
              priceGroupSlug,
            ),
          };
        })
        .filter(Boolean) as Array<{
        item: StoredItem;
        product: Product;
        price: ReturnType<typeof getDealerPrice>;
      }>,
    [items, products, priceGroupSlug],
  );

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!rows.length || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/dealer/rfqs",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            projectName,
            deliveryCountry,
            requiredDate,
            requirement,

            items: rows.map((row) => ({
              slug: row.product.slug,
              quantity: row.item.quantity,
            })),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to submit RFQ.",
        );
      }

      localStorage.removeItem(RFQ_KEY);

      window.dispatchEvent(
        new Event("dingsheng-commerce-update"),
      );

      setItems([]);
      setSubmittedReference(result.rfq.reference);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to submit RFQ.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (submittedReference) {
    return (
      <div className="card p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f7ef] text-3xl text-[#0a9c63]">
          ✓
        </div>

        <div className="eyebrow mt-6">
          RFQ submitted
        </div>

        <h2 className="mt-2 text-3xl font-black">
          Request received
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#71838b]">
          Your RFQ has been saved and sent to the
          Dingsheng Energy commercial team for review.
        </p>

        <div className="mx-auto mt-7 max-w-md rounded-xl border border-[#cfe9dd] bg-[#edf9f3] p-5">
          <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#71838b]">
            RFQ reference
          </div>

          <div className="mt-2 text-2xl font-black text-[#08774f]">
            {submittedReference}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSubmittedReference("");
              setProjectName("");
              setRequiredDate("");
              setRequirement("");
            }}
            className="btn btn-primary"
          >
            Create Another RFQ
          </button>

          <Link
            href="/dealer/products"
            className="btn btn-secondary"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"
    >
      <div className="card p-6">
        <div className="eyebrow">
          {priceGroupName}
        </div>

        <h2 className="mt-2 text-xl font-black">
          Selected products
        </h2>

        {rows.length ? (
          <div className="table-wrap mt-5">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Dealer Price Context</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {rows.map(
                  ({ item, product, price }) => (
                    <tr key={product.slug}>
                      <td>
                        <Link
                          href={`/dealer/products/${product.slug}`}
                          className="font-black hover:text-[#0a9c63]"
                        >
                          {product.name}
                        </Link>

                        <div className="mt-1 text-[10px] text-[#82938c]">
                          {product.sku ||
                            product.slug}
                        </div>
                      </td>

                      <td>
                        <input
                          className="w-20 rounded border border-[#d8e4df] px-2 py-1"
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) =>
                            updateQuantity(
                              product.slug,
                              Number(
                                event.target.value,
                              ),
                            )
                          }
                        />
                      </td>

                      <td>
                        {typeof price?.amount ===
                        "number"
                          ? `${formatMoney(
                              price.amount,
                              price.currency,
                            )} / ${
                              product.unitLabel ||
                              "Unit"
                            }`
                          : "Quotation required"}
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            removeItem(
                              product.slug,
                            )
                          }
                          className="text-xs font-black text-red-600"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-5 rounded-lg bg-[#f6f8f7] p-6 text-sm text-[#71838b]">
            No products selected. Add products from the
            dealer catalogue.
          </div>
        )}

        <Link
          href="/dealer/products"
          className="btn btn-secondary mt-5"
        >
          + Add Products
        </Link>
      </div>

      <div className="card self-start p-6">
        <h2 className="text-xl font-black">
          Project information
        </h2>

        <div className="mt-5 grid gap-4">
          <div className="field">
            <label htmlFor="rfq-project">
              Project Name *
            </label>

            <input
              id="rfq-project"
              value={projectName}
              onChange={(event) =>
                setProjectName(event.target.value)
              }
              placeholder="Project or tender reference"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="rfq-country">
              Delivery Country *
            </label>

            <input
              id="rfq-country"
              value={deliveryCountry}
              onChange={(event) =>
                setDeliveryCountry(event.target.value)
              }
              required
            />
          </div>

          <div className="field">
            <label htmlFor="rfq-date">
              Required Date
            </label>

            <input
              id="rfq-date"
              type="date"
              value={requiredDate}
              min={new Date()
                .toISOString()
                .slice(0, 10)}
              onChange={(event) =>
                setRequiredDate(event.target.value)
              }
            />
          </div>

          <div className="field">
            <label htmlFor="rfq-requirement">
              Requirement Details
            </label>

            <textarea
              id="rfq-requirement"
              value={requirement}
              onChange={(event) =>
                setRequirement(event.target.value)
              }
              placeholder="Technical requirements, standards, delivery expectations or project notes..."
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
              {error}
            </div>
          )}

          <button
            disabled={!rows.length || loading}
            className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Submitting RFQ..."
              : "Submit RFQ →"}
          </button>
        </div>
      </div>
    </form>
  );
}