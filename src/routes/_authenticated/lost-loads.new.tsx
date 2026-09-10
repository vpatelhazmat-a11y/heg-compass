import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { Panel } from "@/components/app/Panels";
import { EmptyState } from "@/components/app/EmptyState";
import { LostLoadTabs } from "@/components/app/LostLoadTabs";
import { RefusedLoadForm } from "@/components/app/RefusedLoadForm";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/lost-loads/new")({
  head: () => ({
    meta: [
      { title: "Refused Load Data Entry — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Record a refused load so lost revenue and capacity constraints are measured." },
      { property: "og:title", content: "Refused Load Data Entry — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Fast entry of refused loads for lost revenue analysis." },
    ],
  }),
  component: RefusedLoadEntry,
});

function RefusedLoadEntry() {
  const { canWrite } = useSession();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Refused load data entry" description="Enter refused load details for tracking and revenue analysis." />
      <LostLoadTabs />
      <div className="p-6">
        {canWrite ? (
          <Panel title="Refused load" description="Required fields are marked with an asterisk.">
            <RefusedLoadForm
              onSaved={(_row, mode) => {
                if (mode === "view") navigate({ to: "/lost-loads/records" });
              }}
              onCancel={() => navigate({ to: "/lost-loads" })}
            />
          </Panel>
        ) : (
          <EmptyState
            title="You have view-only access"
            description="An administrator can give you permission to record refused loads."
          />
        )}
      </div>
    </>
  );
}
