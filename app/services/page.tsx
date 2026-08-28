import Image from "next/image";
import Link from "next/link";

import { PublicShell } from "@/components/PublicShell";
import { Icon } from "@/components/Icon";
import { Callout } from "@/components/Callout";
import { getServices } from "@/lib/catalog";

export const metadata = {
  title: "Services | Dingsheng Energy Limited",
  description: "LPG engineering, EPC, autogas, reticulation, consultancy and machinery servicing from Dingsheng Energy Limited.",
};
export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await getServices();

  return <PublicShell>
    <section className="relative min-h-[455px] overflow-hidden bg-[#061f2d]">
      <Image src="/media/hero-services.jpg" alt="Dingsheng Energy engineering services" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#061f2d]/96 via-[#061f2d]/73 to-[#061f2d]/22" />
      <div className="container-shell relative z-10 flex min-h-[455px] items-center py-20"><div className="max-w-3xl"><div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.17em] text-[#4ed7a1]"><span className="h-[2px] w-8 bg-[#4ed7a1]"/>Engineering Excellence · Complete Solutions</div><h1 className="mt-4 text-[50px] font-black tracking-[-.04em] text-white md:text-[64px]">Our Services</h1><p className="mt-6 max-w-[660px] text-base leading-8 text-white/74">From concept to commissioning, Dingsheng Energy delivers integrated LPG engineering and technical services for safe, efficient and reliable operation.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="#services" className="btn btn-primary">Explore Services →</Link><Link href="/contact#rfq" className="btn border border-white/35 text-white">Discuss a Project</Link></div></div></div>
    </section>

    <section className="section bg-white"><div className="container-shell"><div className="mx-auto max-w-3xl text-center"><div className="eyebrow">What We Do</div><h2 className="h2 mt-3">Comprehensive LPG Engineering & Technical Services</h2><p className="mt-4 text-sm leading-7 text-[#687b84]">Project support spans engineering, procurement, installation, commissioning, reticulation, consultancy and machinery servicing.</p></div><div id="services" className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{services.map((service,i)=><Link href={`/services/${service.slug}`} key={service.slug} className="group overflow-hidden rounded-xl border border-[#dfe8e4] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="relative h-[190px] overflow-hidden"><Image src={service.image || "/media/service-epc.jpg"} alt={service.name} fill className="object-cover transition duration-500 group-hover:scale-[1.04]"/><div className="absolute inset-0 bg-gradient-to-t from-[#071f2c]/80 via-[#071f2c]/10 to-transparent"/><div className="absolute bottom-4 left-5 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-[#0a9c63] text-xs font-black text-white">{String(i+1).padStart(2,"0")}</div></div><div className="p-6"><h3 className="text-xl font-black">{service.name}</h3><p className="mt-3 min-h-[72px] text-sm leading-6 text-[#657983]">{service.summary}</p><div className="mt-5 grid grid-cols-2 gap-2">{service.scope.slice(0,4).map((scope)=><div key={scope} className="flex items-center gap-2 text-[10px] font-bold text-[#5d746e]"><span className="h-1.5 w-1.5 rounded-full bg-[#0a9c63]"/>{scope}</div>)}</div><div className="mt-6 text-xs font-black text-[#0a9c63]">Explore service →</div></div></Link>)}</div></div></section>

    <section className="section dark-section"><div className="container-shell"><div className="mx-auto max-w-3xl text-center"><div className="eyebrow !text-[#59dfa8]">Delivery Model</div><h2 className="h2 mt-3">From Requirement Review to Operational Handover</h2></div><div className="mt-11 grid gap-0 md:grid-cols-6">{["Requirement Review","Engineering","Procurement","Installation","Testing","Commissioning"].map((step,i)=><div key={step} className="relative border border-white/10 p-5 text-center md:border-r-0 last:border-r"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#0a9c63] text-xs font-black">{String(i+1).padStart(2,"0")}</div><div className="mt-4 text-xs font-black uppercase tracking-wide">{step}</div></div>)}</div></div></section>

    <section className="section soft-section"><div className="container-shell"><div className="grid-4">{[
      ["gear","End-to-End Solutions","Engineering and procurement through testing and commissioning."],
      ["shield","Safety & Compliance","Design decisions aligned to applicable standards and project requirements."],
      ["user","Engineering Support","Technical support for equipment selection and project delivery."],
      ["wrench","After-Sales Support","Inspection, maintenance, troubleshooting and servicing."],
    ].map(([icon,title,copy])=><div className="card p-6" key={title}><Icon name={icon as any} className="h-8 w-8 text-[#0a9c63]"/><h3 className="mt-4 font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-[#657983]">{copy}</p></div>)}</div><div className="mt-10"><Callout title="Have an LPG Project in Mind?" copy="Share your project location, operating requirement and technical documents for Dingsheng review."/></div></div></section>
  </PublicShell>;
}
