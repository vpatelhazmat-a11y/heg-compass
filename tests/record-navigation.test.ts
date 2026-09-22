import { readFileSync } from "node:fs";
import { describe, expect, test, vi } from "vitest";
import { schemaContract } from "../scripts/schema-contract.mjs";
import {
  RECORDS,
  RELATION_TARGETS,
  RELATED_LISTS,
  recordDefinition,
  recordHref,
  relatedList,
  editableRelationKeys,
  relationDependsOnCustomer,
} from "../src/lib/record-registry";

vi.mock("../src/lib/data", () => ({ listRows: vi.fn(), getRow: vi.fn() }));
import { listRows, getRow } from "../src/lib/data";
import { loadRecordList } from "../src/lib/record-lists";

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
