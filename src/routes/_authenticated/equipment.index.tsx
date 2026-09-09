import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, type Column } from "@/components/app/DataTable";
import { StatTile } from "@/components/app/Panels";
import { StatusBadge } from "@/components/app/StatusBadge";
import { RecordForm } from "@/components/app/RecordForm";
import { Button } from "@/components/ui/button";
import { listRows } from "@/lib/data";
import { equipmentFields } from "@/lib/entities";
import { orDash } from "@/lib/format";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/equipment/")({
  head: () => ({
    meta: [
      { title: "Equipment — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Tractors, trailers and specialty equipment with ownership, compliance and assignment." },
      { property: "og:title", content: "Equipment — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Equipment records for HazMat Environmental Group." },
    ],
  }),
  component: EquipmentPage,
});

function EquipmentPage() {
  const navigate = useNavigate();
  const { canWrite } = useSession();
  const [creating, setCreating] = useState(false);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["equipment"],
    queryFn: () => listRows("equipment", { order: { column: "unit_number", ascending: true } }),
  });

  const columns: Column[] = [
    { key: "unit_number", header: "Unit" },
    { key: "category", header: "Category" },
    { key: "equipment_type", header: "Type" },
    { key: "model_year", header: "Year" },
    { key: "make", header: "Make" },
    { key: "capacity", header: "Capacity", render: (row) => orDash(row.capacity) },
    { key: "ownership_type", header: "Ownership" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
  ];

  const active = data.filter((row) => row.status === "Active").length;
  const outOfService = data.filter((row) => row.status === "Out of service").length;
  const leased = data.filter((row) => row.ownership_type === "Leased").length;

  return (
    <>
      <PageHeader
        title="Equipment"
        description="Units HEG owns, leases or hauls — with compliance, technology and assignment history."
        actions={
          canWrite ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              New equipment
            </Button>
          ) : null
        }
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Units recorded" value={data.length} />
          <StatTile label="Active" value={active} tone="success" />
          <StatTile label="Out of service" value={outOfService} tone={outOfService ? "warning" : "neutral"} />
          <StatTile label="Leased" value={leased} />
        </div>

        <DataTable
          columns={columns}
          rows={data}
          isLoading={isLoading}
          error={error}
          searchPlaceholder="Search unit numbers, makes, VINs"
          exportName="heg-equipment"
          onRowClick={(row) => navigate({ to: "/equipment/$equipmentId", params: { equipmentId: row.id as string } })}
          emptyTitle="No equipment yet"
          emptyDescription="Add units as you bring fleet information across from spreadsheets and Trimble/TMW."
          emptyAction={canWrite ? <Button onClick={() => setCreating(true)}>Add equipment</Button> : undefined}
        />
      </div>

      <RecordForm
        open={creating}
        onOpenChange={setCreating}
        title="New equipment"
        table="equipment"
        fields={equipmentFields}
        invalidateKeys={[["equipment"]]}
      />
    </>
  );
}
