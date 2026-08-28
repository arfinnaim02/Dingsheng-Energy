import Link from "next/link";

export function Callout({ title = "Need help with your LPG requirement?", copy = "Share your requirement and our team can help identify the right equipment, engineering or trading solution." }: { title?: string; copy?: string }) {
  return <div className="rounded-xl bg-[#082634] p-7 text-white md:flex md:items-center md:justify-between md:gap-8"><div><h3 className="text-2xl font-extrabold">{title}</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">{copy}</p></div><div className="mt-5 flex flex-wrap gap-3 md:mt-0"><Link href="/contact#rfq" className="btn btn-primary">Request a Quote →</Link><Link href="/contact" className="btn border border-white/30 text-white">Contact Our Team</Link></div></div>;
}
