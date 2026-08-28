import Image from "next/image";
import Link from "next/link";

import { PublicShell } from "@/components/PublicShell";
import { Icon } from "@/components/Icon";
import { ProductCard } from "@/components/ProductCard";
import { Callout } from "@/components/Callout";
import { coreValues, industries, suppliers } from "@/data/site";
import { getCategories, getProducts, getServices } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const coreSolutions = [
  ["globe", "LPG Trading & Logistics", "International sourcing, import/export, vessel chartering, port coordination and distribution.", "/lpg-trading"],
  ["gear", "Engineering & EPC", "Plant engineering, installation, testing, commissioning, reticulation and project support.", "/services"],
  ["box", "Equipment Supply", "Storage tanks, filling machinery, pumps, compressors, vaporizers, measuring equipment and accessories.", "/products"],
  ["wrench", "After-Sales Support", "Inspection, maintenance, troubleshooting, repair and servicing of LPG machinery.", "/services/machinery-servicing"],
] as const;

export default async function HomePage() {
  const [categories, products, services] = await Promise.all([
    getCategories(),
    getProducts({ featuredOnly: true }),
    getServices(),
  ]);

  return <PublicShell>
    <section className="relative min-h-[690px] overflow-hidden bg-[#061e2b] text-white">
      <Image src="/media/hero-home.jpg" alt="LPG industrial facility" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#061e2b]/96 via-[#061e2b]/76 to-[#061e2b]/18" />
      <div className="container-shell relative z-10 flex min-h-[690px] items-center pb-36 pt-24">
        <div className="max-w-[770px]">
          <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.18em] text-[#4dd8a1]"><span className="h-[2px] w-8 bg-[#4dd8a1]"/>Global LPG Trading, Engineering & Complete Energy Solutions</div>
          <h1 className="mt-5 text-[48px] font-black uppercase leading-[.98] tracking-[-.045em] sm:text-[60px] lg:text-[72px]">Complete Energy<br/>Solutions</h1>
          <p className="mt-7 max-w-[650px] text-[17px] leading-8 text-white/76">Reliable LPG trading, engineering, equipment supply and end-to-end project support for international and industrial energy markets.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/products" className="btn btn-primary">Explore Products →</Link><Link href="/services" className="btn border border-white/35 text-white">Our Services</Link></div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-20"><div className="container-shell"><div className="grid overflow-hidden border border-white/10 bg-[#071f2c]/92 backdrop-blur-md md:grid-cols-4">{[
        ["shield","Safety First","International standards & careful engineering"],
        ["globe","Global Supply","Trading and logistics across international markets"],
        ["gear","Engineering","End-to-end LPG project capability"],
        ["handshake","Trusted Partner","Long-term technical and commercial relationships"],
      ].map(([icon,title,copy])=><div key={title} className="flex min-h-[108px] items-start gap-4 border-white/10 px-6 py-6 md:border-r last:border-r-0"><Icon name={icon as any} className="h-7 w-7 shrink-0 text-[#49d89e]"/><div><strong className="text-sm">{title}</strong><span className="mt-1 block text-xs leading-5 text-white/52">{copy}</span></div></div>)}</div></div></div>
    </section>

    <section className="section bg-white"><div className="container-shell"><div className="mx-auto max-w-3xl text-center"><div className="eyebrow">Our Core Solutions</div><h2 className="h2 mt-3">Integrated Solutions Across the LPG Value Chain</h2><p className="mt-4 text-sm leading-7 text-[#687b84]">From trading and logistics to engineering, equipment supply and after-sales service, Dingsheng Energy supports the LPG value chain from sourcing to operation.</p></div><div className="grid-4 mt-10">{coreSolutions.map(([icon,title,copy,href],i)=><Link href={href} key={title} className="card card-hover relative min-h-[270px] p-6"><div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f6ef] text-[#0a9c63]"><Icon name={icon as any} className="h-6 w-6"/></div><span className="text-4xl font-black text-[#0a9c63]/10">0{i+1}</span></div><h3 className="h3 mt-5">{title}</h3><p className="mt-3 text-sm leading-6 text-[#647983]">{copy}</p><div className="absolute bottom-6 left-6 text-xs font-extrabold text-[#0a9c63]">Learn more →</div></Link>)}</div></div></section>

    <section className="section dark-section"><div className="container-shell"><div className="mx-auto max-w-3xl text-center"><div className="eyebrow !text-[#55dea8]">Product Solutions</div><h2 className="h2 mt-3">Equipment for Every LPG Application</h2><p className="mt-4 text-sm leading-7 text-white/60">Four integrated product systems organize equipment around real plant, transport, autogas and industrial requirements.</p></div><div className="grid-4 mt-10">{categories.map((category,i)=><Link key={category.slug} href={`/products/${category.slug}`} className="group overflow-hidden rounded-xl bg-white text-[#0c2230]"><div className="relative h-48 overflow-hidden"><Image src={category.image} alt={category.name} fill className="object-cover transition duration-500 group-hover:scale-[1.04]"/><div className="absolute inset-0 bg-gradient-to-t from-[#071f2c]/80 to-transparent"/><div className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-[#0a9c63] text-xs font-black text-white">0{i+1}</div></div><div className="p-6"><h3 className="text-xl font-black uppercase leading-tight">{category.name}</h3><p className="mt-3 text-sm leading-6 text-[#647983]">{category.summary}</p><div className="mt-5 text-xs font-extrabold text-[#0a9c63]">Explore products →</div></div></Link>)}</div></div></section>

    <section className="section soft-section"><div className="container-shell"><div className="flex flex-wrap items-end justify-between gap-5"><div><div className="eyebrow">Featured Equipment</div><h2 className="h2 mt-3">Selected Products</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#687b84]">Technical information is public while commercial pricing remains protected for approved dealers.</p></div><Link href="/products" className="btn btn-secondary">View All Products →</Link></div><div className="grid-4 mt-9">{products.slice(0,8).map((product)=><ProductCard key={product.slug} product={product}/>)}</div></div></section>

    <section className="section bg-white"><div className="container-shell grid-2 items-center"><div><div className="eyebrow">Engineering Services</div><h2 className="h2 mt-3">From Concept to Commissioning</h2><p className="lead mt-5">Dingsheng Energy provides engineering, procurement, installation, testing, commissioning, reticulation and servicing across LPG applications.</p><div className="mt-7 grid gap-3">{services.slice(0,5).map((service,i)=><Link key={service.slug} href={`/services/${service.slug}`} className="flex items-center justify-between border-b border-[#dce7e2] py-3 font-bold"><span><span className="mr-4 text-[#0a9c63]">0{i+1}</span>{service.name}</span><span>→</span></Link>)}</div></div><div className="relative min-h-[470px] overflow-hidden rounded-2xl"><Image src="/media/service-epc.jpg" alt="LPG engineering project" fill className="object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-[#071f2c]/80 to-transparent"/><div className="absolute bottom-7 left-7 right-7 text-white"><div className="eyebrow !text-[#69dfb0]">EPC Delivery Model</div><p className="mt-2 text-2xl font-black">Engineering · Procurement · Installation · Commissioning</p></div></div></div></section>

    <section className="section dark-section"><div className="container-shell grid-2 items-center"><div className="relative min-h-[430px] overflow-hidden rounded-2xl"><Image src="/media/trading-terminal.jpg" alt="LPG trading and terminal" fill className="object-cover"/></div><div><div className="eyebrow !text-[#5bdca8]">LPG Trading & Logistics</div><h2 className="h2 mt-3">Coordinated from Sourcing to Delivery</h2><p className="mt-5 text-lg leading-8 text-white/68">International LPG sourcing, import/export, vessel chartering, port coordination, loading, unloading and domestic distribution.</p><div className="mt-7 flex flex-wrap gap-2">{["Sourcing","Vessel Chartering","Port Coordination","Loading","Unloading","Final Delivery"].map((x)=><span className="pill !border-white/15 !bg-white/5 !text-white/75" key={x}>{x}</span>)}</div><Link href="/lpg-trading" className="btn btn-primary mt-8">Explore LPG Trading →</Link></div></div></section>

    <section className="section bg-white"><div className="container-shell"><div className="mx-auto max-w-3xl text-center"><div className="eyebrow">Industries We Serve</div><h2 className="h2 mt-3">Energy Solutions Across Critical Industries</h2></div><div className="mt-9 grid grid-cols-2 border-l border-t border-[#e0e9e5] sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">{industries.map(([slug,name])=><Link key={slug} href={`/industries/${slug}`} className="flex min-h-[125px] flex-col items-center justify-center border-b border-r border-[#e0e9e5] px-3 text-center transition hover:bg-[#f3faf6]"><Icon name="factory" className="h-7 w-7 text-[#0a9c63]"/><span className="mt-3 text-xs font-bold leading-5">{name}</span></Link>)}</div></div></section>

    <section className="section dark-section"><div className="container-shell grid-2 items-center"><div><div className="eyebrow !text-[#5bdca8]">Dealer Portal</div><h2 className="h2 mt-3">Commercial Access for Approved Dealers</h2><p className="mt-5 text-sm leading-7 text-white/62">Secure access to protected pricing, quotations, orders and technical resources.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/dealer/login" className="btn btn-primary">Dealer Login →</Link><Link href="/dealer/apply" className="btn border border-white/30 text-white">Apply for Access</Link></div></div><div className="grid grid-cols-2 gap-4">{[["lock","Dealer Pricing"],["file","RFQ & Quotations"],["truck","Order Tracking"],["download","Technical Resources"]].map(([icon,label])=><div key={label} className="rounded-xl border border-white/12 bg-white/5 p-5"><Icon name={icon as any} className="h-7 w-7 text-[#59dfa8]"/><strong className="mt-4 block">{label}</strong></div>)}</div></div></section>

    <section className="section soft-section"><div className="container-shell"><div className="mx-auto max-w-3xl text-center"><div className="eyebrow">Our Core Values</div><h2 className="h2 mt-3">Built on Safety, Reliability and Partnership</h2></div><div className="grid-3 mt-9">{coreValues.map(([title,copy])=><div className="card p-6" key={title}><h3 className="text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#657983]">{copy}</p></div>)}</div><div className="mt-12 text-center"><div className="eyebrow">Our Trusted Suppliers</div><div className="mt-7 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-extrabold text-[#52666f]">{suppliers.map((supplier)=><span key={supplier}>{supplier}</span>)}</div></div></div></section>
    <section className="section-sm bg-white"><div className="container-shell"><Callout title="Planning an LPG Project?" copy="Talk with Dingsheng about equipment, EPC, LPG trading or complete project requirements."/></div></section>
  </PublicShell>;
}
