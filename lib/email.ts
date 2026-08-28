import nodemailer from "nodemailer";

type NotificationResult = {
  sent: boolean;
  skipped: boolean;
  messageId?: string;
};

type ContactNotification = {
  id: string;
  reference: string;

  source:
    | "PUBLIC"
    | "DEALER";

  fullName: string;
  company: string;
  email: string;

  phone:
    | string
    | null;

  country:
    | string
    | null;

  inquiryType: string;
  requirement: string;

  dealerId?:
    | string
    | null;

  createdAt: Date;
};

type OrderNotificationItem = {
  name: string;
  slug: string;
  quantity: number;
  unitPrice: number;
};

type OrderNotification = {
  id: string;
  reference: string;
  status: string;
  currency: string;
  totalAmount: number;

  deliveryCountry: string;

  deliveryAddress:
    | string
    | null;

  paymentMethod:
    | string
    | null;

  createdAt: Date;

  dealer: {
    id: string;
    companyName: string;
    contactName: string;
    email: string;

    phone:
      | string
      | null;

    country:
      | string
      | null;

    priceGroupName:
      | string
      | null;
  };

  items: OrderNotificationItem[];
};

type RfqNotificationItem = {
  name: string;
  slug: string;
  quantity: number;
};

type RfqNotification = {
  id: string;
  reference: string;
  status: string;
  projectName: string;
  deliveryCountry: string;

  requiredDate:
    | Date
    | null;

  requirement:
    | string
    | null;

  createdAt: Date;

  dealer: {
    id: string;
    companyName: string;
    contactName: string;
    email: string;

    phone:
      | string
      | null;

    country:
      | string
      | null;
  };

  items: RfqNotificationItem[];
};

type EmailRow = {
  label: string;
  value: string;
};

type EmailItem = {
  title: string;
  subtitle: string;
  amount?: string;
};

type AdminEmail = {
  subject: string;
  heading: string;
  eyebrow: string;
  reference: string;
  replyTo: string;
  rows: EmailRow[];

  bodyTitle?:
    | string;

  body?:
    | string
    | null;

  itemsTitle?:
    | string;

  items?:
    | EmailItem[];

  primaryLabel: string;
  primaryUrl: string;

  secondaryLabel?:
    | string;

  secondaryUrl?:
    | string;

  logLabel: string;
};

function configuration() {
  const user =
    process.env
      .GMAIL_SMTP_USER
      ?.trim();

  const appPassword =
    process.env
      .GMAIL_SMTP_APP_PASSWORD
      ?.replace(/\s/g, "");

  const adminEmail =
    process.env
      .ADMIN_NOTIFICATION_EMAIL
      ?.trim();

  if (
    !user ||
    !appPassword ||
    !adminEmail
  ) {
    return null;
  }

  return {
    user,
    appPassword,
    adminEmail,
  };
}

