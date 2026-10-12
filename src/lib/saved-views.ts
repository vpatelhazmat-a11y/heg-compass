import type { RecordPageRequest } from "./record-lists";
export type SavedViewState = {
  reportDate?: { field: string; from: string; to: string };
  columns?: string[];
  refused?: RecordPageRequest["refused"];
  sort?: string;
  ascending?: boolean;
  search: string;
  searchField: string;
  filterField: string;
  filterValue: string;
  groupBy: string;
  view: "list" | "cards";
};

export type SavedView = { name: string; state: SavedViewState };
type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const key = (userId: string, scope: string) => `heg-saved-views:${userId}:${scope}`;
const cleanState = (value: unknown): SavedViewState | null => {
  if (!value || typeof value !== "object") return null;
  const state = value as Record<string, unknown>;
  const text = (field: string) =>
    typeof state[field] === "string" ? String(state[field]).slice(0, 120) : "";
  const refused =
    state["refused"] && typeof state["refused"] === "object"
      ? (state["refused"] as Record<string, unknown>)
      : undefined;
  return {
    ...(state["reportDate"] && typeof state["reportDate"] === "object"
      ? {
          reportDate: Object.fromEntries(
            ["field", "from", "to"].map((key) => {
              const value = (state["reportDate"] as Record<string, unknown>)[key];
              return [
                key,
                typeof value === "string" ? value.slice(0, key === "field" ? 120 : 10) : "",
              ];
            }),
          ) as { field: string; from: string; to: string },
        }
      : {}),
    ...(Array.isArray(state["columns"]) && state["columns"].length
      ? {
          columns: [
            ...new Set(
              state["columns"].filter(
                (key): key is string =>
                  typeof key === "string" && key.length > 0 && key.length <= 120,
              ),
            ),
          ].slice(0, 80),
        }
      : {}),
    ...(refused
      ? {
          refused: Object.fromEntries(
            ["from", "to", "customer", "reason", "rep"].map((key) => [
              key,
              typeof refused[key] === "string" ? refused[key].slice(0, 120) : "",
            ]),
          ),
        }
      : {}),
    ...(text("sort") ? { sort: text("sort"), ascending: state["ascending"] === true } : {}),
    search: text("search"),
    searchField: text("searchField"),
    filterField: text("filterField"),
    filterValue: text("filterValue"),
    groupBy: text("groupBy"),
    view: state["view"] === "cards" ? "cards" : "list",
  };
};

export function readSavedViews(
  userId: string,
  scope: string,
  storage: Store = localStorage,
): SavedView[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key(userId, scope)) ?? "null");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .flatMap((item) => {
        const name = typeof item?.name === "string" ? item.name.trim().slice(0, 40) : "";
        const state = cleanState(item?.state);
        return name && state ? [{ name, state }] : [];
      })
      .slice(0, 12);
  } catch {
    return [];
  }
}

export function saveView(
  userId: string,
  scope: string,
  name: string,
  state: SavedViewState,
  storage: Store = localStorage,
): SavedView[] {
  const label = name.trim().slice(0, 40);
  if (!label) return readSavedViews(userId, scope, storage);
  const next = [
    ...readSavedViews(userId, scope, storage).filter(
      (item) => item.name.toLowerCase() !== label.toLowerCase(),
    ),
    { name: label, state: cleanState(state)! },
  ].slice(-12);
  storage.setItem(key(userId, scope), JSON.stringify(next));
  return next;
}

export function removeView(
  userId: string,
  scope: string,
  name: string,
  storage: Store = localStorage,
): SavedView[] {
  const next = readSavedViews(userId, scope, storage).filter((item) => item.name !== name);
  storage.setItem(key(userId, scope), JSON.stringify(next));
  return next;
}
