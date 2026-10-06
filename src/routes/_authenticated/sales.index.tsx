import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { MasterRecordList } from "@/components/app/MasterRecordList";
import { parseRecordListSearch } from "@/lib/record-lists";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCustomerOptions } from "@/components/app/QuickCreate";
import { opportunityFields, lostBusinessFields } from "@/lib/entities";

export const Route = createFileRoute("/_authenticated/sales/")({
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) => ({
    ...parseRecordListSearch(search),
    section: search["section"] === "lost" ? "lost" : "pipeline",
  }),
  head: () => ({
    meta: [
      { title: "Sales Center — HEG Commercial Intelligence Hub" },
      {
        name: "description",
        content: "Pipeline, opportunities and the business HEG could not serve.",
      },
      { property: "og:title", content: "Sales Center — HEG Commercial Intelligence Hub" },
      {
        property: "og:description",
        content: "Commercial pipeline for HazMat Environmental Group.",
      },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: customerOptions = [] } = useCustomerOptions();
  return (
    <>
      <Tabs
        value={search.section}
        onValueChange={(section) => {
          void navigate({
            search: {
              q: undefined,
              field: undefined,
              filterField: undefined,
              filterValue: undefined,
              groupBy: undefined,
              sort: undefined,
              ascending: false,
              page: 0,
              view: "list",
              archived: false,
              section,
            },
          });
        }}
      >
        <TabsList className="px-6">
          <TabsTrigger value="pipeline">Opportunities</TabsTrigger>
          <TabsTrigger value="lost">Lost business</TabsTrigger>
        </TabsList>
      </Tabs>
      <MasterRecordList
        key={search.section}
        table={search.section === "lost" ? "lost_business" : "opportunities"}
        search={search}
        fields={[
          {
            name: "customer_id",
            label: "Customer",
            type: "select",
            required: search.section !== "lost",
            options: customerOptions,
            section: "Basic information",
          },
          ...(search.section === "lost" ? lostBusinessFields : opportunityFields),
        ]}
        onChange={(patch) => {
          void navigate({ search: (previous) => ({ ...previous, ...patch }) });
        }}
      />
    </>
  );
}
