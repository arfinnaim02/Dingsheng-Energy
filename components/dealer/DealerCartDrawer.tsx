"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { formatMoney } from "@/lib/pricing";

const CART_KEY = "dingsheng-dealer-cart-v3";

type StoredItem = {
  slug: string;
  quantity: number;
};

type PreviewProduct = {
  slug: string;
  name: string;
  image: string;
  sku: string | null;
  unitLabel: string;
  price: {
    amount: number;
    currency: string;
    minimumQty: number;
  } | null;
};

function readCart(): StoredItem[] {
  if (typeof window === "undefined") return [];

  try {
    const value = JSON.parse(
      localStorage.getItem(CART_KEY) || "[]",
    ) as StoredItem[];

    if (!Array.isArray(value)) return [];

    return value.filter(
      (item) =>
        typeof item.slug === "string" &&
        typeof item.quantity === "number" &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

export function DealerCartDrawer() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<StoredItem[]>([]);
  const [products, setProducts] = useState<
    PreviewProduct[]
  >([]);
  const [priceGroupName, setPriceGroupName] =
    useState("");
  const [loading, setLoading] = useState(false);

  const loadCart = useCallback(async () => {
    const storedItems = readCart();
    setItems(storedItems);

    if (!storedItems.length) {
      setProducts([]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/dealer/cart-preview",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slugs: storedItems.map((item) => item.slug),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Unable to load cart.");
      }

      const result = await response.json();

      setProducts(result.products || []);
      setPriceGroupName(result.priceGroupName || "");
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCart();

    function handleCommerceUpdate() {
      void loadCart();
    }

    function handleCartOpen() {
      setOpen(true);
      void loadCart();
    }

    window.addEventListener(
      "dingsheng-commerce-update",
      handleCommerceUpdate,
    );

    window.addEventListener(
      "dingsheng-cart-open",
      handleCartOpen,
    );

    return () => {
      window.removeEventListener(
        "dingsheng-commerce-update",
        handleCommerceUpdate,
      );

      window.removeEventListener(
        "dingsheng-cart-open",
        handleCartOpen,
      );
    };
  }, [loadCart]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [open]);

  function persist(nextItems: StoredItem[]) {
    setItems(nextItems);

    localStorage.setItem(
      CART_KEY,
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
    const product = products.find(
      (candidate) => candidate.slug === slug,
    );

    const minimumQuantity =
      product?.price?.minimumQty || 1;

    persist(
      items.map((item) =>
        item.slug === slug
          ? {
              ...item,
              quantity: Math.max(
                minimumQuantity,
                quantity || minimumQuantity,
              ),
            }
          : item,
      ),
    );
  }

  function removeItem(slug: string) {
    persist(
      items.filter((item) => item.slug !== slug),
    );

    setProducts((current) =>
      current.filter(
        (product) => product.slug !== slug,
      ),
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

          const subtotal = product.price
            ? product.price.amount * item.quantity
            : null;

          return {
            item,
            product,
            subtotal,
          };
        })
        .filter(Boolean) as Array<{
        item: StoredItem;
        product: PreviewProduct;
        subtotal: number | null;
      }>,
    [items, products],
  );

  const itemCount = items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const currencies = [
    ...new Set(
      rows
        .filter((row) => row.product.price)
        .map(
          (row) =>
            row.product.price?.currency || "USD",
        ),
    ),
  ];

  const singleCurrency = currencies.length <= 1;

  const allPriced =
    rows.length > 0 &&
    rows.every((row) => row.product.price);

  const total =
    allPriced && singleCurrency
      ? rows.reduce(
          (sum, row) => sum + (row.subtotal || 0),
          0,
        )
      : null;

  const currency = currencies[0] || "USD";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          void loadCart();
        }}
        aria-label={`Open cart with ${itemCount} items`}
        className="fixed bottom-6 right-6 z-40 flex h-14 items-center gap-3 rounded-full bg-[#0a9c63] px-5 text-sm font-black text-white shadow-[0_15px_40px_rgba(7,31,44,.28)] transition hover:bg-[#087f52]"
      >
        <span className="text-lg">Cart</span>

        <span className="flex min-w-7 items-center justify-center rounded-full bg-white px-2 py-1 text-xs text-[#087f52]">
          {itemCount}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close cart"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[#061f2d]/55 backdrop-blur-[2px]"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Dealer cart"
            className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col bg-[#f7faf8] shadow-[-20px_0_60px_rgba(7,31,44,.2)]"
          >
            <header className="flex items-start justify-between border-b border-[#dfe8e4] bg-white p-6">
              <div>
                <div className="eyebrow">
                  {priceGroupName || "Dealer"} pricing
                </div>

                <h2 className="mt-2 text-2xl font-black">
                  Your Cart
                </h2>

                <p className="mt-1 text-xs text-[#71838b]">
                  {itemCount} item
                  {itemCount === 1 ? "" : "s"}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close cart"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe8e4] bg-white text-xl font-bold text-[#526872] hover:border-[#0a9c63] hover:text-[#0a9c63]"
              >
                ×
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
              {loading && !rows.length ? (
                <div className="py-12 text-center text-sm font-bold text-[#71838b]">
                  Loading cart...
                </div>
              ) : !rows.length ? (
                <div className="py-12 text-center">
                  <h3 className="text-xl font-black">
                    Your cart is empty
                  </h3>

                  <p className="mt-3 text-sm text-[#71838b]">
                    Add a priced product from the dealer
                    catalogue.
                  </p>

                  <Link
                    href="/dealer/products"
                    onClick={() => setOpen(false)}
                    className="btn btn-primary mt-6"
                  >
                    Browse Products →
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {rows.map(
                    ({ item, product, subtotal }) => (
                      <article
                        key={product.slug}
                        className="rounded-xl border border-[#dfe8e4] bg-white p-4"
                      >
                        <div className="flex gap-4">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#eef5f2]">
                            {product.image ? (
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs font-black text-[#82938c]">
                                LPG
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/dealer/products/${product.slug}`}
                              onClick={() =>
                                setOpen(false)
                              }
                              className="font-black leading-5 hover:text-[#0a9c63]"
                            >
                              {product.name}
                            </Link>

                            <div className="mt-1 text-[10px] text-[#82938c]">
                              {product.sku ||
                                product.slug}
                            </div>

                            {product.price ? (
                              <div className="mt-2 text-sm font-black text-[#08774f]">
                                {formatMoney(
                                  product.price.amount,
                                  product.price.currency,
                                )}{" "}
                                / {product.unitLabel}
                              </div>
                            ) : (
                              <div className="mt-2 text-xs font-bold text-[#a27300]">
                                Price unavailable
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(product.slug)
                            }
                            className="self-start text-xs font-black text-red-600"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-4 border-t border-[#edf2ef] pt-4">
                          <div className="field w-28">
                            <label
                              htmlFor={`drawer-quantity-${product.slug}`}
                            >
                              Quantity
                            </label>

                            <input
                              id={`drawer-quantity-${product.slug}`}
                              type="number"
                              min={
                                product.price
                                  ?.minimumQty || 1
                              }
                              step="1"
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
                          </div>

                          <div className="text-right">
                            <div className="text-[9px] font-black uppercase text-[#82938c]">
                              Subtotal
                            </div>

                            <div className="mt-1 font-black">
                              {subtotal !== null &&
                              product.price
                                ? formatMoney(
                                    subtotal,
                                    product.price
                                      .currency,
                                  )
                                : "Review required"}
                            </div>
                          </div>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}
            </div>

            {rows.length > 0 && (
              <footer className="border-t border-[#dfe8e4] bg-white p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-[#71838b]">
                      Cart total
                    </div>

                    <div className="mt-1 text-[10px] text-[#82938c]">
                      Taxes and delivery calculated later
                    </div>
                  </div>

                  <div className="text-2xl font-black text-[#08774f]">
                    {total !== null
                      ? formatMoney(total, currency)
                      : "Review required"}
                  </div>
                </div>

                <Link
                  href={
                    allPriced && singleCurrency
                      ? "/dealer/checkout"
                      : "/dealer/rfq"
                  }
                  onClick={() => setOpen(false)}
                  className="btn btn-primary mt-5 w-full"
                >
                  {allPriced && singleCurrency
                    ? "Proceed to Checkout →"
                    : "Request Quotation →"}
                </Link>

                <Link
                  href="/dealer/cart"
                  onClick={() => setOpen(false)}
                  className="btn btn-secondary mt-3 w-full"
                >
                  View Full Cart
                </Link>
              </footer>
            )}
          </aside>
        </div>
      )}
    </>
  );
}