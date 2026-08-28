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
  sendNewRfqNotification,
} from "@/lib/email";

import {
  prisma,
} from "@/lib/prisma";

type RfqItem = {
  slug?: string;
  quantity?: number;
};

type RfqBody = {
  projectName?: string;
  deliveryCountry?: string;
  requiredDate?: string;
  requirement?: string;
  items?: RfqItem[];
};

function createReference() {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const random = randomUUID()
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase();

  return `RFQ-${date}-${random}`;
}

export async function POST(
  request: Request,
) {
  const dealer =
    await getCurrentDealer();

  if (!dealer) {
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
      | RfqBody
      | null;

  const projectName =
    body?.projectName
      ?.trim() || "";

  const deliveryCountry =
    body?.deliveryCountry
      ?.trim() || "";

  const requirement =
    body?.requirement
      ?.trim() || "";

  if (
    !projectName ||
    !deliveryCountry
  ) {
    return NextResponse.json(
      {
        error:
          "Project name and delivery country are required.",
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
          "Add at least one product to the RFQ.",
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
            "One or more RFQ products are invalid.",
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

  const slugs = [
    ...combinedItems.keys(),
  ];

  const products =
    await prisma.product.findMany({
      where: {
        slug: {
          in: slugs,
        },

        isActive: true,
      },

      select: {
        id: true,
        slug: true,
        name: true,
      },
    });

  if (
    products.length !==
    slugs.length
  ) {
    return NextResponse.json(
      {
        error:
          "One or more selected products are unavailable.",
      },
      {
        status: 400,
      },
    );
  }

  let requiredDate:
    | Date
    | null = null;

  if (body?.requiredDate) {
    const parsedDate =
      new Date(
        `${body.requiredDate}T00:00:00.000Z`,
      );

    if (
      Number.isNaN(
        parsedDate.getTime(),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid required date.",
        },
        {
          status: 400,
        },
      );
    }

    requiredDate =
      parsedDate;
  }

  try {
    /*
     * Save the RFQ first.
     */
    const rfq =
      await prisma.rfq.create({
        data: {
          reference:
            createReference(),

          dealerId:
            dealer.id,

          projectName,
          deliveryCountry,
          requiredDate,

          requirement:
            requirement ||
            null,

          status:
            "SUBMITTED",

          items: {
            create:
              products.map(
                (product) => ({
                  productId:
                    product.id,

                  quantity:
                    combinedItems.get(
                      product.slug,
                    ) || 1,
                }),
              ),
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
        },
      });

    /*
     * Send the admin notification only
     * after the RFQ has been saved.
     *
     * Gmail failure never fails or
     * removes the RFQ.
     */
    try {
      await sendNewRfqNotification({
        id: rfq.id,

        reference:
          rfq.reference,

        status:
          rfq.status,

        projectName:
          rfq.projectName ||
          projectName,

        deliveryCountry:
          rfq.deliveryCountry ||
          deliveryCountry,

        requiredDate:
          rfq.requiredDate,

        requirement:
          rfq.requirement,

        createdAt:
          rfq.createdAt,

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
        },

        items:
          rfq.items.map(
            (item) => ({
              name:
                item.product.name,

              slug:
                item.product.slug,

              quantity:
                item.quantity,
            }),
          ),
      });
    } catch (emailError) {
      console.error(
        `Admin RFQ email notification failed for ${rfq.reference}:`,
        emailError,
      );
    }

    return NextResponse.json(
      {
        ok: true,

        rfq: {
          id:
            rfq.id,

          reference:
            rfq.reference,

          status:
            rfq.status,

          createdAt:
            rfq.createdAt.toISOString(),
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "RFQ creation failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to submit the RFQ. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}