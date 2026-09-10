import {
  revalidatePath,
} from "next/cache";

import {
  NextResponse,
} from "next/server";

import type {
  DealerPortalSettings,
  PriceGroup,
} from "@/data/site";

import {
  isAdminSession,
} from "@/lib/adminAuth";

import {
  getAllPriceGroups,
  getDealerPortalSettings,
  getProducts,
  updatePricingConfiguration,
} from "@/lib/catalog";

type ProductBasePricingInput = {
  basePrice?: number;
  baseCurrency?: string;

  minimumQty?: number;

  leadTimeText?: string;
  pricingNote?: string;
};

type PricingRequestBody = {
  priceGroups: PriceGroup[];

  dealerPortal:
    DealerPortalSettings;

  productBasePrices: Record<
    string,
    ProductBasePricingInput
  >;
};

export async function GET() {
  if (
    !(await isAdminSession())
  ) {
    return NextResponse.json(
      {
        error:
          "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const [
    priceGroups,
    products,
    dealerPortal,
  ] = await Promise.all([
    getAllPriceGroups(),

    getProducts({
      activeOnly:
        false,

      includeProtected:
        true,
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
  if (
    !(await isAdminSession())
  ) {
    return NextResponse.json(
      {
        error:
          "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const body =
      (await request.json()) as
        PricingRequestBody;

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
        {
          status: 400,
        },
      );
    }

    if (
      !body.dealerPortal ||
      typeof body.dealerPortal !==
        "object"
    ) {
      return NextResponse.json(
        {
          error:
            "Dealer portal configuration is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !body.productBasePrices ||
      typeof body.productBasePrices !==
        "object" ||
      Array.isArray(
        body.productBasePrices,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Product base pricing configuration is required.",
        },
        {
          status: 400,
        },
      );
    }

    await updatePricingConfiguration({
      priceGroups:
        body.priceGroups,

      dealerPortal:
        body.dealerPortal,

      productBasePrices:
        body.productBasePrices,
    });

    /*
     * Admin
     */
    revalidatePath(
      "/admin/pricing",
    );

    revalidatePath(
      "/admin/products",
    );

    revalidatePath(
      "/admin/operations",
    );

    /*
     * Dealer portal
     */
    revalidatePath(
      "/dealer",
    );

    revalidatePath(
      "/dealer/dashboard",
    );

    revalidatePath(
      "/dealer/products",
    );

    revalidatePath(
      "/dealer/cart",
    );

    revalidatePath(
      "/dealer/checkout",
    );

    revalidatePath(
      "/dealer/rfq",
    );

    /*
     * Public catalogue may show
     * commercial/RFQ state that depends
     * on product configuration.
     */
    revalidatePath(
      "/products",
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (
    error
  ) {
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
      {
        status: 400,
      },
    );
  }
}