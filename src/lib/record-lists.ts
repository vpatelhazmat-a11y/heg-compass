import { countRows, getRow, listRows } from "./data";
import { recordDefinition, relatedFilters, relatedList } from "./record-registry";

export const isRecordId = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function loadRecordList(table: string, parent?: string, parentId?: string) {
  if (!recordDefinition(table)) throw new Error("Unknown record type.");
  if (!parent && !parentId) return listRows(table);
  if (!parent || !parentId || !isRecordId(parentId))
    throw new Error("Invalid related-record link.");
  const relation = relatedList(parent, table);
  if (!relation) throw new Error("This relationship is not available.");
  if (relation.equipmentAtSite) {
    const assignments = await listRows("current_equipment_assignments", {
      filters: { site_id: parentId },
      select: "id,equipment_id,created_at",
    });
    const ids = [...new Set<string>(assignments.map((row) => row.equipment_id))];
    return (await Promise.all(ids.map((id) => getRow("equipment", id)))).filter(
      (row) => row && !row.archived_at,
    );
  }
  return listRows(table, { filters: relatedFilters(relation, parentId) });
}

export async function countRelatedRecords(table: string, parent: string, parentId: string) {
  const relation = relatedList(parent, table);
  if (!relation || !isRecordId(parentId)) throw new Error("Invalid related-record link.");
  if (relation.equipmentAtSite) return (await loadRecordList(table, parent, parentId)).length;
  const filters: Record<string, string | null> = relatedFilters(relation, parentId);
  if (["customers", "sites", "equipment"].includes(table)) filters["archived_at"] = null;
  return countRows(table, filters);
}
