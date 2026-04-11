import { homepageStats } from "@/lib/site";

export function StatsStrip() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {homepageStats.map((item) => (
        <div
          key={item.label}
          className="surface-card rounded-[24px] p-5 shadow-soft"
        >
          <p className="font-display text-3xl font-semibold text-kunda-ink">
            {item.value}
          </p>
          <p className="mt-2 text-sm text-kunda-muted">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
