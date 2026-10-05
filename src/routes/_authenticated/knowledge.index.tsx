import { createFileRoute } from "@tanstack/react-router";
import { MasterRecordList } from "@/components/app/MasterRecordList";
import { parseRecordListSearch } from "@/lib/record-lists";

export const Route = createFileRoute("/_authenticated/knowledge/")({
  validateSearch: parseRecordListSearch,
  head: () => ({
    meta: [
      { title: "Knowledge Hub — HEG Commercial Intelligence Hub" },
      {
        name: "description",
        content: "Written-down know-how that would otherwise live only in people's heads.",
      },
      { property: "og:title", content: "Knowledge Hub — HEG Commercial Intelligence Hub" },
      {
        property: "og:description",
        content: "Institutional knowledge for HazMat Environmental Group.",
      },
    ],
  }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <MasterRecordList
      table="knowledge_articles"
      search={search}
      onChange={(patch) => {
        void navigate({ search: (previous) => ({ ...previous, ...patch }) });
      }}
    />
  );
}
