import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicShell } from "@/components/PublicShell";
import { Icon } from "@/components/Icon";
import { Callout } from "@/components/Callout";
import { getService, getServices } from "@/lib/catalog";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ service: string }> };

export async function generateMetadata({ params }: Props) {
  const { service: slug } = await params;
  const service = await getService(slug);
  return service ? { title: `${service.name} | Dingsheng Energy Limited`, description: service.summary } : { title: "Service | Dingsheng Energy" };
}

export default async function ServiceDetail({ params }: Props) {
  const { service: slug } = await params;
  const [service, allServices] = await Promise.all([getService(slug), getServices()]);
  if (!service || service.active === false) notFound();
  const related = allServices.filter((item) => item.slug !== service.slug).slice(0, 3);

  return <PublicShell>
    <section className="relative min-h-[470px] overflow-hidden bg-[#061f2d]"><Image src={service.heroImage || "/media/hero-services.jpg"} alt={service.name} fill priority className="object-cover"/><div className="absolute inset-0 bg-gradient-to-r from-[#061f2d]/96 via-[#061f2d]/76 to-[#061f2d]/18"/><div className="container-shell relative z-10 flex min-h-[470px] items-center py-20"><div className="max-w-3xl"><div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.17em] text-[#4ed7a1]"><span className="h-[2px] w-8 bg-[#4ed7a1]"/>Engineering Service</div><h1 className="mt-4 text-[44px] font-black leading-[1.03] tracking-[-.04em] text-white md:text-[58px]">{service.name}</h1><p className="mt-6 max-w-[670px] text-base leading-8 text-white/74">{service.summary}</p><div className="mt-8 flex flex-wrap gap-3"><Link href="#scope" className="btn btn-primary">Explore Scope →</Link><Link href="/contact#rfq" className="btn border border-white/35 text-white">Discuss This Project</Link></div></div></div></section>
    <div className="border-b border-[#e3ebe7] bg-white"><div className="container-shell flex min-h-[58px] items-center gap-2 text-xs font-semibold text-[#7b8d94]"><Link href="/">Home</Link><span>›</span><Link href="/services">Services</Link><span>›</span><span className="text-[#18313d]">{service.name}</span></div></div>

    <section id="scope" className="section bg-white"><div className="container-shell grid-2 items-center"><div><div className="eyebrow">Service Overview</div><h2 className="h2 mt-3">Structured for Safe, Reliable Project Delivery</h2><p className="mt-5 text-sm leading-8 text-[#687c85]">{service.description || service.summary}</p><div className="mt-8 grid gap-3">{service.scope.map((scope,i)=><div className="flex items-center gap-3 border-b border-[#e1e9e6] py-3" key={scope}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e9f7f0] text-xs font-black text-[#0a9c63]">{String(i+1).padStart(2,"0")}</span><strong className="text-sm">{scope}</strong></div>)}</div></div><div className="relative min-h-[520px] overflow-hidden rounded-2xl"><Image src={service.image || "/media/service-epc.jpg"} alt={service.name} fill className="object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-[#071f2c]/82 to-transparent"/><div className="absolute bottom-7 left-7 right-7 text-white"><div className="eyebrow !text-[#69dfb0]">Project Approach</div><h3 className="mt-2 text-2xl font-black">Engineering · Procurement · Installation · Testing · Commissioning</h3></div></div></div></section>

    {service.process?.length?<section className="section dark-section"><div className="container-shell"><div className="mx-auto max-w-3xl text-center"><div className="eyebrow !text-[#59dfa8]">Delivery Process</div><h2 className="h2 mt-3">A Controlled Path from Requirement to Handover</h2></div><div className="mt-11 grid gap-4 md:grid-cols-3 xl:grid-cols-6">{service.process.map((step,i)=><div key={step} className="border border-white/10 bg-white/[.04] p-5"><div className="text-3xl font-black text-[#59dfa8]/35">{String(i+1).padStart(2,"0")}</div><h3 className="mt-5 text-sm font-black">{step}</h3></div>)}</div></div></section>:null}

    <section className="section soft-section"><div className="container-shell grid gap-7 lg:grid-cols-[1.1fr_.9fr]"><div className="card p-7"><div className="eyebrow">Delivery Principles</div><h2 className="mt-3 text-2xl font-black">Designed for Operational Confidence</h2><div className="mt-7 grid gap-4 sm:grid-cols-2">{[["shield","Safety Focus"],["gear","Technical Engineering"],["check","Quality Control"],["wrench","After-Sales Support"]].map(([icon,title])=><div key={title} className="border border-[#e0e9e5] bg-[#fafcfb] p-5"><Icon name={icon as any} className="h-7 w-7 text-[#0a9c63]"/><h3 className="mt-4 text-sm font-black">{title}</h3></div>)}</div></div><div className="card p-7"><div className="eyebrow">Applications</div><h2 className="mt-3 text-2xl font-black">Typical Project Applications</h2><div className="mt-6 flex flex-wrap gap-2">{(service.applications?.length?service.applications:["LPG Projects"]).map((application)=><span className="pill" key={application}>{application}</span>)}</div><div className="mt-7 rounded-lg bg-[#071f2c] p-5 text-white"><h3 className="font-black">Discuss your requirement</h3><p className="mt-2 text-xs leading-6 text-white/60">Share project location, operating conditions and available documents for technical review.</p><Link href="/contact#rfq" className="btn btn-primary mt-5">Request Consultation →</Link></div></div></div></section>

    <section className="section bg-white"><div className="container-shell"><div className="flex items-end justify-between gap-5"><div><div className="eyebrow">Related Services</div><h2 className="h2 mt-3">Explore More Capabilities</h2></div><Link href="/services" className="text-xs font-black uppercase text-[#0a9c63]">All Services →</Link></div><div className="mt-9 grid gap-5 md:grid-cols-3">{related.map((item)=><Link href={`/services/${item.slug}`} key={item.slug} className="card card-hover overflow-hidden"><div className="relative h-40"><Image src={item.image || "/media/service-epc.jpg"} alt={item.name} fill className="object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-[#071f2c]/70 to-transparent"/></div><div className="p-6"><h3 className="text-lg font-black">{item.name}</h3><p className="mt-2 text-xs leading-6 text-[#687c85]">{item.summary}</p><div className="mt-4 text-xs font-black text-[#0a9c63]">Learn more →</div></div></Link>)}</div><div className="mt-10"><Callout title={`Discuss ${service.name}`} copy="Share project location, operating requirement and available technical documents for review."/></div></div></section>
  </PublicShell>;
}
