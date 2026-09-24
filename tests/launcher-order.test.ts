// @vitest-environment jsdom
import { beforeEach, expect, test } from "vitest";
import { HUB_MODULES } from "../src/lib/modules";
import {
  moveApp,
  normalizeAppOrder,
  readAppOrder,
  resetAppOrder,
  saveAppOrder,
  shiftApp,
} from "../src/lib/launcher-order";

beforeEach(() => localStorage.clear());

test("saved launcher order belongs to one user and survives a reload", () => {
  const original = normalizeAppOrder(null);
  const reordered = moveApp(original, "tasks", "customers");
  saveAppOrder("user-a", reordered);

  expect(readAppOrder("user-a")[0]).toBe("tasks");
  expect(readAppOrder("user-b")).toEqual(original);
  expect(resetAppOrder("user-a")).toEqual(original);
  expect(readAppOrder("user-a")).toEqual(original);
  expect(moveApp(original, "customers", "settings").at(-1)).toBe("customers");
});

test("unknown and duplicate app ids are ignored while new modules remain reachable", () => {
  const order = normalizeAppOrder(["tasks", "tasks", "removed-app", "customers"]);
  expect(order.slice(0, 2)).toEqual(["tasks", "customers"]);
  expect(order).toHaveLength(HUB_MODULES.length);
  expect(new Set(order).size).toBe(HUB_MODULES.length);
});

test("keyboard moves one app without losing its neighbors", () => {
  const original = normalizeAppOrder(null);
  const moved = shiftApp(original, "sites", -1);
  expect(moved.slice(0, 3)).toEqual(["sites", "customers", "site-assessments"]);
  expect(shiftApp(moved, "sites", -1)).toBe(moved);
  expect(shiftApp(moved, "sites", 1)).toEqual(original);
});
