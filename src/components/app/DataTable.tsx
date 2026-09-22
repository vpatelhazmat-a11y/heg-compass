import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState, LoadingState } from "./EmptyState";
import type { Row } from "@/lib/data";
import { recordHref, recordLabel, RELATION_TARGETS } from "@/lib/record-registry";
import { RecordLink } from "./RecordLink";

export type Column = {
  key: string;
  header: string;
  render?: (row: Row) => ReactNode;
  value?: (row: Row) => string | number | null | undefined;
  align?: "left" | "right";
  className?: string;
  sortable?: boolean;
};

export function DataTable({
  columns,
  rows,
  isLoading,
  error,
  onRowClick,
  recordTable,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  toolbar,
  searchPlaceholder = "Search",
  exportName,
  pageSize = 25,
}: {
  columns: Column[];
  rows: Row[];
  isLoading?: boolean;
  error?: unknown;
  onRowClick?: ((row: Row) => void) | undefined;
  recordTable?: string | undefined;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  toolbar?: ReactNode;
  searchPlaceholder?: string;
  exportName?: string;
  pageSize?: number;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: string; asc: boolean } | null>(null);
  const [page, setPage] = useState(0);
  const openRow = recordTable
    ? (row: Row) => window.location.assign(recordHref(recordTable, row.id))
    : onRowClick;

  const cellValue = (row: Row, column: Column) => {
    const raw = column.value ? column.value(row) : row[column.key];
    return raw === null || raw === undefined ? "" : String(raw);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      columns.some((column) => cellValue(row, column).toLowerCase().includes(term)),
    );
  }, [rows, search, columns]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const column = columns.find((c) => c.key === sort.key);
    if (!column) return filtered;
    return [...filtered].sort((a, b) => {
      const av = cellValue(a, column);
      const bv = cellValue(b, column);
      const an = Number(av);
      const bn = Number(bv);
      const cmp =
        av !== "" && bv !== "" && !Number.isNaN(an) && !Number.isNaN(bn)
          ? an - bn
          : av.localeCompare(bv);
      return sort.asc ? cmp : -cmp;
    });
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const visible = sorted.slice(current * pageSize, current * pageSize + pageSize);

  const exportCsv = () => {
    const header = columns.map((c) => `"${c.header}"`).join(",");
    const body = sorted
      .map((row) => columns.map((c) => `"${cellValue(row, c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportName ?? "export"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error instanceof Error ? error.message : undefined} />;

  return (
    <div className="workspace-table">
      <div className="table-tools flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] max-w-lg flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-9"
          />
        </div>
        <span className="table-count" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "record" : "records"}
        </span>
        {toolbar}
        {exportName && rows.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" aria-hidden />
            Export
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No matches"
          description={`Nothing matches "${search}". Try a different search.`}
        />
      ) : (
        <div className="table-frame overflow-hidden rounded-lg border border-border bg-surface">
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-secondary">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={cn(
                        "border-b border-border px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                        column.align === "right" && "text-right",
                        column.className,
                      )}
                    >
                      {column.sortable === false ? (
                        column.header
                      ) : (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 hover:text-foreground"
                          onClick={() =>
                            setSort((prev) =>
                              prev?.key === column.key
                                ? { key: column.key, asc: !prev.asc }
                                : { key: column.key, asc: true },
                            )
                          }
                        >
                          {column.header}
                          {sort?.key === column.key ? (
                            sort.asc ? (
                              <ArrowUp className="h-3 w-3" aria-hidden />
                            ) : (
                              <ArrowDown className="h-3 w-3" aria-hidden />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 opacity-40" aria-hidden />
                          )}
                        </button>
                      )}
                    </th>
                  ))}
                  {recordTable && (
                    <th scope="col" className="px-4 py-2.5">
                      <span className="sr-only">Open record</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {visible.map((row, index) => (
                  <tr
                    key={(row.id as string) ?? index}
                    className={cn(
                      "border-b border-border last:border-0",
                      openRow && "cursor-pointer hover:bg-accent/60 focus-within:bg-accent/60",
                    )}
                    onClick={
                      openRow
                        ? (event) => {
                            if (
                              !(event.target as HTMLElement).closest(
                                "a,button,input,select,textarea",
                              )
                            )
                              openRow(row);
                          }
                        : undefined
                    }
                    tabIndex={openRow ? 0 : undefined}
                    onKeyDown={
                      openRow
                        ? (event) => {
                            if (event.key === "Enter" && event.target === event.currentTarget)
                              openRow(row);
                          }
                        : undefined
                    }
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "px-4 py-2.5 align-middle text-foreground",
                          column.align === "right" && "text-right tabular",
                          column.className,
                        )}
                      >
                        {RELATION_TARGETS[
                          column.key.endsWith("_id") ? column.key : `${column.key}_id`
                        ] && row[column.key.endsWith("_id") ? column.key : `${column.key}_id`] ? (
                          <RecordLink
                            table={
                              RELATION_TARGETS[
                                column.key.endsWith("_id") ? column.key : `${column.key}_id`
                              ]!
                            }
                            id={row[column.key.endsWith("_id") ? column.key : `${column.key}_id`]}
                            label={
                              column.value
                                ? String(column.value(row) ?? "") || undefined
                                : undefined
                            }
                          />
                        ) : column.render ? (
                          column.render(row)
                        ) : (
                          cellValue(row, column) || <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    ))}
                    {recordTable && (
                      <td className="px-4 py-2.5 text-right">
                        <a
                          href={recordHref(recordTable, row.id)}
                          aria-label={`Open record: ${recordLabel(recordTable, row)}`}
                          onClick={(event) => event.stopPropagation()}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Open<span className="sr-only"> record</span> ↗
                        </a>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sorted.length > pageSize && (
        <div className="flex items-center justify-between border-t border-border p-3 text-sm text-muted-foreground">
          <span>
            Showing {current * pageSize + 1}–{Math.min(sorted.length, (current + 1) * pageSize)} of{" "}
            {sorted.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={current >= pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
