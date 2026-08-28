import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import { DealerProductActions } from "@/components/dealer/DealerProductActions";
import { Icon } from "@/components/Icon";
import { PortalShell } from "@/components/PortalShell";
import { ProductGallery } from "@/components/ProductGallery";
import { requireDealer } from "@/lib/dealerAuth";
import { getProduct } from "@/lib/catalog";
import {
  canRequestQuote,
  formatMoney,
  getDealerPrice,
  productForDealerGroup,
} from "@/lib/pricing";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    product: string;
  }>;
};

function commercialModeLabel(mode: string) {
  switch (mode) {
    case "rfq":
      return "RFQ Available";

    case "dealer-purchase":
      return "Dealer Purchase";

    case "dealer-purchase-rfq":
      return "Dealer Purchase + RFQ";

    default:
      return "Information Only";
  }
}

export default async function DealerProductDetailPage({
  params,
}: PageProps) {
  const dealer = await requireDealer();

  if (!dealer.priceGroup || !dealer.priceGroup.active) {
    redirect("/dealer/login");
  }

  const { product: slug } = await params;

  const product = await getProduct(slug, {
    includeProtected: true,
  });

  if (!product || product.active === false) {
    notFound();
  }

  const priceGroupSlug = dealer.priceGroup.slug;
  const priceGroupName = dealer.priceGroup.name;

  /*
   * Strip every other dealer price group before the product
   * is passed into client-side components.
   */
  const dealerProduct = productForDealerGroup(
    product,
    priceGroupSlug,
  );

  const price = getDealerPrice(
    dealerProduct,
    priceGroupSlug,
  );

  const priceConfigured =
    typeof price?.amount === "number" &&
    Number.isFinite(price.amount);

  /*
   * Every product with an approved dealer price can be added
   * to the cart. Products without an approved price continue
   * through the RFQ workflow.
   */
  const canPurchase = priceConfigured;

  const canRfq =
    canRequestQuote(dealerProduct) || !priceConfigured;

  return (
    <PortalShell title={dealerProduct.name}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dealer/products"
          className="text-xs font-black text-[#0a9c63]"
        >
          ← Back to Dealer Products
        </Link>

        <div className="rounded-full bg-[#e7f7ef] px-4 py-2 text-[10px] font-black uppercase tracking-[.08em] text-[#087a50]">
          {priceGroupName} Pricing
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <ProductGallery product={dealerProduct} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">
              {dealerProduct.eyebrow}
            </span>

            {dealerProduct.sku && (
              <span className="rounded-full bg-[#f1f5f3] px-3 py-1 text-[10px] font-black uppercase text-[#647982]">
                SKU {dealerProduct.sku}
              </span>
            )}
          </div>

          <h2 className="mt-2 text-3xl font-black">
            {dealerProduct.name}
          </h2>

          <p className="mt-4 text-sm leading-7 text-[#657983]">
            {dealerProduct.summary}
          </p>

          {dealerProduct.description &&
            dealerProduct.description !==
              dealerProduct.summary && (
              <p className="mt-3 text-xs leading-6 text-[#71838b]">
                {dealerProduct.description}
              </p>
            )}

          <div className="mt-6 overflow-hidden rounded-xl border border-[#b9dfcc] bg-white shadow-[0_10px_35px_rgba(7,31,44,.06)]">
            <div className="flex items-center justify-between gap-4 border-b border-[#d7ebe1] bg-[#edf9f3] px-6 py-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#0a7f55]">
                  Protected Dealer Pricing
                </div>

                <div className="mt-1 text-xs font-bold text-[#5e786e]">
                  {priceGroupName} price group
                </div>
              </div>

              <Icon
                name="lock"
                className="h-5 w-5 text-[#0a9c63]"
              />
            </div>

            <div className="p-6">
              {priceConfigured && price ? (
                <>
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#7a8d84]">
                        Unit Price
                      </div>

                      <div className="mt-1 text-4xl font-black tracking-[-.04em] text-[#08774f]">
                        {formatMoney(
                          price.amount as number,
                          price.currency,
                        )}
                      </div>

                      <div className="mt-1 text-xs font-bold text-[#71838b]">
                        per{" "}
                        {dealerProduct.unitLabel || "Unit"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-right">
                      <div className="rounded-lg bg-[#f7faf8] p-3">
                        <div className="text-[9px] font-black uppercase text-[#82938c]">
                          MOQ
                        </div>

                        <div className="mt-1 text-sm font-black">
                          {price.minimumQty ?? "—"}
                        </div>
                      </div>

                      <div className="rounded-lg bg-[#f7faf8] p-3">
                        <div className="text-[9px] font-black uppercase text-[#82938c]">
                          Lead Time
                        </div>

                        <div className="mt-1 text-sm font-black">
                          {price.leadTimeText || "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {price.note && (
                    <div className="mt-4 rounded-lg border border-[#dce9e3] bg-[#f8fbf9] p-4 text-xs leading-6 text-[#5e746b]">
                      {price.note}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-[#eadfbd] bg-[#fff9e9] p-5">
                  <div className="text-xl font-black text-[#8f6500]">
                    Price not configured
                  </div>

                  <p className="mt-2 text-xs leading-6 text-[#81765d]">
                    No approved price is currently available
                    for your {priceGroupName} account. This
                    product can still be submitted through the
                    RFQ workflow.
                  </p>
                </div>
              )}

              <div className="mt-5">
                <DealerProductActions
                  productSlug={dealerProduct.slug}
                  canPurchase={canPurchase}
                  canRfq={canRfq}
                  priceConfigured={priceConfigured}
                  minimumQty={price?.minimumQty ?? 1}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#dfe8e4] bg-white p-5">
              <div className="text-[10px] font-black uppercase text-[#71838b]">
                Availability
              </div>

              <div className="mt-2 text-sm font-black">
                {dealerProduct.availability ||
                  "Contact Dingsheng"}
              </div>
            </div>

            <div className="rounded-xl border border-[#dfe8e4] bg-white p-5">
              <div className="text-[10px] font-black uppercase text-[#71838b]">
                Commercial Mode
              </div>

              <div className="mt-2 text-sm font-black">
                {commercialModeLabel(
                  dealerProduct.commercialMode,
                )}
              </div>
            </div>
          </div>

          {dealerProduct.dealerCommercialDetails && (
            <div className="mt-5 rounded-xl border border-[#dfe8e4] bg-[#f8fbf9] p-5">
              <div className="text-[10px] font-black uppercase tracking-[.08em] text-[#0a9c63]">
                Dealer Commercial Details
              </div>

              <p className="mt-3 whitespace-pre-line text-xs leading-6 text-[#5e746b]">
                {dealerProduct.dealerCommercialDetails}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="card p-6">
          <h3 className="text-lg font-black">
            Technical Specifications
          </h3>

          {dealerProduct.specs.length ? (
            <div className="table-wrap mt-5">
              <table>
                <tbody>
                  {dealerProduct.specs.map(
                    ([label, value]) => (
                      <tr key={`${label}-${value}`}>
                        <td className="font-bold">
                          {label}
                        </td>

                        <td>{value}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[#71838b]">
              No detailed specifications are currently
              available for this product.
            </p>
          )}
        </div>

        <div className="space-y-6">
          

          <div className="card p-6">
            <h3 className="text-lg font-black">
              Applications & Standards
            </h3>

            <div className="mt-4 flex flex-wrap gap-2">
              {dealerProduct.applications?.map((item) => (
                <span key={item} className="pill">
                  {item}
                </span>
              ))}
            </div>

            {dealerProduct.standards?.length ? (
              <div className="mt-5 border-t border-[#e5ece8] pt-4 text-xs leading-6 text-[#71838b]">
                Product references:{" "}
                <strong>
                  {dealerProduct.standards.join(" · ")}
                </strong>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}