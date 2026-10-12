type Store = Pick<Storage, "getItem" | "setItem">;
const preferenceKey = (userId: string, scope: string) => `heg-columns:${userId}:${scope}`;

/** Only columns supplied by the current view can be restored from storage. */
export function normalizeColumnChoice(value: unknown, available: string[]): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const chosen = new Set(value.filter((key): key is string => typeof key === "string"));
  const valid = [...new Set(available)].filter((key) => chosen.has(key));
  return valid.length ? valid : undefined;
}

export function readColumnChoice(
  userId: string,
  scope: string,
  available: string[],
  storage?: Store,
) {
  try {
    return normalizeColumnChoice(
      JSON.parse((storage ?? localStorage).getItem(preferenceKey(userId, scope)) ?? "null"),
      available,
    );
  } catch {
    return undefined;
  }
}

export function writeColumnChoice(
  userId: string,
  scope: string,
  chosen: string[],
  available: string[],
  storage: Store = localStorage,
) {
  const value = normalizeColumnChoice(chosen, available) ?? available;
  storage.setItem(preferenceKey(userId, scope), JSON.stringify(value));
}
