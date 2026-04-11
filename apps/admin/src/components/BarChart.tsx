import { Card } from "@kunda/ui";
import type { ChartDatum } from "../lib/mock-data";

type BarChartProps = {
  title: string;
  description: string;
  data: ChartDatum[];
  suffix?: string;
};

export function BarChart({ data, description, suffix = "", title }: BarChartProps) {
  const maxValue = Math.max(...data.map((entry) => entry.value), 1);

  return (
    <Card title={title} eyebrow={description}>
      <div className="chart-stack">
        {data.map((entry) => (
          <div className="chart-row" key={entry.label}>
            <div className="chart-label">{entry.label}</div>
            <div className="chart-track">
              <div
                className="chart-fill"
                style={{ width: `${(entry.value / maxValue) * 100}%` }}
              />
            </div>
            <div className="chart-value">
              {entry.value}
              {suffix}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
