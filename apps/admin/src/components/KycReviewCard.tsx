import { Badge, Button, Card } from "@kunda/ui";
import type { KycQueueItem } from "../lib/mock-data";

type KycReviewCardProps = {
  item: KycQueueItem;
};

function getRiskTone(riskBand: KycQueueItem["riskBand"]) {
  if (riskBand === "High") {
    return "danger" as const;
  }

  if (riskBand === "Medium") {
    return "warning" as const;
  }

  return "success" as const;
}

function getStatusTone(status: KycQueueItem["status"]) {
  if (status === "APPROVED") {
    return "success" as const;
  }

  if (status === "REJECTED") {
    return "danger" as const;
  }

  if (status === "SUBMITTED") {
    return "info" as const;
  }

  return "warning" as const;
}

export function KycReviewCard({ item }: KycReviewCardProps) {
  return (
    <Card
      eyebrow={`${item.country} • assigned to ${item.assignedTo}`}
      title={item.applicant}
      actions={<Badge tone={getStatusTone(item.status)}>{item.status}</Badge>}
    >
      <div className="stack-list">
        <div className="inline-row split">
          <span className="muted-copy">Risk band</span>
          <Badge tone={getRiskTone(item.riskBand)}>{item.riskBand}</Badge>
        </div>
        <div className="inline-row split">
          <span className="muted-copy">Document</span>
          <span>{item.documentType.replaceAll("_", " ")}</span>
        </div>
        <div className="inline-row split">
          <span className="muted-copy">AML</span>
          <span>{item.amlStatus.replaceAll("_", " ")}</span>
        </div>
        <p className="muted-copy">{item.reviewNote}</p>
        <div className="button-row">
          <Button size="sm">Approve</Button>
          <Button size="sm" variant="secondary">
            Request docs
          </Button>
        </div>
      </div>
    </Card>
  );
}
