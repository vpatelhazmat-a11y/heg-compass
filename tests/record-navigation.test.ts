import { readFileSync } from "node:fs";
import { describe, expect, test, vi } from "vitest";
import { schemaContract } from "../scripts/schema-contract.mjs";
import {
  RECORDS,
  RELATION_TARGETS,
  RELATED_LISTS,
  recordDefinition,
  recordHref,
  recordReturnHref,
  recordReturnLabel,
  relatedList,
  editableRelationKeys,
  relationDependsOnCustomer,
} from "../src/lib/record-registry";

vi.mock("../src/lib/data", () => ({ listRows: vi.fn(), getRow: vi.fn(), listRowsPage: vi.fn() }));
import { listRows, getRow, listRowsPage } from "../src/lib/data";
import { loadRecordList, loadRecordListPage, parseRecordListSearch } from "../src/lib/record-lists";

const id = "11111111-1111-4111-8111-111111111111";
describe("record navigation contract", () => {
  test("registry fields and relationships exist in the stabilized database", () => {
    const schema = schemaContract(readFileSync("src/integrations/supabase/types.ts", "utf8"));
    const invalid: string[] = [];
    for (const [table, definition] of Object.entries(RECORDS)) {
      const columns = schema[table]?.Row ?? {};
      for (const key of new Set([
        ...definition.title,
        ...definition.columns,
        ...definition.fields.map((field) => field.name),
        ...definition.relations,
      ])) {
        if (!(key in columns)) invalid.push(`${table}.${key}`);
      }
      for (const key of definition.relations) {
        if (!RELATION_TARGETS[key] || !recordDefinition(RELATION_TARGETS[key]!))
          invalid.push(`target:${table}.${key}`);
      }
    }
    for (const [parent, relations] of Object.entries(RELATED_LISTS)) {
      for (const relation of relations) {
        if (relation.column && !(relation.column in schema[relation.table].Row))
          invalid.push(`scope:${parent}.${relation.table}.${relation.column}`);
      }
    }
    expect(invalid).toEqual([]);
  });

  test("unknown and prototype record types never reach the database", async () => {
    vi.clearAllMocks();
    expect(recordDefinition("__proto__")).toBeUndefined();
    expect(relatedList("constructor", "sites")).toBeUndefined();
    await expect(loadRecordList("profiles")).rejects.toThrow("Unknown record type");
    await expect(loadRecordList("sites", "customers", "bad,id")).rejects.toThrow(
      "Invalid related-record link",
    );
    await expect(loadRecordList("bids", "sites", id)).rejects.toThrow("relationship");
    expect(listRows).not.toHaveBeenCalled();
  });

  test("document smart buttons apply both polymorphic scope columns", async () => {
    vi.mocked(listRows).mockResolvedValue([]);
    await loadRecordList("documents", "customers", id);
    expect(listRows).toHaveBeenLastCalledWith("documents", {
      filters: { linked_entity_type: "customer", linked_entity_id: id },
    });
  });

  test("site equipment list deduplicates current assignments and excludes archived equipment", async () => {
    vi.mocked(listRows).mockResolvedValue([
      { equipment_id: "a" },
      { equipment_id: "a" },
      { equipment_id: "b" },
    ]);
    vi.mocked(getRow).mockImplementation(async (_table, key) => ({
      id: key,
      archived_at: key === "b" ? "2026-01-01" : null,
    }));
    expect(await loadRecordList("equipment", "sites", id)).toEqual([
      { id: "a", archived_at: null },
    ]);
  });

  test("paged list searches and filters only registered fields and preserves parent scope", async () => {
    vi.clearAllMocks();
    vi.mocked(listRowsPage).mockResolvedValue({ rows: [], count: 0 });
    await loadRecordListPage("sites", "customers", id, {
      page: 2,
      search: "Depot",
      searchField: "site_name",
      filterField: "status",
      filterValue: "Active",
      groupBy: "status",
    });
    expect(listRowsPage).toHaveBeenCalledWith(
      "sites",
      expect.objectContaining({
        filters: { customer_id: id },
        searchField: "site_name",
        search: "Depot",
        exactField: "status",
        exactValue: "Active",
        groupBy: "status",
        offset: 50,
        limit: 25,
      }),
    );
    await loadRecordListPage("sites", undefined, undefined, {
      searchField: "archived_at",
      filterField: "customer_id",
      filterValue: id,
      groupBy: "customer_id",
    });
    expect(listRowsPage).toHaveBeenLastCalledWith(
      "sites",
      expect.objectContaining({
        exactField: undefined,
        exactValue: undefined,
        groupBy: undefined,
      }),
    );
  });

  test("archived list scope reaches the server query", async () => {
    vi.clearAllMocks();
    vi.mocked(listRowsPage).mockResolvedValue({ rows: [], count: 0 });
    await loadRecordListPage("customers", undefined, undefined, { archived: true });
    expect(listRowsPage).toHaveBeenCalledWith(
      "customers",
      expect.objectContaining({ archived: true, offset: 0, limit: 25 }),
    );
  });

  test("document folders scope the server query to linked and unlinked records", async () => {
    vi.clearAllMocks();
    vi.mocked(listRowsPage).mockResolvedValue({ rows: [], count: 0 });
    await loadRecordListPage("documents", undefined, undefined, { folder: "customer" });
    expect(listRowsPage).toHaveBeenLastCalledWith(
      "documents",
      expect.objectContaining({ filters: { linked_entity_type: "customer" } }),
    );
    await loadRecordListPage("documents", undefined, undefined, { folder: "unlinked" });
    expect(listRowsPage).toHaveBeenLastCalledWith(
      "documents",
      expect.objectContaining({ filters: { linked_entity_type: null } }),
    );
    await loadRecordListPage("documents", "customers", id, { folder: "site" });
    expect(listRowsPage).toHaveBeenLastCalledWith(
      "documents",
      expect.objectContaining({
        filters: { linked_entity_type: "customer", linked_entity_id: id },
      }),
    );
  });

  test("links preserve existing primary pages and give supporting records stable addresses", () => {
    expect(recordHref("customers", id)).toBe(`/customers/${id}`);
    expect(recordHref("bids", id)).toBe(`/records/bids/${id}`);
    expect(recordHref("profiles", id)).toBe("/command-center");
  });
  test("rate edits never send relationship fields to the revision RPC", () => {
    expect(editableRelationKeys("rates")).toEqual([]);
    expect(editableRelationKeys("equipment_assignments")).toEqual([]);
    expect(editableRelationKeys("bids")).toContain("customer_id");
  });
  test("lane endpoints remain cross-customer while owned child choices stay scoped", () => {
    expect(relationDependsOnCustomer("lanes", "origin_site_id")).toBe(false);
    expect(relationDependsOnCustomer("lanes", "destination_site_id")).toBe(false);
    expect(relationDependsOnCustomer("contacts", "site_id")).toBe(true);
    expect(relationDependsOnCustomer("bids", "opportunity_id")).toBe(true);
  });
});

