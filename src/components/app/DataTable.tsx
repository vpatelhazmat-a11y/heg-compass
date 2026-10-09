import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  List,
  Settings2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState, LoadingState } from "./EmptyState";
import type { Row } from "@/lib/data";
import { recordHref, recordLabel, RELATION_TARGETS } from "@/lib/record-registry";
import { RecordLink } from "./RecordLink";
import { downloadCsv } from "@/lib/csv";
import { useSession } from "@/hooks/use-session";
import { SavedViews } from "./SavedViews";

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
  onRetry,
  onRowClick,
  recordTable,
  returnTo,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  toolbar,
  searchPlaceholder = "Search",
  exportName,
  pageSize = 25,
  bare = false,
  embedded = false,
  groupingField,
  serverSort,
}: {
  columns: Column[];
  rows: Row[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRowClick?: ((row: Row) => void) | undefined;
  recordTable?: string | undefined;
  returnTo?: string | undefined;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  toolbar?: ReactNode;
  searchPlaceholder?: string;
  exportName?: string;
  pageSize?: number;
  bare?: boolean;
  embedded?: boolean;
  groupingField?: string | undefined;
  serverSort?: {
    key?: string | undefined;
    asc: boolean;
    onChange: (key: string, asc: boolean) => void;
  };
}) {
  const { session } = useSession();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: string; asc: boolean } | null>(null);
  const displayedSort = serverSort ?? sort;
  const [page, setPage] = useState(0);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [searchField, setSearchField] = useState("");
  const [filterField, setFilterField] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [groupBy, setGroupBy] = useState("");
  const [view, setView] = useState<"list" | "cards">("list");
  const [searchOptionsOpen, setSearchOptionsOpen] = useState(false);
  const activeGroupBy = bare ? (groupingField ?? "") : groupBy;
  const selectedColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
  const visibleColumns = selectedColumns.length ? selectedColumns : columns;
  const originHref =
    returnTo ??
    (embedded && typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : undefined);
  const primaryLink = Boolean(
    recordTable &&
    visibleColumns[0] &&
    !RELATION_TARGETS[
      visibleColumns[0].key.endsWith("_id") ? visibleColumns[0].key : `${visibleColumns[0].key}_id`
    ],
  );
  const openRow = recordTable
    ? (row: Row) => navigate({ to: recordHref(recordTable, row.id, originHref) })
    : onRowClick;

  const cellValue = (row: Row, column: Column) => {
    const raw = column.value ? column.value(row) : row[column.key];
    return raw === null || raw === undefined ? "" : String(raw);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const selectedFilter = columns.find((column) => column.key === filterField);
    return rows.filter(
      (row) =>
        (!term ||
          columns.some(
            (column) =>
              (!searchField || column.key === searchField) &&
              cellValue(row, column).toLowerCase().includes(term),
          )) &&
        (!selectedFilter ||
          !filterValue ||
          cellValue(row, selectedFilter).toLowerCase() === filterValue.toLowerCase()),
    );
  }, [rows, search, searchField, filterField, filterValue, columns]);

  const sorted = useMemo(() => {
    if (!sort && !activeGroupBy) return filtered;
    const column = columns.find((c) => c.key === sort?.key);
    const grouping = columns.find((c) => c.key === activeGroupBy);
    return [...filtered].sort((a, b) => {
      if (grouping) {
        const groupCompare = cellValue(a, grouping).localeCompare(cellValue(b, grouping));
        if (groupCompare) return groupCompare;
      }
      if (!column) return 0;
      const av = cellValue(a, column);
      const bv = cellValue(b, column);
      const an = Number(av);
      const bn = Number(bv);
      const cmp =
        av !== "" && bv !== "" && !Number.isNaN(an) && !Number.isNaN(bn)
          ? an - bn
          : av.localeCompare(bv);
      return sort?.asc ? cmp : -cmp;
    });
  }, [filtered, sort, activeGroupBy, columns]);

  const filterColumn = columns.find((column) => column.key === filterField);
  const filterOptions = filterColumn
    ? [...new Set(rows.map((row) => cellValue(row, filterColumn)).filter(Boolean))].sort()
    : [];
  const groupColumn = columns.find((column) => column.key === activeGroupBy);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const visible = sorted.slice(current * pageSize, current * pageSize + pageSize);

  const exportCsv = () => {
    downloadCsv(
      exportName ?? "export",
      visibleColumns.map((column) => column.header),
      sorted.map((row) => visibleColumns.map((column) => cellValue(row, column))),
    );
  };

  if (isLoading) return <LoadingState />;
  if (error)
    return (
      <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={onRetry} />
    );

  return (
    <div className="workspace-table">
      {!bare && !embedded && (
        <div className="table-tools flex flex-wrap items-center gap-2">
          <div className="relative flex min-w-[180px] max-w-xl flex-1 items-center">
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
              className="pl-9 pr-9"
            />
            <button
              type="button"
              aria-label="Search options"
              aria-expanded={searchOptionsOpen}
              onClick={() => setSearchOptionsOpen((open) => !open)}
              className="absolute right-1 grid h-7 w-7 place-items-center rounded hover:bg-muted"
            >
              <ChevronDown className="h-4 w-4" aria-hidden />
            </button>
            {searchOptionsOpen && (
              <div className="table-search-options">
                <label>
                  Search in
                  <select
                    value={searchField}
                    onChange={(event) => {
                      setSearchField(event.target.value);
                      setPage(0);
                    }}
                  >
                    <option value="">All fields</option>
                    {columns.map((column) => (
                      <option key={column.key} value={column.key}>
                        {column.header}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Filter
                  <select
                    value={filterField}
                    onChange={(event) => {
                      setFilterField(event.target.value);
                      setFilterValue("");
                      setPage(0);
                    }}
                  >
                    <option value="">All records</option>
                    {columns.map((column) => (
                      <option key={column.key} value={column.key}>
                        {column.header}
                      </option>
                    ))}
                  </select>
                </label>
                {filterField && (
                  <label>
                    Value
                    <select
                      value={filterValue}
                      onChange={(event) => {
                        setFilterValue(event.target.value);
                        setPage(0);
                      }}
                    >
                      <option value="">All values</option>
                      {filterOptions.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  Group by
                  <select
                    value={groupBy}
                    onChange={(event) => {
                      setGroupBy(event.target.value);
                      setSort(null);
                      setPage(0);
                    }}
                  >
                    <option value="">No grouping</option>
                    {columns.map((column) => (
                      <option key={column.key} value={column.key}>
                        {column.header}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
          {exportName && (
            <SavedViews
              userId={session?.userId}
              scope={exportName}
              value={{ search, searchField, filterField, filterValue, groupBy, view }}
              onApply={(saved) => {
                setSearch(saved.search);
                setSearchField(saved.searchField);
                setFilterField(saved.filterField);
                setFilterValue(saved.filterValue);
                setGroupBy(saved.groupBy);
                setView(saved.view);
                setSort(null);
                setPage(0);
              }}
            />
          )}
          <span className="table-count" aria-live="polite">
            {sorted.length
              ? `${current * pageSize + 1}–${Math.min(sorted.length, (current + 1) * pageSize)} of ${sorted.length}`
              : "0 records"}
          </span>
          <div className="table-pager">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous page"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next page"
              disabled={current >= pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
          <div className="record-list-view" aria-label="View mode">
            <button
              type="button"
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Card view"
              aria-pressed={view === "cards"}
              onClick={() => setView("cards")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="List actions">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={visibleColumns.some((visible) => visible.key === column.key)}
                  disabled={visibleColumns.length === 1 && visibleColumns[0]?.key === column.key}
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={(checked) =>
                    setHiddenColumns((previous) =>
                      checked
                        ? previous.filter((key) => key !== column.key)
                        : [...previous, column.key],
                    )
                  }
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ))}
              {exportName && rows.length > 0 && (
                <DropdownMenuItem onSelect={exportCsv}>
                  <Download className="h-4 w-4" aria-hidden /> Export filtered results
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {toolbar}
        </div>
      )}
      {!bare && (filterValue || groupBy) && (
        <div className="table-active-filters">
          {filterValue && (
            <button
              type="button"
              onClick={() => {
                setFilterField("");
                setFilterValue("");
                setPage(0);
              }}
            >
              {filterColumn?.header}: {filterValue} <span aria-hidden>×</span>
            </button>
          )}
          {groupBy && (
            <button
              type="button"
              onClick={() => {
                setGroupBy("");
                setPage(0);
              }}
            >
              Grouped by {groupColumn?.header} <span aria-hidden>×</span>
            </button>
          )}
        </div>
      )}

      {rows.length === 0 ? (
        embedded ? (
          <div className="py-3 text-sm text-muted-foreground">
            <p>{emptyTitle}</p>
            {emptyDescription && <p className="mt-1 text-xs">{emptyDescription}</p>}
            {emptyAction && <div className="mt-2">{emptyAction}</div>}
          </div>
        ) : (
          <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
        )
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No matches"
          description={
            search
              ? `Nothing matches "${search}". Try a different search.`
              : "No records match this filter."
          }
        />
      ) : view === "cards" && !bare ? (
        <div className="record-list-cards">
          {visible.map((row, index) => {
            const group = groupColumn ? cellValue(row, groupColumn) || "Not set" : null;
            const previous = index ? visible[index - 1] : null;
            const showGroup =
              group &&
              (!previous || cellValue(previous, groupColumn!) !== cellValue(row, groupColumn!));
            return (
              <Fragment key={(row.id as string) ?? index}>
                {showGroup && (
                  <h3 className="record-list-group-heading">
                    {groupColumn?.header}: {group}
                  </h3>
                )}
                {recordTable ? (
                  <Link
                    className="record-list-card"
                    to={recordHref(recordTable, row.id, originHref)}
                  >
                    <strong>{recordLabel(recordTable, row)}</strong>
                    {visibleColumns.slice(1, 5).map((column) => (
                      <span key={column.key}>
                        <small>{column.header}</small>
                        {cellValue(row, column) || "—"}
                      </span>
                    ))}
                  </Link>
                ) : onRowClick ? (
                  <button
                    type="button"
                    className="record-list-card text-left"
                    onClick={() => onRowClick(row)}
                  >
                    <strong>{cellValue(row, visibleColumns[0]!) || "Record"}</strong>
                    {visibleColumns.slice(1, 5).map((column) => (
                      <span key={column.key}>
                        <small>{column.header}</small>
                        {cellValue(row, column) || "—"}
                      </span>
                    ))}
                  </button>
                ) : (
                  <div className="record-list-card" role="group">
                    <strong>{cellValue(row, visibleColumns[0]!) || "Record"}</strong>
                    {visibleColumns.slice(1, 5).map((column) => (
                      <span key={column.key}>
                        <small>{column.header}</small>
                        {cellValue(row, column) || "—"}
                      </span>
                    ))}
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      ) : (
        <div
          className={cn(
            "table-frame overflow-hidden bg-surface",
            !embedded && "border border-border",
          )}
        >
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-secondary">
                <tr>
                  {visibleColumns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={
                        displayedSort?.key === column.key
                          ? displayedSort.asc
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                      className={cn(
                        "border-b border-border px-4 py-2.5 text-left text-xs font-medium text-muted-foreground",
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
                          onClick={() => {
                            const asc =
                              displayedSort?.key === column.key ? !displayedSort.asc : true;
                            if (serverSort) serverSort.onChange(column.key, asc);
                            else setSort({ key: column.key, asc });
                            setPage(0);
                          }}
                        >
                          {column.header}
                          {displayedSort?.key === column.key ? (
                            displayedSort.asc ? (
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
                  {recordTable && !primaryLink && (
                    <th scope="col" className="px-4 py-2.5">
                      <span className="sr-only">Open record</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {visible.map((row, index) => (
                  <Fragment key={(row.id as string) ?? index}>
                    {groupColumn &&
                      (index === 0 ||
                        cellValue(visible[index - 1], groupColumn) !==
                          cellValue(row, groupColumn)) && (
                        <tr className="record-list-group-row">
                          <th
                            scope="rowgroup"
                            colSpan={visibleColumns.length + (recordTable && !primaryLink ? 1 : 0)}
                          >
                            {groupColumn.header}: {cellValue(row, groupColumn) || "Not set"}
                          </th>
                        </tr>
                      )}
                    <tr
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
                      {visibleColumns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            "px-4 py-2.5 align-middle text-foreground",
                            column.align === "right" && "text-right tabular",
                            column.className,
                          )}
                        >
                          {primaryLink && recordTable && column === visibleColumns[0] ? (
                            <Link
                              to={recordHref(recordTable, row.id, originHref)}
                              aria-label={`Open record: ${recordLabel(recordTable, row)}`}
                              onClick={(event) => event.stopPropagation()}
                              className="font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {column.render
                                ? column.render(row)
                                : cellValue(row, column) || recordLabel(recordTable, row)}
                            </Link>
                          ) : RELATION_TARGETS[
                              column.key.endsWith("_id") ? column.key : `${column.key}_id`
                            ] &&
                            row[column.key.endsWith("_id") ? column.key : `${column.key}_id`] ? (
                            <RecordLink
                              compact
                              returnTo={originHref}
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
                            cellValue(row, column) || (
                              <span className="text-muted-foreground">—</span>
                            )
                          )}
                        </td>
                      ))}
                      {recordTable && !primaryLink && (
                        <td className="px-4 py-2.5 text-right">
                          <Link
                            to={recordHref(recordTable, row.id, originHref)}
                            aria-label={`Open record: ${recordLabel(recordTable, row)}`}
                            onClick={(event) => event.stopPropagation()}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Open<span className="sr-only"> record</span> ↗
                          </Link>
                        </td>
                      )}
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {embedded && pageCount > 1 && (
        <div className="record-list-pager">
          <span aria-live="polite">
            {current * pageSize + 1}–{Math.min(sorted.length, (current + 1) * pageSize)} of{" "}
            {sorted.length}
          </span>
          <button
            type="button"
            aria-label="Previous page"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next page"
            disabled={current + 1 >= pageCount}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
