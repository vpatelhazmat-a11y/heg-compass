import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable } from "@/components/app/DataTable";
import { Panel, StatTile } from "@/components/app/Panels";
import { EmptyState } from "@/components/app/EmptyState";
import { StatusBadge } from "@/components/app/StatusBadge";
import { RecordForm } from "@/components/app/RecordForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listRows } from "@/lib/data";
import { incidentFields } from "@/lib/entities";
import { formatDate, todayISO } from "@/lib/format";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/safety/")({
  head: () => ({
    meta: [
      { title: "Safety Center — HEG Commercial Intelligence Hub" },
      {
        name: "description",
        content: "Incidents and corrective actions in one place.",
      },
      { property: "og:title", content: "Safety Center — HEG Commercial Intelligence Hub" },
      {
        property: "og:description",
        content: "Safety and compliance oversight for HazMat Environmental Group.",
      },
    ],
  }),
  component: SafetyPage,
});

function SafetyPage() {
  const { canEdit, canViewSafety, hasAnyRole } = useSession();
  const canWrite = canEdit("incidents");
  const [creating, setCreating] = useState(false);
  const canSeeIncidents = canViewSafety || hasAnyRole(["operations"]);

  const incidents = useQuery({
    queryKey: ["incidents"],
    queryFn: () =>
      listRows("incidents", {
        select: "*, customers(legal_name)",
        order: { column: "incident_date", ascending: false },
      }),
    enabled: canSeeIncidents,
  });
  const actions = useQuery({
    queryKey: ["corrective-actions"],
    queryFn: () =>
      listRows("corrective_actions", { order: { column: "due_date", ascending: true } }),
    enabled: canSeeIncidents,
  });

  if (!canSeeIncidents) {
    return (
      <>
        <PageHeader title="Safety Center" />
        <div className="p-6">
          <EmptyState
            title="You don't have access to safety information"
            description="Safety records are limited to Safety, Operations, Management and Administrator roles. Ask an administrator if you need access."
          />
        </div>
      </>
    );
  }

  const today = todayISO();
  const incidentRows = incidents.data ?? [];
  const actionRows = actions.data ?? [];
  const openIncidents = incidentRows.filter((row) => ["Open", "In Process"].includes(row.status));
  const overdueActions = actionRows.filter(
    (row) =>
      !["Completed", "Cancelled"].includes(row.status) && row.due_date && row.due_date < today,
  );

  return (
    <>
      <PageHeader
        title="Safety Center"
        description="Incidents and corrective actions — visible to the people responsible for them."
        actions={
          canWrite ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Log incident
            </Button>
          ) : null
        }
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Open incidents"
            value={openIncidents.length}
            tone={openIncidents.length ? "warning" : "neutral"}
          />
          <StatTile
            label="Overdue corrective actions"
            value={overdueActions.length}
            tone={overdueActions.length ? "danger" : "neutral"}
          />
          <StatTile label="Incidents recorded" value={incidentRows.length} />
          <StatTile label="Corrective actions" value={actionRows.length} />
        </div>

        <Tabs defaultValue="incidents">
          <TabsList>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
            <TabsTrigger value="actions">Corrective actions</TabsTrigger>
          </TabsList>

          <TabsContent value="incidents" className="mt-4">
            <Panel title="Incidents">
              <DataTable
                columns={[
                  {
                    key: "incident_date",
                    header: "Date",
                    render: (row) => formatDate(row.incident_date),
                  },
                  { key: "incident_type", header: "Type" },
                  {
                    key: "customer",
                    header: "Customer",
                    value: (row) => row.customers?.legal_name ?? "",
                  },
                  {
                    key: "severity",
                    header: "Severity",
                    render: (row) => <StatusBadge status={row.severity} />,
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (row) => <StatusBadge status={row.status} />,
                  },
                  {
                    key: "due_date",
                    header: "Action due",
                    render: (row) => formatDate(row.due_date),
                  },
                ]}
                recordTable="incidents"
                rows={incidentRows}
                isLoading={incidents.isLoading}
                error={incidents.error}
                exportName="heg-incidents"
                emptyTitle="No incidents recorded"
              />
            </Panel>
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            <Panel title="Corrective actions">
              <DataTable
                columns={[
                  { key: "action", header: "Action" },
                  { key: "due_date", header: "Due", render: (row) => formatDate(row.due_date) },
                  {
                    key: "status",
                    header: "Status",
                    render: (row) => <StatusBadge status={row.status} />,
                  },
                  {
                    key: "completion_date",
                    header: "Completed",
                    render: (row) => formatDate(row.completion_date),
                  },
                ]}
                recordTable="corrective_actions"
                rows={actionRows}
                isLoading={actions.isLoading}
                emptyTitle="No corrective actions recorded"
              />
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      <RecordForm
        open={creating}
        onOpenChange={setCreating}
        title="Log incident"
        table="incidents"
        fields={incidentFields}
        invalidateKeys={[["incidents"]]}
      />
    </>
  );
}
