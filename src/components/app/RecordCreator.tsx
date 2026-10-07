import { useQueries, useQuery } from "@tanstack/react-query";
import { getRow, listRows, type Row } from "@/lib/data";
import {
  recordDefinition,
  recordLabel,
  RELATION_TARGETS,
  relationDependsOnCustomer,
  fieldLabel,
} from "@/lib/record-registry";
import { recordCreationDefaults, requiredRecordRelation } from "@/lib/record-creation";
import { RecordForm, type FieldConfig } from "./RecordForm";
import { EmptyState, ErrorState, LoadingState } from "./EmptyState";
import { Button } from "@/components/ui/button";
import { isRecordId } from "@/lib/record-lists";

export function RecordCreator({
  table,
  parent,
  parentId,
  onClose,
  onSaved,
}: {
  table: string;
  parent?: string | undefined;
  parentId?: string | undefined;
  onClose: () => void;
  onSaved: (row: Row) => void;
}) {
  const definition = recordDefinition(table)!;
  const relationKeys = definition.relations;
  const targets = [
    ...new Set(
      relationKeys
        .map((key) => RELATION_TARGETS[key])
        .filter((target): target is string => Boolean(target)),
    ),
  ];
  const scoped = Boolean(parent && isRecordId(parentId ?? "") && recordDefinition(parent));
  const source = useQuery({
    queryKey: ["record", parent, parentId],
    enabled: scoped,
    queryFn: () => getRow(parent!, parentId!),
  });
  const choices = useQueries({
    queries: targets.map((target) => ({
      queryKey: ["new-record-options", target],
      queryFn: () => listRows(target),
    })),
  });
  if ((scoped && source.isPending) || choices.some((choice) => choice.isPending))
    return <LoadingState />;
  if ((scoped && source.isError) || choices.some((choice) => choice.isError))
    return (
      <>
        <ErrorState
          message="Linked records could not load. Your record has not been created."
          onRetry={() => {
            if (source.isError) void source.refetch();
            for (const choice of choices) if (choice.isError) void choice.refetch();
          }}
        />
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </>
    );
  if (scoped && (!source.data || source.data.archived_at))
    return (
      <>
        <EmptyState title="The parent record is unavailable or archived" />
        <Button variant="outline" onClick={onClose}>
          Back to records
        </Button>
      </>
    );
  const defaults = recordCreationDefaults(table, parent, parentId, source.data);
  const relationFields: FieldConfig[] = relationKeys.map((key) => {
    const target = RELATION_TARGETS[key]!;
    const rows = [...(choices[targets.indexOf(target)]?.data ?? [])];
    // Keep a readable selected parent even when it lies beyond the option batch.
    if (target === parent && source.data && !rows.some((row) => row.id === source.data.id))
      rows.push(source.data);
    return {
      name: key,
      label: fieldLabel(key),
      type: "select",
      section: "Linked records",
      required: requiredRecordRelation(table, key),
      ...(relationDependsOnCustomer(table, key) ? { dependsOn: "customer_id" } : {}),
      options: rows
        .filter((row) => !row.archived_at)
        .map((row) => ({
          value: row.id,
          label: recordLabel(target, row),
          parentValue: row.customer_id ?? null,
        })),
    };
  });
  return (
    <RecordForm
      presentation="create"
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`New ${definition.singular.toLowerCase()}`}
      table={table}
      fields={[...relationFields, ...definition.fields]}
      initialValues={defaults}
      defaults={Object.fromEntries(
        Object.entries(defaults).filter(
          ([key]) => ![...relationFields, ...definition.fields].some((field) => field.name === key),
        ),
      )}
      onSaved={onSaved}
    />
  );
}
