"use client";

import Link from "next/link";
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

const CART_KEY = "dingsheng-dealer-cart-v3";

type StoredItem = {
  slug: string;
  quantity: number;
};

type CreatedOrder = {
  reference: string;
  status: string;
  currency: string;
  totalAmount: string | null;
};

type Props = {
  products: Product[];
  priceGroupSlug: string;
  priceGroupName: string;
  companyName: string;
  contactName: string;
  defaultCountry: string;
};

function readCart(): StoredItem[] {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(CART_KEY) || "[]",
    ) as StoredItem[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function DealerCheckoutClient({
  products,
  priceGroupSlug,
  priceGroupName,
  companyName,
  contactName,
  defaultCountry,
}: Props) {
  const [items, setItems] = useState<StoredItem[]>([]);
  const [deliveryCountry, setDeliveryCountry] =
    useState(defaultCountry);
  const [deliveryAddress, setDeliveryAddress] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("BANK_TRANSFER");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdOrder, setCreatedOrder] =
    useState<CreatedOrder | null>(null);

  useEffect(() => {
    setItems(readCart());
  }, []);

  const rows = useMemo(
    () =>
      items
        .map((item) => {
          const product = products.find(
            (candidate) =>
              candidate.slug === item.slug,
          );

          if (!product) return null;

          const price = getDealerPrice(
            product,
            priceGroupSlug,
          );

          const subtotal =
            typeof price?.amount === "number"
              ? price.amount * item.quantity
              : null;

          return {
            item,
            product,
            price,
            subtotal,
          };
        })
        .filter(Boolean) as Array<{
        item: StoredItem;
        product: Product;
        price: ReturnType<typeof getDealerPrice>;
        subtotal: number | null;
      }>,
    [items, products, priceGroupSlug],
  );

  const currencies = [
    ...new Set(
      rows
        .filter((row) => row.price)
        .map((row) => row.price?.currency || "USD"),
    ),
  ];

  const valid =
    rows.length > 0 &&
    rows.every(
      (row) =>
        typeof row.subtotal === "number" &&
        row.item.quantity >=
          Math.max(1, row.price?.minimumQty || 1),
    ) &&
    currencies.length === 1;

  const total = rows.reduce(
    (sum, row) => sum + (row.subtotal || 0),
    0,
  );

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!valid || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/dealer/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        body: JSON.stringify({
            deliveryCountry,
            deliveryAddress,
            paymentMethod,

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
          result.error || "Unable to create order.",
        );
      }

      localStorage.removeItem(CART_KEY);

      window.dispatchEvent(
        new Event("dingsheng-commerce-update"),
      );

      setItems([]);
      setCreatedOrder(result.order);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create order.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (createdOrder) {
    return (
      <div className="card mx-auto max-w-3xl p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f7ef] text-3xl text-[#0a9c63]">
          ✓
        </div>

        <div className="eyebrow mt-6">
          Order submitted
        </div>

        <h2 className="mt-2 text-3xl font-black">
          Thank you for your order
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#71838b]">
          Your order has been saved and is awaiting review
          by the Dingsheng Energy commercial team.
        </p>

        <div className="mx-auto mt-7 max-w-md rounded-xl border border-[#cfe9dd] bg-[#edf9f3] p-5">
          <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#71838b]">
            Order reference
          </div>

          <div className="mt-2 text-2xl font-black text-[#08774f]">
            {createdOrder.reference}
          </div>

          <div className="mt-3 text-xs font-bold text-[#617b70]">
            Status: {createdOrder.status}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/dealer/orders"
            className="btn btn-primary"
          >
            View My Orders →
          </Link>

          <Link
            href="/dealer/products"
            className="btn btn-secondary"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-xl font-black">
          No checkout items
        </h2>

        <p className="mt-3 text-sm text-[#71838b]">
          Add products to your cart before starting
          checkout.
        </p>

        <Link
          href="/dealer/products"
          className="btn btn-primary mt-5"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-6 lg:grid-cols-[1fr_380px]"
    >
      <div className="card p-7">
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
          <div className="rounded bg-[#e8f7ef] p-3 text-[#0a7f55]">
            1. Shipping
          </div>

          <div className="rounded bg-[#e8f7ef] p-3 text-[#0a7f55]">
            2. Terms
          </div>

          <div className="rounded bg-[#e8f7ef] p-3 text-[#0a7f55]">
            3. Review
          </div>
        </div>

        <div className="form-grid mt-8">
          <div className="field">
            <label>Company</label>
            <input value={companyName} disabled />
          </div>

          <div className="field">
            <label>Contact Person</label>
            <input value={contactName} disabled />
          </div>

          <div className="field">
            <label>Delivery Country *</label>
            <input
              value={deliveryCountry}
              onChange={(event) =>
                setDeliveryCountry(event.target.value)
              }
              required
            />
          </div>

          <div className="field">
            <label>Delivery Address *</label>
            <input
              value={deliveryAddress}
              onChange={(event) =>
                setDeliveryAddress(event.target.value)
              }
              required
            />
          </div>

          <div className="field span-2">
            <label htmlFor="payment-method">
              Preferred Payment Method *
            </label>

            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value)
              }
              required
            >
              <option value="BANK_TRANSFER">
                Bank Transfer
              </option>

              <option value="LETTER_OF_CREDIT">
                Letter of Credit (L/C)
              </option>

              <option value="APPROVED_CREDIT_TERMS">
                Approved Dealer Credit Terms
              </option>

              <option value="MANUAL_COMMERCIAL_AGREEMENT">
                Manual Commercial Agreement
              </option>
            </select>

            <p className="mt-2 text-xs leading-5 text-[#71838b]">
              Dingsheng Energy will contact you to confirm payment
              instructions and commercial terms.
            </p>
          </div>
        </div>
      </div>

      <aside className="card self-start p-6 lg:sticky lg:top-6">
        <div className="eyebrow">
          {priceGroupName}
        </div>

        <h2 className="mt-2 text-xl font-black">
          Order summary
        </h2>

        <div className="mt-5 grid gap-3">
          {rows.map((row) => (
            <div
              key={row.product.slug}
              className="flex justify-between gap-4 border-b border-[#e5ece8] pb-3 text-xs"
            >
              <div>
                <strong>{row.product.name}</strong>

                <div className="mt-1 text-[#82938c]">
                  Qty {row.item.quantity}
                </div>
              </div>

              <strong>
                {typeof row.subtotal === "number"
                  ? formatMoney(
                      row.subtotal,
                      row.price?.currency,
                    )
                  : "—"}
              </strong>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-end justify-between">
          <span className="font-bold">Total</span>

          <strong className="text-2xl text-[#0a7f55]">
            {valid
              ? formatMoney(total, currencies[0])
              : "Review required"}
          </strong>
        </div>

        {!valid && (
          <div className="mt-4 rounded-md bg-[#fff9e9] p-3 text-xs leading-5 text-[#81765d]">
            Checkout requires valid prices, minimum
            quantities and one currency.
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
            {error}
          </div>
        )}

        <button
          disabled={!valid || loading}
          className="btn btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Submitting Order..."
            : "Submit Order →"}
        </button>

        <Link
          href="/dealer/cart"
          className="btn btn-secondary mt-3 w-full"
        >
          Return to Cart
        </Link>
      </aside>
    </form>
  );
}