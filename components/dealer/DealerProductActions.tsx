"use client";

import { useState } from "react";
import Link from "next/link";

const CART_KEY = "dingsheng-dealer-cart-v3";
const RFQ_KEY = "dingsheng-dealer-rfq-v3";

type StoredItem = { slug: string; quantity: number };

function read(key: string): StoredItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]") as StoredItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function add(key: string, slug: string, quantity: number) {
  const items = read(key);
  const existing = items.find((item) => item.slug === slug);
  if (existing) existing.quantity += quantity;
  else items.push({ slug, quantity });
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event("dingsheng-commerce-update"));
}

export function DealerProductActions({
  productSlug,
  canPurchase,
  canRfq,
  priceConfigured,
  minimumQty = 1,
}: {
  productSlug: string;
  canPurchase: boolean;
  canRfq: boolean;
  priceConfigured: boolean;
  minimumQty?: number;
}) {
  const [quantity, setQuantity] = useState(Math.max(1, minimumQty));
  const [message, setMessage] = useState("");

  function addCart() {
    add(CART_KEY, productSlug, quantity);
    setMessage(`${quantity} added to cart.`);

    window.dispatchEvent(
      new Event("dingsheng-cart-open"),
    );
  }

  function addRfq() {
    add(RFQ_KEY, productSlug, quantity);
    setMessage(`${quantity} added to RFQ.`);
  }

  return <div>
    <div className="flex items-end gap-3">
      <div className="field w-28"><label>Quantity</label><input type="number" min={Math.max(1, minimumQty)} step="1" value={quantity} onChange={(e) => setQuantity(Math.max(Math.max(1, minimumQty), Number(e.target.value) || 1))} /></div>
      <div className="flex flex-1 flex-wrap gap-2">
        {canPurchase && priceConfigured && <button type="button" onClick={addCart} className="btn btn-primary flex-1">Add to Cart →</button>}
        {canRfq && <button type="button" onClick={addRfq} className="btn btn-secondary flex-1">Add to RFQ</button>}
      </div>
    </div>
    {canPurchase && !priceConfigured && <div className="mt-3 rounded-md border border-[#eadfbd] bg-[#fff9e9] p-3 text-xs leading-5 text-[#81765d]">Direct purchase becomes available when an approved dealer price is configured. You can still request a quotation.</div>}
    {message && <div className="mt-3 flex items-center justify-between rounded-md border border-[#cfe9dd] bg-[#edf9f3] px-4 py-3 text-xs font-bold text-[#08774f]"><span>{message}</span><div className="flex gap-3"><Link href="/dealer/cart">Cart</Link><Link href="/dealer/rfq">RFQ</Link></div></div>}
  </div>;
}
