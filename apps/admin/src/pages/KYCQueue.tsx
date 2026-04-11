import { Button, Tabs } from "@kunda/ui";
import { KycReviewCard } from "../components/KycReviewCard";
import { PageHeader } from "../components/PageHeader";
import { kycQueue } from "../lib/mock-data";
import { withRoleGuard } from "../lib/role-guard";

function KYCQueuePage() {
  const statusCounts = [
    { label: "All", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Submitted", value: "SUBMITTED" },
    { label: "Approved", value: "APPROVED" },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="KYC review queue"
        title="Identity verification"
        description="Prioritize high-risk applicants, check provider signals, and keep approvals moving."
        action={<Button>Pull latest provider state</Button>}
      />

      <Tabs onChange={() => undefined} options={statusCounts} value="ALL" />

      <section className="card-grid">
        {kycQueue.map((item) => (
          <KycReviewCard item={item} key={item.id} />
        ))}
      </section>
    </div>
  );
}

export default withRoleGuard(KYCQueuePage, ["ADMIN"]);
