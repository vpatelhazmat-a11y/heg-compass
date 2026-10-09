import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BarChart3, List, Settings2 } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { canViewTable } from "@/lib/permissions";
import { listRows } from "@/lib/data";
import { RECORDS } from "@/lib/record-registry";
import { downloadCsv } from "@/lib/csv";
import { downloadSpreadsheet } from "@/lib/spreadsheet-export";
import { formatMoney } from "@/lib/format";
import {
  reportColumns,
  reportGroups,
  reportMeasures,
  summarizeReport,
  validReport,
  type ReportConfig,
} from "@/lib/reporting";
import { SavedViews } from "./SavedViews";
import { EmptyState, ErrorState, LoadingState } from "./EmptyState";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ReportWorkbench({
  value,
  onChange,
}: {
  value: Partial<ReportConfig>;
  onChange: (value: ReportConfig) => void;
}) {
  const { roles, session } = useSession();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const config = validReport(value, roles);
  const sources = Object.entries(RECORDS).filter(([kind]) => canViewTable(roles, kind));
  const columns = config ? reportColumns(config) : [];
  const query = useQuery({
    queryKey: [
      "report-source",
      session?.userId,
      roles.join(","),
      config?.source,
      columns.join(","),
    ],
    queryFn: () => listRows(config!.source, { select: columns.join(",") }),
    enabled: Boolean(config && session?.userId),
  });
  if (!config)
    return (
      <div className="p-6">
        <EmptyState
          title="No report sources available"
          description="Your account needs access to a module before its records can be reported."
        />
      </div>
    );
  const fields = reportGroups(config.source);
  const definition = RECORDS[config.source]!;
  const report = summarizeReport(query.data ?? [], config);
  const groupLabel = fields.find((field) => field.name === config.group)?.label ?? "Group";
  const measureLabel = reportMeasures(config.source).find(
    (measure) => measure.value === config.measure,
  )!.label;
  const display = (value: number | null) =>
    value === null ? "—" : config.measure === "count" ? value.toLocaleString() : formatMoney(value);
  const update = (patch: Partial<ReportConfig>) =>
    onChange(validReport({ ...config, ...patch }, roles)!);
  const values = [
    ...new Set((query.data ?? []).map((row) => String(row[config.group] ?? "")).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));
  const maximum = Math.max(...report.groups.map((group) => Math.abs(group.value ?? 0)), 1);
  const ready = Boolean(query.data && !query.isFetching && !query.error);
  const exportRows = report.groups.map((group) =>
    config.measure === "count"
      ? [group.label, group.records]
      : [group.label, group.records, group.value],
  );
  const exportHeadings =
    config.measure === "count" ? [groupLabel, "Records"] : [groupLabel, "Records", measureLabel];
  const exportXlsx = async () => {
    if (exporting || !ready) return;
    setExporting(true);
    setExportError(null);
    try {
      await downloadSpreadsheet(`${config.source}-report`, exportHeadings, exportRows);
    } catch {
      setExportError("The spreadsheet could not be exported. Your report is unchanged; try again.");
    } finally {
      setExporting(false);
    }
  };
  return (
    <>
      <div className="report-controls border-b border-border bg-surface px-6 py-3 flex flex-wrap items-end gap-4">
        <label className="flex min-w-36 flex-col gap-1 text-xs text-muted-foreground">
          Records
          <select
            className="h-8 border-b border-border bg-transparent text-sm text-foreground"
            value={config.source}
            onChange={(event) =>
              update({
                source: event.target.value,
                group: "",
                measure: "count",
                search: "",
                filter: "",
              })
            }
          >
            {sources.map(([kind, definition]) => (
              <option key={kind} value={kind}>
                {definition.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-32 flex-col gap-1 text-xs text-muted-foreground">
          Group by
          <select
            className="h-8 border-b border-border bg-transparent text-sm text-foreground"
            value={config.group}
            onChange={(event) => update({ group: event.target.value, filter: "" })}
          >
            <option value="">None</option>
            {fields.map((field) => (
              <option key={field.name} value={field.name}>
                {field.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-36 flex-col gap-1 text-xs text-muted-foreground">
          Measure
          <select
            className="h-8 border-b border-border bg-transparent text-sm text-foreground"
            value={config.measure}
            onChange={(event) => update({ measure: event.target.value })}
          >
            {reportMeasures(config.source).map((measure) => (
              <option key={measure.value} value={measure.value}>
                {measure.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs text-muted-foreground">
          Search records
          <input
            type="search"
            className="h-8 border-b border-border bg-transparent text-sm text-foreground"
            placeholder={`Search ${definition.label.toLowerCase()}`}
            maxLength={120}
            value={config.search}
            onChange={(event) => update({ search: event.target.value })}
          />
        </label>
        {config.group && (
          <label className="flex min-w-32 flex-col gap-1 text-xs text-muted-foreground">
            {groupLabel}
            <select
              className="h-8 border-b border-border bg-transparent text-sm text-foreground"
              value={config.filter}
              onChange={(event) => update({ filter: event.target.value })}
            >
              <option value="">All</option>
              {values.map((value) => (
                <option key={value} value={value}>
                  {value === "true" ? "Yes" : value === "false" ? "No" : value}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex h-8 items-center gap-1" role="group" aria-label="Report view">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Table view"
            aria-pressed={config.view === "list"}
            onClick={() => update({ view: "list" })}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Bar view"
            aria-pressed={config.view === "bars"}
            onClick={() => update({ view: "bars" })}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <SavedViews
            userId={session?.userId}
            scope="report-analysis"
            value={{
              search: config.search,
              searchField: config.source,
              filterField: config.measure,
              filterValue: config.filter,
              groupBy: config.group,
              view: config.view === "bars" ? "cards" : "list",
            }}
            onApply={(state) =>
              onChange(
                validReport(
                  {
                    source: state.searchField,
                    search: state.search,
                    group: state.groupBy,
                    measure: state.filterField,
                    filter: state.filterValue,
                    view: state.view === "cards" ? "bars" : "list",
                  },
                  roles,
                )!,
              )
            }
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Report actions">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={!ready || !report.records || exporting}
                onSelect={() => void exportXlsx()}
              >
                {exporting ? "Preparing spreadsheet…" : "Export Excel"}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!ready || !report.records}
                onSelect={() =>
                  downloadCsv(
                    `${config.source}-report`,
                    config.measure === "count"
                      ? [groupLabel, "Records"]
                      : [groupLabel, "Records", measureLabel],
                    report.groups.map((group) =>
                      config.measure === "count"
                        ? [group.label, group.records]
                        : [group.label, group.records, group.value],
                    ),
                  )
                }
              >
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem disabled={query.isFetching} onSelect={() => void query.refetch()}>
                Refresh
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="px-6 py-5" aria-busy={query.isFetching}>
        {exportError && (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {exportError}
          </p>
        )}
        {query.isLoading || !session?.userId ? (
          <LoadingState label="Loading report" />
        ) : query.error ? (
          <ErrorState
            message={
              query.error instanceof Error ? query.error.message : "The report could not load."
            }
            onRetry={() => void query.refetch()}
          />
        ) : !report.records ? (
          <EmptyState
            title="No matching records"
            description="Change the search or grouping filter to see results."
          />
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {report.records.toLocaleString()} records
                {config.measure !== "count" &&
                  ` · ${report.measured.toLocaleString()} with revenue`}
              </p>
              <p className="text-sm">
                {measureLabel}{" "}
                <strong className="ml-3 text-xl font-semibold tabular-nums">
                  {display(report.value)}
                </strong>
              </p>
            </div>
            {config.view === "list" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">{definition.label} grouped report</caption>
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="py-3 font-medium">{groupLabel}</th>
                      <th className="px-4 py-3 text-right font-medium">Records</th>
                      {config.measure !== "count" && (
                        <th className="py-3 text-right font-medium">{measureLabel}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {report.groups.map((group) => (
                      <tr key={group.key} className="border-b border-border">
                        <th scope="row" className="py-3 text-left font-normal">
                          {group.label}
                        </th>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {group.records.toLocaleString()}
                        </td>
                        {config.measure !== "count" && (
                          <td className="py-3 text-right tabular-nums">{display(group.value)}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <ul aria-label={`${definition.label} bar report`} className="space-y-5">
                {report.groups.map((group) => (
                  <li key={group.key}>
                    <div className="mb-1 flex justify-between gap-4 text-sm">
                      <span>{group.label}</span>
                      <span className="tabular-nums">{display(group.value)}</span>
                    </div>
                    <div className="h-4 bg-muted" aria-hidden>
                      <div
                        className={
                          group.value !== null && group.value < 0
                            ? "h-full bg-danger"
                            : "h-full bg-primary"
                        }
                        style={{ width: `${(Math.abs(group.value ?? 0) / maximum) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  );
}
