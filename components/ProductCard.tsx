"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Icon } from "./Icon";
import type { DealerPrice, Product } from "@/data/site";

function commercialLabel(product: Product) {
  switch (product.commercialMode) {
    case "rfq": return "RFQ Product";
    case "dealer-purchase": return "Dealer Purchase";
    case "dealer-purchase-rfq": return "Purchase / RFQ";
    default: return "Technical Product";
  }
}

function fallbackIcon(product: Product) {
  const value = `${product.slug} ${product.subcategory}`.toLowerCase();
  if (value.includes("tank")) return "tank" as const;
  if (value.includes("pump")) return "pump" as const;
  if (value.includes("flow") || value.includes("gauge")) return "gauge" as const;
  if (value.includes("pipe") || value.includes("hose")) return "pipeline" as const;
  if (value.includes("valve") || value.includes("coupling")) return "gear" as const;
  return "tools" as const;
}

export function ProductCard({
  product,
  dealer = false,
  contextCategorySlug,
  dealerPrice,
  dealerPriceGroupName,
}: {
  product: Product;
  dealer?: boolean;
  contextCategorySlug?: string;
  dealerPrice?: DealerPrice;
  dealerPriceGroupName?: string;
}) {
  const [imageError, setImageError] = useState(false);
  const categorySlug = contextCategorySlug && product.categorySlugs.includes(contextCategorySlug)
    ? contextCategorySlug
    : product.primaryCategorySlug;
  const href = dealer
    ? `/dealer/products/${product.slug}`
    : `/products/${categorySlug}/${product.slug}`;
  const displayGroup = product.categoryGroups?.[categorySlug] ?? product.subcategory;
  const primarySpecs = product.specs.slice(0, 2);
  const showImage = Boolean(product.image) && !imageError;
  const hasDealerPrice = dealer && typeof dealerPrice?.amount === "number" && Number.isFinite(dealerPrice.amount);
  const formattedDealerPrice = hasDealerPrice
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: dealerPrice?.currency || "USD", minimumFractionDigits: 2 }).format(dealerPrice!.amount!)
    : "";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#dfe8e4] bg-white shadow-[0_8px_30px_rgba(7,31,44,.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#0a9c63]/35 hover:shadow-[0_18px_45px_rgba(7,31,44,.1)]">
      <Link href={href} className="relative block h-[235px] overflow-hidden border-b border-[#edf2ef] bg-gradient-to-br from-white via-[#fbfdfc] to-[#eef5f2]">
        <div className="absolute left-4 top-4 z-20 rounded-full border border-[#d9e9e1] bg-white/95 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#55706a] shadow-sm backdrop-blur">
          {product.eyebrow || displayGroup}
        </div>
        <div className="absolute right-4 top-4 z-20 rounded-full bg-[#071f2c]/92 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.1em] text-white">
          {commercialLabel(product)}
        </div>

        {showImage ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain p-7 transition-transform duration-500 group-hover:scale-[1.045]"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#d7e6df] bg-white shadow-sm">
              <Icon name={fallbackIcon(product)} className="h-10 w-10 text-[#0a9c63]" />
            </div>
            <span className="mt-4 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#91a39b]">Technical Product</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#0a9c63]">{displayGroup}</div>
          {product.standards?.[0] && <div className="text-[9px] font-bold uppercase tracking-wide text-[#82938c]">{product.standards[0]}</div>}
        </div>

        <Link href={href}><h3 className="mt-2 min-h-[44px] text-[18px] font-black leading-[1.25] tracking-[-.015em] text-[#0b2230] transition-colors group-hover:text-[#0a9c63]">{product.name}</h3></Link>
        <p className="mt-3 line-clamp-2 min-h-[48px] text-[12.5px] leading-6 text-[#687b84]">{product.summary}</p>

        {primarySpecs.length > 0 ? (
          <div className="mt-5 overflow-hidden rounded-lg border border-[#e5ece8] bg-[#fafcfb]">
            {primarySpecs.map(([label, value], index) => (
              <div key={`${label}-${value}`} className={`grid grid-cols-[.9fr_1.1fr] gap-3 px-3 py-2.5 ${index !== primarySpecs.length - 1 ? "border-b border-[#e8eeeb]" : ""}`}>
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#85958e]">{label}</span>
                <span className="text-right text-[11px] font-extrabold text-[#29404a]">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 flex min-h-[58px] items-center rounded-lg border border-[#e5ece8] bg-[#fafcfb] px-4">
            <span className="text-[11px] leading-5 text-[#71858d]">Technical specifications available on request or on the product detail page.</span>
          </div>
        )}

        {product.standards && product.standards.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {product.standards.slice(0, 2).map((standard) => (
              <span key={standard} className="inline-flex items-center gap-1.5 rounded-full border border-[#d8e7df] bg-[#eff8f3] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#197456]">
                <Icon name="check" className="h-3 w-3" />{standard}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-5">
          {dealer ? (
            hasDealerPrice ? (
              <div className="rounded-lg border border-[#bfe3d2] bg-[#edf9f3] px-3.5 py-3">
                <div className="text-[9px] font-black uppercase tracking-[.1em] text-[#5b7d70]">{dealerPriceGroupName || "Dealer"} Price</div>
                <div className="mt-1 text-xl font-black text-[#08774f]">{formattedDealerPrice}<span className="ml-1 text-[10px] font-bold text-[#6d857b]">/ {product.unitLabel || "Unit"}</span></div>
                <div className="mt-1 text-[10px] leading-5 text-[#608077]">{dealerPrice?.minimumQty ? `MOQ ${dealerPrice.minimumQty}` : "No MOQ configured"}{dealerPrice?.leadTimeText ? ` · ${dealerPrice.leadTimeText}` : ""}</div>
              </div>
            ) : (
              <div className="rounded-lg border border-[#eadfbd] bg-[#fff9e9] px-3.5 py-3">
                <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#9c6c00]"><Icon name="file" className="h-4 w-4" /> Price Not Configured</div>
                <p className="mt-1 pl-6 text-[10px] leading-5 text-[#81765d]">Admin can add an approved dealer price, or this product can continue through RFQ.</p>
              </div>
            )
          ) : (
            <div className="rounded-lg border border-[#f1dfb1] bg-[#fff9e9] px-3.5 py-3">
              <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#b87c00]"><Icon name="lock" className="h-4 w-4 shrink-0" /> Dealer Pricing Protected</div>
              <p className="mt-1 pl-6 text-[10px] leading-5 text-[#8c8060]">Approved dealers can login to access commercial pricing.</p>
            </div>
          )}

          <Link href={href} className="mt-4 flex h-[44px] w-full items-center justify-between border border-[#0a9c63] px-4 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#0a9c63] transition hover:bg-[#0a9c63] hover:text-white">
            <span>{dealer ? "View Dealer Product" : "View Product Details"}</span><Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
