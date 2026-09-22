import { createFileRoute } from "@tanstack/react-router";
import { RecordDetailPage } from "@/components/app/RecordWorkspace";

export const Route = createFileRoute("/_authenticated/records/$entityType/$recordId")({
  component: RecordDetailRoute,
});
function RecordDetailRoute() {
  const { entityType, recordId } = Route.useParams();
  return <RecordDetailPage key={`${entityType}-${recordId}`} table={entityType} id={recordId} />;
}
