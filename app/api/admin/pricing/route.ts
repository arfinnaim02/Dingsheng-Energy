import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import type {
  DealerPortalSettings,
  DealerPrice,
  PriceGroup,
} from "@/data/site";

import { isAdminSession } from "@/lib/adminAuth";

import {
  getAllPriceGroups,
  getDealerPortalSettings,
  getProducts,
  updatePricingConfiguration,
} from "@/lib/catalog";

export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const [
    priceGroups,
    products,
    dealerPortal,
  ] = await Promise.all([
    getAllPriceGroups(),

    getProducts({
      activeOnly: false,
      includeProtected: true,
    }),

    getDealerPortalSettings(),
  ]);

  return NextResponse.json({
    priceGroups,
    products,
    dealerPortal,
  });
}

export async function PUT(
  request: Request,
) {
  if (!(await isAdminSession())) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body =
      (await request.json()) as {
        priceGroups: PriceGroup[];

        dealerPortal:
          DealerPortalSettings;

        productPrices: Record<
          string,
          DealerPrice[]
        >;
      };

    if (
      !Array.isArray(
        body.priceGroups,
      ) ||
      !body.priceGroups.length
    ) {
      return NextResponse.json(
        {
          error:
            "At least one price group is required.",
        },
        { status: 400 },
      );
    }

    await updatePricingConfiguration(
      body,
    );

    revalidatePath("/admin/pricing");
    revalidatePath("/admin/products");
    revalidatePath("/admin/operations");

    revalidatePath("/dealer");
    revalidatePath("/dealer/dashboard");
    revalidatePath("/dealer/products");
    revalidatePath("/dealer/cart");
    revalidatePath("/dealer/checkout");
    revalidatePath("/dealer/rfq");

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Pricing update failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save pricing.",
      },
      { status: 400 },
    );
  }
}