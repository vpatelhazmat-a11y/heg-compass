import { useQuery } from "@tanstack/react-query";
import { listRows } from "@/lib/data";

export type LookupOption = { value: string; label: string };

/**
 * Reads a configurable reference list (states, equipment types, loss reasons,
 * CS reps, statuses...) from the lookup_values table so nothing is hard-coded.
 */
export function useLookup(category: string, fallback: string[] = []) {
  const query = useQuery({
    queryKey: ["lookup", category],
    queryFn: () =>
      listRows("lookup_values", {
        filters: { category, active: true },
        order: { column: "sort_order", ascending: true },
      }),
    staleTime: 5 * 60 * 1000,
  });

  const options: LookupOption[] = (query.data ?? []).map((row) => ({
    value: String(row.value),
    label: String(row.label ?? row.value),
  }));

  return {
    ...query,
    options: options.length ? options : fallback.map((value) => ({ value, label: value })),
  };
}
