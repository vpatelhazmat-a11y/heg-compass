import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { StatusBadge } from "./StatusBadge";
import { formatDate, formatMoney, dueLabel } from "@/lib/format";
import { getRow, listRows, type Row } from "@/lib/data";
import {
  recordDefinition,
  recordLabel,
  recordHref,
  recordListHref,
  recordReturnHref,
  recordReturnLabel,
  fieldLabel,
  RELATION_TARGETS,
  editableRelationKeys,
  relationDependsOnCustomer,
} from "@/lib/record-registry";
import {
  isRecordId,
  loadRecordListPage,
  recordListFields,
  recordDefaultOrder,
  type RecordPageRequest,
} from "@/lib/record-lists";
import { useSession } from "@/hooks/use-session";
import { PageHeader } from "./PageHeader";
import { DataTable, type Column } from "./DataTable";
import { SavedViews } from "./SavedViews";
import { EmptyState, ErrorState, LoadingState } from "./EmptyState";
import { RecordLink, RecordRelations } from "./RecordLink";
import { RelatedRecords } from "./RelatedRecords";
import { RecordChatter } from "./RecordChatter";
import { DocumentFile } from "./DocumentFile";
import { RichTextView } from "./RichText";
import { DocumentFolderTree } from "./DocumentFolderTree";
import { ArchiveVisibility, RecordArchiveActions } from "./RecordArchiveActions";
import { SmartButtons } from "./SmartButtons";
import { RecordForm, type FieldConfig } from "./RecordForm";
import { RefusedLoadForm, toFormState } from "./RefusedLoadForm";
import { Button } from "@/components/ui/button";
import { documentFields } from "@/lib/entities";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { downloadCsv } from "@/lib/csv";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutGrid,
  List,
  Plus,
  Search,
  Settings2,
  ChevronDown,
} from "lucide-react";

type ListState = RecordPageRequest & { view?: "list" | "cards" };
type ListPatch = {
  refused?: RecordPageRequest["refused"];
  sort?: string;
  ascending?: boolean;
  archived?: boolean;
  folder?: string | undefined;
  parent?: string | undefined;
  parentId?: string | undefined;
  q?: string;
  field?: string;
  filterField?: string;
  filterValue?: string;
  groupBy?: string;
  view?: "list" | "cards";
  page?: number;
};

