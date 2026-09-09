import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, type Column } from "@/components/app/DataTable";
import { StatusBadge } from "@/components/app/StatusBadge";
import { listRows } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/sites/")({
  head: () => ({
    meta: [
      { title: "Sites — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Every customer location HEG services, with access, safety and route knowledge." },
      { property: "og:title", content: "Sites — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Site master records for HazMat Environmental Group." },
    ],
  }),
  component: SitesPage,
});

function SitesPage() {
  const navigate = useNavigate();
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["sites-all"],
    queryFn: () =>
      listRows("sites", {
        select: "*, customers(legal_name)",
        order: { column: "site_name", ascending: true },
      }),
  });

  const columns: Column[] = [
    { key: "site_name", header: "Site" },
    { key: "customer", header: "Customer", value: (row) => row.customers?.legal_name ?? "" },
    { key: "city", header: "City" },
    { key: "state", header: "State" },
    { key: "site_type", header: "Type" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Sites"
        description="Locations HEG picks up from and delivers to, including access, safety and routing knowledge."
      />
      <div className="p-6">
        <DataTable
          columns={columns}
          rows={data}
          isLoading={isLoading}
          error={error}
          searchPlaceholder="Search sites, cities, customers"
          exportName="heg-sites"
          onRowClick={(row) => navigate({ to: "/sites/$siteId", params: { siteId: row.id as string } })}
          emptyTitle="No sites yet"
          emptyDescription="Sites are added from a customer's record so they always stay linked to the right customer."
        />
      </div>
    </>
  );
}
