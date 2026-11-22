"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

type ImageWithFallbackProps = ImageProps & {
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK = "/media/image-unavailable.svg";

/**
 * Keep public pages usable when an admin-managed URL becomes
 * unavailable (missing Cloudinary asset, temporary CDN error,
 * or an unsupported external image host).
 *
 * This does not replace or alter the saved image URL. Admins
 * can re-upload the original image to repair the actual asset.
 */
export default function ImageWithFallback({
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  onError,
  unoptimized,
  ...props
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const displaySrc = failed ? fallbackSrc : src;

  // Bypass Next's host allowlist only for non-Cloudinary URLs.
  // An external admin-supplied URL should not crash the page.
  const isOtherRemoteSource =
    typeof displaySrc === "string" &&
    /^https?:\/\//i.test(displaySrc) &&
    !/^https:\/\/res\.cloudinary\.com\//i.test(displaySrc);

  return (
    <Image
      {...props}
      src={displaySrc}
      unoptimized={unoptimized ?? isOtherRemoteSource}
      onError={(event) => {
        if (!failed) {
          setFailed(true);
        }

        onError?.(event);
      }}
    />
  );
}
