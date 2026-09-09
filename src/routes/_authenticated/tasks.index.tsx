import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable } from "@/components/app/DataTable";
import { StatusBadge } from "@/components/app/StatusBadge";
import { RecordForm } from "@/components/app/RecordForm";
import { Button } from "@/components/ui/button";
import { listRows } from "@/lib/data";
import { taskFields } from "@/lib/entities";
import { dueLabel, formatDate } from "@/lib/format";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/tasks/")({
  head: () => ({
    meta: [
      { title: "Tasks — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Follow-ups and commitments across customers, bids and safety." },
      { property: "og:title", content: "Tasks — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Task tracking for HazMat Environmental Group." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const { canWrite } = useSession();
  const [creating, setCreating] = useState(false);
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => listRows("tasks", { order: { column: "due_date", ascending: true } }),
  });

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Every commitment in one list, so follow-ups don't live in someone's inbox."
        actions={
          canWrite ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              New task
            </Button>
          ) : null
        }
      />
      <div className="p-6">
        <DataTable
          columns={[
            { key: "title", header: "Task" },
            { key: "priority", header: "Priority", render: (row) => <StatusBadge status={row.priority} /> },
            { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
            {
              key: "due_date",
              header: "Due",
              render: (row) => {
                const due = dueLabel(row.due_date);
                return due.tone === "neutral" ? formatDate(row.due_date) : <StatusBadge status={due.label} tone={due.tone} />;
              },
            },
          ]}
          rows={data}
          isLoading={isLoading}
          error={error}
          exportName="heg-tasks"
          emptyTitle="No tasks yet"
          emptyDescription="Create a task, or add one from a customer, bid or incident."
          emptyAction={canWrite ? <Button onClick={() => setCreating(true)}>Add a task</Button> : undefined}
        />
      </div>
      <RecordForm
        open={creating}
        onOpenChange={setCreating}
        title="New task"
        table="tasks"
        fields={taskFields}
        invalidateKeys={[["tasks"]]}
      />
    </>
  );
}
