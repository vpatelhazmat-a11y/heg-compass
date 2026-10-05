import { parseRecordReturn } from "@/lib/record-return";
import { createFileRoute } from "@tanstack/react-router";
import { RecordDetailPage } from "@/components/app/RecordWorkspace";

export const Route = createFileRoute("/_authenticated/records/$entityType/$recordId")({
  validateSearch: parseRecordReturn,
  component: RecordDetailRoute,
});
function RecordDetailRoute() {
  const { entityType, recordId } = Route.useParams();
  const { returnTo } = Route.useSearch();
  return (
    <RecordDetailPage
      returnTo={returnTo}
      key={`${entityType}-${recordId}`}
      table={entityType}
      id={recordId}
    />
  );
}
