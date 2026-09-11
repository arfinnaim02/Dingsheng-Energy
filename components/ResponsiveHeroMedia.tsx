import Image from "next/image";

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
      alt={alt}
      fill
      priority={priority}
      sizes="100vw"
      className={`object-contain ${positionClass}`}
    />
  );
}