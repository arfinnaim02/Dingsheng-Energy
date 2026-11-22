"use client";

import Image from "next/image";
import { useState } from "react";

type SupplierLogo = {
  name: string;
  image: string;
};

export function TrustedSupplierMarquee({
  suppliers,
}: {
  suppliers: readonly SupplierLogo[];
}) {
  const [failedSources, setFailedSources] = useState<string[]>([]);

  // Filter both copies of a failed logo together. This prevents
  // empty cards appearing in the looping marquee.
  const visibleSuppliers = suppliers.filter(
    (supplier) => !failedSources.includes(supplier.image),
  );

  function hideBrokenLogo(src: string) {
    setFailedSources((current) =>
      current.includes(src) ? current : [...current, src],
    );
  }

  if (visibleSuppliers.length === 0) {
    return null;
  }

  return (
    <div className="supplier-marquee mt-8">
      <div className="supplier-marquee-track">
        {[0, 1].map((groupIndex) => (
          <div
            key={groupIndex}
            className="supplier-marquee-group"
            aria-hidden={groupIndex === 1 ? true : undefined}
          >
            {visibleSuppliers.map((supplier) => (
              <div
                key={`${groupIndex}-${supplier.image}`}
                className="supplier-logo-card"
              >
                <Image
                  src={supplier.image}
                  alt={groupIndex === 0 ? `${supplier.name} logo` : ""}
                  width={180}
                  height={80}
                  loading="eager"
                  unoptimized
                  className="supplier-logo-image"
                  onError={() => hideBrokenLogo(supplier.image)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
