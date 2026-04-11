import { Badge, Button, Card } from "@kunda/ui";
import type { DisputeCase } from "../lib/mock-data";

type DisputePanelProps = {
  dispute: DisputeCase;
};

function getTone(status: DisputeCase["status"]) {
  if (status === "Open") {
    return "danger" as const;
  }

  if (status === "Needs review") {
    return "warning" as const;
  }

  return "info" as const;
}

export function DisputePanel({ dispute }: DisputePanelProps) {
  return (
    <Card
      eyebrow={`${dispute.amount} • opened ${dispute.openedAt}`}
      title={dispute.listingTitle}
      actions={<Badge tone={getTone(dispute.status)}>{dispute.status}</Badge>}
    >
      <div className="stack-list">
        <div className="inline-row split">
          <span className="muted-copy">Buyer</span>
          <span>{dispute.buyerName}</span>
        </div>
        <div className="inline-row split">
          <span className="muted-copy">Seller</span>
          <span>{dispute.sellerName}</span>
        </div>
        <p>{dispute.reason}</p>
        <p className="muted-copy">Next action: {dispute.nextAction}</p>
        <div className="button-row">
          <Button size="sm">Open case</Button>
          <Button size="sm" variant="secondary">
            Contact parties
          </Button>
        </div>
      </div>
    </Card>
  );
}
