import type { Row } from "@/lib/data";
import { formatMoney, formatNumber } from "@/lib/format";
export function groupCount(rows: Row[], key: (row: Row) => string) {
  const map = new Map<string, { label: string; count: number; loads: number; revenue: number }>();
  for (const row of rows) {
    const label = key(row) || "Not recorded";
    const entry = map.get(label) ?? { label, count: 0, loads: 0, revenue: 0 };
    entry.count += 1;
    entry.loads += Number(row.load_count ?? 0);
    entry.revenue += Number(row.estimated_lost_revenue ?? 0);
    map.set(label, entry);
  }
  return [...map.values()].sort((a, b) => b.loads - a.loads);
}

export function Bars({
  rows,
}: {
  rows: { label: string; count: number; loads: number; revenue: number }[];
}) {
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">Nothing recorded for this period.</p>;
  const max = Math.max(...rows.map((row) => row.loads), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{row.label}</span>
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {formatNumber(row.loads)} loads{row.revenue ? ` · ${formatMoney(row.revenue)}` : ""}
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary"
              style={{ width: `${(row.loads / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
