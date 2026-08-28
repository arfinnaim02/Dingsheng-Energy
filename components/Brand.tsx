import Image from "next/image";
import Link from "next/link";

export function Brand({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 shrink-0">
      <Image src={inverse ? "/brand-logo-white.png" : "/brand-logo.png"} alt="Dingsheng Energy Limited logo" width={compact ? 38 : 48} height={compact ? 38 : 48} className="object-contain" />
      <span className="leading-none">
        <strong className={`block font-extrabold tracking-[-0.025em] ${compact ? "text-[13px]" : "text-[15px]"} ${inverse ? "text-white" : "text-[#0a9c63]"}`}>DINGSHENG</strong>
        <strong className={`block mt-1 ${compact ? "text-[9px]" : "text-[10px]"} tracking-[.13em] ${inverse ? "text-white/70" : "text-[#243c47]"}`}>ENERGY LIMITED</strong>
      </span>
    </Link>
  );
}
