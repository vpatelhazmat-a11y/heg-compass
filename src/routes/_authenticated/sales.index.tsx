import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable } from "@/components/app/DataTable";
import { Panel, StatTile } from "@/components/app/Panels";
import { StatusBadge } from "@/components/app/StatusBadge";
import { RecordForm } from "@/components/app/RecordForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listRows } from "@/lib/data";
import { lostBusinessFields, opportunityFields } from "@/lib/entities";
import { formatDate, formatMoney } from "@/lib/format";
import { useSession } from "@/hooks/use-session";
import { useCustomerOptions } from "@/components/app/QuickCreate";

export const Route = createFileRoute("/_authenticated/sales/")({
  head: () => ({
    meta: [
      { title: "Sales Center — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Pipeline, opportunities and the business HEG could not serve." },
      { property: "og:title", content: "Sales Center — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Commercial pipeline for HazMat Environmental Group." },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const { canWrite } = useSession();
  const [creating, setCreating] = useState<"opportunity" | "lost" | null>(null);
  const { data: customerOptions = [] } = useCustomerOptions();

  const opportunities = useQuery({
    queryKey: ["opportunities"],
    queryFn: () =>
      listRows("opportunities", { select: "*, customers(legal_name)", order: { column: "expected_close_date", ascending: true } }),
  });
  const lost = useQuery({
    queryKey: ["lost-business"],
    queryFn: () => listRows("lost_business", { select: "*, customers(legal_name)", order: { column: "occurred_on", ascending: false } }),
  });

  const rows = opportunities.data ?? [];
  const open = rows.filter((row) => !["Won", "Lost"].includes(row.stage));
  const lostRows = lost.data ?? [];

  return (
    <>
      <PageHeader
        title="Sales Center"
        description="Opportunities, pipeline value, and an honest record of the work HEG turned away."
        actions={
          canWrite ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCreating("lost")}>
                Record lost business
              </Button>
              <Button onClick={() => setCreating("opportunity")}>
                <Plus className="h-4 w-4" aria-hidden />
                New opportunity
              </Button>
            </div>
          ) : null
        }
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Open opportunities" value={open.length} />
          <StatTile label="Open pipeline" value={formatMoney(open.reduce((s, r) => s + Number(r.estimated_revenue ?? 0), 0))} />
          <StatTile
            label="Blocked by capacity"
            value={open.filter((r) => r.capacity_status && r.capacity_status !== "Serviceable").length}
            tone="warning"
          />
          <StatTile
            label="Revenue not served"
            value={formatMoney(lostRows.reduce((s, r) => s + Number(r.estimated_revenue ?? 0), 0))}
            tone={lostRows.length ? "warning" : "neutral"}
          />
        </div>

        <Tabs defaultValue="pipeline">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="lost">Lost business</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="mt-4">
            <Panel title="Opportunities">
              <DataTable
                columns={[
                  { key: "name", header: "Opportunity" },
                  { key: "customer", header: "Customer", value: (row) => row.customers?.legal_name ?? "" },
                  { key: "stage", header: "Stage", render: (row) => <StatusBadge status={row.stage} /> },
                  { key: "capacity_status", header: "Can we service it?", render: (row) => <StatusBadge status={row.capacity_status} /> },
                  { key: "estimated_revenue", header: "Estimated revenue", align: "right", render: (row) => formatMoney(row.estimated_revenue) },
                  { key: "expected_close_date", header: "Expected close", render: (row) => formatDate(row.expected_close_date) },
                ]}
                rows={rows}
                isLoading={opportunities.isLoading}
                error={opportunities.error}
                exportName="heg-opportunities"
                emptyTitle="No opportunities yet"
                emptyDescription="Add an opportunity to start tracking pipeline and capacity blockers."
              />
            </Panel>
          </TabsContent>

          <TabsContent value="lost" className="mt-4">
            <Panel title="Business we could not serve" description="The record that turns anecdotes into capacity decisions">
              <DataTable
                columns={[
                  { key: "occurred_on", header: "Date", render: (row) => formatDate(row.occurred_on) },
                  { key: "customer", header: "Customer", value: (row) => row.customers?.legal_name ?? "" },
                  { key: "reason_category", header: "Reason" },
                  { key: "estimated_revenue", header: "Revenue lost", align: "right", render: (row) => formatMoney(row.estimated_revenue) },
                  { key: "recoverable", header: "Recoverable", render: (row) => (row.recoverable ? "Yes" : "No") },
                ]}
                rows={lostRows}
                isLoading={lost.isLoading}
                error={lost.error}
                exportName="heg-lost-business"
                emptyTitle="Nothing recorded yet"
                emptyDescription="Record work HEG declined and why, so capacity gaps become visible."
              />
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      {creating && (
        <RecordForm
          open
          onOpenChange={(open) => {
            if (!open) setCreating(null);
          }}
          title={creating === "opportunity" ? "New opportunity" : "Record lost business"}
          table={creating === "opportunity" ? "opportunities" : "lost_business"}
          fields={[
            { name: "customer_id", label: "Customer", type: "select", options: customerOptions, section: "Basic information" },
            ...(creating === "opportunity" ? opportunityFields : lostBusinessFields),
          ]}
          invalidateKeys={[["opportunities"], ["lost-business"]]}
        />
      )}
    </>
  );
}
