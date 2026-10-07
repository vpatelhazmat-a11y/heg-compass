import type { Row } from "./data";
import { RECORDS, RELATION_TARGETS, SHARED_RECORD_KINDS } from "./record-registry";
import { isRecordId } from "./record-lists";

// These forms use normal inserts. Refused Loads and polymorphic requirements
// keep their dedicated creation workflow until their complete rules are shared.
export function supportsRecordCreation(table: string) {
  return (
    Object.hasOwn(RECORDS, table) && !["refused_loads", "requirements", "documents"].includes(table)
  );
}
export function requiredRecordRelation(table: string, key: string) {
  return (
    (key === "customer_id" &&
      ["sites", "bids", "rates", "contacts", "products", "lanes", "contracts"].includes(table)) ||
    (key === "site_id" && table === "site_assessments") ||
    (key === "equipment_id" && table.startsWith("equipment_"))
  );
}
export function recordCreationDefaults(
  table: string,
  parent?: string,
  parentId?: string,
  parentRow?: Row,
): Row {
  if (!parent || !isRecordId(parentId ?? "") || !parentRow || parentRow.archived_at) return {};
  const relations = RECORDS[table]?.relations ?? [];
  const matching = relations.filter((key) => RELATION_TARGETS[key] === parent);
  const defaults: Row = matching.length === 1 ? { [matching[0]!]: parentId } : {};
  if (relations.includes("customer_id")) {
    const customer = parent === "customers" ? parentId : parentRow.customer_id;
    if (isRecordId(customer)) defaults.customer_id = customer;
  }
  if (["tasks", "documents"].includes(table) && SHARED_RECORD_KINDS[parent]) {
    defaults.linked_entity_type = SHARED_RECORD_KINDS[parent];
    defaults.linked_entity_id = parentId;
  }
  return defaults;
}
