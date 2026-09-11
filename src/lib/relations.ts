/**
 * Relationship helpers.
 *
 * Some tables link to a parent record with a direct foreign key (customer_id,
 * site_id, equipment_id), while others use a polymorphic pair of columns.
 * Detail pages must use the right pair, otherwise the query fails and the tab
 * shows nothing even though the record exists.
 */

export type ScopeKind = "customer" | "site" | "equipment";

const POLYMORPHIC: Record<string, { typeColumn: string; idColumn: string }> = {
  requirements: { typeColumn: "entity_type", idColumn: "entity_id" },
  documents: { typeColumn: "linked_entity_type", idColumn: "linked_entity_id" },
  tasks: { typeColumn: "linked_entity_type", idColumn: "linked_entity_id" },
};

const KIND_COLUMN: Record<ScopeKind, string> = {
  customer: "customer_id",
  site: "site_id",
  equipment: "equipment_id",
};

/** Columns that actually exist on each table, so we never send a stray value. */
const TABLE_COLUMNS: Record<string, string[]> = {
  sites: ["customer_id"],
  contacts: ["customer_id", "site_id"],
  products: ["customer_id"],
  rates: ["customer_id", "site_id", "lane_id", "product_id"],
  bids: ["customer_id", "opportunity_id"],
  opportunities: ["customer_id", "site_id"],
  contracts: ["customer_id"],
  lost_business: ["customer_id", "site_id", "lane_id", "product_id"],
  refused_loads: ["customer_id", "site_id", "equipment_id", "lane_id", "product_id"],
  site_assessments: ["site_id"],
  incidents: ["customer_id", "site_id", "equipment_id", "driver_id", "lane_id"],
  equipment_assignments: ["equipment_id", "customer_id", "site_id", "lane_id", "product_id"],
  equipment_compliance: ["equipment_id"],
  equipment_technology: ["equipment_id"],
  equipment_leases: ["equipment_id", "customer_id", "contract_id"],
};

/** Filters that select every child record belonging to a parent record. */
export function scopeFilters(table: string, kind: ScopeKind, id: string): Record<string, string> {
  const poly = POLYMORPHIC[table];
  if (poly) return { [poly.typeColumn]: kind, [poly.idColumn]: id };
  return { [KIND_COLUMN[kind]]: id };
}

/** Values pre-filled on a new child record, limited to columns the table has. */
export function scopeDefaults(
  table: string,
  kind: ScopeKind,
  id: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const base = scopeFilters(table, kind, id);
  const columns = TABLE_COLUMNS[table];
  const allowed = Object.entries(extra).filter(
    ([key, value]) => value != null && (!columns || columns.includes(key)),
  );
  return { ...base, ...Object.fromEntries(allowed) };
}
