import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { getRow, type Row } from "@/lib/data";
import {
  ENTITY_TABLES,
  RELATION_TARGETS,
  fieldLabel,
  recordDefinition,
  recordHref,
  recordLabel,
} from "@/lib/record-registry";

export function RecordLink({
  table,
  id,
  label,
}: {
  table: string;
  id: string | null | undefined;
  label?: string | undefined;
}) {
  const valid = Boolean(id && recordDefinition(table));
  const record = useQuery({
    queryKey: ["record-label", table, id],
    queryFn: () => getRow(table, id!),
    enabled: valid && !label,
    staleTime: 60_000,
  });
  if (!valid) return <span className="text-muted-foreground">—</span>;
  const text =
    label ||
    (record.data
      ? recordLabel(table, record.data)
      : record.isLoading
        ? "Loading…"
        : "Unavailable record");
  return (
    <a
      href={recordHref(table, id!)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
    >
      <span>{text}</span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
    </a>
  );
}

export function RecordRelations({ row }: { row: Row }) {
  const links = Object.entries(RELATION_TARGETS).filter(([key]) => row[key]);
  const type = row.linked_entity_type ?? row.entity_type;
  const id = row.linked_entity_id ?? row.entity_id;
  const polyTable = type && Object.hasOwn(ENTITY_TABLES, type) ? ENTITY_TABLES[type] : undefined;
  if (!links.length && !(polyTable && id)) return null;
  return (
    <section
      aria-label="Linked records"
      className="flex flex-wrap gap-x-8 gap-y-3 border-b border-border bg-surface px-6 py-4"
    >
      {links.map(([key, table]) => (
        <div key={key}>
          <p className="field-label">{fieldLabel(key)}</p>
          <RecordLink table={table} id={row[key]} />
        </div>
      ))}
      {polyTable && id && (
        <div>
          <p className="field-label">Linked record</p>
          <RecordLink table={polyTable} id={id} />
        </div>
      )}
    </section>
  );
}
