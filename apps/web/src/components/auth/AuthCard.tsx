import Link from "next/link";

type AuthCardProps = {
  alternateHref: string;
  alternateLabel: string;
  alternateText: string;
  children: React.ReactNode;
  eyebrow: string;
  title: string;
};

export function AuthCard({
  alternateHref,
  alternateLabel,
  alternateText,
  children,
  eyebrow,
  title,
}: AuthCardProps) {
  return (
    <div className="surface-card mx-auto w-full max-w-lg rounded-[34px] p-8 shadow-soft md:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-kunda-forest">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-kunda-ink">
        {title}
      </h1>
      <div className="mt-8">{children}</div>
      <p className="mt-6 text-sm text-kunda-muted">
        {alternateText}{" "}
        <Link href={alternateHref} className="font-semibold text-kunda-forest">
          {alternateLabel}
        </Link>
      </p>
    </div>
  );
}
