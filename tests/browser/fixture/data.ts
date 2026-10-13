/** Synthetic, memory-only data. This fixture never connects to a database. */
import { RECORDS } from "@/lib/record-registry";
export const customerId = "11111111-1111-4111-8111-111111111111";
export const userId = "22222222-2222-4222-8222-222222222222";
const tables: Record<string, Record<string, unknown>[]> = {
  customers: [
    {
      id: customerId,
      legal_name: "Sample Freight",
      status: "Active",
      city: "Cleveland",
      state: "OH",
      commercial_notes: "Review delivery requirements before scheduling.",
      updated_at: "2026-10-01T12:00:00Z",
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      legal_name: "Example Manufacturing",
      status: "Prospect",
      city: "Detroit",
      state: "MI",
      updated_at: "2026-10-01T12:00:00Z",
    },
  ],
  sites: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      customer_id: customerId,
      site_name: "Sample receiving facility",
      city: "Cleveland",
      state: "OH",
      status: "Active",
    },
  ],
  profiles: [{ id: userId, full_name: "Sample User", active: true }],
  user_roles: [{ user_id: userId, role: "admin" }],
};
// Database rows include nullable fields too; retaining that shape exercises
// the complete form instead of accidentally hiding unpopulated sections.
for (const [table, rows] of Object.entries(tables)) {
  const definition = RECORDS[table];
  if (!definition) continue;
  const empty = Object.fromEntries(
    definition.fields.map((field) => [field.name, field.type === "checkbox" ? false : null]),
  );
  tables[table] = rows.map((row) => ({
    ...empty,
    created_at: "2026-10-01T12:00:00Z",
    updated_at: "2026-10-01T12:00:00Z",
    ...(["customers", "sites", "equipment"].includes(table) ? { archived_at: null } : {}),
    ...row,
  }));
}
function matching(table: string, options: Record<string, unknown> = {}) {
  return (tables[table] ?? []).filter((row) =>
    Object.entries((options["filters"] ?? {}) as Record<string, unknown>).every(
      ([key, value]) => value === undefined || row[key] === value,
    ),
  );
}
export async function listRows(table: string, options: Record<string, unknown> = {}) {
  return matching(table, options);
}
export async function countRows(table: string, filters: Record<string, unknown> = {}) {
  return matching(table, { filters }).length;
}
export async function getRow(table: string, id: string) {
  return (tables[table] ?? []).find((row) => row["id"] === id) ?? null;
}
export async function listRowsPage(table: string, options: Record<string, unknown> = {}) {
  let rows = matching(table, options);
  if (options["search"] && options["searchField"])
    rows = rows.filter((row) =>
      String(row[String(options["searchField"])] ?? "")
        .toLowerCase()
        .includes(String(options["search"]).toLowerCase()),
    );
  if (options["exactField"] && options["exactValue"])
    rows = rows.filter((row) => row[String(options["exactField"])] === options["exactValue"]);
  if (options["groupBy"])
    rows = [...rows].sort((a, b) =>
      String(a[String(options["groupBy"])] ?? "").localeCompare(
        String(b[String(options["groupBy"])] ?? ""),
      ),
    );
  const offset = Number(options["offset"] ?? 0);
  return { rows: rows.slice(offset, offset + Number(options["limit"] ?? 25)), count: rows.length };
}
export async function updateRow(table: string, id: string, values: Record<string, unknown>) {
  const row = await getRow(table, id);
  if (!row) throw new Error("Fixture record not found");
  Object.assign(row, values, { updated_at: new Date().toISOString() });
  return { ...row };
}
export async function insertRow(table: string, values: Record<string, unknown>) {
  const row = { id: crypto.randomUUID(), ...values };
  (tables[table] ??= []).push(row);
  return row;
}
export async function archiveRow(table: string, id: string) {
  return updateRow(table, id, { archived_at: new Date().toISOString() });
}
export async function restoreRow(table: string, id: string) {
  return updateRow(table, id, { archived_at: null });
}
export function relationshipOrFilter() {
  return "";
}
export const supabase = {
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getUser: async () => ({ data: { user: { id: userId, email: "sample@example.test" } } }),
    signOut: async () => ({ error: null }),
  },
  from: (table: string) => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: async () => ({ data: (tables[table] ?? [])[0] ?? null, error: null }),
      upsert: async () => ({ data: null, error: null }),
      then: (resolve: (result: unknown) => unknown) =>
        Promise.resolve({ data: tables[table] ?? [], error: null }).then(resolve),
    };
    return chain;
  },
  rpc: async (name: string) =>
    name === "record_thread_access"
      ? { data: { readable: true, writable: true }, error: null }
      : { data: null, error: { message: "Not available in sample-data fixtures" } },
};
