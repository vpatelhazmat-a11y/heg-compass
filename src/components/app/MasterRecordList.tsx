import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { RecordCreationLayout, RecordListPage } from "./RecordWorkspace";
import type { FieldConfig } from "./RecordForm";
import { RecordCreator } from "./RecordCreator";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { recordHref } from "@/lib/record-registry";
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
  const returnTo =
    typeof window === "undefined" ? undefined : window.location.pathname + window.location.search;
  if (creating && canEdit(table))
    return (
      <RecordCreationLayout table={table} returnTo={returnTo}>
        <RecordCreator
          onClose={() => setCreating(false)}
          table={table}
          fields={fields}
          onSaved={(row) => void navigate({ to: recordHref(table, row.id, returnTo) })}
        />
      </RecordCreationLayout>
    );
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
          ) : (
            false
          )
        }
      />
    </>
  );
}
