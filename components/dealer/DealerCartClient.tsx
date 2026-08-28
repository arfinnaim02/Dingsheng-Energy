"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { Product } from "@/data/site";
import { formatMoney, getDealerPrice } from "@/lib/pricing";

const CART_KEY = "dingsheng-dealer-cart-v3";
type StoredItem = { slug: string; quantity: number };

function readCart(): StoredItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]") as StoredItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function DealerCartClient({ products, priceGroupSlug, priceGroupName }: { products: Product[]; priceGroupSlug: string; priceGroupName: string }) {
  const [items, setItems] = useState<StoredItem[]>([]);
  useEffect(() => { setItems(readCart()); }, []);

  function persist(next: StoredItem[]) { setItems(next); localStorage.setItem(CART_KEY, JSON.stringify(next)); window.dispatchEvent(new Event("dingsheng-commerce-update")); }
  function quantity(slug: string, value: number) { persist(items.map((item) => item.slug === slug ? { ...item, quantity: Math.max(1, value) } : item)); }
  function remove(slug: string) { persist(items.filter((item) => item.slug !== slug)); }

  const rows = useMemo(() => items.map((item) => {
    const product = products.find((candidate) => candidate.slug === item.slug);
    if (!product) return null;
    const price = getDealerPrice(product, priceGroupSlug);
    return { item, product, price, subtotal: typeof price?.amount === "number" ? price.amount * item.quantity : undefined };
  }).filter(Boolean) as Array<{ item: StoredItem; product: Product; price: ReturnType<typeof getDealerPrice>; subtotal?: number }>, [items, products, priceGroupSlug]);

  const currencies = [...new Set(rows.filter((row) => typeof row.subtotal === "number").map((row) => row.price?.currency || "USD"))];
  const singleCurrency = currencies.length <= 1;
  const total = singleCurrency ? rows.reduce((sum, row) => sum + (row.subtotal ?? 0), 0) : undefined;
  const currency = currencies[0] || "USD";
  const allPriced = rows.length > 0 && rows.every((row) => typeof row.price?.amount === "number");

  if (!rows.length) return <div className="card p-10 text-center"><h2 className="text-xl font-black">Your dealer cart is empty</h2><p className="mt-3 text-sm text-[#71838b]">Add a product with an approved dealer price from the  catalogue.</p><Link href="/dealer/products" className="btn btn-primary mt-6">Browse Dealer Products →</Link></div>;

  return <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
    <div className="card overflow-hidden">
      <div className="border-b border-[#e4ebe7] p-6"><div className="eyebrow">{priceGroupName}</div><h2 className="mt-2 text-xl font-black">Dealer cart</h2></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px]"><thead><tr><th>Product</th><th>Unit Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead><tbody>{rows.map(({ item, product, price, subtotal }) => <tr key={product.slug}><td><strong className="block">{product.name}</strong><span className="mt-1 block text-[10px] text-[#82938c]">{product.sku || product.slug} · {product.unitLabel || "Unit"}</span></td><td>{typeof price?.amount === "number" ? formatMoney(price.amount, price.currency) : <span className="font-bold text-[#a27300]">Not configured</span>}</td><td><input className="w-20 rounded-md border border-[#d8e4df] px-3 py-2" type="number" min={Math.max(1, price?.minimumQty ?? 1)} value={item.quantity} onChange={(e) => quantity(product.slug, Number(e.target.value) || 1)} /></td><td className="font-black">{typeof subtotal === "number" ? formatMoney(subtotal, price?.currency) : "—"}</td><td><button onClick={() => remove(product.slug)} className="text-xs font-black text-red-600">Remove</button></td></tr>)}</tbody></table></div>
    </div>
    <div className="card self-start p-6 lg:sticky lg:top-6"><div className="eyebrow">Order Summary</div><h2 className="mt-2 text-xl font-black">Commercial total</h2><div className="mt-5 flex items-center justify-between border-b border-[#e5ece8] pb-4 text-sm"><span>Items</span><strong>{rows.reduce((sum,row)=>sum+row.item.quantity,0)}</strong></div><div className="mt-4 flex items-end justify-between gap-4"><span className="text-sm font-bold">Total</span><strong className="text-2xl text-[#0a7f55]">{allPriced && singleCurrency && typeof total === "number" ? formatMoney(total, currency) : "Review required"}</strong></div>{!allPriced && <p className="mt-4 rounded-md bg-[#fff9e9] p-3 text-xs leading-5 text-[#81765d]">One or more cart prices are no longer configured. Update pricing in Admin or move those items to RFQ.</p>}{!singleCurrency && <p className="mt-4 rounded-md bg-[#fff9e9] p-3 text-xs leading-5 text-[#81765d]">Multiple currencies are present. A single checkout total is intentionally not calculated.</p>}<Link href={allPriced && singleCurrency ? "/dealer/checkout" : "/dealer/rfq"} className="btn btn-primary mt-6 w-full">{allPriced && singleCurrency ? "Proceed to Checkout →" : "Request Quotation →"}</Link><Link href="/dealer/products" className="btn btn-secondary mt-3 w-full">Continue Shopping</Link></div>
  </div>;
}
