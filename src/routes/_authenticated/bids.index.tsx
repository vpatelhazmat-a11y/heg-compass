import { createFileRoute } from "@tanstack/react-router";
import { MasterRecordList } from "@/components/app/MasterRecordList";
import { parseRecordListSearch } from "@/lib/record-lists";
import { useCustomerOptions } from "@/components/app/QuickCreate";
import { bidFields } from "@/lib/entities";

export const Route = createFileRoute("/_authenticated/bids/")({
  validateSearch: parseRecordListSearch,
  head: () => ({
    meta: [
      { title: "Bid Center — HEG Commercial Intelligence Hub" },
      {
        name: "description",
        content: "Every bid HEG is working, with deadlines, readiness and outcomes.",
      },
      { property: "og:title", content: "Bid Center — HEG Commercial Intelligence Hub" },
      {
        property: "og:description",
        content: "Bid pipeline and deadlines for HazMat Environmental Group.",
      },
    ],
  }),
  component: BidsPage,
});

function BidsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: customerOptions = [] } = useCustomerOptions();
  return (
    <MasterRecordList
      table="bids"
      search={search}
      onChange={(patch) => {
        void navigate({ search: (previous) => ({ ...previous, ...patch }) });
      }}
      fields={[
        {
          name: "customer_id",
          label: "Customer",
          type: "select",
          required: true,
          options: customerOptions,
          section: "Basic information",
        },
        ...bidFields,
      ]}
    />
  );
}
