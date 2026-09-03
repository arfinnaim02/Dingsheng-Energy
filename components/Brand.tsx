import Image from "next/image";
import Link from "next/link";

type BrandProps = {
  inverse?: boolean;
  compact?: boolean;
  href?: string;
  ariaLabel?: string;
};

export function Brand({
  inverse = false,
  compact = false,
  href = "/",
  ariaLabel = "Dingsheng Energy Limited home",
}: BrandProps) {
  const logoSize = compact
    ? 38
    : 48;

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="flex shrink-0 items-center gap-3"
    >
      <span
        className="relative block shrink-0"
        style={{
          width: logoSize,
          height: logoSize,
        }}
      >
        <Image
          src={
            inverse
              ? "/brand-logo-white.png"
              : "/brand-logo.png"
          }
          alt=""
          fill
          sizes={`${logoSize}px`}
          className="object-contain"
        />
      </span>

      <span className="min-w-0 leading-none">
        <strong
          className={`block font-extrabold tracking-[-0.025em] ${
            compact
              ? "text-[13px]"
              : "text-[15px]"
          } ${
            inverse
              ? "text-white"
              : "text-[#0a9c63]"
          }`}
        >
          DINGSHENG
        </strong>

        <strong
          className={`mt-1 block whitespace-nowrap tracking-[.13em] ${
            compact
              ? "text-[9px]"
              : "text-[10px]"
          } ${
            inverse
              ? "text-white/70"
              : "text-[#243c47]"
          }`}
        >
          ENERGY LIMITED
        </strong>
      </span>
    </Link>
  );
}