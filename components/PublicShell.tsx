import {
  SiteHeader,
} from "./SiteHeader";

import {
  SiteFooter,
} from "./SiteFooter";

export function PublicShell({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />

      {children}

      <SiteFooter />

      {/* WhatsApp floating contact button */}
      <a
        href="https://wa.me/8613142550592?text=Hello%20Dingsheng%20Energy%2C%20I%20would%20like%20to%20know%20more%20about%20your%20products%20and%20services."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Dingsheng Energy on WhatsApp"
        title="Chat with us on WhatsApp"
        className="group fixed bottom-5 right-5 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-[#20bd5a] focus:outline-none focus:ring-4 focus:ring-[#25D366]/25 sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
      >
        <svg
          viewBox="0 0 32 32"
          aria-hidden="true"
          className="h-7 w-7 fill-current sm:h-8 sm:w-8"
        >
          <path d="M19.11 17.2c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.15-.42-2.19-1.35-.81-.72-1.36-1.61-1.52-1.88-.16-.27-.02-.42.12-.56.12-.12.27-.32.41-.47.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.47-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47h-.52c-.18 0-.47.07-.72.34-.25.27-.95.93-.95 2.27s.97 2.63 1.11 2.81c.14.18 1.91 2.92 4.63 4.09.65.28 1.15.45 1.54.57.65.21 1.24.18 1.71.11.52-.08 1.6-.65 1.83-1.29.23-.63.23-1.17.16-1.29-.07-.11-.25-.18-.52-.32Z" />

          <path d="M16.03 3C8.86 3 3.03 8.78 3.03 15.89c0 2.27.6 4.49 1.73 6.44L3 28.75l6.62-1.72a13.05 13.05 0 0 0 6.4 1.63h.01c7.17 0 13-5.78 13-12.89C29.03 8.78 23.2 3 16.03 3Zm0 23.48h-.01a10.84 10.84 0 0 1-5.53-1.5l-.4-.24-3.93 1.02 1.05-3.8-.26-.39a10.62 10.62 0 0 1-1.69-5.68c0-5.91 4.83-10.72 10.77-10.72 5.94 0 10.77 4.81 10.77 10.72 0 5.79-4.83 10.59-10.77 10.59Z" />
        </svg>

        <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-md bg-[#071f2c] px-3 py-2 text-[11px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 sm:block">
          Chat on WhatsApp
        </span>
      </a>
    </>
  );
}