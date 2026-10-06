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
  archivedOnly?: boolean;
};

export type PageOptions = {
  dateRange?: { column: string; from?: string | undefined; to?: string | undefined } | undefined;
  order?: { column: string; ascending: boolean } | undefined;
  filters?: Record<string, string | number | boolean | null | undefined>;
  searchField?: string | undefined;
  search?: string | undefined;
  exactField?: string | undefined;
  exactValue?: string | undefined;
  groupBy?: string | undefined;
  offset?: number;
  limit?: number;
  ids?: string[] | undefined;
  archived?: boolean | undefined;
};

export async function listRowsPage(
  table: string,
  options: PageOptions = {},
): Promise<{ rows: Row[]; count: number }> {
  const safeColumn = (column: string) => {
    if (!/^[a-z][a-z0-9_]*$/.test(column)) throw new Error("Invalid search field");
    return column;
  };
  const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 25)));
  const offset = Math.max(0, Math.floor(options.offset ?? 0));
  let query = (supabase.from(table as never) as Row).select("*", { count: "exact" });
  for (const [column, value] of Object.entries(options.filters ?? {})) {
    if (value === undefined) continue;
    query =
      value === null ? query.is(safeColumn(column), null) : query.eq(safeColumn(column), value);
  }
  if (options.dateRange?.from)
    query = query.gte(safeColumn(options.dateRange.column), options.dateRange.from);
  if (options.dateRange?.to)
    query = query.lte(safeColumn(options.dateRange.column), options.dateRange.to);
  if (options.ids) {
    if (!options.ids.length) return { rows: [], count: 0 };
    query = query.in("id", options.ids);
  }
  if (["customers", "sites", "equipment"].includes(table))
    query = options.archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (options.searchField && options.search?.trim()) {
    const escaped = options.search.trim().replace(/[\\%_]/g, "\\$&");
    query = query.ilike(safeColumn(options.searchField), `%${escaped}%`);
  }
  if (options.exactField && options.exactValue)
    query = query.eq(safeColumn(options.exactField), options.exactValue);
  query = query.order(safeColumn(options.groupBy ?? options.order?.column ?? "created_at"), {
    ascending: options.groupBy ? true : Boolean(options.order?.ascending),
    nullsFirst: false,
  });
  if (options.groupBy && options.order && options.order.column !== options.groupBy)
    query = query.order(safeColumn(options.order.column), {
      ascending: options.order.ascending,
      nullsFirst: false,
    });
  query = query.order("id", { ascending: true });
  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return { rows: data ?? [], count: count ?? 0 };
}

export async function listRows(table: string, options: ListOptions = {}): Promise<Row[]> {
  let query = (supabase.from(table as never) as Row).select(options.select ?? "*");

  for (const [column, value] of Object.entries(options.filters ?? {})) {
    if (value === undefined) continue;
    query = value === null ? query.is(column, null) : query.eq(column, value);
  }

  if (["customers", "sites", "equipment"].includes(table)) {
    if (options.archivedOnly) query = query.not("archived_at", "is", null);
    else if (!options.includeArchived) query = query.is("archived_at", null);
  }
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

export async function updateRow(
  table: string,
  id: string,
  values: Row,
  expectedUpdatedAt?: string,
): Promise<Row> {
  let query = (supabase.from(table as never) as Row).update(values).eq("id", id);
  if (expectedUpdatedAt) query = query.eq("updated_at", expectedUpdatedAt);
  const { data, error } = await query.select().single();
  if (error && expectedUpdatedAt && error.code === "PGRST116")
    throw new Error("This record changed while you were editing. Refresh it before saving again.");
  if (error) throw new Error(friendlyError(error.message));
  return data as Row;
}

export async function archiveRow(table: string, id: string): Promise<void> {
  if (!["customers", "sites", "equipment"].includes(table))
    throw new Error("This record cannot be archived.");
  const { error } = await (supabase.from(table as never) as Row)
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(friendlyError(error.message));
}

export async function restoreRow(table: string, id: string): Promise<void> {
  if (!["customers", "sites", "equipment"].includes(table))
    throw new Error("This record cannot be restored.");
  const { error } = await (supabase.from(table as never) as Row)
    .update({ archived_at: null })
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
  if (/equipment_rate_dates_valid/i.test(message))
    return "The rate expiry date must be on or after its effective date.";
  if (/equipment_lease_dates_valid/i.test(message))
    return "The agreement end date must be on or after its start date.";
  if (/equipment_rate_amount_valid/i.test(message)) return "Enter a finite amount of zero or more.";
  if (/row-level security|permission denied/i.test(message)) {
    return "You don't have permission to make this change. Ask an administrator to update your role.";
  }
  if (/duplicate key/i.test(message)) {
    return "A record with these details already exists.";
  }
  return message;
}
