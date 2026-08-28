import Image from "next/image";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/PublicShell";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { Callout } from "@/components/Callout";
import { industries } from "@/data/site";

export default async function IndustryDetail({params}:{params:Promise<{industry:string}>}){const {industry:slug}=await params;const item=industries.find(i=>i[0]===slug);if(!item)notFound();const [,name,copy]=item;return <PublicShell><PageHero eyebrow="Industry solution" title={name} description={copy} image={slug==='pharmaceutical'?'/media/industry-pharma.jpg':'/media/hero-products.jpg'}/>
<section className="section"><div className="container-shell grid-2 items-center"><div><SectionHeading eyebrow="Application approach" title={`LPG systems for ${name}`} copy="System configuration should be engineered around actual load, operating pressure, storage requirement, site layout, applicable standards and safety requirements."/><div className="mt-7 grid grid-cols-2 gap-3">{["Storage Systems","Vaporizers / Pumps","Pressure Regulation","Piping & Fittings","Instrumentation","Safety Systems"].map(x=><div className="card p-4 text-sm font-extrabold" key={x}>{x}</div>)}</div></div><div className="relative min-h-[460px] overflow-hidden rounded-2xl"><Image src={slug==='pharmaceutical'?'/media/industry-pharma.jpg':'/media/service-epc.jpg'} alt={name} fill className="object-cover"/></div></div></section><section className="section-sm soft-section"><div className="container-shell"><Callout title={`Discuss your ${name} requirement`} /></div></section></PublicShell>}
