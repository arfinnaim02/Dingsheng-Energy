import Image from "next/image";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt?: string;
  imagePosition?: "center" | "right";
};

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  imagePosition = "center",
}: PageHeroProps) {
  const positionClass =
    imagePosition === "right"
      ? "object-[68%_center] md:object-center"
      : "object-center";

  return (
    <section className="page-hero">
      <Image
        src={image}
        alt={imageAlt || title}
        fill
        priority
        sizes="100vw"
        className={`hero-media object-cover ${positionClass}`}
      />

      <div className="container-shell page-hero-content">
        <div className="hero-kicker">
          {eyebrow}
        </div>

        <h1 className="h1 mt-4 max-w-3xl">
          {title}
        </h1>

        <p className="mt-5 max-w-2xl text-[15px] leading-7 text-white/75 sm:text-base md:text-[17px]">
          {description}
        </p>
      </div>
    </section>
  );
}