export function RecordListPage({
  table,
  parent,
  parentId,
  state = {},
  onChange,
  actions,
  extraFilters,
  activeFilters,
  columns,
}: {
  table: string;
  parent?: string | undefined;
  parentId?: string | undefined;
  state?: ListState;
  onChange?: (patch: ListPatch) => void;
  actions?: ReactNode;
  extraFilters?: ReactNode;
  activeFilters?: ReactNode;
  columns?: Column[];
}) {
  const { session, canEdit } = useSession();
  const navigate = useNavigate();
  const definition = recordDefinition(table);
  const fields = recordListFields(table);
  const returnTo =
    typeof window === "undefined" ? undefined : window.location.pathname + window.location.search;
  const labelFor = (name: string) =>
    definition?.fields.find((field) => field.name === name)?.label ?? fieldLabel(name);
  const [searchInput, setSearchInput] = useState(state.search ?? "");
  const [creatingDocument, setCreatingDocument] = useState(false);
  useEffect(() => setSearchInput(state.search ?? ""), [state.search]);
  useEffect(() => {
    if (searchInput === (state.search ?? "") || !onChange) return;
    const timer = window.setTimeout(() => onChange({ q: searchInput, page: 0 }), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, state.search, onChange]);
  const page = state.page ?? 0;
  const rows = useQuery({
    queryKey: [
      "record-list-page",
      table,
      parent,
      parentId,
      state.search,
      state.searchField,
      state.filterField,
      state.filterValue,
      state.groupBy,
      state.sort,
      state.ascending,
      state.archived,
      state.folder,
      state.refused,
      page,
    ],
    queryFn: () => loadRecordListPage(table, parent, parentId, state),
    enabled: Boolean(definition),
  });
  useEffect(() => {
    if (page > 0 && rows.data && page * 25 >= rows.data.count) {
      onChange?.({ page: Math.max(0, Math.ceil(rows.data.count / 25) - 1) });
    }
  }, [page, rows.data, onChange]);
  if (!definition)
    return (
      <div className="p-6">
        <EmptyState title="Record type not found" />
      </div>
    );
  return (
    <>
      <PageHeader
        title={definition.label}
        actions={
          actions ??
          (table === "documents" && canEdit("documents") ? (
            <Button onClick={() => setCreatingDocument(true)}>
              <Plus className="h-4 w-4" /> New document
            </Button>
          ) : undefined)
        }
        breadcrumbs={[
          { label: "Apps", to: "/command-center" },
          ...(parent && parentId && isRecordId(parentId) && recordDefinition(parent)
            ? [{ label: recordDefinition(parent)!.singular, to: recordHref(parent, parentId) }]
            : []),
          { label: definition.label },
        ]}
      />
      <div
        className={
          table === "documents" ? "record-list-workspace document-browser" : "record-list-workspace"
        }
      >
        {table === "documents" && (
          <DocumentFolderTree
            folder={state.folder}
            parent={parent}
            parentId={parentId}
            onSelect={(selection) =>
              onChange?.({
                folder: selection.folder,
                parent: selection.parent,
                parentId: selection.parentId,
                page: 0,
              })
            }
          />
        )}
        <div className="record-list-controls">
          <div className="record-list-search">
            <Search className="h-4 w-4" aria-hidden />
            <input
              aria-label={`Search ${definition.label}`}
              placeholder={`Search ${definition.label.toLowerCase()}…`}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Search options"
                  className="record-search-options-trigger"
                >
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="record-search-options">
                {extraFilters}
                <p className="field-label">Search in</p>
                {fields.search.length > 1 && (
                  <select
                    aria-label="Search field"
                    value={state.searchField ?? fields.search[0]}
                    onChange={(event) => onChange?.({ field: event.target.value, page: 0 })}
                  >
                    {fields.search.map((name) => (
                      <option key={name} value={name}>
                        {labelFor(name)}
                      </option>
                    ))}
                  </select>
                )}
                {(fields.filter.length > 0 || fields.group.length > 0) && (
                  <div className="record-list-control-group">
                    <p className="field-label">Filters and grouping</p>
                    {fields.filter.length > 0 && (
                      <select
                        aria-label="Filter field"
                        value={state.filterField ?? ""}
                        onChange={(event) =>
                          onChange?.({ filterField: event.target.value, filterValue: "", page: 0 })
                        }
                      >
                        <option value="">Filter</option>
                        {fields.filter.map((name) => (
                          <option key={name} value={name}>
                            {labelFor(name)}
                          </option>
                        ))}
                      </select>
                    )}
                    {state.filterField && (
                      <select
                        aria-label="Filter value"
                        value={state.filterValue ?? ""}
                        onChange={(event) =>
                          onChange?.({ filterValue: event.target.value, page: 0 })
                        }
                      >
                        <option value="">All</option>
                        {definition.fields
                          .find((field) => field.name === state.filterField)
                          ?.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                      </select>
                    )}
                    <select
                      aria-label="Group by"
                      value={state.groupBy ?? ""}
                      onChange={(event) => onChange?.({ groupBy: event.target.value, page: 0 })}
                    >
                      <option value="">Group by</option>
                      {fields.group.map((name) => (
                        <option key={name} value={name}>
                          {labelFor(name)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
          <div className="record-list-view" aria-label="View mode">
            <button
              type="button"
              aria-label="List view"
              aria-pressed={state.view !== "cards"}
              onClick={() => onChange?.({ view: "list" })}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Card view"
              aria-pressed={state.view === "cards"}
              onClick={() => onChange?.({ view: "cards" })}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <SavedViews
            userId={session?.userId}
            scope={`record-${table}`}
            value={{
              ...(state.refused ? { refused: state.refused } : {}),
              ...(state.sort ? { sort: state.sort, ascending: Boolean(state.ascending) } : {}),
              search: state.search ?? "",
              searchField: state.searchField ?? "",
              filterField: state.filterField ?? "",
              filterValue: state.filterValue ?? "",
              groupBy: state.groupBy ?? "",
              view: state.view ?? "list",
            }}
            onApply={(saved) =>
              onChange?.({
                refused: saved.refused,
                sort: saved.sort ?? "",
                ascending: Boolean(saved.ascending),
                q: saved.search,
                field: saved.searchField,
                filterField: saved.filterField,
                filterValue: saved.filterValue,
                groupBy: saved.groupBy,
                view: saved.view,
                page: 0,
              })
            }
          />
          {["customers", "sites", "equipment"].includes(table) && (
            <ArchiveVisibility
              archived={Boolean(state.archived)}
              onChange={(archived) => onChange?.({ archived, page: 0 })}
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="record-list-actions" aria-label="List actions">
                <Settings2 className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={!rows.data?.rows.length}
                onSelect={() =>
                  downloadCsv(
                    `heg-${table}-page-${page + 1}`,
                    columns?.map((column) => column.header) ?? definition.columns.map(labelFor),
                    (rows.data?.rows ?? []).map(
                      (row) =>
                        columns?.map((column) =>
                          column.value ? (column.value(row) ?? "") : (row[column.key] ?? ""),
                        ) ?? definition.columns.map((key) => row[key] ?? ""),
                    ),
                  )
                }
              >
                <Download className="h-4 w-4" /> Export this page
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {activeFilters}
        {(state.filterValue || state.groupBy) && (
          <div className="table-active-filters" aria-label="Active search conditions">
            {state.filterValue && (
              <button
                type="button"
                aria-label="Remove filter"
                onClick={() => onChange?.({ filterField: "", filterValue: "", page: 0 })}
              >
                {labelFor(state.filterField ?? "")}: {state.filterValue} ×
              </button>
            )}
            {state.groupBy && (
              <button
                type="button"
                aria-label="Remove grouping"
                onClick={() => onChange?.({ groupBy: "", page: 0 })}
              >
                Group: {labelFor(state.groupBy)} ×
              </button>
            )}
          </div>
        )}
        {rows.isLoading ? (
          <LoadingState />
        ) : rows.error ? (
          <ErrorState message={rows.error.message} />
        ) : (
          <>
            {state.view === "cards" ? (
              rows.data?.rows.length ? (
                <div className="record-list-cards">
                  {rows.data.rows.map((row, index) => (
                    <div key={row.id} className="contents">
                      {state.groupBy &&
                        (index === 0 ||
                          rows.data.rows[index - 1]?.[state.groupBy] !== row[state.groupBy]) && (
                          <h3 className="record-list-group-heading">
                            {labelFor(state.groupBy)}: {String(row[state.groupBy] ?? "Not set")}
                          </h3>
                        )}
                      <article className="record-list-card">
                        <Link
                          to={recordHref(table, row.id, returnTo)}
                          className="font-semibold hover:text-primary hover:underline"
                        >
                          <strong>{recordLabel(table, row)}</strong>
                        </Link>
                        {definition.columns.slice(1, 4).map((key) => (
                          <span key={key}>
                            <small>{labelFor(key)}</small>
                            {key === "status" && row.archived_at
                              ? "Archived"
                              : listValue(table, key, row)}
                          </span>
                        ))}
                      </article>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title={`No ${definition.label.toLowerCase()} found`} />
              )
            ) : (
              <DataTable
                bare
                serverSort={{
                  key: state.sort ?? recordDefaultOrder(table).column,
                  asc: state.sort ? Boolean(state.ascending) : recordDefaultOrder(table).ascending,
                  onChange: (key, asc) => onChange?.({ sort: key, ascending: asc, page: 0 }),
                }}
                recordTable={table}
                returnTo={returnTo}
                groupingField={state.groupBy}
                columns={
                  columns
                    ? [
                        ...columns,
                        ...(state.groupBy && !columns.some((column) => column.key === state.groupBy)
                          ? [
                              {
                                key: state.groupBy,
                                header: labelFor(state.groupBy),
                                sortable: false,
                                render: (row: Row) => listValue(table, state.groupBy!, row),
                              },
                            ]
                          : []),
                      ]
                    : [
                        ...definition.columns,
                        ...(state.groupBy && !definition.columns.includes(state.groupBy)
                          ? [state.groupBy]
                          : []),
                      ].map((key) => ({
                        key,
                        header: labelFor(key),
                        sortable: !RELATION_TARGETS[key],
                        render: (row: Row) => listValue(table, key, row),
                        align: ["money", "number"].includes(
                          definition.fields.find((field) => field.name === key)?.type ?? "",
                        )
                          ? ("right" as const)
                          : ("left" as const),
                      }))
                }
                rows={rows.data?.rows ?? []}
                emptyTitle={`No ${definition.label.toLowerCase()} found`}
              />
            )}
            <div className="record-list-pager">
              <span aria-live="polite">
                {rows.data?.count
                  ? `${page * 25 + 1}–${Math.min(rows.data.count, (page + 1) * 25)} of ${rows.data.count}`
                  : "0 records"}
              </span>
              <button
                type="button"
                aria-label="Previous page"
                disabled={page === 0}
                onClick={() => onChange?.({ page: page - 1 })}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next page"
                disabled={!rows.data || (page + 1) * 25 >= rows.data.count}
                onClick={() => onChange?.({ page: page + 1 })}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
      {table === "documents" && (
        <RecordForm
          open={creatingDocument}
          onOpenChange={setCreatingDocument}
          title="New document"
          table="documents"
          fields={documentFields}
          onSaved={(saved) => navigate({ to: recordHref("documents", saved.id, returnTo) })}
          defaults={
            parent && parentId
              ? {
                  linked_entity_type:
                    parent === "opportunities" ? "opportunity" : parent.replace(/s$/, ""),
                  linked_entity_id: parentId,
                }
              : undefined
          }
        />
      )}
    </>
  );
}

function listValue(table: string, key: string, row: Row) {
  const field = recordDefinition(table)?.fields.find((field) => field.name === key);
  const target = RELATION_TARGETS[key];
  if (target) return <RecordLink table={target} id={row[key]} />;
  if (key === "status") return <StatusBadge status={row.archived_at ? "Archived" : row[key]} />;
  if (
    key === "due_date" &&
    ["tasks", "bids", "corrective_actions"].includes(table) &&
    !["Completed", "Cancelled", "Won", "Lost", "Withdrawn"].includes(row.status)
  ) {
    const due = dueLabel(row[key]);
    return due.tone === "neutral" ? due.label : <StatusBadge status={due.label} tone={due.tone} />;
  }
  if (["priority", "severity"].includes(key)) return <StatusBadge status={row[key]} />;
  if (key === "updated_at") return formatDate(row[key]);
  if (field?.type === "date") return formatDate(row[key]);
  if (field?.type === "money") return formatMoney(row[key], row.currency_code, 2);
  if (field?.type === "checkbox") return row[key] ? "Yes" : "No";
  return String(row[key] ?? "—");
}

const hidden = new Set([
  "id",
  "created_by",
  "updated_by",
  "linked_entity_type",
  "linked_entity_id",
  "entity_type",
  "entity_id",
  "import_batch_id",
  "source_row_id",
  "file_path",
  "file_name",
  "change_reason",
]);

export function RecordDetailPage({
  table,
  id,
  returnTo,
}: {
  table: string;
  id: string;
  returnTo?: string | undefined;
}) {
  const definition = recordDefinition(table);
  const { canEdit } = useSession();
  const [editing, setEditing] = useState(false);
  const valid = Boolean(definition && isRecordId(id));
  const record = useQuery({
    queryKey: ["record", table, id],
    queryFn: () => getRow(table, id),
    enabled: valid,
  });
  const history = useQuery({
    queryKey: ["rate-history", table, id],
    queryFn: () =>
      table === "equipment_leases"
        ? listRows("equipment_rate_history", {
            filters: { rate_term_id: id },
            order: { column: "changed_at" },
          })
        : listRows("rate_history", { filters: { rate_id: id } }),
    enabled: valid && ["rates", "equipment_leases"].includes(table),
  });
  if (!valid || !definition)
    return (
      <div className="p-6">
        <EmptyState title="Record not found" />
      </div>
    );
  if (record.isLoading)
    return (
      <div className="p-6">
        <LoadingState />
      </div>
    );
  if (record.error)
    return (
      <div className="p-6">
        <ErrorState message={record.error.message} onRetry={() => void record.refetch()} />
      </div>
    );
  const row = record.data;
  if (!row)
    return (
      <div className="p-6">
        <EmptyState
          title="Record unavailable"
          description="The record may no longer exist or your role may not have access."
        />
      </div>
    );
  const labels = new Map(definition.fields.map((field) => [field.name, field.label]));
  const refusedEditableKeys = new Set([...Object.keys(toFormState(row)), "internal_notes"]);
  const entries = Object.entries(row).filter(
    ([key, value]) =>
      !hidden.has(key) &&
      !(key.startsWith("linked_") && key.endsWith("_fk")) &&
      !RELATION_TARGETS[key] &&
      (value === null || typeof value !== "object"),
  );
  const grouped = new Map<string, typeof entries>();
  for (const entry of entries) {
    const field = definition.fields.find((field) => field.name === entry[0]);
    const section = ["created_at", "updated_at"].includes(entry[0])
      ? "Record information"
      : (field?.section ?? "Details");
    grouped.set(section, [...(grouped.get(section) ?? []), entry]);
  }
  const displayValue = (key: string, value: unknown) => {
    if (value === null || value === "")
      return table === "refused_loads" && key === "estimated_lost_revenue" ? "Rate unknown" : "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    const field = definition.fields.find((field) => field.name === key);
    if (field?.type === "richtext")
      return <RichTextView document={row.rich_text?.[key]} text={String(value ?? "")} />;
    if (field?.type === "money")
      return formatMoney(
        Number(value),
        table === "equipment_leases"
          ? row.currency_code
          : table === "refused_loads"
            ? row.currency
            : "USD",
        2,
      );
    if (field?.type === "date" || key === "created_at" || key === "updated_at")
      return formatDate(String(value));
    return String(value);
  };
  return (
    <>
      <PageHeader
        title={recordLabel(table, row)}
        meta={
          row.archived_at ? (
            <StatusBadge status="Archived" />
          ) : row.status ? (
            <StatusBadge status={row.status} />
          ) : undefined
        }
        actions={
          ["customers", "sites", "equipment"].includes(table) ? (
            <RecordArchiveActions
              table={table as "customers" | "sites" | "equipment"}
              id={id}
              archived={Boolean(row.archived_at)}
              onChanged={() => void record.refetch()}
            />
          ) : undefined
        }
        related={<SmartButtons table={table} id={id} />}
        breadcrumbs={[
          { label: "Apps", to: "/command-center" },
          { label: recordReturnLabel(table, returnTo), to: recordReturnHref(table, returnTo) },
          { label: recordLabel(table, row) },
        ]}
      />
      <RecordRelations row={row} returnTo={recordHref(table, id, returnTo)} />
      <div className="record-workspace-layout">
        <RecordChatter table={table} id={id} />
        <div className="record-workspace-main space-y-6 px-3 pb-6 sm:px-6">
          {editing && table === "refused_loads" ? (
            <RefusedLoadForm
              recordId={id}
              expectedUpdatedAt={row.updated_at}
              initial={toFormState(row)}
              onCancel={() => setEditing(false)}
              onSaved={() => {
                setEditing(false);
                void record.refetch();
              }}
            />
          ) : canEdit(table) && table !== "refused_loads" ? (
            <RecordEditor table={table} row={row} />
          ) : editing ? (
            <RecordEditor table={table} row={row} onClose={() => setEditing(false)} />
          ) : (
            <article className="record-sheet" aria-label="Record details">
              {[...grouped]
                .sort(([a], [b]) => Number(a === "Notes") - Number(b === "Notes"))
                .map(([section, fields]) => (
                  <section
                    className={`record-section ${section === "Notes" || section === "Record information" ? "record-section-wide" : ""}`}
                    key={section}
                  >
                    <h2>{section}</h2>
                    <dl className="grid gap-x-12">
                      {fields.map(([key, value]) => (
                        <div key={key} className="record-field">
                          <dt>{labels.get(key) ?? fieldLabel(key)}</dt>
                          <dd>
                            {table === "refused_loads" &&
                            canEdit(table) &&
                            refusedEditableKeys.has(key) ? (
                              <button
                                type="button"
                                className="record-edit-value"
                                onClick={() => setEditing(true)}
                                aria-label={`Edit ${labels.get(key) ?? fieldLabel(key)}`}
                              >
                                {displayValue(key, value)}
                              </button>
                            ) : (
                              displayValue(key, value)
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
            </article>
          )}
          {table === "rates" && (
            <section aria-label="Rate history">
              <h2 className="mb-3 text-lg font-semibold">Rate history</h2>
              <DataTable
                embedded
                rows={history.data ?? []}
                isLoading={history.isLoading}
                error={history.error}
                columns={[
                  { key: "created_at", header: "Changed" },
                  { key: "previous_amount", header: "Previous amount" },
                  { key: "new_amount", header: "New amount" },
                  { key: "effective_date", header: "Effective" },
                  { key: "reason", header: "Reason" },
                ]}
                emptyTitle="No revisions recorded"
              />
            </section>
          )}
          {table === "equipment_leases" && (
            <section aria-label="Equipment rate history">
              <h2 className="mb-3 text-lg font-semibold">Rate history</h2>
              <DataTable
                rows={history.data ?? []}
                isLoading={history.isLoading}
                error={history.error}
                columns={[
                  {
                    key: "changed_at",
                    header: "Changed",
                    render: (entry) => formatDate(entry.changed_at),
                  },
                  { key: "event_type", header: "Event" },
                  {
                    key: "previous_rate",
                    header: "Previous",
                    value: (entry) => entry.previous_record?.rate,
                    render: (entry) =>
                      formatMoney(
                        entry.previous_record?.rate,
                        entry.previous_record?.currency_code,
                        2,
                      ),
                  },
                  {
                    key: "rate",
                    header: "New amount",
                    value: (entry) => entry.new_record?.rate,
                    render: (entry) =>
                      formatMoney(entry.new_record?.rate, entry.new_record?.currency_code, 2),
                  },
                  { key: "unit", header: "Unit", value: (entry) => entry.new_record?.rate_unit },
                  { key: "reason", header: "Reason" },
                ]}
                emptyTitle="No rate history"
              />
            </section>
          )}
          {table === "documents" && <DocumentFile document={row} />}
          <RelatedRecords table={table} id={id} />
        </div>
      </div>
    </>
  );
}

function RecordEditor({ table, row, onClose }: { table: string; row: Row; onClose?: () => void }) {
  const definition = recordDefinition(table)!;
  const relationKeys = editableRelationKeys(table);
  const targets = [
    ...new Set(
      relationKeys
        .map((key) => RELATION_TARGETS[key])
        .filter((target): target is string => Boolean(target)),
    ),
  ];
  const choices = useQueries({
    queries: targets.map((target) => ({
      queryKey: ["record-options", target],
      queryFn: () => listRows(target, { includeArchived: true }),
    })),
  });
  if (choices.some((choice) => choice.isPending))
    return (
      <div className="p-6">
        <LoadingState />
      </div>
    );
  if (choices.some((choice) => choice.isError))
    return (
      <div className="p-6">
        <ErrorState
          message="Related choices could not be loaded."
          onRetry={() => {
            for (const choice of choices) if (choice.isError) void choice.refetch();
          }}
        />
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    );
  const relationFields: FieldConfig[] = relationKeys
    .filter((key) => key in row)
    .map((key) => {
      const target = RELATION_TARGETS[key]!;
      const customerScoped = relationDependsOnCustomer(table, key);
      return {
        name: key,
        label: fieldLabel(key),
        type: "select",
        section: "Linked records",
        ...(customerScoped ? { dependsOn: "customer_id" } : {}),
        required:
          (key === "customer_id" &&
            ["bids", "rates", "contacts", "products", "lanes", "contracts"].includes(table)) ||
          (table === "site_assessments" && key === "site_id"),
        options: (choices[targets.indexOf(target)]?.data ?? [])
          .filter((option) => !option.archived_at || option.id === row[key])
          .map((option) => ({
            value: option.id,
            label: recordLabel(target, option),
            parentValue: option.customer_id ?? null,
          })),
      };
    });
  const editFields = [...relationFields, ...definition.fields.filter((field) => field.name in row)];
  if (["rates", "equipment_leases"].includes(table))
    editFields.push({
      name: "change_reason",
      label: "Reason for change",
      type: "textarea",
      required: true,
      section: "Revision",
    });
  return (
    <RecordForm
      presentation={onClose ? "inline" : "record"}
      open
      onOpenChange={(open) => {
        if (!open) onClose?.();
      }}
      title={`Edit ${definition.singular.toLowerCase()}`}
      table={table}
      recordId={row.id}
      initialValues={row}
      fields={editFields}
    />
  );
}
