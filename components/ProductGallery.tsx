"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Icon } from "@/components/Icon";
import type { Product } from "@/data/site";

type Props = {
  product: Product;
};

function fallbackIcon(
  product: Product,
) {
  const value = [
    product.slug,
    product.name,
    product.subcategory,
  ]
    .join(" ")
    .toLowerCase();

  if (
    value.includes("tank") ||
    value.includes("vessel")
  ) {
    return "tank" as const;
  }

  if (
    value.includes("pump") ||
    value.includes("compressor")
  ) {
    return "pump" as const;
  }

  return "tools" as const;
}

export function ProductGallery({
  product,
}: Props) {
  const images = useMemo(
    () => [
      ...new Set(
        [
          product.image,
          ...(product.gallery ??
            []),
        ]
          .filter(
            (
              image,
            ): image is string =>
              typeof image ===
              "string",
          )
          .map((image) =>
            image.trim(),
          )
          .filter(Boolean),
      ),
    ],
    [
      product.image,
      product.gallery,
    ],
  );

  const [
    activeImage,
    setActiveImage,
  ] = useState(
    images[0] ?? "",
  );

  const [
    failedImages,
    setFailedImages,
  ] = useState<string[]>(
    [],
  );

  useEffect(() => {
    setActiveImage(
      images[0] ?? "",
    );

    setFailedImages([]);
  }, [
    product.slug,
    images,
  ]);

  const activeIndex =
    images.indexOf(
      activeImage,
    );

  const activeImageFailed =
    !activeImage ||
    failedImages.includes(
      activeImage,
    );

  function markFailed(
    source: string,
  ) {
    if (!source) {
      return;
    }

    setFailedImages(
      (current) =>
        current.includes(
          source,
        )
          ? current
          : [
              ...current,
              source,
            ],
    );
  }

  return (
    <div className="min-w-0">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#dfe8e4] bg-gradient-to-br from-white via-[#fbfdfc] to-[#edf5f1]">
        {!activeImageFailed ? (
          <Image
            key={activeImage}
            src={activeImage}
            alt={product.name}
            fill
            priority
            sizes="
              (max-width: 639px) calc(100vw - 32px),
              (max-width: 1023px) calc(100vw - 48px),
              52vw
            "
            className="object-contain p-6 sm:p-9 md:p-12 lg:p-14"
            onError={() =>
              markFailed(
                activeImage,
              )
            }
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#d7e6df] bg-white shadow-sm sm:h-32 sm:w-32">
              <Icon
                name={fallbackIcon(
                  product,
                )}
                className="h-11 w-11 text-[#0a9c63] sm:h-14 sm:w-14"
              />
            </div>

            <div className="mt-5 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#8ca098] sm:text-[11px]">
              Product Image Pending
            </div>
          </div>
        )}

        {(product.eyebrow ||
          product.subcategory) && (
          <div className="absolute left-3 top-3 z-20 max-w-[calc(100%-24px)] truncate rounded-full border border-[#d8e7df] bg-white/95 px-3 py-1.5 text-[8px] font-extrabold uppercase tracking-[.1em] text-[#557068] shadow-sm backdrop-blur sm:left-5 sm:top-5 sm:text-[9px] sm:tracking-[.12em]">
            {product.eyebrow ||
              product.subcategory}
          </div>
        )}

        <div className="absolute bottom-3 left-3 z-20 max-w-[65%] text-[8px] font-extrabold uppercase tracking-[.1em] text-[#84978f] sm:bottom-5 sm:left-5 sm:text-[9px] sm:tracking-[.16em]">
          Dingsheng Energy Equipment
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 z-20 rounded-full border border-[#d8e7df] bg-white/95 px-3 py-1 text-[8px] font-black text-[#557068] shadow-sm backdrop-blur sm:bottom-5 sm:right-5 sm:text-[9px]">
            {Math.max(
              activeIndex +
                1,
              1,
            )}{" "}
            / {images.length}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div
          className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]"
          aria-label="Product image gallery"
        >
          {images.map(
            (
              image,
              index,
            ) => {
              const selected =
                activeImage ===
                image;

              const failed =
                failedImages.includes(
                  image,
                );

              return (
                <button
                  type="button"
                  key={image}
                  onClick={() =>
                    setActiveImage(
                      image,
                    )
                  }
                  aria-label={`View ${product.name} image ${
                    index + 1
                  }`}
                  aria-pressed={
                    selected
                  }
                  className={`
                    relative
                    aspect-square
                    w-[74px]
                    shrink-0
                    snap-start
                    overflow-hidden
                    rounded-lg
                    border
                    bg-gradient-to-br
                    from-white
                    to-[#f4f8f6]
                    transition
                    sm:w-[82px]
                    ${
                      selected
                        ? "border-[#0a9c63] ring-2 ring-[#0a9c63]/20"
                        : "border-[#dfe8e4] hover:border-[#70b997]"
                    }
                  `}
                >
                  {failed ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon
                        name="box"
                        className="h-5 w-5 text-[#8fa199]"
                      />
                    </div>
                  ) : (
                    <Image
                      src={image}
                      alt={`${product.name} view ${
                        index + 1
                      }`}
                      fill
                      sizes="82px"
                      className="object-contain p-2"
                      onError={() =>
                        markFailed(
                          image,
                        )
                      }
                    />
                  )}

                  <span
                    className={`
                      absolute
                      bottom-1
                      right-1
                      flex
                      h-4
                      min-w-4
                      items-center
                      justify-center
                      rounded-full
                      px-1
                      text-[8px]
                      font-black
                      ${
                        selected
                          ? "bg-[#0a9c63] text-white"
                          : "bg-[#071f2c]/75 text-white"
                      }
                    `}
                  >
                    {index + 1}
                  </span>
                </button>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}