type SectionHeadingProps = {
  description: string;
  eyebrow?: string;
  title: string;
};

export function SectionHeading({
  description,
  eyebrow,
  title,
}: SectionHeadingProps) {
  return (
    <div className="max-w-3xl space-y-4">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-kunda-forest">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-4xl font-semibold text-kunda-ink md:text-5xl">
        {title}
      </h2>
      <p className="text-base leading-7 text-kunda-muted md:text-lg">{description}</p>
    </div>
  );
}
