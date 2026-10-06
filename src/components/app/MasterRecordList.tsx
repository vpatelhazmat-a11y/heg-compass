import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { RecordListPage } from "./RecordWorkspace";
import { RecordForm, type FieldConfig } from "./RecordForm";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { recordDefinition, recordHref } from "@/lib/record-registry";
import { parseRecordListSearch } from "@/lib/record-lists";
type State = ReturnType<typeof parseRecordListSearch>;
export function MasterRecordList({
  table,
  search,
  onChange,
  fields,
  creatable = table !== "sites",
}: {
  table:
    | "customers"
    | "sites"
    | "equipment"
    | "bids"
    | "tasks"
    | "knowledge_articles"
    | "incidents"
    | "corrective_actions"
    | "opportunities"
    | "lost_business";
  fields?: FieldConfig[];
  creatable?: boolean;
  search: State;
  onChange: (patch: Partial<State>) => void;
}) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const { canEdit } = useSession();
  const definition = recordDefinition(table)!;
  return (
    <>
      <RecordListPage
        table={table}
        state={{
          sort: search.sort,
          ascending: search.ascending,
          search: search.q,
          searchField: search.field,
          filterField: search.filterField,
          filterValue: search.filterValue,
          groupBy: search.groupBy,
          view: search.view,
          page: search.page,
          archived: search.archived,
        }}
        onChange={onChange}
        actions={
          creatable && canEdit(table) && !search.archived ? (
            <Button onClick={() => setCreating(true)}>New</Button>
          ) : undefined
        }
      />
      {creatable && (
        <RecordForm
          open={creating}
          onOpenChange={setCreating}
          title={"New " + definition.singular.toLowerCase()}
          table={table}
          fields={fields ?? definition.fields}
          onSaved={(row) =>
            void navigate({
              to: recordHref(table, row.id, window.location.pathname + window.location.search),
            })
          }
        />
      )}
    </>
  );
}
