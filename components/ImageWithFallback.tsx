"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

type ImageWithFallbackProps = ImageProps & {
  fallbackSrc?: string;
};

type ImageAttempt = "optimized" | "direct" | "fallback";

const DEFAULT_FALLBACK = "/media/image-unavailable.svg";

/**
 * First try normal Next.js image optimization. If the optimizer
 * fails for a remote image, retry its original URL directly.
 * Only show a local fallback when the source itself fails.
 *
 * This prevents broken public layouts while leaving the stored
 * Cloudinary URL untouched for an administrator to repair.
 */
export default function ImageWithFallback({
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  onError,
  unoptimized,
  ...props
}: ImageWithFallbackProps) {
  const [attempt, setAttempt] = useState<ImageAttempt>("optimized");

  useEffect(() => {
    setAttempt("optimized");
  }, [src]);

  const isHttpSource =
    typeof src === "string" && /^https?:\/\//i.test(src);

  const isCloudinary =
    typeof src === "string" &&
    /^https:\/\/res\.cloudinary\.com\//i.test(src);

  // Next.js only allows configured remote hosts. Load other
  // admin-provided URLs directly instead of crashing the page.
  const isOtherRemoteSource = isHttpSource && !isCloudinary;

  const displaySrc =
    attempt === "fallback" ? fallbackSrc : src;

  const loadDirectly =
    unoptimized === true ||
    isOtherRemoteSource ||
    attempt !== "optimized";

  return (
    <Image
      {...props}
      src={displaySrc}
      unoptimized={loadDirectly}
      onError={(event) => {
        if (
          attempt === "optimized" &&
          isHttpSource &&
          !loadDirectly
        ) {
          setAttempt("direct");
          return;
        }

        if (attempt !== "fallback") {
          setAttempt("fallback");
          onError?.(event);
        }
      }}
    />
  );
}
