import { redirect } from "next/navigation";

import { DealerRfqClient } from "@/components/dealer/DealerRfqClient";
import { PortalShell } from "@/components/PortalShell";
import { requireDealer } from "@/lib/dealerAuth";
import { getProducts } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { productForDealerGroup } from "@/lib/pricing";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

export default async function DealerRfqPage() {
  const dealer = await requireDealer();

  if (!dealer.priceGroup || !dealer.priceGroup.active) {
    redirect("/dealer/login");
  }

  const [products, rfqs] = await Promise.all([
    getProducts({
      includeProtected: true,
    }),

    prisma.rfq.findMany({
      where: {
        dealerId: dealer.id,
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

      orderBy: {
        createdAt: "desc",
      },

      take: 10,
    }),
  ]);

  const priceGroupSlug = dealer.priceGroup.slug;

  const dealerProducts = products.map((product) =>
    productForDealerGroup(product, priceGroupSlug),
  );

  return (
    <PortalShell title="RFQ Management">
      <section className="mb-6 rounded-xl border border-[#cfe9dd] bg-[#edf9f3] p-5">
        <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#0a7f55]">
          Request for quotation
        </div>

        <h2 className="mt-2 text-xl font-black">
          {dealer.companyName}
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#617b70]">
          Submit product and project requirements to the
          Dingsheng Energy commercial team. Submitted RFQs
          and their current review status appear below.
        </p>
      </section>

      <DealerRfqClient
        products={dealerProducts}
        priceGroupSlug={priceGroupSlug}
        priceGroupName={dealer.priceGroup.name}
        defaultCountry={dealer.country || ""}
      />

      <section className="mt-8">
        <div className="eyebrow">RFQ history</div>

        <h2 className="mt-2 text-2xl font-black">
          Submitted requests
        </h2>

        {!rfqs.length ? (
          <div className="card mt-5 p-8 text-center text-sm text-[#71838b]">
            No RFQs have been submitted yet.
          </div>
        ) : (
          <div className="card mt-5 overflow-hidden">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Project</th>
                    <th>Products</th>
                    <th>Required Date</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>

                <tbody>
                  {rfqs.map((rfq) => (
                    <tr key={rfq.id}>
                      <td className="font-black">
                        {rfq.reference}
                      </td>

                      <td>
                        {rfq.projectName ||
                          "General requirement"}
                      </td>

                      <td>
                        {rfq.items.length}

                        <div className="mt-1 text-[10px] text-[#82938c]">
                          {rfq.items
                            .slice(0, 2)
                            .map(
                              (item) =>
                                item.product.name,
                            )
                            .join(", ")}

                          {rfq.items.length > 2
                            ? ` +${
                                rfq.items.length - 2
                              } more`
                            : ""}
                        </div>
                      </td>

                      <td>
                        {rfq.requiredDate
                          ? rfq.requiredDate.toLocaleDateString()
                          : "Not specified"}
                      </td>

                      <td>
                        <span className="status">
                          {statusLabel(rfq.status)}
                        </span>
                      </td>

                      <td>
                        {rfq.createdAt.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </PortalShell>
  );
}