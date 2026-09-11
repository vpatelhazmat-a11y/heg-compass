import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { PageHeader, MetaItem } from "@/components/app/PageHeader";
import { Panel, Field, FieldGrid } from "@/components/app/Panels";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/EmptyState";
import { StatusBadge } from "@/components/app/StatusBadge";
import { DataTable } from "@/components/app/DataTable";
import { RecordForm, type FieldConfig } from "@/components/app/RecordForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRow, listRows } from "@/lib/data";
import { scopeDefaults } from "@/lib/relations";

import {
  equipmentAssignmentFields,
  equipmentComplianceFields,
  equipmentFields,
  equipmentTechnologyFields,
} from "@/lib/entities";
import { formatDate, orDash } from "@/lib/format";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/equipment/$equipmentId")({
  head: () => ({
    meta: [
      { title: "Equipment unit — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Specification, compliance, technology and assignment history for this unit." },
      { property: "og:title", content: "Equipment unit — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Equipment 360 view for HazMat Environmental Group." },
    ],
  }),
  component: EquipmentDetail,
});

type Creator = { table: string; title: string; fields: FieldConfig[] } | null;

function EquipmentDetail() {
  const { equipmentId } = Route.useParams();
  const { canWrite } = useSession();
  const [editing, setEditing] = useState(false);
  const [creator, setCreator] = useState<Creator>(null);

  const unitQuery = useQuery({
    queryKey: ["equipment-unit", equipmentId],
    queryFn: () => getRow("equipment", equipmentId),
  });

  const related = useQuery({
    queryKey: ["equipment-related", equipmentId],
    queryFn: async () => {
      const filters = { equipment_id: equipmentId };
      const [assignments, compliance, technology, leases] = await Promise.all([
        listRows("equipment_assignments", { filters, order: { column: "start_date", ascending: false } }),
        listRows("equipment_compliance", { filters, order: { column: "expiration_date", ascending: true } }),
        listRows("equipment_technology", { filters }),
        listRows("equipment_leases", { filters }).catch(() => []),
      ]);
      return { assignments, compliance, technology, leases };
    },
  });

  if (unitQuery.isLoading) {
    return (
      <div className="p-6">
        <LoadingState />
      </div>
    );
  }
  if (unitQuery.error) {
    return (
      <div className="p-6">
        <ErrorState message={(unitQuery.error as Error).message} />
      </div>
    );
  }
  const unit = unitQuery.data;
  if (!unit) {
    return (
      <div className="p-6">
        <EmptyState title="Equipment not found" />
      </div>
    );
  }

  const data = related.data;
  const addButton = (label: string, table: string, fields: FieldConfig[]) =>
    canWrite ? (
      <Button size="sm" variant="outline" onClick={() => setCreator({ table, title: label, fields })}>
        <Plus className="h-4 w-4" aria-hidden />
        {label}
      </Button>
    ) : null;

  return (
    <>
      <PageHeader
        title={`Unit ${unit.unit_number}`}
        description={[unit.model_year, unit.make, unit.equipment_type].filter(Boolean).join(" ") || undefined}
        breadcrumbs={[{ label: "Equipment", to: "/equipment" }, { label: `Unit ${unit.unit_number}` }]}
        meta={
          <>
            <MetaItem label="Status">
              <StatusBadge status={unit.status} />
            </MetaItem>
            <MetaItem label="Category">{orDash(unit.category)}</MetaItem>
            <MetaItem label="Ownership">{orDash(unit.ownership_type)}</MetaItem>
            <MetaItem label="Data quality">{orDash(unit.data_quality_status)}</MetaItem>
          </>
        }
        actions={
          canWrite ? (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          ) : null
        }
      />

      <div className="space-y-6 p-6">
        <Tabs defaultValue="specification">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="specification">Specification</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="technology">Technology</TabsTrigger>
          </TabsList>

          <TabsContent value="specification" className="mt-4 space-y-6">
            <Panel title="Unit details">
              <FieldGrid>
                <Field label="Unit number">{unit.unit_number}</Field>
                <Field label="Category">{orDash(unit.category)}</Field>
                <Field label="Type">{orDash(unit.equipment_type)}</Field>
                <Field label="Year">{orDash(unit.model_year)}</Field>
                <Field label="Make">{orDash(unit.make)}</Field>
                <Field label="Color">{orDash(unit.color)}</Field>
                <Field label="Capacity">{orDash(unit.capacity)}</Field>
                <Field label="Certified weight">{orDash(unit.certified_weight)}</Field>
                <Field label="VIN">{orDash(unit.vin)}</Field>
                <Field label="Serial number">{orDash(unit.serial_number)}</Field>
                <Field label="Plate number">{orDash(unit.plate_number)}</Field>
              </FieldGrid>
            </Panel>
            <Panel title="Notes">
              <p className="text-sm text-foreground">{orDash(unit.notes)}</p>
            </Panel>
          </TabsContent>

          <TabsContent value="assignments" className="mt-4">
            <Panel title="Assignment history" actions={addButton("Add assignment", "equipment_assignments", equipmentAssignmentFields)}>
              <DataTable
                columns={[
                  { key: "assignment_type", header: "Assignment" },
                  { key: "start_date", header: "Start", render: (row) => formatDate(row.start_date) },
                  { key: "end_date", header: "End", render: (row) => formatDate(row.end_date) },
                  { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
                ]}
                rows={data?.assignments ?? []}
                isLoading={related.isLoading}
                emptyTitle="No assignments recorded"
                emptyDescription="Record where this unit has been assigned so history isn't lost."
              />
            </Panel>
          </TabsContent>

          <TabsContent value="compliance" className="mt-4">
            <Panel title="Registration and compliance" actions={addButton("Add compliance record", "equipment_compliance", equipmentComplianceFields)}>
              <DataTable
                columns={[
                  { key: "jurisdiction", header: "Jurisdiction" },
                  { key: "requirement", header: "Requirement" },
                  { key: "plate_number", header: "Plate / permit" },
                  { key: "expiration_date", header: "Expires", render: (row) => formatDate(row.expiration_date) },
                  { key: "required", header: "Required", render: (row) => (row.required ? "Yes" : "No") },
                ]}
                rows={data?.compliance ?? []}
                isLoading={related.isLoading}
                emptyTitle="No compliance records"
                emptyDescription="Track state registrations and permits with their expiry dates."
              />
            </Panel>
          </TabsContent>

          <TabsContent value="technology" className="mt-4">
            <Panel title="Installed technology" actions={addButton("Add technology", "equipment_technology", equipmentTechnologyFields)}>
              <DataTable
                columns={[
                  { key: "technology_type", header: "Technology" },
                  { key: "device_id", header: "Device ID" },
                  { key: "cable_id", header: "Cable ID" },
                  { key: "installation_date", header: "Installed", render: (row) => formatDate(row.installation_date) },
                  { key: "removal_date", header: "Removed", render: (row) => formatDate(row.removal_date) },
                ]}
                rows={data?.technology ?? []}
                isLoading={related.isLoading}
                emptyTitle="No technology recorded"
              />
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      <RecordForm
        open={editing}
        onOpenChange={setEditing}
        title="Edit equipment"
        table="equipment"
        recordId={equipmentId}
        initialValues={unit}
        fields={equipmentFields}
        invalidateKeys={[["equipment-unit", equipmentId], ["equipment"]]}
      />

      {creator && (
        <RecordForm
          open
          onOpenChange={(open) => {
            if (!open) setCreator(null);
          }}
          title={creator.title}
          table={creator.table}
          fields={creator.fields}
          defaults={{ equipment_id: equipmentId }}
          invalidateKeys={[["equipment-related", equipmentId]]}
        />
      )}
    </>
  );
}
