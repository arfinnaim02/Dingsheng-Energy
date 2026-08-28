export function SectionHeading({ eyebrow, title, copy, center = false }: { eyebrow?: string; title: string; copy?: string; center?: boolean }) {
  return <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2 className="h2 mt-3">{title}</h2>{copy && <p className="lead mt-4">{copy}</p>}</div>;
}
