import Image from "next/image";

export function PageHero({ eyebrow, title, description, image }: { eyebrow: string; title: string; description: string; image: string }) {
  return (
    <section className="page-hero">
      <Image src={image} alt="" fill priority className="hero-media" />
      <div className="container-shell page-hero-content">
        <div className="hero-kicker">{eyebrow}</div>
        <h1 className="h1 mt-4 max-w-3xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-7 text-white/75">{description}</p>
      </div>
    </section>
  );
}
