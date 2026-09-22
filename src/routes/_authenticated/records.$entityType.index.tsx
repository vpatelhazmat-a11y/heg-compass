import { createFileRoute } from "@tanstack/react-router";
import { RecordListPage } from "@/components/app/RecordWorkspace";

export const Route = createFileRoute("/_authenticated/records/$entityType/")({
  validateSearch: (search: Record<string, unknown>) => ({
    parent: typeof search["parent"] === "string" ? search["parent"] : undefined,
    parentId: typeof search["parentId"] === "string" ? search["parentId"] : undefined,
  }),
  component: RecordListRoute,
});
function RecordListRoute() {
  const { entityType } = Route.useParams();
  const { parent, parentId } = Route.useSearch();
  return <RecordListPage table={entityType} parent={parent} parentId={parentId} />;
}
