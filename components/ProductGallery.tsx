"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { Icon } from "@/components/Icon";
import type { Product } from "@/data/site";

export function ProductGallery({ product }: { product: Product }) {
  const images = useMemo(() => [...new Set([product.image, ...(product.gallery ?? [])].filter(Boolean))], [product.image, product.gallery]);
  const [activeImage, setActiveImage] = useState(images[0] ?? "");
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const failed = !activeImage || failedImages.includes(activeImage);

  function markFailed(src: string) {
    setFailedImages((current) => current.includes(src) ? current : [...current, src]);
  }

  return <div>
    <div className="relative min-h-[500px] overflow-hidden rounded-xl border border-[#dfe8e4] bg-gradient-to-br from-white via-[#fbfdfc] to-[#edf5f1] lg:min-h-[570px]">
      {!failed ? <Image src={activeImage} alt={product.name} fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-contain p-10 md:p-14" onError={() => markFailed(activeImage)} /> : <div className="absolute inset-0 flex flex-col items-center justify-center"><div className="flex h-32 w-32 items-center justify-center rounded-full border border-[#d7e6df] bg-white shadow-sm"><Icon name={product.slug.includes("tank") ? "tank" : product.slug.includes("pump") ? "pump" : "tools"} className="h-14 w-14 text-[#0a9c63]" /></div><div className="mt-5 text-[11px] font-extrabold uppercase tracking-[.15em] text-[#8ca098]">Product Image Pending</div></div>}
      <div className="absolute left-5 top-5 rounded-full border border-[#d8e7df] bg-white/95 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#557068] shadow-sm backdrop-blur">{product.eyebrow}</div>
      <div className="absolute bottom-5 left-5 text-[9px] font-extrabold uppercase tracking-[.16em] text-[#84978f]">Dingsheng Energy Equipment</div>
    </div>
    {images.length > 1 && <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">{images.map((image) => <button type="button" key={image} onClick={() => setActiveImage(image)} className={`relative h-[82px] overflow-hidden rounded-lg border bg-white transition ${activeImage === image ? "border-[#0a9c63] ring-1 ring-[#0a9c63]" : "border-[#dfe8e4] hover:border-[#8cc8ad]"}`}>{failedImages.includes(image) ? <div className="absolute inset-0 flex items-center justify-center"><Icon name="box" className="h-5 w-5 text-[#8fa199]" /></div> : <Image src={image} alt={product.name} fill sizes="100px" className="object-contain p-2" onError={() => markFailed(image)} />}</button>)}</div>}
  </div>;
}
