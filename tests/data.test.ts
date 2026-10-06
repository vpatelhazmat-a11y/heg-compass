import { test, expect, vi, beforeEach } from "vitest";
const state = vi.hoisted(() => ({ rows: [] as { id: string }[], fail: false }));
const client = vi.hoisted(() => {
  const q = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    order: vi.fn(),
    or: vi.fn(),
    range: vi.fn(),
  };
  for (const method of ["select", "eq", "is", "order", "or"] as const)
    q[method].mockImplementation(() => q);
  return q;
});
vi.mock("../src/integrations/supabase/client", () => ({ supabase: { from: () => client } }));
import { listRows, listRowsPage, relationshipOrFilter } from "../src/lib/data";
beforeEach(() => {
  state.fail = false;
  client.range.mockImplementation(async (from: number, to: number) => ({
    data: state.rows.slice(from, to + 1),
    error: state.fail ? { message: "Connection failed" } : null,
  }));
});
test("dashboard queries return every page rather than silently truncate at 500", async () => {
  state.rows = Array.from({ length: 1001 }, (_, i) => ({ id: String(i) }));
  expect(await listRows("refused_loads")).toHaveLength(1001);
  expect(await listRows("refused_loads", { limit: 7 })).toHaveLength(7);
});
test("empty queries return arrays and failures remain distinguishable from zero records", async () => {
  state.rows = [];
  expect(await listRows("customers")).toEqual([]);
  state.fail = true;
  await expect(listRows("customers")).rejects.toThrow("Connection failed");
});

test("paged grouped ordering keeps group, chosen sort and stable ID tie-break", async () => {
  client.order.mockClear();
  await listRowsPage("bids", {
    groupBy: "status",
    order: { column: "due_date", ascending: true },
    offset: 25,
    limit: 25,
  });
  expect(client.order.mock.calls.map((call) => call[0])).toEqual(["status", "due_date", "id"]);
  expect(client.range).toHaveBeenLastCalledWith(25, 49);
});

test("relationship OR filters reject injected columns and identifiers", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  expect(relationshipOrFilter({ origin_site_id: id, destination_site_id: id })).toBe(
    "origin_site_id.eq." + id + ",destination_site_id.eq." + id,
  );
  expect(() => relationshipOrFilter({ "id,archived_at": id })).toThrow();
  expect(() => relationshipOrFilter({ site_id: "id,archived_at.is.null" })).toThrow();
  expect(() => relationshipOrFilter({})).toThrow();
});
