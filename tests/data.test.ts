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
import { listRows } from "../src/lib/data";
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