test("module URL state rejects malformed paging and bounds search while preserving supported views", () => {
  const parsed = parseRecordListSearch({
    q: "x".repeat(180),
    page: -1,
    view: "calendar",
    archived: "true",
    filterValue: "y".repeat(180),
  });
  expect(parsed.q).toHaveLength(120);
  expect(parsed.filterValue).toHaveLength(120);
  expect(parsed.page).toBe(0);
  expect(parsed.view).toBe("list");
  expect(parsed.archived).toBe(false);
  expect(parseRecordListSearch({ page: 2, view: "cards", archived: true })).toMatchObject({
    page: 2,
    view: "cards",
    archived: true,
  });
});

test("record breadcrumbs retain collection state and reject external or unknown destinations", () => {
  const origin = "/customers?q=Cascade&view=cards&page=2";
  const href = recordHref("customers", id, origin);
  expect(new URL(href, "https://test.invalid").searchParams.get("returnTo")).toBe(origin);
  expect(recordReturnHref("customers", origin)).toBe(origin);
  expect(recordReturnHref("rates", `/customers/${id}`)).toBe(`/customers/${id}`);
  expect(recordReturnLabel("rates", `/customers/${id}`)).toBe("Customer");
  expect(recordReturnLabel("corrective_actions", "/safety?section=actions")).toBe(
    "Corrective actions",
  );
  for (const value of [
    "https://bad.invalid/customers",
    "//bad.invalid/customers",
    "/unknown",
    "/records/__proto__",
  ])
    expect(recordReturnHref("customers", value)).toBe("/customers");
});
