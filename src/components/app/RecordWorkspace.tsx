import { useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "@/lib/format";
import { Pencil } from "lucide-react";
import { getRow, listRows, type Row } from "@/lib/data";
import {
  recordDefinition,
  recordLabel,
  recordHref,
  fieldLabel,
  RELATION_TARGETS,
  editableRelationKeys,
  relationDependsOnCustomer,
} from "@/lib/record-registry";
import { isRecordId, loadRecordList } from "@/lib/record-lists";
import { useSession } from "@/hooks/use-session";
import { PageHeader } from "./PageHeader";
import { DataTable } from "./DataTable";
import { EmptyState, ErrorState, LoadingState } from "./EmptyState";
import { RecordRelations } from "./RecordLink";
import { SmartButtons } from "./SmartButtons";
import { RecordForm, type FieldConfig } from "./RecordForm";
import { RefusedLoadForm, toFormState } from "./RefusedLoadForm";
import { Button } from "@/components/ui/button";

export function RecordListPage({
  table,
  parent,
  parentId,
}: {
  table: string;
  parent?: string | undefined;
  parentId?: string | undefined;
}) {
  const definition = recordDefinition(table);
  const rows = useQuery({
    queryKey: ["record-list", table, parent, parentId],
    queryFn: () => loadRecordList(table, parent, parentId),
    enabled: Boolean(definition),
  });
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
      <div className="p-6">
        <DataTable
          recordTable={table}
          columns={definition.columns.map((key) => ({ key, header: fieldLabel(key) }))}
          rows={rows.data ?? []}
          isLoading={rows.isLoading}
          error={rows.error}
          exportName={`heg-${table}`}
          searchPlaceholder={`Search ${definition.label.toLowerCase()}`}
          emptyTitle={`No ${definition.label.toLowerCase()} found`}
        />
      </div>
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
    queryKey: ["rate-history", id],
    queryFn: () => listRows("rate_history", { filters: { rate_id: id } }),
    enabled: valid && table === "rates",
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
    if (field?.type === "money")
      return Number(value).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });
    if (field?.type === "date" || key === "created_at" || key === "updated_at")
      return formatDate(String(value));
    return String(value);
  };
  return (
    <>
      <PageHeader
        title={recordLabel(table, row)}
        meta={row.status ? <StatusBadge status={row.status} /> : undefined}
        breadcrumbs={[
          { label: "Apps", to: "/command-center" },
          { label: definition.label, to: "/records/$entityType", params: { entityType: table } },
          { label: recordLabel(table, row) },
        ]}
        actions={
          canEdit(table) && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          )
        }
      />
      <SmartButtons table={table} id={id} />
      <RecordRelations row={row} />
      <div className="space-y-6 px-3 pb-6 sm:px-6">
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
        ) : (
          <article className="record-sheet" aria-label="Record details">
            {[...grouped].map(([section, fields]) => (
              <section className="record-section" key={section}>
                <h2>{section}</h2>
                <dl className="grid gap-x-12 md:grid-cols-2">
                  {fields.map(([key, value]) => (
                    <div
                      key={key}
                      className={`record-field ${typeof value === "string" && value.length > 150 ? "md:col-span-2" : ""}`}
                    >
                      <dt>{labels.get(key) ?? fieldLabel(key)}</dt>
                      <dd>{displayValue(key, value)}</dd>
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
      </div>
      {editing && table !== "refused_loads" && (
        <RecordEditor table={table} row={row} onClose={() => setEditing(false)} />
      )}
    </>
  );
}

function RecordEditor({ table, row, onClose }: { table: string; row: Row; onClose: () => void }) {
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
  if (table === "rates")
    editFields.push({
      name: "change_reason",
      label: "Reason for change",
      type: "textarea",
      required: true,
      section: "Revision",
    });
  return (
    <RecordForm
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Edit ${definition.singular.toLowerCase()}`}
      table={table}
      recordId={row.id}
      initialValues={row}
      fields={editFields}
    />
  );
}
