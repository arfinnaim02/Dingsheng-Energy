import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { Callout } from "@/components/Callout";
import { industries } from "@/data/site";

export const metadata={title:"Industries"};
export default function IndustriesPage(){return <PublicShell><PageHero eyebrow="Industries we serve" title="LPG Solutions Across Diverse Industries" description="Equipment, trading and engineering support for LPG bottling, storage, industrial, commercial and infrastructure applications." image="/media/hero-products.jpg"/>
<section className="section"><div className="container-shell"><SectionHeading center eyebrow="Industry solutions" title="Designed around application requirements" copy="Each industry has different storage, pressure control, transfer, safety and operating needs. Our platform organizes relevant products and services around those requirements."/><div className="grid-4 mt-10">{industries.map(([slug,name,copy],i)=><Link href={`/industries/${slug}`} className="card card-hover p-6" key={slug}><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e9f7f0] text-sm font-extrabold text-[#0a9c63]">0{i+1}</div><h3 className="mt-5 text-lg font-extrabold">{name}</h3><p className="mt-3 text-sm leading-6 text-[#657983]">{copy}</p><div className="mt-5 text-xs font-extrabold text-[#0a9c63]">Explore industry →</div></Link>)}</div><div className="mt-10"><Callout title="Need an industry-specific LPG solution?"/></div></div></section></PublicShell>}