function siteUrl() {
  return (
    process.env
      .NEXT_PUBLIC_SITE_URL
      ?.trim()
      .replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function escapeHtml(
  value:
    | string
    | null
    | undefined,
) {
  return (value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll(
      "'",
      "&#039;",
    );
}

function displayValue(
  value:
    | string
    | null
    | undefined,
) {
  const cleaned =
    value?.trim();

  return (
    cleaned ||
    "Not provided"
  );
}

function formatDate(
  value: Date,
) {
  return value.toLocaleString(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

function formatDateOnly(
  value:
    | Date
    | null,
) {
  if (!value) {
    return "Not specified";
  }

  return value.toLocaleDateString(
    "en-US",
    {
      dateStyle: "medium",
    },
  );
}

function formatMoney(
  amount: number,
  currency: string,
) {
  try {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency,
      },
    ).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(
      2,
    )}`;
  }
}

function paymentMethodLabel(
  provider:
    | string
    | null,
) {
  switch (provider) {
    case "BANK_TRANSFER":
      return "Bank Transfer";

    case "LETTER_OF_CREDIT":
      return "Letter of Credit (L/C)";

    case "APPROVED_CREDIT_TERMS":
      return "Approved Dealer Credit Terms";

    case "MANUAL_COMMERCIAL_AGREEMENT":
      return "Manual Commercial Agreement";

    default:
      return "Not specified";
  }
}

function createTransporter(
  user: string,
  appPassword: string,
) {
  return nodemailer.createTransport({
    service: "gmail",

    auth: {
      user,
      pass: appPassword,
    },
  });
}

async function sendAdminEmail(
  email: AdminEmail,
): Promise<NotificationResult> {
  const config =
    configuration();

  if (!config) {
    console.warn(
      `${email.logLabel} skipped: Gmail SMTP environment variables are incomplete.`,
    );

    return {
      sent: false,
      skipped: true,
    };
  }

  const transporter =
    createTransporter(
      config.user,
      config.appPassword,
    );

  const plainText = [
    email.heading,
    "",
    `Reference: ${email.reference}`,

    ...email.rows.map(
      (row) =>
        `${row.label}: ${row.value}`,
    ),

    ...(email.body
      ? [
          "",
          email.bodyTitle ||
            "Details",
          email.body,
        ]
      : []),

    ...(email.items?.length
      ? [
          "",
          email.itemsTitle ||
            "Items",

          ...email.items.map(
            (item) =>
              `${item.title} — ${item.subtitle}${
                item.amount
                  ? ` — ${item.amount}`
                  : ""
              }`,
          ),
        ]
      : []),

    "",
    `${email.primaryLabel}: ${email.primaryUrl}`,

    ...(email.secondaryUrl
      ? [
          `${email.secondaryLabel || "View details"}: ${email.secondaryUrl}`,
        ]
      : []),
  ].join("\n");

  const rowsHtml =
    email.rows
      .map(
        (row) => `
          <tr>
            <td style="padding:10px 0;color:#71838b;width:155px;vertical-align:top;">
              ${escapeHtml(
                row.label,
              )}
            </td>

            <td style="padding:10px 0;font-weight:700;vertical-align:top;">
              ${escapeHtml(
                row.value,
              )}
            </td>
          </tr>
        `,
      )
      .join("");

  const itemsHtml =
    email.items?.length
      ? `
        <div style="margin-top:26px;">
          <div style="margin-bottom:12px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#71838b;">
            ${escapeHtml(
              email.itemsTitle ||
                "Items",
            )}
          </div>

          <div style="border:1px solid #e2eae6;border-radius:8px;overflow:hidden;">
            ${email.items
              .map(
                (
                  item,
                  index,
                ) => `
                  <div style="padding:15px 17px;${
                    index > 0
                      ? "border-top:1px solid #e8eeeb;"
                      : ""
                  }">
                    <div style="font-size:14px;font-weight:800;color:#17313d;">
                      ${escapeHtml(
                        item.title,
                      )}
                    </div>

                    <div style="margin-top:5px;font-size:12px;color:#71838b;">
                      ${escapeHtml(
                        item.subtitle,
                      )}
                    </div>

                    ${
                      item.amount
                        ? `
                          <div style="margin-top:6px;font-size:13px;font-weight:800;color:#087a50;">
                            ${escapeHtml(
                              item.amount,
                            )}
                          </div>
                        `
                        : ""
                    }
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>
      `
      : "";

  const bodyHtml =
    email.body
      ? `
        <div style="margin-top:25px;padding:20px;background:#f6f9f7;border-left:4px solid #0a9c63;border-radius:6px;">
          <div style="margin-bottom:10px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#71838b;">
            ${escapeHtml(
              email.bodyTitle ||
                "Details",
            )}
          </div>

          <div style="font-size:14px;line-height:1.7;white-space:pre-wrap;">
            ${escapeHtml(
              email.body,
            )}
          </div>
        </div>
      `
      : "";

  const html = `
    <div style="margin:0;padding:32px;background:#f3f7f5;font-family:Arial,Helvetica,sans-serif;color:#17313d;">
      <div style="max-width:700px;margin:0 auto;background:#ffffff;border:1px solid #dfe8e4;border-radius:14px;overflow:hidden;">
        <div style="padding:28px 32px;background:#0c322a;color:#ffffff;">
          <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#91cbb3;">
            ${escapeHtml(
              email.eyebrow,
            )}
          </div>

          <h1 style="margin:10px 0 0;font-size:25px;line-height:1.3;">
            ${escapeHtml(
              email.heading,
            )}
          </h1>

          <p style="margin:9px 0 0;color:#c9ddd5;font-size:14px;">
            ${escapeHtml(
              email.reference,
            )}
          </p>
        </div>

        <div style="padding:30px 32px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            ${rowsHtml}
          </table>

          ${bodyHtml}
          ${itemsHtml}

          <div style="margin-top:28px;">
            <a
              href="${escapeHtml(
                email.primaryUrl,
              )}"
              style="display:inline-block;padding:13px 20px;background:#0a9c63;color:#ffffff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:800;"
            >
              ${escapeHtml(
                email.primaryLabel,
              )}
            </a>

            ${
              email.secondaryUrl
                ? `
                  <a
                    href="${escapeHtml(
                      email.secondaryUrl,
                    )}"
                    style="display:inline-block;margin-left:8px;padding:12px 19px;background:#ffffff;color:#17313d;text-decoration:none;border:1px solid #d8e4df;border-radius:6px;font-size:13px;font-weight:800;"
                  >
                    ${escapeHtml(
                      email.secondaryLabel ||
                        "View Details",
                    )}
                  </a>
                `
                : ""
            }
          </div>
        </div>

        <div style="padding:18px 32px;background:#f7faf8;border-top:1px solid #e5ece8;color:#829198;font-size:11px;line-height:1.6;">
          This notification was generated automatically by the Dingsheng Energy website.
        </div>
      </div>
    </div>
  `;

  const result =
    await transporter.sendMail({
      from: {
        name:
          "Dingsheng Energy Website",

        address:
          config.user,
      },

      to:
        config.adminEmail,

      replyTo:
        email.replyTo,

      subject:
        email.subject,

      text:
        plainText,

      html,
    });

  console.info(
    `${email.logLabel} sent for ${email.reference}:`,
    result.messageId,
  );

  return {
    sent: true,
    skipped: false,
    messageId:
      result.messageId,
  };
}

export async function sendNewContactNotification(
  contact: ContactNotification,
) {
  const adminContactUrl =
    `${siteUrl()}/admin/contacts/${encodeURIComponent(
      contact.id,
    )}`;

  const dealerUrl =
    contact.dealerId
      ? `${siteUrl()}/admin/dealers/${encodeURIComponent(
          contact.dealerId,
        )}`
      : undefined;

  return sendAdminEmail({
    subject:
      contact.source ===
      "DEALER"
        ? `[Dealer Contact] ${contact.company} — ${contact.inquiryType}`
        : `[New Contact] ${contact.fullName} — ${contact.inquiryType}`,

    heading:
      "New Contact Inquiry",

    eyebrow:
      contact.source ===
      "DEALER"
        ? "Dealer Portal"
        : "Public Website",

    reference:
      contact.reference,

    replyTo:
      contact.email,

    rows: [
      {
        label: "Contact",
        value:
          contact.fullName,
      },

      {
        label: "Company",
        value:
          contact.company,
      },

      {
        label: "Email",
        value:
          contact.email,
      },

      {
        label: "Phone",
        value:
          displayValue(
            contact.phone,
          ),
      },

      {
        label: "Country",
        value:
          displayValue(
            contact.country,
          ),
      },

      {
        label:
          "Inquiry Type",

        value:
          contact.inquiryType,
      },

      {
        label: "Submitted",
        value:
          formatDate(
            contact.createdAt,
          ),
      },
    ],

    bodyTitle:
      "Requirement Details",

    body:
      contact.requirement,

    primaryLabel:
      "View Contact Inquiry",

    primaryUrl:
      adminContactUrl,

    secondaryLabel:
      dealerUrl
        ? "View Dealer Profile"
        : undefined,

    secondaryUrl:
      dealerUrl,

    logLabel:
      "Contact email notification",
  });
}

export async function sendNewOrderNotification(
  order: OrderNotification,
) {
  const adminOrdersUrl =
    `${siteUrl()}/admin/orders`;

  const dealerUrl =
    `${siteUrl()}/admin/dealers/${encodeURIComponent(
      order.dealer.id,
    )}`;

  return sendAdminEmail({
    subject:
      `[New Order] ${order.reference} — ${order.dealer.companyName}`,

    heading:
      "New Dealer Order",

    eyebrow:
      "Dealer Portal Order",

    reference:
      order.reference,

    replyTo:
      order.dealer.email,

    rows: [
      {
        label: "Dealer",
        value:
          order.dealer
            .companyName,
      },

      {
        label:
          "Contact Person",

        value:
          order.dealer
            .contactName,
      },

      {
        label: "Email",
        value:
          order.dealer.email,
      },

      {
        label: "Phone",
        value:
          displayValue(
            order.dealer.phone,
          ),
      },

      {
        label:
          "Dealer Country",

        value:
          displayValue(
            order.dealer.country,
          ),
      },

      {
        label:
          "Price Group",

        value:
          displayValue(
            order.dealer
              .priceGroupName,
          ),
      },

      {
        label:
          "Order Status",

        value:
          order.status,
      },

      {
        label:
          "Payment Method",

        value:
          paymentMethodLabel(
            order.paymentMethod,
          ),
      },

      {
        label:
          "Delivery Country",

        value:
          order.deliveryCountry,
      },

      {
        label:
          "Delivery Address",

        value:
          displayValue(
            order.deliveryAddress,
          ),
      },

      {
        label:
          "Order Total",

        value:
          formatMoney(
            order.totalAmount,
            order.currency,
          ),
      },

      {
        label: "Submitted",
        value:
          formatDate(
            order.createdAt,
          ),
      },
    ],

    itemsTitle:
      "Ordered Products",

    items:
      order.items.map(
        (item) => ({
          title:
            item.name,

          subtitle:
            `Quantity: ${item.quantity} · Unit price: ${formatMoney(
              item.unitPrice,
              order.currency,
            )}`,

          amount:
            `Line total: ${formatMoney(
              item.unitPrice *
                item.quantity,
              order.currency,
            )}`,
        }),
      ),

    primaryLabel:
      "Manage Orders",

    primaryUrl:
      adminOrdersUrl,

    secondaryLabel:
      "View Dealer Profile",

    secondaryUrl:
      dealerUrl,

    logLabel:
      "Order email notification",
  });
}

export async function sendNewRfqNotification(
  rfq: RfqNotification,
) {
  const adminRfqUrl =
    `${siteUrl()}/admin/rfqs`;

  const dealerUrl =
    `${siteUrl()}/admin/dealers/${encodeURIComponent(
      rfq.dealer.id,
    )}`;

  return sendAdminEmail({
    subject:
      `[New RFQ] ${rfq.reference} — ${rfq.dealer.companyName}`,

    heading:
      "New Dealer RFQ",

    eyebrow:
      "Dealer Portal RFQ",

    reference:
      rfq.reference,

    replyTo:
      rfq.dealer.email,

    rows: [
      {
        label: "Dealer",
        value:
          rfq.dealer
            .companyName,
      },

      {
        label:
          "Contact Person",

        value:
          rfq.dealer
            .contactName,
      },

      {
        label: "Email",
        value:
          rfq.dealer.email,
      },

      {
        label: "Phone",
        value:
          displayValue(
            rfq.dealer.phone,
          ),
      },

      {
        label:
          "Dealer Country",

        value:
          displayValue(
            rfq.dealer.country,
          ),
      },

      {
        label: "Project",
        value:
          rfq.projectName,
      },

      {
        label:
          "Delivery Country",

        value:
          rfq.deliveryCountry,
      },

      {
        label:
          "Required Date",

        value:
          formatDateOnly(
            rfq.requiredDate,
          ),
      },

      {
        label:
          "RFQ Status",

        value:
          rfq.status,
      },

      {
        label: "Submitted",
        value:
          formatDate(
            rfq.createdAt,
          ),
      },
    ],

    bodyTitle:
      "Project Requirements",

    body:
      rfq.requirement,

    itemsTitle:
      "Requested Products",

    items:
      rfq.items.map(
        (item) => ({
          title:
            item.name,

          subtitle:
            `Quantity: ${item.quantity}`,

          amount:
            `Product slug: ${item.slug}`,
        }),
      ),

    primaryLabel:
      "Manage RFQs",

    primaryUrl:
      adminRfqUrl,

    secondaryLabel:
      "View Dealer Profile",

    secondaryUrl:
      dealerUrl,

    logLabel:
      "RFQ email notification",
  });
}