import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable } from "@/components/app/DataTable";
import { StatTile } from "@/components/app/Panels";
import { StatusBadge } from "@/components/app/StatusBadge";
import { RecordForm } from "@/components/app/RecordForm";
import { Button } from "@/components/ui/button";
import { listRows } from "@/lib/data";
import { bidFields } from "@/lib/entities";
import { dueLabel, formatDate, formatMoney, todayISO } from "@/lib/format";
import { useSession } from "@/hooks/use-session";
import { useCustomerOptions } from "@/components/app/QuickCreate";

export const Route = createFileRoute("/_authenticated/bids/")({
  head: () => ({
    meta: [
      { title: "Bid Center — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Every bid HEG is working, with deadlines, readiness and outcomes." },
      { property: "og:title", content: "Bid Center — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Bid pipeline and deadlines for HazMat Environmental Group." },
    ],
  }),
  component: BidsPage,
});

function BidsPage() {
  const { canWrite } = useSession();
  const [creating, setCreating] = useState(false);
  const { data: customerOptions = [] } = useCustomerOptions();

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["bids"],
    queryFn: () => listRows("bids", { select: "*, customers(legal_name)", order: { column: "due_date", ascending: true } }),
  });

  const today = todayISO();
  const live = data.filter((row) => !["Won", "Lost", "Withdrawn", "Cancelled"].includes(row.status));
  const overdue = live.filter((row) => row.due_date && row.due_date < today);
  const won = data.filter((row) => row.status === "Won");

  return (
    <>
      <PageHeader
        title="Bid Center"
        description="Bids, deadlines and readiness — so nothing is missed and every outcome is recorded."
        actions={
          canWrite ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              New bid
            </Button>
          ) : null
        }
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Live bids" value={live.length} />
          <StatTile label="Past due" value={overdue.length} tone={overdue.length ? "danger" : "neutral"} />
          <StatTile label="Won" value={won.length} tone="success" />
          <StatTile
            label="Live bid value"
            value={formatMoney(live.reduce((sum, row) => sum + Number(row.estimated_revenue ?? 0), 0))}
          />
        </div>

        <DataTable
          columns={[
            { key: "bid_name", header: "Bid" },
            { key: "customer", header: "Customer", value: (row) => row.customers?.legal_name ?? "" },
            { key: "bid_type", header: "Type" },
            { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
            {
              key: "due_date",
              header: "Due",
              render: (row) => {
                const due = dueLabel(row.due_date);
                return due.tone === "neutral" ? formatDate(row.due_date) : <StatusBadge status={due.label} tone={due.tone} />;
              },
            },
            { key: "pricing_status", header: "Pricing" },
            { key: "document_status", header: "Documents" },
            { key: "estimated_revenue", header: "Estimated revenue", align: "right", render: (row) => formatMoney(row.estimated_revenue) },
          ]}
          rows={data}
          isLoading={isLoading}
          error={error}
          searchPlaceholder="Search bids"
          exportName="heg-bids"
          emptyTitle="No bids yet"
          emptyDescription="Add a bid to start tracking its deadlines, pricing readiness and outcome."
          emptyAction={canWrite ? <Button onClick={() => setCreating(true)}>Add a bid</Button> : undefined}
        />
      </div>

      <RecordForm
        open={creating}
        onOpenChange={setCreating}
        title="New bid"
        table="bids"
        fields={[
          { name: "customer_id", label: "Customer", type: "select", required: true, options: customerOptions, section: "Basic information" },
          ...bidFields,
        ]}
        invalidateKeys={[["bids"]]}
      />
    </>
  );
}
