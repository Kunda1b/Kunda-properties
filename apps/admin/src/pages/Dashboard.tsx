import { Badge, Button, Card } from "@kunda/ui";
import { DataTable } from "../components/DataTable";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { activityFeed, adminMetrics, escrowWatchlist } from "../lib/mock-data";
import { withRoleGuard } from "../lib/role-guard";

function DashboardPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Ops overview"
        title="Kunda control room"
        description="Track KYC throughput, moderation pressure, and escrow risk from one place."
        badge={{ label: "Staging", tone: "forest" }}
        action={<Button variant="secondary">Export daily snapshot</Button>}
      />

      <section className="metric-grid">
        {adminMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="page-grid">
        <Card title="Recent activity" eyebrow="Latest cross-service changes">
          <div className="activity-list">
            {activityFeed.map((item) => (
              <div className="activity-item" key={item.id}>
                <div className="activity-title">{item.title}</div>
                <p className="muted-copy">{item.detail}</p>
                <span className="tiny-label">{item.time}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Environment pulse" eyebrow="Connected surfaces">
          <div className="stack-list">
            <div className="inline-row split">
              <span>Gateway</span>
              <Badge tone="success">Healthy</Badge>
            </div>
            <div className="inline-row split">
              <span>Smile Identity</span>
              <Badge tone="warning">Retrying callbacks</Badge>
            </div>
            <div className="inline-row split">
              <span>Stripe webhooks</span>
              <Badge tone="success">Healthy</Badge>
            </div>
            <div className="inline-row split">
              <span>Registry liaison queue</span>
              <Badge tone="info">6 awaiting manual review</Badge>
            </div>
          </div>
        </Card>
      </section>

      <DataTable
        title="Escrow watchlist"
        description="Transactions requiring operator attention"
        columns={[
          {
            key: "listing",
            header: "Listing",
            render: (row) => (
              <div>
                <div>{row.listingTitle}</div>
                <div className="tiny-label">{row.buyerName}</div>
              </div>
            ),
          },
          {
            key: "amount",
            header: "Amount",
            render: (row) => `GBP ${row.amountGBP.toLocaleString()}`,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge tone={row.status === "DISPUTED" ? "danger" : "warning"}>
                {row.status}
              </Badge>
            ),
          },
          {
            key: "provider",
            header: "Provider",
            render: (row) => row.paymentProvider ?? "Manual",
          },
        ]}
        getRowId={(row) => row.id}
        rows={escrowWatchlist}
        emptyMessage="No high-risk escrow items right now."
      />
    </div>
  );
}

export default withRoleGuard(DashboardPage, ["ADMIN"]);
