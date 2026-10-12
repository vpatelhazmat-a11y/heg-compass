import { expect, test } from "vitest";
import {
  normalizeColumnChoice,
  readColumnChoice,
  writeColumnChoice,
} from "../src/lib/column-preferences";

test("column choices only restore current fields in their display order", () => {
  expect(
    normalizeColumnChoice(["removed", "status", "name", "status", 12], ["name", "status", "rate"]),
  ).toEqual(["name", "status"]);
  expect(normalizeColumnChoice([], ["name"])).toBeUndefined();
  expect(normalizeColumnChoice(["removed"], ["name"])).toBeUndefined();
});

test("column preferences remain isolated by account and module and tolerate corrupt storage", () => {
  const values = new Map<string, string>();
  const store = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  writeColumnChoice("alice", "customers", ["name"], ["name", "status"], store);
  expect(readColumnChoice("alice", "customers", ["name", "status"], store)).toEqual(["name"]);
  expect(readColumnChoice("bob", "customers", ["name", "status"], store)).toBeUndefined();
  expect(readColumnChoice("alice", "equipment", ["name", "status"], store)).toBeUndefined();
  values.set("heg-columns:alice:customers", "broken JSON");
  expect(readColumnChoice("alice", "customers", ["name"], store)).toBeUndefined();
  writeColumnChoice("alice", "customers", [], ["name", "status"], store);
  expect(readColumnChoice("alice", "customers", ["name", "status"], store)).toEqual([
    "name",
    "status",
  ]);
});
