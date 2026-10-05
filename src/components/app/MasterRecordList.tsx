import { useState } from "react";
import { RecordListPage } from "./RecordWorkspace";
import { RecordForm } from "./RecordForm";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { recordDefinition } from "@/lib/record-registry";
import { parseRecordListSearch } from "@/lib/record-lists";
type State = ReturnType<typeof parseRecordListSearch>;
export function MasterRecordList({
  table,
  search,
  onChange,
}: {
  table: "customers" | "sites" | "equipment";
  search: State;
  onChange: (patch: Partial<State>) => void;
}) {
  const [creating, setCreating] = useState(false);
  const { canEdit } = useSession();
  const definition = recordDefinition(table)!;
  return (
    <>
      <RecordListPage
        table={table}
        state={{
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
          table !== "sites" && canEdit(table) && !search.archived ? (
            <Button onClick={() => setCreating(true)}>New</Button>
          ) : undefined
        }
      />
      {table !== "sites" && (
        <RecordForm
          open={creating}
          onOpenChange={setCreating}
          title={"New " + definition.singular.toLowerCase()}
          table={table}
          fields={definition.fields}
        />
      )}
    </>
  );
}
