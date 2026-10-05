import { createFileRoute } from "@tanstack/react-router";
import { MasterRecordList } from "@/components/app/MasterRecordList";
import { parseRecordListSearch } from "@/lib/record-lists";

export const Route = createFileRoute("/_authenticated/tasks/")({
  validateSearch: parseRecordListSearch,
  head: () => ({
    meta: [
      { title: "Tasks — HEG Commercial Intelligence Hub" },
      {
        name: "description",
        content: "Follow-ups and commitments across customers, bids and safety.",
      },
      { property: "og:title", content: "Tasks — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Task tracking for HazMat Environmental Group." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <MasterRecordList
      table="tasks"
      search={search}
      onChange={(patch) => {
        void navigate({ search: (previous) => ({ ...previous, ...patch }) });
      }}
    />
  );
}
