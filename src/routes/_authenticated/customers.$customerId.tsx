import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { PageHeader, MetaItem } from "@/components/app/PageHeader";
import { Panel, Field, FieldGrid, StatTile } from "@/components/app/Panels";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/EmptyState";
import { StatusBadge } from "@/components/app/StatusBadge";
import { DataTable, type Column } from "@/components/app/DataTable";
import { RecordForm, type FieldConfig } from "@/components/app/RecordForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRow, listRows } from "@/lib/data";
import {
  contactFields,
  contractFields,
  customerFields,
  documentFields,
  lostBusinessFields,
  opportunityFields,
  productFields,
  rateFields,
  requirementFields,
  siteFields,
} from "@/lib/entities";
import { formatDate, formatMoney, orDash } from "@/lib/format";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/customers/$customerId")({
  head: () => ({
    meta: [
      { title: "Customer — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Everything HEG knows about this customer in one place." },
      { property: "og:title", content: "Customer — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Customer 360 view: sites, contacts, rates, bids and history." },
    ],
  }),
  component: CustomerDetail,
});

type Creator = { table: string; title: string; fields: FieldConfig[] } | null;

function CustomerDetail() {
  const { customerId } = Route.useParams();
  const navigate = useNavigate();
  const { canWrite } = useSession();
  const [editing, setEditing] = useState(false);
  const [creator, setCreator] = useState<Creator>(null);

  const customerQuery = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => getRow("customers", customerId),
  });

  const related = useQuery({
    queryKey: ["customer-related", customerId],
    queryFn: async () => {
      const filters = { customer_id: customerId };
      const [sites, contacts, requirements, products, rates, bids, opportunities, contracts, documents, lost] =
        await Promise.all([
          listRows("sites", { filters, order: { column: "site_name", ascending: true } }),
          listRows("contacts", { filters, order: { column: "last_name", ascending: true } }),
          listRows("requirements", { filters }),
          listRows("products", { filters, order: { column: "product_name", ascending: true } }),
          listRows("rates", { filters, order: { column: "effective_date", ascending: false } }),
          listRows("bids", { filters, order: { column: "due_date", ascending: false } }),
          listRows("opportunities", { filters, order: { column: "expected_close_date", ascending: true } }),
          listRows("contracts", { filters, order: { column: "expiration_date", ascending: true } }),
          listRows("documents", { filters }),
          listRows("lost_business", { filters, order: { column: "occurred_on", ascending: false } }),
        ]);
      return { sites, contacts, requirements, products, rates, bids, opportunities, contracts, documents, lost };
    },
  });

  if (customerQuery.isLoading) {
    return (
      <div className="p-6">
        <LoadingState />
      </div>
    );
  }
  if (customerQuery.error) {
    return (
      <div className="p-6">
        <ErrorState message={(customerQuery.error as Error).message} />
      </div>
    );
  }
  const customer = customerQuery.data;
  if (!customer) {
    return (
      <div className="p-6">
        <EmptyState title="Customer not found" description="This customer may have been removed." />
      </div>
    );
  }

  const data = related.data;
  const openOpps = (data?.opportunities ?? []).filter((o) => !["Won", "Lost"].includes(o.stage));
  const activeRates = (data?.rates ?? []).filter((r) => r.status === "Active");

  const create = (table: string, title: string, fields: FieldConfig[]) => setCreator({ table, title, fields });

  const addButton = (label: string, table: string, fields: FieldConfig[]) =>
    canWrite ? (
      <Button size="sm" variant="outline" onClick={() => create(table, label, fields)}>
        <Plus className="h-4 w-4" aria-hidden />
        {label}
      </Button>
    ) : null;

  const siteColumns: Column[] = [
    { key: "site_name", header: "Site" },
    { key: "city", header: "City" },
    { key: "state", header: "State" },
    { key: "site_type", header: "Type" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <>
      <PageHeader
        title={customer.legal_name}
        description={customer.dba_name ? `Doing business as ${customer.dba_name}` : undefined}
        breadcrumbs={[{ label: "Customers", to: "/customers" }, { label: customer.legal_name }]}
        meta={
          <>
            <MetaItem label="Status">
              <StatusBadge status={customer.status} />
            </MetaItem>
            <MetaItem label="Qualification">
              <StatusBadge status={customer.qualification_status} />
            </MetaItem>
            <MetaItem label="Customer since">{formatDate(customer.customer_since)}</MetaItem>
            <MetaItem label="Data quality">{orDash(customer.data_quality_status)}</MetaItem>
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
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile label="Sites" value={data?.sites.length ?? "—"} />
          <StatTile label="Contacts" value={data?.contacts.length ?? "—"} />
          <StatTile label="Active rates" value={activeRates.length} />
          <StatTile label="Open opportunities" value={openOpps.length} />
          <StatTile label="Lost business records" value={data?.lost.length ?? "—"} tone={data?.lost.length ? "warning" : "neutral"} />
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="rates">Rates</TabsTrigger>
            <TabsTrigger value="commercial">Bids & pipeline</TabsTrigger>
            <TabsTrigger value="contracts">Contracts & documents</TabsTrigger>
            <TabsTrigger value="lost">Lost business</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-6">
            <Panel title="Customer profile">
              <FieldGrid>
                <Field label="Legal name">{customer.legal_name}</Field>
                <Field label="Doing business as">{orDash(customer.dba_name)}</Field>
                <Field label="Customer type">{orDash(customer.customer_type)}</Field>
                <Field label="Industry">{orDash(customer.industry)}</Field>
                <Field label="Website">{orDash(customer.website)}</Field>
                <Field label="Strategic priority">{orDash(customer.strategic_priority)}</Field>
                <Field label="Headquarters" full>
                  {orDash(customer.headquarters_address)}
                </Field>
              </FieldGrid>
            </Panel>
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Qualification">
                <p className="text-sm text-foreground">{orDash(customer.qualification_notes)}</p>
              </Panel>
              <Panel title="Commercial & risk notes">
                <p className="text-sm text-foreground">{orDash(customer.commercial_notes)}</p>
                <p className="mt-3 text-sm text-muted-foreground">{orDash(customer.risk_notes)}</p>
              </Panel>
            </div>
            <Panel title="Where this information came from" description="Provenance is kept so the record can always be traced back">
              <FieldGrid columns={4}>
                <Field label="Source system">{orDash(customer.source_system)}</Field>
                <Field label="Source file">{orDash(customer.source_file)}</Field>
                <Field label="Source sheet">{orDash(customer.source_sheet)}</Field>
                <Field label="Last verified">{formatDate(customer.last_verified_at)}</Field>
              </FieldGrid>
            </Panel>
          </TabsContent>

          <TabsContent value="sites" className="mt-4">
            <Panel title="Sites" actions={addButton("Add site", "sites", siteFields)}>
              <DataTable
                columns={siteColumns}
                rows={data?.sites ?? []}
                isLoading={related.isLoading}
                exportName="customer-sites"
                onRowClick={(row) => navigate({ to: "/sites/$siteId", params: { siteId: row.id as string } })}
                emptyTitle="No sites recorded"
                emptyDescription="Add the locations HEG picks up from or delivers to for this customer."
              />
            </Panel>
          </TabsContent>

          <TabsContent value="contacts" className="mt-4">
            <Panel title="Contacts" actions={addButton("Add contact", "contacts", contactFields)}>
              <DataTable
                columns={[
                  { key: "name", header: "Name", value: (row) => `${row.first_name ?? ""} ${row.last_name ?? ""}` },
                  { key: "title", header: "Title" },
                  { key: "contact_type", header: "Type" },
                  { key: "email", header: "Email" },
                  { key: "phone", header: "Phone" },
                ]}
                rows={data?.contacts ?? []}
                isLoading={related.isLoading}
                emptyTitle="No contacts recorded"
                emptyDescription="Capture who HEG works with so the knowledge isn't held by one person."
              />
            </Panel>
          </TabsContent>

          <TabsContent value="requirements" className="mt-4">
            <Panel title="Customer requirements" actions={addButton("Add requirement", "requirements", requirementFields)}>
              <DataTable
                columns={[
                  { key: "requirement", header: "Requirement" },
                  { key: "category", header: "Category" },
                  { key: "mandatory", header: "Mandatory", render: (row) => (row.mandatory ? "Yes" : "No") },
                  { key: "expiration_date", header: "Expires", render: (row) => formatDate(row.expiration_date) },
                ]}
                rows={data?.requirements ?? []}
                isLoading={related.isLoading}
                emptyTitle="No requirements recorded"
                emptyDescription="Record the rules this customer expects HEG to follow."
              />
            </Panel>
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            <Panel title="Products and materials" actions={addButton("Add product", "products", productFields)}>
              <DataTable
                columns={[
                  { key: "product_name", header: "Product" },
                  { key: "hazard_classification", header: "Hazard class" },
                  { key: "un_number", header: "UN number" },
                  { key: "physical_state", header: "State" },
                  { key: "data_quality_status", header: "Data quality" },
                ]}
                rows={data?.products ?? []}
                isLoading={related.isLoading}
                emptyTitle="No products recorded"
                emptyDescription="Add materials HEG moves for this customer. Leave hazard details blank if unverified."
              />
            </Panel>
          </TabsContent>

          <TabsContent value="rates" className="mt-4">
            <Panel title="Rates" description="Quoted, contracted and historical pricing" actions={addButton("Add rate", "rates", rateFields)}>
              <DataTable
                columns={[
                  { key: "rate_type", header: "Type" },
                  { key: "amount", header: "Amount", align: "right", render: (row) => formatMoney(row.amount) },
                  { key: "unit", header: "Unit" },
                  { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
                  { key: "effective_date", header: "Effective", render: (row) => formatDate(row.effective_date) },
                  { key: "expiration_date", header: "Expires", render: (row) => formatDate(row.expiration_date) },
                ]}
                rows={data?.rates ?? []}
                isLoading={related.isLoading}
                exportName="customer-rates"
                emptyTitle="No rates recorded"
                emptyDescription="Rate history is how HEG stops re-quoting from memory."
              />
            </Panel>
          </TabsContent>

          <TabsContent value="commercial" className="mt-4 space-y-6">
            <Panel title="Opportunities" actions={addButton("Add opportunity", "opportunities", opportunityFields)}>
              <DataTable
                columns={[
                  { key: "name", header: "Opportunity" },
                  { key: "stage", header: "Stage", render: (row) => <StatusBadge status={row.stage} /> },
                  { key: "capacity_status", header: "Can we service it?", render: (row) => <StatusBadge status={row.capacity_status} /> },
                  { key: "estimated_revenue", header: "Estimated revenue", align: "right", render: (row) => formatMoney(row.estimated_revenue) },
                  { key: "expected_close_date", header: "Expected close", render: (row) => formatDate(row.expected_close_date) },
                ]}
                rows={data?.opportunities ?? []}
                isLoading={related.isLoading}
                emptyTitle="No opportunities recorded"
              />
            </Panel>
            <Panel title="Bids">
              <DataTable
                columns={[
                  { key: "bid_name", header: "Bid" },
                  { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
                  { key: "due_date", header: "Due", render: (row) => formatDate(row.due_date) },
                  { key: "estimated_revenue", header: "Estimated revenue", align: "right", render: (row) => formatMoney(row.estimated_revenue) },
                ]}
                rows={data?.bids ?? []}
                isLoading={related.isLoading}
                emptyTitle="No bids recorded"
                emptyDescription="Bids are created in the Bid Center."
                emptyAction={
                  <Link to="/bids" className="text-sm font-medium text-primary hover:underline">
                    Go to Bid Center
                  </Link>
                }
              />
            </Panel>
          </TabsContent>

          <TabsContent value="contracts" className="mt-4 space-y-6">
            <Panel title="Contracts" actions={addButton("Add contract", "contracts", contractFields)}>
              <DataTable
                columns={[
                  { key: "contract_name", header: "Contract" },
                  { key: "contract_number", header: "Number" },
                  { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
                  { key: "effective_date", header: "Effective", render: (row) => formatDate(row.effective_date) },
                  { key: "expiration_date", header: "Expires", render: (row) => formatDate(row.expiration_date) },
                ]}
                rows={data?.contracts ?? []}
                isLoading={related.isLoading}
                emptyTitle="No contracts recorded"
              />
            </Panel>
            <Panel title="Documents" actions={addButton("Add document", "documents", documentFields)}>
              <DataTable
                columns={[
                  { key: "document_name", header: "Document" },
                  { key: "document_type", header: "Type" },
                  { key: "classification", header: "Sensitivity" },
                  { key: "expiration_date", header: "Expires", render: (row) => formatDate(row.expiration_date) },
                ]}
                rows={data?.documents ?? []}
                isLoading={related.isLoading}
                emptyTitle="No documents recorded"
                emptyDescription="Record where a document lives so the team can always find it."
              />
            </Panel>
          </TabsContent>

          <TabsContent value="lost" className="mt-4">
            <Panel
              title="Business we could not serve"
              description="Why HEG lost or declined work — the record that drives capacity decisions"
              actions={addButton("Record lost business", "lost_business", lostBusinessFields)}
            >
              <DataTable
                columns={[
                  { key: "occurred_on", header: "Date", render: (row) => formatDate(row.occurred_on) },
                  { key: "reason_category", header: "Reason" },
                  { key: "estimated_revenue", header: "Revenue lost", align: "right", render: (row) => formatMoney(row.estimated_revenue) },
                  { key: "competitor", header: "Competitor" },
                  { key: "recoverable", header: "Recoverable", render: (row) => (row.recoverable ? "Yes" : "No") },
                ]}
                rows={data?.lost ?? []}
                isLoading={related.isLoading}
                emptyTitle="Nothing recorded"
                emptyDescription="Recording declined work is how HEG proves where capacity is costing revenue."
              />
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      <RecordForm
        open={editing}
        onOpenChange={setEditing}
        title="Edit customer"
        table="customers"
        recordId={customerId}
        initialValues={customer}
        fields={customerFields}
        invalidateKeys={[["customer", customerId], ["customers"]]}
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
          defaults={{ customer_id: customerId }}
          invalidateKeys={[["customer-related", customerId]]}
        />
      )}
    </>
  );
}
