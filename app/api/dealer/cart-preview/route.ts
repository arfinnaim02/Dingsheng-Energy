import { NextResponse } from "next/server";

import { getCurrentDealer } from "@/lib/dealerAuth";
import { getProducts } from "@/lib/catalog";
import {
  getDealerPrice,
  productForDealerGroup,
} from "@/lib/pricing";

type RequestBody = {
  slugs?: string[];
};

export async function POST(request: Request) {
  const dealer = await getCurrentDealer();

  if (
    !dealer ||
    !dealer.priceGroup ||
    !dealer.priceGroup.active
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | RequestBody
    | null;

  const slugs = Array.isArray(body?.slugs)
    ? [
        ...new Set(
          body.slugs
            .filter(
              (slug): slug is string =>
                typeof slug === "string",
            )
            .slice(0, 100),
        ),
      ]
    : [];

  if (!slugs.length) {
    return NextResponse.json({
      products: [],
      priceGroupName: dealer.priceGroup.name,
    });
  }

  const products = await getProducts({
    includeProtected: true,
  });

  const priceGroupSlug = dealer.priceGroup.slug;

  const previewProducts = products
    .filter(
      (product) =>
        product.active !== false &&
        slugs.includes(product.slug),
    )
    .map((product) => {
      const dealerProduct = productForDealerGroup(
        product,
        priceGroupSlug,
      );

      const price = getDealerPrice(
        dealerProduct,
        priceGroupSlug,
      );

      return {
        slug: dealerProduct.slug,
        name: dealerProduct.name,
        image: dealerProduct.image,
        sku: dealerProduct.sku || null,
        unitLabel: dealerProduct.unitLabel || "Unit",
        price:
          typeof price?.amount === "number"
            ? {
                amount: price.amount,
                currency: price.currency || "USD",
                minimumQty: price.minimumQty || 1,
              }
            : null,
      };
    });

  return NextResponse.json({
    products: previewProducts,
    priceGroupName: dealer.priceGroup.name,
  });
}