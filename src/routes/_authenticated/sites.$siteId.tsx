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
import { scopeDefaults, scopeFilters } from "@/lib/relations";

import { assessmentFields, documentFields, requirementFields, siteFields } from "@/lib/entities";
import { formatDate, orDash } from "@/lib/format";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/sites/$siteId")({
  head: () => ({
    meta: [
      { title: "Site — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Access, safety, routing and assessment knowledge for this site." },
      { property: "og:title", content: "Site — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Site 360 view for HazMat Environmental Group." },
    ],
  }),
  component: SiteDetail,
});

type Creator = { table: string; title: string; fields: FieldConfig[] } | null;

function SiteDetail() {
  const { siteId } = Route.useParams();
  const { canWrite, canViewSafety } = useSession();
  const [editing, setEditing] = useState(false);
  const [creator, setCreator] = useState<Creator>(null);

  const siteQuery = useQuery({
    queryKey: ["site", siteId],
    queryFn: () => getRow("sites", siteId, "*, customers(id, legal_name)"),
  });

  const related = useQuery({
    queryKey: ["site-related", siteId],
    queryFn: async () => {
      const filters = { site_id: siteId };
      const [requirements, assessments, documents, incidents] = await Promise.all([
        listRows("requirements", { filters: scopeFilters("requirements", "site", siteId) }),
        listRows("site_assessments", { filters, order: { column: "assessment_date", ascending: false } }).catch(() => []),
        listRows("documents", { filters: scopeFilters("documents", "site", siteId) }),
        listRows("incidents", { filters, order: { column: "incident_date", ascending: false } }).catch(() => []),
      ]);

      return { requirements, assessments, documents, incidents };
    },
  });

  if (siteQuery.isLoading) {
    return (
      <div className="p-6">
        <LoadingState />
      </div>
    );
  }
  if (siteQuery.error) {
    return (
      <div className="p-6">
        <ErrorState message={(siteQuery.error as Error).message} />
      </div>
    );
  }
  const site = siteQuery.data;
  if (!site) {
    return (
      <div className="p-6">
        <EmptyState title="Site not found" />
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
        title={site.site_name}
        description={[site.address, site.city, site.state, site.postal_code].filter(Boolean).join(", ") || undefined}
        breadcrumbs={[
          { label: "Customers", to: "/customers" },
          ...(site.customers
            ? [{ label: site.customers.legal_name, to: "/customers/$customerId", params: { customerId: site.customers.id } }]
            : []),
          { label: site.site_name },
        ]}
        meta={
          <>
            <MetaItem label="Status">
              <StatusBadge status={site.status} />
            </MetaItem>
            <MetaItem label="Site type">{orDash(site.site_type)}</MetaItem>
            <MetaItem label="Appointment required">{site.appointment_required ? "Yes" : "No"}</MetaItem>
            <MetaItem label="Data quality">{orDash(site.data_quality_status)}</MetaItem>
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
        <Tabs defaultValue="operations">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="safety">Safety & environmental</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="operations" className="mt-4 space-y-6">
            <Panel title="Getting in and out">
              <FieldGrid>
                <Field label="Operating hours">{orDash(site.operating_hours)}</Field>
                <Field label="Emergency contact">{orDash(site.emergency_contact)}</Field>
                <Field label="Appointment required">{site.appointment_required ? "Yes" : "No"}</Field>
                <Field label="Access requirements" full>
                  {orDash(site.access_requirements)}
                </Field>
                <Field label="Security requirements" full>
                  {orDash(site.security_requirements)}
                </Field>
                <Field label="Parking notes" full>
                  {orDash(site.parking_notes)}
                </Field>
                <Field label="Route notes" full>
                  {orDash(site.route_notes)}
                </Field>
              </FieldGrid>
            </Panel>
            <Panel title="Loading and unloading">
              <FieldGrid columns={2}>
                <Field label="Loading instructions">{orDash(site.loading_requirements)}</Field>
                <Field label="Unloading instructions">{orDash(site.unloading_requirements)}</Field>
                <Field label="Special instructions">{orDash(site.special_instructions)}</Field>
              </FieldGrid>
            </Panel>
          </TabsContent>

          <TabsContent value="safety" className="mt-4 space-y-6">
            <Panel title="Safety and environmental">
              <FieldGrid columns={2}>
                <Field label="PPE required">{orDash(site.ppe_requirements)}</Field>
                <Field label="Safety requirements">{orDash(site.safety_requirements)}</Field>
                <Field label="Environmental requirements">{orDash(site.environmental_requirements)}</Field>
              </FieldGrid>
            </Panel>
            {canViewSafety && (
              <Panel title="Incidents at this site">
                <DataTable
                  columns={[
                    { key: "incident_date", header: "Date", render: (row) => formatDate(row.incident_date) },
                    { key: "incident_type", header: "Type" },
                    { key: "severity", header: "Severity", render: (row) => <StatusBadge status={row.severity} /> },
                    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
                  ]}
                  rows={data?.incidents ?? []}
                  isLoading={related.isLoading}
                  emptyTitle="No incidents recorded at this site"
                />
              </Panel>
            )}
          </TabsContent>

          <TabsContent value="requirements" className="mt-4">
            <Panel title="Site requirements" actions={addButton("Add requirement", "requirements", requirementFields)}>
              <DataTable
                columns={[
                  { key: "requirement", header: "Requirement" },
                  { key: "category", header: "Category" },
                  { key: "mandatory", header: "Mandatory", render: (row) => (row.mandatory ? "Yes" : "No") },
                  { key: "expiration_date", header: "Expires", render: (row) => formatDate(row.expiration_date) },
                ]}
                rows={data?.requirements ?? []}
                isLoading={related.isLoading}
                emptyTitle="No site requirements recorded"
              />
            </Panel>
          </TabsContent>

          <TabsContent value="assessments" className="mt-4">
            <Panel title="Site assessments" actions={addButton("Add assessment", "site_assessments", assessmentFields)}>
              <DataTable
                columns={[
                  { key: "assessment_type", header: "Type" },
                  { key: "assessment_date", header: "Assessed", render: (row) => formatDate(row.assessment_date) },
                  { key: "next_review_date", header: "Next review", render: (row) => formatDate(row.next_review_date) },
                  { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
                  { key: "assessor", header: "Assessed by" },
                ]}
                rows={data?.assessments ?? []}
                isLoading={related.isLoading}
                emptyTitle="No assessments on file"
                emptyDescription="Assessments record what HEG verified at this location and when it needs review."
              />
            </Panel>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <Panel title="Documents" actions={addButton("Add document", "documents", documentFields)}>
              <DataTable
                columns={[
                  { key: "document_name", header: "Document" },
                  { key: "document_type", header: "Type" },
                  { key: "expiration_date", header: "Expires", render: (row) => formatDate(row.expiration_date) },
                ]}
                rows={data?.documents ?? []}
                isLoading={related.isLoading}
                emptyTitle="No documents recorded"
              />
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      <RecordForm
        open={editing}
        onOpenChange={setEditing}
        title="Edit site"
        table="sites"
        recordId={siteId}
        initialValues={site}
        fields={siteFields}
        invalidateKeys={[["site", siteId]]}
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
          defaults={scopeDefaults(creator.table, "site", siteId, { customer_id: site.customer_id })}
          invalidateKeys={[["site-related", siteId]]}
        />
      )}
    </>
  );
}
