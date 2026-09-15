import { supabase } from "@/integrations/supabase/client";

/**
 * Thin data-access layer. All reads/writes go through here so pages never talk
 * to the database client directly and every table gets the same behaviour.
 */

// Records are dynamic across many tables, so callers get permissive access.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = any;

export type ListOptions = {
  select?: string;
  filters?: Record<string, string | number | boolean | null | undefined>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  anyOf?: Record<string, string>;
  includeArchived?: boolean;
};

export async function listRows(table: string, options: ListOptions = {}): Promise<Row[]> {
  let query = (supabase.from(table as never) as Row).select(options.select ?? "*");

  for (const [column, value] of Object.entries(options.filters ?? {})) {
    if (value === undefined) continue;
    query = value === null ? query.is(column, null) : query.eq(column, value);
  }

  if (!options.includeArchived && ["customers", "sites", "equipment"].includes(table))
    query = query.is("archived_at", null);
  if (options.anyOf)
    query = query.or(
      Object.entries(options.anyOf)
        .map(([key, value]) => {
          if (!/^[a-z_]+$/.test(key) || !/^[0-9a-f-]{36}$/i.test(value))
            throw new Error("Invalid relationship filter");
          return key + ".eq." + value;
        })
        .join(","),
    );
  const order = options.order ?? { column: "created_at", ascending: false };
  query = query.order(order.column, { ascending: order.ascending ?? false, nullsFirst: false });
  // Stable pagination keeps dashboards and relationship lists from silently
  // dropping records after the old 500-row ceiling.
  if (order.column !== "id") query = query.order("id", { ascending: true });
  const rows: Row[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const remaining =
      options.limit === undefined ? pageSize : Math.min(pageSize, options.limit - offset);
    if (remaining <= 0) return rows;
    const { data, error } = await query.range(offset, offset + remaining - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if ((data ?? []).length < remaining) return rows;
  }
}

export async function getRow(table: string, id: string, select = "*"): Promise<Row | null> {
  const { data, error } = await (supabase.from(table as never) as Row)
    .select(select)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as Row | null;
}

export async function insertRow(table: string, values: Row): Promise<Row> {
  const { data, error } = await (supabase.from(table as never) as Row)
    .insert(values)
    .select()
    .single();
  if (error) throw new Error(friendlyError(error.message));
  return data as Row;
}

export async function updateRow(table: string, id: string, values: Row): Promise<Row> {
  const { data, error } = await (supabase.from(table as never) as Row)
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(friendlyError(error.message));
  return data as Row;
}

export async function archiveRow(table: string, id: string): Promise<void> {
  const { error } = await (supabase.from(table as never) as Row)
    .update({ archived_at: new Date().toISOString(), status: "Archived" })
    .eq("id", id);
  if (error) throw new Error(friendlyError(error.message));
}

export async function countRows(
  table: string,
  filters: Record<string, Row> = {},
  modifier?: (q: Row) => Row,
): Promise<number> {
  let query = (supabase.from(table as never) as Row).select("id", { count: "exact", head: true });
  for (const [column, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    query = value === null ? query.is(column, null) : query.eq(column, value);
  }
  if (modifier) query = modifier(query);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export function friendlyError(message: string): string {
  if (/row-level security|permission denied/i.test(message)) {
    return "You don't have permission to make this change. Ask an administrator to update your role.";
  }
  if (/duplicate key/i.test(message)) {
    return "A record with these details already exists.";
  }
  return message;
}
