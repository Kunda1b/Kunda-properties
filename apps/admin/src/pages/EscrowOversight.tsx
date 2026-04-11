import { Button } from "@kunda/ui";
import { DataTable } from "../components/DataTable";
import { DisputePanel } from "../components/DisputePanel";
import { PageHeader } from "../components/PageHeader";
import { disputeCases, escrowWatchlist } from "../lib/mock-data";
import { withRoleGuard } from "../lib/role-guard";

function EscrowOversightPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Protected funds"
        title="Escrow oversight"
        description="Monitor transaction health, investigate disputes, and keep manual releases auditable."
        action={<Button>Open release console</Button>}
      />

      <DataTable
        title="Escrow transactions"
        description="Operational watchlist"
        columns={[
          {
            key: "transaction",
            header: "Transaction",
            render: (row) => (
              <div>
                <div>{row.listingTitle}</div>
                <div className="tiny-label">{row.id}</div>
              </div>
            ),
          },
          {
            key: "buyer",
            header: "Buyer",
            render: (row) => row.buyerName,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => row.status,
          },
          {
            key: "payment",
            header: "Payment",
            render: (row) => row.paymentStatus,
          },
          {
            key: "amount",
            header: "Amount",
            render: (row) => `GBP ${row.amountGBP.toLocaleString()}`,
          },
        ]}
        getRowId={(row) => row.id}
        rows={escrowWatchlist}
        emptyMessage="No escrow items need manual oversight."
      />

      <section className="card-grid">
        {disputeCases.map((dispute) => (
          <DisputePanel dispute={dispute} key={dispute.id} />
        ))}
      </section>
    </div>
  );
}

export default withRoleGuard(EscrowOversightPage, ["ADMIN"]);
