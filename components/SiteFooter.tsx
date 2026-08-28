import Link from "next/link";
import { Brand } from "./Brand";
import { company } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="bg-[#071f2c] text-white">
      <div className="container-shell py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Brand inverse />
          <p className="mt-5 max-w-xs text-sm leading-7 text-white/65">{company.tagline}</p>
        </div>
        <div>
          <strong className="text-sm">Quick Links</strong>
          <div className="mt-4 grid gap-2 text-sm text-white/65">
            <Link href="/about">About Us</Link><Link href="/products">Products</Link><Link href="/services">Services</Link><Link href="/lpg-trading">LPG Trading</Link><Link href="/industries">Industries</Link>
          </div>
        </div>
        <div>
          <strong className="text-sm">Dealer</strong>
          <div className="mt-4 grid gap-2 text-sm text-white/65">
            <Link href="/dealer/login">Dealer Login</Link><Link href="/dealer/apply">Apply for Access</Link><Link href="/dealer/rfq">RFQ Portal</Link><Link href="/resources">Resources</Link>
          </div>
        </div>
        <div>
          <strong className="text-sm">Contact</strong>
          <div className="mt-4 grid gap-2 text-sm leading-6 text-white/65">
            <span>{company.phone}</span><span>{company.email}</span><span>{company.address}</span>
          </div>
        </div>
      </div>
      <div className="container-shell flex flex-col md:flex-row gap-3 justify-between border-t border-white/10 py-5 text-xs text-white/45">
        <span>© 2026 Dingsheng Energy Limited. All rights reserved.</span>
        <span><Link href="/legal/privacy">Privacy Policy</Link> &nbsp; · &nbsp; <Link href="/legal/terms">Terms & Conditions</Link></span>
      </div>
    </footer>
  );
}
