type MetricCardProps = {
  label: string;
  value: string;
  delta: string;
  tone: "positive" | "neutral" | "warning";
};

export function MetricCard({ delta, label, tone, value }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className={`metric-delta ${tone}`}>{delta}</div>
    </article>
  );
}
