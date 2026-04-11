import { Button } from "@kunda/ui";
import { BarChart } from "../components/BarChart";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import {
  adminMetrics,
  enquiryTrend,
  escrowValueTrend,
  listingTrend,
} from "../lib/mock-data";
import { withRoleGuard } from "../lib/role-guard";

function AnalyticsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Marketplace analytics"
        title="Volume and throughput"
        description="Keep an eye on listings, enquiry demand, and escrow movement before launch."
        action={<Button variant="secondary">Schedule weekly digest</Button>}
      />

      <section className="metric-grid">
        {adminMetrics.slice(0, 3).map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="chart-grid">
        <BarChart
          data={listingTrend}
          description="Listings entering moderation"
          title="Listings trend"
        />
        <BarChart
          data={enquiryTrend}
          description="Buyer demand across channels"
          title="Enquiry trend"
        />
        <BarChart
          data={escrowValueTrend}
          description="Protected value in tens of thousands"
          title="Escrow value"
          suffix="k"
        />
      </section>
    </div>
  );
}

export default withRoleGuard(AnalyticsPage, ["ADMIN"]);
