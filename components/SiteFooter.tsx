import Link from "next/link";

import { Brand } from "./Brand";
import { company } from "@/data/site";

function FacebookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="currentColor"
    >
      <path d="M13.5 22v-9h3l.45-3.5H13.5V7.26c0-1.01.28-1.7 1.74-1.7H17.1V2.43c-.32-.04-1.42-.13-2.7-.13-2.67 0-4.5 1.63-4.5 4.62V9.5H7v3.5h2.9v9h3.6Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="currentColor"
    >
      <path d="M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2Zm0 2A3.75 3.75 0 0 0 4 7.75v8.5A3.75 3.75 0 0 0 7.75 20h8.5A3.75 3.75 0 0 0 20 16.25v-8.5A3.75 3.75 0 0 0 16.25 4h-8.5ZM17.5 5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="currentColor"
    >
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.12C19.55 3.58 12 3.58 12 3.58s-7.55 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.07 0 12 0 12s0 3.93.5 5.8a3 3 0 0 0 2.1 2.12c1.85.5 9.4.5 9.4.5s7.55 0 9.4-.5a3 3 0 0 0 2.1-2.12c.5-1.87.5-5.8.5-5.8s0-3.93-.5-5.8ZM9.6 15.6V8.4L15.85 12 9.6 15.6Z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-[#071f2c] text-white">
      <div className="container-shell grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        {/* Company */}
        <div>
          <Brand inverse />

          <p className="mt-5 max-w-xs text-sm leading-7 text-white/65">
            {company.tagline}
          </p>

          {/* Social Media */}
          <div className="mt-6">
            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="Facebook"
                title="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <FacebookIcon />
              </a>

              <a
                href="#"
                aria-label="Instagram"
                title="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <InstagramIcon />
              </a>

              <a
                href="#"
                aria-label="YouTube"
                title="YouTube"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <YouTubeIcon />
              </a>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <strong className="text-sm">
            Quick Links
          </strong>

          <div className="mt-4 grid gap-2 text-sm text-white/65">
            <Link href="/about">
              About Us
            </Link>

            <Link href="/products">
              Products
            </Link>

            <Link href="/services">
              Services
            </Link>

            <Link href="/lpg-trading">
              Trading
            </Link>

            <Link href="/industries">
              Industries
            </Link>
          </div>
        </div>

        {/* Dealer */}
        <div>
          <strong className="text-sm">
            Dealer
          </strong>

          <div className="mt-4 grid gap-2 text-sm text-white/65">
            <Link href="/dealer/login">
              Dealer Login
            </Link>

            <Link href="/dealer/apply">
              Apply for Access
            </Link>

            <Link href="/dealer/rfq">
              RFQ Portal
            </Link>

            <Link href="/resources">
              Resources
            </Link>
          </div>
        </div>

        {/* Contact */}
        <div>
          <strong className="text-sm">
            Contact
          </strong>

          <div className="mt-4 grid gap-2 text-sm leading-6 text-white/65">
            <span>
              {company.phone}
            </span>

            <span>
              {company.email}
            </span>

            <span>
              {company.address}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="container-shell flex flex-col justify-between gap-3 border-t border-white/10 py-5 text-xs text-white/45 md:flex-row">
        <span>
          © 2026 Dingsheng Energy Limited. All rights reserved.
        </span>

        <span>
          <Link href="/legal/privacy">
            Privacy Policy
          </Link>

          {" "}
          &nbsp; · &nbsp;
          {" "}

          <Link href="/legal/terms">
            Terms & Conditions
          </Link>
        </span>
      </div>
    </footer>
  );
}