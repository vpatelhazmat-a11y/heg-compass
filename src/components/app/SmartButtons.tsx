import { useQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { RELATED_LISTS } from "@/lib/record-registry";
import { countRelatedRecords } from "@/lib/record-lists";

export function SmartButtons({ table, id }: { table: string; id: string }) {
  const relations = Object.hasOwn(RELATED_LISTS, table) ? (RELATED_LISTS[table] ?? []) : [];
  const counts = useQueries({
    queries: relations.map((relation) => ({
      queryKey: ["related-count", table, id, relation.table],
      queryFn: () => countRelatedRecords(relation.table, table, id),
    })),
  });
  if (!relations.length) return null;
  return (
    <nav aria-label="Related records" className="related-buttons flex flex-wrap">
      {relations.map((relation, index) => (
        <Link
          key={relation.table}
          aria-label={`${counts[index]?.isPending ? "Loading" : counts[index]?.isError ? "Count unavailable for" : counts[index]?.data} ${relation.label}`}
          to="/records/$entityType"
          params={{ entityType: relation.table }}
          search={{
            sort: undefined,
            ascending: false,
            parent: table,
            parentId: id,
            q: undefined,
            field: undefined,
            filterField: undefined,
            filterValue: undefined,
            groupBy: undefined,
            view: "list",
            archived: false,
            folder: undefined,
            page: 0,
          }}
          className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm hover:border-primary hover:bg-accent"
        >
          <strong className="tabular text-primary">
            {counts[index]?.isPending ? "…" : counts[index]?.isError ? "—" : counts[index]?.data}
          </strong>
          <span>{relation.label}</span>
        </Link>
      ))}
    </nav>
  );
}
