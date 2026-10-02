export type SavedViewState = {
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
  return {
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
  try {
    storage.setItem(key(userId, scope), JSON.stringify(next));
  } catch {
    /* Keep this session's list. */
  }
  return next;
}

export function removeView(
  userId: string,
  scope: string,
  name: string,
  storage: Store = localStorage,
): SavedView[] {
  const next = readSavedViews(userId, scope, storage).filter((item) => item.name !== name);
  try {
    storage.setItem(key(userId, scope), JSON.stringify(next));
  } catch {
    /* Keep this session's list. */
  }
  return next;
}
