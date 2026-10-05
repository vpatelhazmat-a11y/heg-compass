import { createFileRoute } from "@tanstack/react-router";
import { MasterRecordList } from "@/components/app/MasterRecordList";
import { parseRecordListSearch } from "@/lib/record-lists";

export const Route = createFileRoute("/_authenticated/sites/")({
  validateSearch: parseRecordListSearch,
  head: () => ({
    meta: [
      { title: "Sites — HEG Commercial Intelligence Hub" },
      {
        name: "description",
        content: "Every customer location HEG services, with access, safety and route knowledge.",
      },
      { property: "og:title", content: "Sites — HEG Commercial Intelligence Hub" },
      {
        property: "og:description",
        content: "Site master records for HazMat Environmental Group.",
      },
    ],
  }),
  component: SitesPage,
});

function SitesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <MasterRecordList
      table="sites"
      search={search}
      onChange={(patch) => {
        void navigate({ search: (previous) => ({ ...previous, ...patch }) });
      }}
    />
  );
}
