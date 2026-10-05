import { createFileRoute } from "@tanstack/react-router";
import { MasterRecordList } from "@/components/app/MasterRecordList";
import { parseRecordListSearch } from "@/lib/record-lists";

export const Route = createFileRoute("/_authenticated/equipment/")({
  validateSearch: parseRecordListSearch,
  head: () => ({
    meta: [
      { title: "Equipment — HEG Commercial Intelligence Hub" },
      {
        name: "description",
        content:
          "Tractors, trailers and specialty equipment with ownership, compliance and assignment.",
      },
      { property: "og:title", content: "Equipment — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Equipment records for HazMat Environmental Group." },
    ],
  }),
  component: EquipmentPage,
});

function EquipmentPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <MasterRecordList
      table="equipment"
      search={search}
      onChange={(patch) => {
        void navigate({ search: (previous) => ({ ...previous, ...patch }) });
      }}
    />
  );
}
