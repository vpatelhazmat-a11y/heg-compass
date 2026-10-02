import { countRows, getRow, listRows, listRowsPage } from "./data";
import { recordDefinition, relatedFilters, relatedList } from "./record-registry";

export const isRecordId = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export type RecordPageRequest = {
  page?: number | undefined;
  archived?: boolean | undefined;
  folder?: string | undefined;
  search?: string | undefined;
  searchField?: string | undefined;
  filterField?: string | undefined;
  filterValue?: string | undefined;
  groupBy?: string | undefined;
};

export function recordListFields(table: string) {
  const definition = recordDefinition(table);
  if (!definition) return { search: [] as string[], filter: [] as string[] };
  const search = [
    ...new Set(
      definition.fields
        .filter(
          (field) =>
            !field.name.endsWith("_id") &&
            (!field.type || ["text", "textarea", "select"].includes(field.type)),
        )
        .map((field) => field.name),
    ),
  ];
  if (table === "refused_loads") search.push("product", "loss_reason");
  const filter = [
    ...new Set(
      definition.fields.filter((field) => field.type === "select").map((field) => field.name),
    ),
  ];
  return { search, filter };
}

export async function loadRecordListPage(
  table: string,
  parent?: string,
  parentId?: string,
  request: RecordPageRequest = {},
) {
  const definition = recordDefinition(table);
  if (!definition) throw new Error("Unknown record type.");
  const allowed = recordListFields(table);
  const searchField =
    request.searchField && allowed.search.includes(request.searchField)
      ? request.searchField
      : allowed.search[0];
  const exactField =
    request.filterField && allowed.filter.includes(request.filterField)
      ? request.filterField
      : undefined;
  const filterOptions = definition.fields.find((field) => field.name === exactField)?.options;
  const exactValue = filterOptions?.some((option) => option.value === request.filterValue)
    ? request.filterValue
    : undefined;
  const groupBy =
    request.groupBy && allowed.filter.includes(request.groupBy) ? request.groupBy : undefined;
  const page = Math.max(0, Math.floor(request.page ?? 0));
  let filters: Record<string, string | null> = {};
  let ids: string[] | undefined;
  if (parent || parentId) {
    if (!parent || !parentId || !isRecordId(parentId))
      throw new Error("Invalid related-record link.");
    const relation = relatedList(parent, table);
    if (!relation) throw new Error("This relationship is not available.");
    if (relation.equipmentAtSite) {
      const assignments = await listRows("current_equipment_assignments", {
        filters: { site_id: parentId },
        select: "id,equipment_id,created_at",
      });
      ids = [...new Set<string>(assignments.map((row) => row.equipment_id))];
    } else filters = relatedFilters(relation, parentId);
  } else if (table === "documents") {
    if (["customer", "site", "equipment"].includes(request.folder ?? ""))
      filters = { linked_entity_type: request.folder! };
    else if (request.folder === "unlinked") filters = { linked_entity_type: null };
  }
  return listRowsPage(table, {
    filters,
    ids,
    searchField,
    search: request.search?.slice(0, 120),
    exactField,
    exactValue,
    groupBy,
    offset: page * 25,
    limit: 25,
    archived: request.archived,
  });
}

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
