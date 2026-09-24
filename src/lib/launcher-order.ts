import { HUB_MODULES } from "./modules";
import { supabase } from "@/integrations/supabase/client";

const defaultOrder = HUB_MODULES.map((module) => module.id);

export function normalizeAppOrder(saved: unknown): string[] {
  const known = new Set(defaultOrder);
  const ordered = Array.isArray(saved)
    ? saved.filter((id): id is string => typeof id === "string" && known.delete(id))
    : [];
  return [...ordered, ...defaultOrder.filter((id) => known.has(id))];
}

export function moveApp(order: string[], dragged: string, target: string): string[] {
  if (dragged === target || !order.includes(dragged) || !order.includes(target)) return order;
  const targetIndex = order.indexOf(target);
  const next = order.filter((id) => id !== dragged);
  next.splice(targetIndex, 0, dragged);
  return next;
}

export function shiftApp(order: string[], id: string, direction: -1 | 1): string[] {
  const index = order.indexOf(id);
  const destination = index + direction;
  if (index < 0 || destination < 0 || destination >= order.length) return order;
  const next = [...order];
  next[index] = order[destination]!;
  next[destination] = id;
  return next;
}

function storageKey(userId: string): string {
  return `heg-app-order:${userId}`;
}

export function readAppOrder(userId: string): string[] {
  try {
    return normalizeAppOrder(JSON.parse(localStorage.getItem(storageKey(userId)) ?? "null"));
  } catch {
    return normalizeAppOrder(null);
  }
}

export function saveAppOrder(userId: string, order: string[]): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(normalizeAppOrder(order)));
  } catch {
    // The current session can still rearrange apps when browser storage is unavailable.
  }
}

export function resetAppOrder(userId: string): string[] {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // Reset the visible order even when browser storage is unavailable.
  }
  return normalizeAppOrder(null);
}

export async function readSyncedAppOrder(userId: string): Promise<string[] | null> {
  const { data, error } = await supabase
    .from("user_workspace_preferences")
    .select("app_order")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeAppOrder(data.app_order) : null;
}

export async function saveSyncedAppOrder(userId: string, order: string[]): Promise<void> {
  const { error } = await supabase.from("user_workspace_preferences").upsert({
    user_id: userId,
    app_order: normalizeAppOrder(order),
  });
  if (error) throw new Error(error.message);
}
