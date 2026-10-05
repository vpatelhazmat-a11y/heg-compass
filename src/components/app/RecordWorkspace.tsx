import { useEffect, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { StatusBadge } from "./StatusBadge";
import { formatDate, formatMoney } from "@/lib/format";
import { getRow, listRows, type Row } from "@/lib/data";
import {
  recordDefinition,
  recordLabel,
  recordHref,
  recordListHref,
  fieldLabel,
  RELATION_TARGETS,
  editableRelationKeys,
  relationDependsOnCustomer,
} from "@/lib/record-registry";
import {
  isRecordId,
  loadRecordListPage,
  recordListFields,
  type RecordPageRequest,
} from "@/lib/record-lists";
import { useSession } from "@/hooks/use-session";
import { PageHeader } from "./PageHeader";
import { DataTable } from "./DataTable";
import { SavedViews } from "./SavedViews";
import { EmptyState, ErrorState, LoadingState } from "./EmptyState";
import { RecordRelations } from "./RecordLink";
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
  SlidersHorizontal,
} from "lucide-react";

type ListState = RecordPageRequest & { view?: "list" | "cards" };
type ListPatch = {
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
}: {
  table: string;
  parent?: string | undefined;
  parentId?: string | undefined;
  state?: ListState;
  onChange?: (patch: ListPatch) => void;
}) {
  const { session, canEdit } = useSession();
  const definition = recordDefinition(table);
  const fields = recordListFields(table);
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
      state.archived,
      state.folder,
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
          table === "documents" && canEdit("documents") ? (
            <Button onClick={() => setCreatingDocument(true)}>
              <Plus className="h-4 w-4" /> New document
            </Button>
          ) : undefined
        }
        description={
          parent
            ? "Records linked to the selected record."
            : `Search and open ${definition.label.toLowerCase()}.`
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
            {fields.search.length > 1 && (
              <select
                aria-label="Search field"
                value={state.searchField ?? fields.search[0]}
                onChange={(event) => onChange?.({ field: event.target.value, page: 0 })}
              >
                {fields.search.map((name) => (
                  <option key={name} value={name}>
                    {fieldLabel(name)}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="record-list-control-group">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
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
                  {fieldLabel(name)}
                </option>
              ))}
            </select>
            {state.filterField && (
              <select
                aria-label="Filter value"
                value={state.filterValue ?? ""}
                onChange={(event) => onChange?.({ filterValue: event.target.value, page: 0 })}
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
              {fields.filter.map((name) => (
                <option key={name} value={name}>
                  {fieldLabel(name)}
                </option>
              ))}
            </select>
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
              search: state.search ?? "",
              searchField: state.searchField ?? "",
              filterField: state.filterField ?? "",
              filterValue: state.filterValue ?? "",
              groupBy: state.groupBy ?? "",
              view: state.view ?? "list",
            }}
            onApply={(saved) =>
              onChange?.({
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
                    definition.columns.map(fieldLabel),
                    (rows.data?.rows ?? []).map((row) =>
                      definition.columns.map((key) => row[key] ?? ""),
                    ),
                  )
                }
              >
                <Download className="h-4 w-4" /> Export this page
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
                            {fieldLabel(state.groupBy)}: {String(row[state.groupBy] ?? "Not set")}
                          </h3>
                        )}
                      <a href={recordHref(table, row.id)} className="record-list-card">
                        <strong>{recordLabel(table, row)}</strong>
                        {definition.columns.slice(1, 4).map((key) => (
                          <span key={key}>
                            <small>{fieldLabel(key)}</small>
                            {key === "status" && row.archived_at
                              ? "Archived"
                              : String(row[key] ?? "—")}
                          </span>
                        ))}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title={`No ${definition.label.toLowerCase()} found`} />
              )
            ) : (
              <DataTable
                bare
                recordTable={table}
                groupingField={state.groupBy}
                columns={[
                  ...definition.columns,
                  ...(state.groupBy && !definition.columns.includes(state.groupBy)
                    ? [state.groupBy]
                    : []),
                ].map((key) => ({
                  key,
                  header: fieldLabel(key),
                  sortable: false,
                  ...(key === "status"
                    ? {
                        render: (row: Row) =>
                          row.archived_at ? "Archived" : String(row.status ?? "—"),
                      }
                    : {}),
                }))}
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
          onSaved={(saved) => window.location.assign(recordHref("documents", saved.id))}
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

export function RecordDetailPage({ table, id }: { table: string; id: string }) {
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
        <ErrorState message={record.error.message} />
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
    if (value === null || value === "") return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    const field = definition.fields.find((field) => field.name === key);
    if (field?.type === "richtext")
      return <RichTextView document={row.rich_text?.[key]} text={String(value ?? "")} />;
    if (field?.type === "money")
      return formatMoney(
        Number(value),
        table === "equipment_leases" ? row.currency_code : "USD",
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
          { label: definition.label, to: recordListHref(table) },
          { label: recordLabel(table, row) },
        ]}
      />
      <RecordRelations row={row} />
      <div className="record-workspace-layout">
        <RecordChatter table={table} id={id} />
        <div className="record-workspace-main space-y-6 px-3 pb-6 sm:px-6">
          {editing && table === "refused_loads" ? (
            <RefusedLoadForm
              recordId={id}
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
                            {table === "refused_loads" && canEdit(table) ? (
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
        <ErrorState message="Related choices could not be loaded. Close and retry before editing." />
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
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
