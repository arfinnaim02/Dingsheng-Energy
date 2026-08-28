import type { DealerPrice, PriceGroup, Product } from "@/data/site";

export function getDealerPrice(product: Product, priceGroupSlug: string): DealerPrice | undefined {
  return (product.dealerPrices ?? []).find((price) => price.priceGroupSlug === priceGroupSlug);
}

export function hasConfiguredPrice(product: Product, priceGroupSlug: string): boolean {
  const price = getDealerPrice(product, priceGroupSlug);
  return typeof price?.amount === "number" && Number.isFinite(price.amount);
}

export function formatMoney(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || "USD"} ${amount.toFixed(2)}`;
  }
}

export function priceGroupName(groups: PriceGroup[], slug: string): string {
  return groups.find((group) => group.slug === slug)?.name ?? slug;
}

export function canPurchaseDirect(product: Product): boolean {
  return product.commercialMode === "dealer-purchase" || product.commercialMode === "dealer-purchase-rfq";
}

export function canRequestQuote(product: Product): boolean {
  return product.commercialMode === "rfq" || product.commercialMode === "dealer-purchase-rfq";
}

export function productForDealerGroup(product: Product, priceGroupSlug: string): Product {
  return {
    ...product,
    dealerPrices: (product.dealerPrices ?? []).filter((price) => price.priceGroupSlug === priceGroupSlug),
  };
}
