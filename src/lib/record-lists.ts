import type { SearchSchemaInput } from "@tanstack/react-router";
import { countRows, getRow, listRows, listRowsPage } from "./data";
import { recordDefinition, relatedFilters, relatedList } from "./record-registry";

export const isRecordId = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export type RecordPageRequest = {
  refused?:
    { from?: string; to?: string; customer?: string; reason?: string; rep?: string } | undefined;
  sort?: string | undefined;
  ascending?: boolean | undefined;
  page?: number | undefined;
  archived?: boolean | undefined;
  folder?: string | undefined;
  search?: string | undefined;
  searchField?: string | undefined;
  filterField?: string | undefined;
  filterValue?: string | undefined;
  groupBy?: string | undefined;
};

export function recordDefaultOrder(table: string) {
  const defaults: Record<string, { column: string; ascending: boolean }> = {
    customers: { column: "legal_name", ascending: true },
    sites: { column: "site_name", ascending: true },
    equipment: { column: "unit_number", ascending: true },
    bids: { column: "due_date", ascending: true },
    tasks: { column: "due_date", ascending: true },
    refused_loads: { column: "call_in_date", ascending: false },
    knowledge_articles: { column: "updated_at", ascending: false },
    incidents: { column: "incident_date", ascending: false },
    opportunities: { column: "expected_close_date", ascending: true },
    corrective_actions: { column: "due_date", ascending: true },
    lost_business: { column: "occurred_on", ascending: false },
  };
  return defaults[table] ?? { column: "created_at", ascending: false };
}

export function recordListFields(table: string) {
  const definition = recordDefinition(table);
  if (!definition) return { search: [] as string[], filter: [] as string[] };
  const search = [
    ...new Set(
      definition.fields
        .filter(
          (field) =>
            !field.name.endsWith("_id") &&
            (!field.type || ["text", "textarea", "richtext", "select"].includes(field.type)),
        )
        .map((field) => field.name),
    ),
  ];
  if (table === "refused_loads")
    search.push(
      "product",
      "loss_reason",
      "pickup_city",
      "pickup_state",
      "delivery_city",
      "delivery_state",
      "cs_rep",
      "equipment_type",
    );
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
  const refused = table === "refused_loads" ? request.refused : undefined;
  if (refused?.customer && isRecordId(refused.customer)) filters["customer_id"] = refused.customer;
  if (refused?.reason && refused.reason !== "__all__")
    filters["loss_reason"] = refused.reason.slice(0, 120);
  if (refused?.rep && refused.rep !== "__all__") filters["cs_rep"] = refused.rep.slice(0, 120);
  const date = (value?: string) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined);
  return listRowsPage(table, {
    dateRange: refused
      ? { column: "call_in_date", from: date(refused.from), to: date(refused.to) }
      : undefined,
    filters,
    ids,
    searchField,
    search: request.search?.slice(0, 120),
    exactField,
    exactValue,
    groupBy,
    order:
      request.sort && definition.columns.includes(request.sort)
        ? { column: request.sort, ascending: Boolean(request.ascending) }
        : recordDefaultOrder(table),
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

export function parseRecordListSearch(search: Record<string, unknown> & SearchSchemaInput) {
  return {
    sort: typeof search["sort"] === "string" ? search["sort"] : undefined,
    ascending: search["ascending"] === true,
    q: typeof search["q"] === "string" ? search["q"].slice(0, 120) : undefined,
    field: typeof search["field"] === "string" ? search["field"] : undefined,
    filterField: typeof search["filterField"] === "string" ? search["filterField"] : undefined,
    filterValue:
      typeof search["filterValue"] === "string" ? search["filterValue"].slice(0, 120) : undefined,
    groupBy: typeof search["groupBy"] === "string" ? search["groupBy"] : undefined,
    view: search["view"] === "cards" ? ("cards" as const) : ("list" as const),
    archived: search["archived"] === true,
    page:
      typeof search["page"] === "number" && Number.isInteger(search["page"]) && search["page"] >= 0
        ? search["page"]
        : 0,
  };
}
