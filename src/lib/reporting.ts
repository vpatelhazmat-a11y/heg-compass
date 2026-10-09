import { RECORDS } from "./record-registry";
import { canViewTable } from "./permissions";
import type { AppRole } from "@/hooks/use-session";

export type ReportConfig = {
  source: string;
  group: string;
  measure: string;
  search: string;
  filter: string;
  view: "list" | "bars";
};
export type ReportGroup = { key: string; label: string; records: number; value: number | null };
export const reportGroups = (source: string) =>
  (RECORDS[source]?.fields ?? []).filter(
    (field) => field.type === "select" || field.type === "checkbox",
  );
export function reportMeasures(source: string) {
  const field = RECORDS[source]?.fields.find((field) => field.name === "estimated_revenue");
  return [
    { value: "count", label: "Record count" },
    ...(field
      ? [
          { value: "sum:estimated_revenue", label: `${field.label} · total` },
          { value: "average:estimated_revenue", label: `${field.label} · average` },
        ]
      : []),
  ];
}
export function validReport(value: Partial<ReportConfig>, roles: AppRole[]): ReportConfig | null {
  const sources = Object.keys(RECORDS).filter((source) => canViewTable(roles, source));
  const source = sources.includes(value.source ?? "") ? value.source! : sources[0];
  if (!source) return null;
  const group = reportGroups(source).some((field) => field.name === value.group)
    ? value.group!
    : "";
  return {
    source,
    group,
    measure: reportMeasures(source).some((measure) => measure.value === value.measure)
      ? value.measure!
      : "count",
    search: (value.search ?? "").slice(0, 120),
    filter: group ? (value.filter ?? "").slice(0, 120) : "",
    view: value.view === "bars" ? "bars" : "list",
  };
}
export function reportColumns(config: ReportConfig): string[] {
  const definition = RECORDS[config.source];
  if (!definition) throw new Error("Unknown report source");
  if (config.group && !reportGroups(config.source).some((field) => field.name === config.group))
    throw new Error("Unknown grouping field");
  if (!reportMeasures(config.source).some((measure) => measure.value === config.measure))
    throw new Error("Unknown report measure");
  return [
    ...new Set([
      "id",
      ...definition.title,
      ...(config.group ? [config.group] : []),
      ...(config.measure === "count" ? [] : ["estimated_revenue"]),
    ]),
  ];
}
export function summarizeReport(
  rows: Record<string, unknown>[],
  config: ReportConfig,
): { groups: ReportGroup[]; records: number; value: number | null; measured: number } {
  reportColumns(config);
  const title = RECORDS[config.source]!.title;
  const search = config.search.trim().toLocaleLowerCase();
  const matched = rows.filter(
    (row) =>
      (!search ||
        title.some((field) =>
          String(row[field] ?? "")
            .toLocaleLowerCase()
            .includes(search),
        )) &&
      (!config.filter || String(row[config.group] ?? "") === config.filter),
  );
  const grouped = new Map<
    string,
    { label: string; records: number; sum: number; measured: number }
  >();
  let total = 0;
  let measured = 0;
  for (const row of matched) {
    const raw = config.group ? row[config.group] : "All records";
    const missing = raw === null || raw === undefined || raw === "";
    const key = missing ? "missing" : `value:${String(raw)}`;
    const label = missing
      ? "Unspecified"
      : typeof raw === "boolean"
        ? raw
          ? "Yes"
          : "No"
        : String(raw);
    const entry = grouped.get(key) ?? { label, records: 0, sum: 0, measured: 0 };
    entry.records++;
    const number = row["estimated_revenue"];
    const numeric =
      (typeof number === "number" || typeof number === "string") && String(number).trim() !== ""
        ? Number(number)
        : NaN;
    if (Number.isFinite(numeric)) {
      entry.sum += numeric;
      entry.measured++;
      total += numeric;
      measured++;
    }
    grouped.set(key, entry);
  }
  const result = (count: number, sum: number, measured: number) =>
    config.measure === "count"
      ? count
      : config.measure.startsWith("average:")
        ? measured
          ? sum / measured
          : null
        : measured
          ? sum
          : null;
  return {
    groups: [...grouped.entries()]
      .map(([key, entry]) => ({
        key,
        label: entry.label,
        records: entry.records,
        value: result(entry.records, entry.sum, entry.measured),
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    records: matched.length,
    value: result(matched.length, total, measured),
    measured,
  };
}
