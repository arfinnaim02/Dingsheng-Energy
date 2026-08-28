import Link from "next/link";
import { Brand } from "./Brand";
import { nav } from "@/data/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e5ece9] bg-white/95 backdrop-blur">
      <div className="container-shell flex h-[76px] items-center justify-between gap-6">
        <Brand />
        <nav className="hidden lg:flex items-center gap-6 text-[13px] font-bold text-[#2d444e]">
          {nav.map((item) => <Link key={item.href} href={item.href} className="hover:text-[#0a9c63] transition-colors">{item.label}</Link>)}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <Link className="btn btn-secondary" href="/dealer/login">Dealer Login</Link>
          <Link className="btn btn-gold" href="/contact#rfq">Request Quote →</Link>
        </div>
        <details className="lg:hidden relative">
          <summary className="cursor-pointer list-none rounded border border-[#d7e4df] px-3 py-2 text-sm font-bold">Menu</summary>
          <div className="absolute right-0 top-12 w-[260px] rounded-xl border border-[#dce7e2] bg-white p-4 shadow-2xl">
            <div className="grid gap-2">
              {nav.map((item) => <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm font-bold hover:bg-[#edf7f2]">{item.label}</Link>)}
              <Link className="btn btn-primary mt-2" href="/dealer/login">Dealer Login</Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
