import { supabase } from "@/integrations/supabase/client";

/**
 * Thin data-access layer. All reads/writes go through here so pages never talk
 * to the database client directly and every table gets the same behaviour.
 */

export type Row = Record<string, any>;

export type ListOptions = {
  select?: string;
  filters?: Record<string, string | number | boolean | null | undefined>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
};

export async function listRows(table: string, options: ListOptions = {}): Promise<Row[]> {
  let query = (supabase.from(table as never) as any).select(options.select ?? "*");

  for (const [column, value] of Object.entries(options.filters ?? {})) {
    if (value === undefined) continue;
    query = value === null ? query.is(column, null) : query.eq(column, value);
  }

  const order = options.order ?? { column: "created_at", ascending: false };
  query = query.order(order.column, { ascending: order.ascending ?? false, nullsFirst: false });
  query = query.limit(options.limit ?? 500);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Row[];
}

export async function getRow(table: string, id: string, select = "*"): Promise<Row | null> {
  const { data, error } = await (supabase.from(table as never) as any)
    .select(select)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as Row | null;
}

export async function insertRow(table: string, values: Row): Promise<Row> {
  const { data, error } = await (supabase.from(table as never) as any)
    .insert(values)
    .select()
    .single();
  if (error) throw new Error(friendlyError(error.message));
  return data as Row;
}

export async function updateRow(table: string, id: string, values: Row): Promise<Row> {
  const { data, error } = await (supabase.from(table as never) as any)
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(friendlyError(error.message));
  return data as Row;
}

export async function archiveRow(table: string, id: string): Promise<void> {
  const { error } = await (supabase.from(table as never) as any)
    .update({ archived_at: new Date().toISOString(), status: "Archived" })
    .eq("id", id);
  if (error) throw new Error(friendlyError(error.message));
}

export async function countRows(
  table: string,
  filters: Record<string, any> = {},
  modifier?: (q: any) => any,
): Promise<number> {
  let query = (supabase.from(table as never) as any).select("id", { count: "exact", head: true });
  for (const [column, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    query = value === null ? query.is(column, null) : query.eq(column, value);
  }
  if (modifier) query = modifier(query);
  const { count, error } = await query;
  if (error) return 0;
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

/** Writes a change entry so critical records keep their institutional memory. */
export async function recordAudit(entry: {
  entity_type: string;
  entity_id?: string | null;
  action: string;
  field_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
}) {
  const { data } = await supabase.auth.getUser();
  await (supabase.from("audit_log" as never) as any).insert({ ...entry, user_id: data.user?.id ?? null });
}
