"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Icon } from "./Icon";

import type {
  DealerPrice,
  Product,
} from "@/data/site";

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
  const [imageError, setImageError] =
    useState(false);

  const categorySlug =
    contextCategorySlug &&
    product.categorySlugs.includes(
      contextCategorySlug,
    )
      ? contextCategorySlug
      : product.primaryCategorySlug;

  const href = dealer
    ? `/dealer/products/${product.slug}`
    : `/products/${categorySlug}/${product.slug}`;

  const showImage =
    Boolean(product.image) && !imageError;

  const hasDealerPrice =
    dealer &&
    typeof dealerPrice?.amount === "number" &&
    Number.isFinite(dealerPrice.amount);

  const formattedDealerPrice =
    hasDealerPrice
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency:
            dealerPrice?.currency || "USD",
          minimumFractionDigits: 2,
        }).format(dealerPrice!.amount!)
      : "";

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-[#dfe8e4] bg-white shadow-[0_6px_24px_rgba(7,31,44,.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#0a9c63]/35 hover:shadow-[0_14px_36px_rgba(7,31,44,.09)]">
      {/* Product Image */}
      <Link
        href={href}
        className="relative block aspect-[4/3] w-full overflow-hidden border-b border-[#edf2ef] bg-gradient-to-br from-white via-[#fbfdfc] to-[#eef5f2]"
      >
        {showImage ? (
          <div className="absolute inset-5">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw"
              className="object-contain object-center transition-transform duration-500 group-hover:scale-[1.04]"
              onError={() =>
                setImageError(true)
              }
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#d7e6df] bg-white shadow-sm">
              <Icon
                name="tools"
                className="h-7 w-7 text-[#0a9c63]"
              />
            </div>
          </div>
        )}
      </Link>

      {/* Product Content */}
      <div className="flex flex-1 flex-col p-4">
        <Link href={href}>
          <h3 className="line-clamp-2 text-[17px] font-black leading-[1.3] tracking-[-.015em] text-[#0b2230] transition-colors group-hover:text-[#0a9c63]">
            {product.name}
          </h3>
        </Link>

        {product.summary && (
          <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#687b84]">
            {product.summary}
          </p>
        )}

        {/* Dealer / Protected Pricing */}
        <div className="mt-auto pt-4">
          {dealer ? (
            hasDealerPrice ? (
              <div className="rounded-lg border border-[#bfe3d2] bg-[#edf9f3] px-3 py-2.5">
                <div className="text-[9px] font-black uppercase tracking-[.1em] text-[#5b7d70]">
                  {dealerPriceGroupName ||
                    "Dealer"}{" "}
                  Price
                </div>

                <div className="mt-1 text-lg font-black text-[#08774f]">
                  {formattedDealerPrice}

                  <span className="ml-1 text-[10px] font-bold text-[#6d857b]">
                    /{" "}
                    {product.unitLabel ||
                      "Unit"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-[#eadfbd] bg-[#fff9e9] px-3 py-2.5">
                <div className="flex items-center gap-2 text-[10px] font-extrabold text-[#9c6c00]">
                  <Icon
                    name="file"
                    className="h-3.5 w-3.5 shrink-0"
                  />

                  Price Not Configured
                </div>
              </div>
            )
          ) : (
            <div className="rounded-lg border border-[#f1dfb1] bg-[#fff9e9] px-3 py-2.5">
              <div className="flex items-center gap-2 text-[10px] font-extrabold text-[#b87c00]">
                <Icon
                  name="lock"
                  className="h-3.5 w-3.5 shrink-0"
                />

                Dealer Pricing Protected
              </div>

              <p className="mt-1 pl-[22px] text-[9.5px] leading-4 text-[#8c8060]">
                Approved dealers can login to
                access commercial pricing.
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}