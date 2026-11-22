import Image from "@/components/ImageWithFallback";

type ResponsiveHeroMediaProps = {
  src: string;

  alt: string;

  priority?: boolean;

  position?:
    | "center"
    | "right";
};

export function ResponsiveHeroMedia({
  src,
  alt,
  priority = false,
  position = "center",
}: ResponsiveHeroMediaProps) {
  const positionClass =
    position === "right"
      ? "object-right"
      : "object-center";

  return (
    <Image
      src={src}
      fallbackSrc="/media/home/hero-home.jpg"
      alt={alt}
      fill
      priority={priority}
      sizes="100vw"
      className={`object-contain ${positionClass}`}
    />
  );
}