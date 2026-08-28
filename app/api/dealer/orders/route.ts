import {
  randomUUID,
} from "node:crypto";

import {
  NextResponse,
} from "next/server";

import {
  getCurrentDealer,
} from "@/lib/dealerAuth";

import {
  sendNewOrderNotification,
} from "@/lib/email";

import {
  getProducts,
} from "@/lib/catalog";

import {
  prisma,
} from "@/lib/prisma";

import {
  getDealerPrice,
  productForDealerGroup,
} from "@/lib/pricing";

type CheckoutItem = {
  slug?: string;
  quantity?: number;
};

type CheckoutBody = {
  items?: CheckoutItem[];
  deliveryCountry?: string;
  deliveryAddress?: string;
  paymentMethod?: string;
};

const paymentMethods = [
  "BANK_TRANSFER",
  "LETTER_OF_CREDIT",
  "APPROVED_CREDIT_TERMS",
  "MANUAL_COMMERCIAL_AGREEMENT",
] as const;

function createReference() {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const random = randomUUID()
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase();

  return `ORD-${date}-${random}`;
}

export async function POST(
  request: Request,
) {
  const dealer =
    await getCurrentDealer();

  if (
    !dealer ||
    !dealer.priceGroup ||
    !dealer.priceGroup.active
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const body =
    (await request.json().catch(
      () => null,
    )) as
      | CheckoutBody
      | null;

  const deliveryCountry =
    body?.deliveryCountry
      ?.trim() || "";

  const deliveryAddress =
    body?.deliveryAddress
      ?.trim() || "";

  const paymentMethod =
    body?.paymentMethod
      ?.trim() || "";

  if (
    !paymentMethods.includes(
      paymentMethod as
        (typeof paymentMethods)[number],
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Select a valid payment method.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !deliveryCountry ||
    !deliveryAddress
  ) {
    return NextResponse.json(
      {
        error:
          "Delivery country and address are required.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !Array.isArray(
      body?.items,
    ) ||
    !body.items.length
  ) {
    return NextResponse.json(
      {
        error:
          "Your cart is empty.",
      },
      {
        status: 400,
      },
    );
  }

  const combinedItems =
    new Map<
      string,
      number
    >();

  for (
    const item of body.items.slice(
      0,
      100,
    )
  ) {
    const slug =
      typeof item.slug ===
      "string"
        ? item.slug.trim()
        : "";

    const quantity =
      Number(
        item.quantity,
      );

    if (
      !slug ||
      !Number.isInteger(
        quantity,
      ) ||
      quantity < 1 ||
      quantity > 100000
    ) {
      return NextResponse.json(
        {
          error:
            "One or more cart items are invalid.",
        },
        {
          status: 400,
        },
      );
    }

    combinedItems.set(
      slug,

      (combinedItems.get(
        slug,
      ) || 0) + quantity,
    );
  }

  const requestedSlugs = [
    ...combinedItems.keys(),
  ];

  const catalogProducts =
    await getProducts({
      includeProtected: true,
    });

  const selectedProducts =
    catalogProducts.filter(
      (product) =>
        product.active !==
          false &&
        requestedSlugs.includes(
          product.slug,
        ),
    );

  if (
    selectedProducts.length !==
    requestedSlugs.length
  ) {
    return NextResponse.json(
      {
        error:
          "One or more products are no longer available.",
      },
      {
        status: 400,
      },
    );
  }

  const priceGroupSlug =
    dealer.priceGroup.slug;

  let calculatedItems: {
    slug: string;
    name: string;
    quantity: number;
    unitPrice: number;
    currency: string;
  }[];

  try {
    calculatedItems =
      selectedProducts.map(
        (product) => {
          const dealerProduct =
            productForDealerGroup(
              product,
              priceGroupSlug,
            );

          const price =
            getDealerPrice(
              dealerProduct,
              priceGroupSlug,
            );

          const quantity =
            combinedItems.get(
              dealerProduct.slug,
            ) || 0;

          if (
            typeof price?.amount !==
              "number" ||
            !Number.isFinite(
              price.amount,
            ) ||
            price.amount < 0
          ) {
            throw new Error(
              `PRICE_UNAVAILABLE:${dealerProduct.name}`,
            );
          }

          const minimumQuantity =
            Math.max(
              1,
              price.minimumQty ||
                1,
            );

          if (
            quantity <
            minimumQuantity
          ) {
            throw new Error(
              `MINIMUM_QUANTITY:${dealerProduct.name}:${minimumQuantity}`,
            );
          }

          return {
            slug:
              dealerProduct.slug,

            name:
              dealerProduct.name,

            quantity,

            unitPrice:
              price.amount,

            currency:
              price.currency ||
              "USD",
          };
        },
      );
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.startsWith(
          "PRICE_UNAVAILABLE:",
        )
      ) {
        return NextResponse.json(
          {
            error:
              `A current dealer price is unavailable for ${error.message.replace(
                "PRICE_UNAVAILABLE:",
                "",
              )}.`,
          },
          {
            status: 400,
          },
        );
      }

      if (
        error.message.startsWith(
          "MINIMUM_QUANTITY:",
        )
      ) {
        const [
          ,
          productName,
          minimum,
        ] =
          error.message.split(
            ":",
          );

        return NextResponse.json(
          {
            error:
              `${productName} requires a minimum quantity of ${minimum}.`,
          },
          {
            status: 400,
          },
        );
      }
    }

    throw error;
  }

  const currencies = [
    ...new Set(
      calculatedItems.map(
        (item) =>
          item.currency,
      ),
    ),
  ];

  if (
    currencies.length !== 1
  ) {
    return NextResponse.json(
      {
        error:
          "Checkout cannot combine products with different currencies.",
      },
      {
        status: 400,
      },
    );
  }

  const databaseProducts =
    await prisma.product.findMany({
      where: {
        slug: {
          in: requestedSlugs,
        },

        isActive: true,
      },

      select: {
        id: true,
        slug: true,
      },
    });

  if (
    databaseProducts.length !==
    requestedSlugs.length
  ) {
    return NextResponse.json(
      {
        error:
          "One or more products have not been synchronized with the database.",
      },
      {
        status: 409,
      },
    );
  }

  const productIds =
    new Map(
      databaseProducts.map(
        (product) => [
          product.slug,
          product.id,
        ],
      ),
    );

  const totalAmount =
    calculatedItems.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.unitPrice *
          item.quantity,

      0,
    );

  try {
    /*
     * Save the order first.
     */
    const order =
      await prisma.order.create({
        data: {
          reference:
            createReference(),

          dealerId:
            dealer.id,

          status: "PENDING",

          currency:
            currencies[0],

          totalAmount,

          deliveryCountry,
          deliveryAddress,

          items: {
            create:
              calculatedItems.map(
                (item) => ({
                  productId:
                    productIds.get(
                      item.slug,
                    )!,

                  quantity:
                    item.quantity,

                  unitPrice:
                    item.unitPrice,
                }),
              ),
          },

          payments: {
            create: {
              provider:
                paymentMethod,

              status:
                "PENDING",

              amount:
                totalAmount,

              currency:
                currencies[0],
            },
          },
        },

        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },

          payments: {
            orderBy: {
              createdAt:
                "desc",
            },

            take: 1,
          },
        },
      });

    /*
     * Send the email only after the
     * order exists in Neon.
     *
     * Email failure never deletes or
     * fails the order.
     */
    try {
      await sendNewOrderNotification({
        id: order.id,

        reference:
          order.reference,

        status:
          order.status,

        currency:
          order.currency,

        totalAmount:
          order.totalAmount !==
          null
            ? Number(
                order.totalAmount,
              )
            : totalAmount,

        deliveryCountry:
          order.deliveryCountry ||
          deliveryCountry,

        deliveryAddress:
          order.deliveryAddress,

        paymentMethod:
          order.payments[0]
            ?.provider ||
          paymentMethod,

        createdAt:
          order.createdAt,

        dealer: {
          id:
            dealer.id,

          companyName:
            dealer.companyName,

          contactName:
            dealer.contactName,

          email:
            dealer.user.email,

          phone:
            dealer.phone,

          country:
            dealer.country,

          priceGroupName:
            dealer.priceGroup.name,
        },

        items:
          calculatedItems.map(
            (item) => ({
              name:
                item.name,

              slug:
                item.slug,

              quantity:
                item.quantity,

              unitPrice:
                item.unitPrice,
            }),
          ),
      });
    } catch (emailError) {
      console.error(
        `Admin order email notification failed for ${order.reference}:`,
        emailError,
      );
    }

    return NextResponse.json(
      {
        ok: true,

        order: {
          id:
            order.id,

          reference:
            order.reference,

          status:
            order.status,

          currency:
            order.currency,

          totalAmount:
            order.totalAmount
              ?.toString(),

          createdAt:
            order.createdAt.toISOString(),
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Order creation failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to create the order. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}