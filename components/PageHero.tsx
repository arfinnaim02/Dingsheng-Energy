import {
  ResponsiveHeroMedia,
} from "@/components/ResponsiveHeroMedia";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt?: string;

  imagePosition?:
    | "center"
    | "right";
};

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  imagePosition = "center",
}: PageHeroProps) {
  const alt =
    imageAlt || title;

  return (
    <section className="bg-[#061f2d] text-white">

      {/* ==============================
          DESKTOP
      ============================== */}
      <div className="relative hidden aspect-[16/9] w-full overflow-hidden lg:block">

        <ResponsiveHeroMedia
          src={image}
          alt={alt}
          priority
          position={imagePosition}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#061f2d]/94 via-[#061f2d]/58 to-[#061f2d]/5" />

        <div className="container-shell absolute inset-0 z-10 flex items-center">

          <div className="max-w-[720px]">

            <div className="hero-kicker">
              {eyebrow}
            </div>

            <h1 className="h1 mt-4 max-w-3xl">
              {title}
            </h1>

            <p className="mt-5 max-w-2xl text-[17px] leading-8 text-white/75">
              {description}
            </p>

          </div>

        </div>

      </div>


      {/* ==============================
          MOBILE / TABLET
      ============================== */}
      <div className="lg:hidden">

        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#061f2d]">

          <ResponsiveHeroMedia
            src={image}
            alt={alt}
            priority
            position="center"
          />

        </div>

        <div className="container-shell py-10">

          <div className="hero-kicker">
            {eyebrow}
          </div>

          <h1 className="mt-4 text-[38px] font-black leading-[1.02] tracking-[-.035em] sm:text-[48px]">
            {title}
          </h1>

          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-white/70 sm:text-base">
            {description}
          </p>

        </div>

      </div>

    </section>
  );
}