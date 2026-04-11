import { Badge, Button } from "@kunda/ui";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { moderationListings } from "../lib/mock-data";
import { withRoleGuard } from "../lib/role-guard";

function ListingModerationPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Publishing gate"
        title="Listings moderation"
        description="Review media, verify ownership evidence, and keep the marketplace clean before publish."
        action={<Button variant="secondary">Download moderation checklist</Button>}
      />

      <DataTable
        title="Review queue"
        description="Newest submissions first"
        columns={[
          {
            key: "listing",
            header: "Listing",
            render: (row) => (
              <div>
                <div>{row.title}</div>
                <div className="tiny-label">
                  {row.location}, {row.region}
                </div>
              </div>
            ),
          },
          {
            key: "type",
            header: "Type",
            render: (row) => row.type,
          },
          {
            key: "submittedBy",
            header: "Submitted by",
            render: (row) => (
              <div>
                <div>{row.submittedBy}</div>
                <div className="tiny-label">{row.submittedAt}</div>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge tone={row.status === "REJECTED" ? "danger" : "warning"}>
                {row.status}
              </Badge>
            ),
          },
          {
            key: "note",
            header: "Reviewer note",
            render: (row) => row.reviewNote,
          },
        ]}
        getRowId={(row) => row.id}
        rows={moderationListings}
        emptyMessage="No listings waiting for moderation."
      />
    </div>
  );
}

export default withRoleGuard(ListingModerationPage, ["ADMIN"]);
