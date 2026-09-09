import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, type Column } from "@/components/app/DataTable";
import { StatusBadge } from "@/components/app/StatusBadge";
import { RecordForm } from "@/components/app/RecordForm";
import { Button } from "@/components/ui/button";
import { listRows } from "@/lib/data";
import { customerFields } from "@/lib/entities";
import { formatDate, orDash } from "@/lib/format";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/customers/")({
  head: () => ({
    meta: [
      { title: "Customers — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Every HEG customer, their status, qualification and commercial history." },
      { property: "og:title", content: "Customers — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Customer master records for HazMat Environmental Group." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const navigate = useNavigate();
  const { canWrite } = useSession();
  const [creating, setCreating] = useState(false);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["customers"],
    queryFn: () => listRows("customers", { order: { column: "legal_name", ascending: true } }),
  });

  const columns: Column[] = [
    { key: "legal_name", header: "Customer" },
    { key: "dba_name", header: "Doing business as" },
    { key: "industry", header: "Industry" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "qualification_status",
      header: "Qualification",
      render: (row) => <StatusBadge status={row.qualification_status} />,
    },
    { key: "customer_since", header: "Customer since", render: (row) => formatDate(row.customer_since) },
    { key: "data_quality_status", header: "Data quality", render: (row) => orDash(row.data_quality_status) },
  ];

  return (
    <>
      <PageHeader
        title="Customers"
        description="The commercial record for every customer — status, qualification, sites, rates and history."
        actions={
          canWrite ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              New customer
            </Button>
          ) : null
        }
      />

      <div className="p-6">
        <DataTable
          columns={columns}
          rows={data}
          isLoading={isLoading}
          error={error}
          searchPlaceholder="Search customers"
          exportName="heg-customers"
          onRowClick={(row) => navigate({ to: "/customers/$customerId", params: { customerId: row.id as string } })}
          emptyTitle="No customers yet"
          emptyDescription="Add your first customer, or bring existing customer information in through the Import Center."
          emptyAction={canWrite ? <Button onClick={() => setCreating(true)}>Add a customer</Button> : undefined}
        />
      </div>

      <RecordForm
        open={creating}
        onOpenChange={setCreating}
        title="New customer"
        description="Only the legal name is required. Leave anything you're unsure about blank rather than guessing."
        table="customers"
        fields={customerFields}
        invalidateKeys={[["customers"]]}
      />
    </>
  );
}
