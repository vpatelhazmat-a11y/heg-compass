import { expect, test } from "vitest";
import { readSavedViews, removeView, saveView, type SavedViewState } from "../src/lib/saved-views";

function memoryStore() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

test("saved views stay scoped to an account and list, and can be replaced or removed", () => {
  const store = memoryStore();
  const initial: SavedViewState = {
    search: "Acme",
    searchField: "name",
    filterField: "status",
    filterValue: "Active",
    groupBy: "status",
    view: "list",
  };
  saveView("user-a", "customers", "Active customers", initial, store);
  expect(readSavedViews("user-a", "customers", store)[0]?.state).toEqual(initial);
  expect(readSavedViews("user-b", "customers", store)).toEqual([]);
  expect(readSavedViews("user-a", "bids", store)).toEqual([]);
  saveView("user-a", "customers", "active customers", { ...initial, view: "cards" }, store);
  expect(readSavedViews("user-a", "customers", store)).toHaveLength(1);
  expect(readSavedViews("user-a", "customers", store)[0]?.state.view).toBe("cards");
  expect(removeView("user-a", "customers", "active customers", store)).toEqual([]);
});
