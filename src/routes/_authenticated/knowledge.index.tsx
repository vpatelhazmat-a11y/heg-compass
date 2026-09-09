import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable } from "@/components/app/DataTable";
import { RecordForm } from "@/components/app/RecordForm";
import { Button } from "@/components/ui/button";
import { listRows } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/knowledge/")({
  head: () => ({
    meta: [
      { title: "Knowledge Hub — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Written-down know-how that would otherwise live only in people's heads." },
      { property: "og:title", content: "Knowledge Hub — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Institutional knowledge for HazMat Environmental Group." },
    ],
  }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const { canWrite } = useSession();
  const [creating, setCreating] = useState(false);
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["knowledge"],
    queryFn: () => listRows("knowledge_articles", { order: { column: "updated_at", ascending: false } }),
  });

  return (
    <>
      <PageHeader
        title="Knowledge Hub"
        description="Procedures, lessons learned and the answers people currently keep in their heads."
        actions={
          canWrite ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              New article
            </Button>
          ) : null
        }
      />
      <div className="p-6">
        <DataTable
          columns={[
            { key: "title", header: "Title" },
            { key: "category", header: "Category" },
            { key: "updated_at", header: "Last updated", render: (row) => formatDate(row.updated_at) },
          ]}
          rows={data}
          isLoading={isLoading}
          error={error}
          emptyTitle="Nothing written down yet"
          emptyDescription="Capture how HEG actually does things — the knowledge that usually leaves with people."
          emptyAction={canWrite ? <Button onClick={() => setCreating(true)}>Write the first article</Button> : undefined}
        />
      </div>
      <RecordForm
        open={creating}
        onOpenChange={setCreating}
        title="New knowledge article"
        table="knowledge_articles"
        fields={[
          { name: "title", label: "Title", required: true, section: "Article" },
          { name: "category", label: "Category", section: "Article" },
          { name: "summary", label: "Summary", type: "textarea", section: "Article" },
          { name: "body", label: "Article", type: "textarea", section: "Article", full: true },
        ]}
        invalidateKeys={[["knowledge"]]}
      />
    </>
  );
}
