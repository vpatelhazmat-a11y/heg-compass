import { useQuery } from "@tanstack/react-query";
import { listRows, type Row } from "./data";

export type Option = { value: string; label: string };

/** Configurable choice lists maintained by administrators in lookup_values. */
export function useLookup(category: string, fallback: string[] = []) {
  const query = useQuery({
    queryKey: ["lookup", category],
    staleTime: 5 * 60_000,
    queryFn: () =>
      listRows("lookup_values", {
        filters: { category, active: true },
        order: { column: "sort_order", ascending: true },
      }),
  });

  const options: Option[] = (query.data ?? []).map((row: Row) => ({
    value: String(row.value),
    label: String(row.label ?? row.value),
  }));

  return {
    ...query,
    options: options.length ? options : fallback.map((value) => ({ value, label: value })),
  };
}

/** People who can be recorded as the customer-service representative. */
export function usePeople() {
  const query = useQuery({
    queryKey: ["people-options"],
    staleTime: 5 * 60_000,
    queryFn: () =>
      listRows("profiles", { filters: { active: true }, order: { column: "full_name", ascending: true } }),
  });

  const options: Option[] = (query.data ?? [])
    .map((row: Row) => ({ value: String(row.full_name || row.email || row.id), label: String(row.full_name || row.email || "Unnamed user") }))
    .filter((option) => option.value);

  return { ...query, options };
}
