import Link from "next/link";

import { PortalShell } from "@/components/PortalShell";
import { getCategories, getDealerPortalSettings, getPriceGroups, getProducts, getServices, readCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [catalog, categories, products, services, priceGroups, dealerPortal] = await Promise.all([
    readCatalog(),
    getCategories(),
    getProducts({ activeOnly: false, includeProtected: true }),
    getServices({ activeOnly: false }),
    getPriceGroups(),
    getDealerPortalSettings(),
  ]);
  const activeProducts = products.filter((item) => item.active !== false).length;
  const featured = products.filter((item) => item.featured).length;
  const activeServices = services.filter((item) => item.active !== false).length;
  const pricedProducts = products.filter((item) => item.dealerPrices?.some((price) => price.priceGroupSlug === dealerPortal.demoPriceGroupSlug && typeof price.amount === "number")).length;

  return <PortalShell admin title="Admin Dashboard">
    <div className="grid-4">{[
      ["Products", String(products.length), `${activeProducts} public`],
      ["Product Systems", String(categories.length), "Editable categories"],
      ["Services", String(services.length), `${activeServices} public`],
      ["Dealer Pricing", `${pricedProducts}/${products.length}`, `${priceGroups.length} price groups`],
    ].map(([title,value,copy])=><div className="card p-6" key={title}><div className="text-xs font-black uppercase tracking-[.08em] text-[#71838b]">{title}</div><div className="mt-3 text-3xl font-black text-[#0a9c63]">{value}</div><div className="mt-1 text-xs text-[#71838b]">{copy}</div></div>)}</div>

    <div className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div className="card p-6"><div className="flex items-center justify-between gap-4"><div><div className="eyebrow">Content Operations</div><h2 className="mt-2 text-xl font-black">Manage the live local catalogue</h2></div><span className="status">Last updated {new Date(catalog.updatedAt).toLocaleString()}</span></div><div className="mt-6 grid gap-4 md:grid-cols-3"><Link href="/admin/products/new" className="rounded-xl border border-[#dfe8e4] bg-[#f8fbf9] p-5 transition hover:border-[#0a9c63]"><strong className="block">Add Product</strong><span className="mt-2 block text-xs leading-5 text-[#71838b]">Create technical records, specifications and commercial settings.</span></Link><Link href="/admin/services/new" className="rounded-xl border border-[#dfe8e4] bg-[#f8fbf9] p-5 transition hover:border-[#0a9c63]"><strong className="block">Add Service</strong><span className="mt-2 block text-xs leading-5 text-[#71838b]">Add or update Dingsheng engineering services.</span></Link><Link href="/admin/pricing" className="rounded-xl border border-[#dfe8e4] bg-[#f8fbf9] p-5 transition hover:border-[#0a9c63]"><strong className="block">Dealer Pricing</strong><span className="mt-2 block text-xs leading-5 text-[#71838b]">Manage price groups, unit prices, MOQ, lead time and local dealer profile.</span></Link></div></div>
      <div className="card p-6"><div className="eyebrow">Backend Roadmap</div><h2 className="mt-2 text-xl font-black">Prepared for MySQL</h2><div className="mt-5 grid gap-3 text-sm">{["Local JSON content persistence: active","Product/service admin CRUD: active","Protected dealer pricing & price groups: active","Local cart / RFQ / checkout calculations: active","Production authentication & MySQL transactions: next phase"].map((item)=><div className="rounded-md border border-[#e1ebe7] p-3" key={item}>{item}</div>)}</div></div>
    </div>
  </PortalShell>;
}
