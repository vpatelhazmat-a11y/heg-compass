import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { RELATED_LISTS, relatedLists } from "@/lib/record-registry";
import { countRelatedRecords } from "@/lib/record-lists";

/** Secondary relationships stay collapsed so the main sheet remains quiet. */
export function RelatedRecords({ table, id }: { table: string; id: string }) {
  const [open, setOpen] = useState(false);
  const primary = new Set((RELATED_LISTS[table] ?? []).map((relation) => relation.table));
  const relations = relatedLists(table).filter((relation) => !primary.has(relation.table));
  const counts = useQueries({
    queries: relations.map((relation) => ({
      queryKey: ["related-count", table, id, relation.table],
      queryFn: () => countRelatedRecords(relation.table, table, id),
      enabled: open,
    })),
  });
  if (!relations.length) return null;
  return (
    <details
      className="record-related-panel"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>Related records</summary>
      <div className="record-related-links">
        {relations.map((relation, index) => (
          <div key={relation.table}>
            <Link
              aria-label={`${relation.label}, ${counts[index]?.isPending ? "count loading" : counts[index]?.isError ? "count unavailable" : `${counts[index]?.data} records`}`}
              to="/records/$entityType"
              params={{ entityType: relation.table }}
              search={{
                parent: table,
                parentId: id,
                view: "list",
                page: 0,
                archived: false,
                ascending: false,
                sort: undefined,
                q: undefined,
                field: undefined,
                filterField: undefined,
                filterValue: undefined,
                groupBy: undefined,
                folder: undefined,
              }}
            >
              <span>{relation.label}</span>
              <span className="tabular">
                {counts[index]?.isPending
                  ? "…"
                  : counts[index]?.isError
                    ? "—"
                    : counts[index]?.data}
              </span>
            </Link>
            {counts[index]?.isError && (
              <button
                type="button"
                onClick={() => void counts[index]?.refetch()}
                aria-label={`Retry ${relation.label} count`}
              >
                Retry count
              </button>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}
