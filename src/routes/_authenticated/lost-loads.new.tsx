import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordCreationLayout } from "@/components/app/RecordWorkspace";
import { recordHref, recordReturnHref } from "@/lib/record-registry";
import { EmptyState } from "@/components/app/EmptyState";
import { RefusedLoadForm } from "@/components/app/RefusedLoadForm";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/lost-loads/new")({
  validateSearch: (search: Record<string, unknown>): { returnTo?: string } =>
    typeof search["returnTo"] === "string"
      ? { returnTo: recordReturnHref("refused_loads", search["returnTo"]) }
      : {},
  head: () => ({
    meta: [
      { title: "Refused Load Data Entry — HEG Commercial Intelligence Hub" },
      {
        name: "description",
        content: "Record a refused load so lost revenue and capacity constraints are measured.",
      },
      {
        property: "og:title",
        content: "Refused Load Data Entry — HEG Commercial Intelligence Hub",
      },
      {
        property: "og:description",
        content: "Fast entry of refused loads for lost revenue analysis.",
      },
    ],
  }),
  component: RefusedLoadEntry,
});

export function RefusedLoadEntry() {
  const { canEdit } = useSession();
  const canWrite = canEdit("refused_loads");
  const navigate = useNavigate();
  const { returnTo } = Route.useSearch();
  const list = recordReturnHref("refused_loads", returnTo);

  return (
    <RecordCreationLayout table="refused_loads" returnTo={list}>
      {canWrite ? (
        <RefusedLoadForm
          onSaved={(row, mode) => {
            if (mode === "view") void navigate({ to: recordHref("refused_loads", row.id, list) });
          }}
          onCancel={() => void navigate({ to: list })}
        />
      ) : (
        <EmptyState
          title="You have view-only access"
          description="An administrator can give you permission to record refused loads."
        />
      )}
    </RecordCreationLayout>
  );
}
