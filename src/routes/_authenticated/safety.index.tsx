import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { MasterRecordList } from "@/components/app/MasterRecordList";
import { parseRecordListSearch } from "@/lib/record-lists";
import { useSession } from "@/hooks/use-session";
import { EmptyState } from "@/components/app/EmptyState";
import { PageHeader } from "@/components/app/PageHeader";

export const Route = createFileRoute("/_authenticated/safety/")({
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) => ({
    ...parseRecordListSearch(search),
    section: search["section"] === "actions" ? "actions" : "incidents",
  }),
  head: () => ({
    meta: [
      { title: "Safety Center — HEG Commercial Intelligence Hub" },
      {
        name: "description",
        content: "Incidents and corrective actions in one place.",
      },
      { property: "og:title", content: "Safety Center — HEG Commercial Intelligence Hub" },
      {
        property: "og:description",
        content: "Safety and compliance oversight for HazMat Environmental Group.",
      },
    ],
  }),
  component: SafetyPage,
});

function SafetyPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { canViewSafety, hasAnyRole } = useSession();
  if (!canViewSafety && !hasAnyRole(["operations"]))
    return (
      <>
        <PageHeader title="Safety" />
        <div className="p-6">
          <EmptyState
            title="You don't have access to safety information"
            description="Safety records are limited to Safety, Operations, Management and Administrator roles."
          />
        </div>
      </>
    );
  return (
    <>
      <MasterRecordList
        key={search.section}
        table={search.section === "actions" ? "corrective_actions" : "incidents"}
        creatable={search.section !== "actions"}
        search={search}
        onChange={(patch) => {
          void navigate({ search: (previous) => ({ ...previous, ...patch }) });
        }}
      />
    </>
  );
}
