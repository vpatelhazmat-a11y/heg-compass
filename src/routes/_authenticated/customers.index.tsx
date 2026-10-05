import { createFileRoute } from "@tanstack/react-router";
import { MasterRecordList } from "@/components/app/MasterRecordList";
import { parseRecordListSearch } from "@/lib/record-lists";

export const Route = createFileRoute("/_authenticated/customers/")({
  validateSearch: parseRecordListSearch,
  head: () => ({
    meta: [
      { title: "Customers — HEG Commercial Intelligence Hub" },
      {
        name: "description",
        content: "Every HEG customer, their status, qualification and commercial history.",
      },
      { property: "og:title", content: "Customers — HEG Commercial Intelligence Hub" },
      {
        property: "og:description",
        content: "Customer master records for HazMat Environmental Group.",
      },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <MasterRecordList
      table="customers"
      search={search}
      onChange={(patch) => {
        void navigate({ search: (previous) => ({ ...previous, ...patch }) });
      }}
    />
  );
}
