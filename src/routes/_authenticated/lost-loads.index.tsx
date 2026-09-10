import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Panel, StatTile } from "@/components/app/Panels";
import { EmptyState, LoadingState } from "@/components/app/EmptyState";
import { LostLoadTabs } from "@/components/app/LostLoadTabs";
import { Button } from "@/components/ui/button";
import { listRows, type Row } from "@/lib/data";
import { formatMoney, formatNumber, isoInDays, todayISO } from "@/lib/format";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/lost-loads/")({
  head: () => ({
    meta: [
      { title: "Lost Loads — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Refused loads, lost revenue and the capacity constraints behind them." },
      { property: "og:title", content: "Lost Loads — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Where HEG is losing qualified business, and why." },
    ],
  }),
  component: LostLoadsDashboard,
});

export function useRefusedLoads() {
  return useQuery({
    queryKey: ["refused-loads"],
    queryFn: () => listRows("refused_loads", { order: { column: "call_in_date", ascending: false } }),
  });
}

export function customerNames() {
  return listRows("customers", { select: "id, legal_name, dba_name", order: { column: "legal_name", ascending: true } });
}

function LostLoadsDashboard() {
  const { canWrite } = useSession();
  const rows = useRefusedLoads();
  const customers = useQuery({ queryKey: ["customer-names"], queryFn: customerNames });

  if (rows.isLoading) {
    return (
      <>
        <PageHeader title="Lost loads" description="Loading." />
        <LostLoadTabs />
        <div className="p-6">
          <LoadingState />
        </div>
      </>
    );
  }

  const data: Row[] = rows.data ?? [];
  const nameById = new Map((customers.data ?? []).map((c: Row) => [c.id, c.legal_name ?? c.dba_name ?? "Unnamed customer"]));

  const today = todayISO();
  const weekAgo = isoInDays(-7);
  const monthStart = `${today.slice(0, 7)}-01`;
  const yearStart = `${today.slice(0, 4)}-01-01`;

  const loadsIn = (from: string) =>
    data.filter((row) => (row.call_in_date ?? "") >= from).reduce((sum, row) => sum + Number(row.load_count ?? 0), 0);
  const revenueIn = (from: string) =>
    data.filter((row) => (row.call_in_date ?? "") >= from).reduce((sum, row) => sum + Number(row.estimated_lost_revenue ?? 0), 0);

  const capacityReasons = ["No capacity", "No driver available", "No equipment available"];
  const byReason = groupCount(data, (row) => row.loss_reason ?? "Not recorded");
  const byCustomer = groupCount(data, (row) => nameById.get(row.customer_id) ?? "Not linked to a customer");

  return (
    <>
      <PageHeader
        title="Lost loads"
        description="Every refused or unserviceable load, and the revenue behind it."
        actions={
          canWrite ? (
            <Button asChild>
              <Link to="/lost-loads/new">
                <Plus className="h-4 w-4" aria-hidden /> Enter refused load
              </Link>
            </Button>
          ) : undefined
        }
      />
      <LostLoadTabs />

      <div className="space-y-6 p-6">
        {data.length === 0 ? (
          <EmptyState
            title="No lost loads recorded yet"
            description="Record a refused load whenever HEG cannot accept or service requested business. Once entries exist, this page shows the volume, the revenue and the reasons behind it."
            action={
              canWrite ? (
                <Button asChild>
                  <Link to="/lost-loads/new">Enter the first refused load</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Loads lost this week" value={formatNumber(loadsIn(weekAgo))} />
              <StatTile label="Loads lost this month" value={formatNumber(loadsIn(monthStart))} />
              <StatTile label="Loads lost this year" value={formatNumber(loadsIn(yearStart))} />
              <StatTile
                label="Estimated lost revenue this year"
                value={formatMoney(revenueIn(yearStart))}
                hint="Only entries with a known rate"
              />
            </section>

            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile
                label="Lost to capacity"
                value={data.filter((row) => row.loss_reason === "No capacity").length}
                tone="warning"
              />
              <StatTile
                label="Lost to driver availability"
                value={data.filter((row) => row.loss_reason === "No driver available").length}
                tone="warning"
              />
              <StatTile
                label="Lost to equipment availability"
                value={data.filter((row) => row.loss_reason === "No equipment available").length}
                tone="warning"
              />
              <StatTile
                label="Lost to constraints we control"
                value={data.filter((row) => capacityReasons.includes(row.loss_reason)).length}
                tone="danger"
                hint="Capacity, drivers or equipment"
              />
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Reasons we lost business" description="Records by reason">
                <Bars rows={byReason} />
              </Panel>
              <Panel title="Customers we turned away most" description="Records by customer">
                <Bars rows={byCustomer.slice(0, 8)} />
              </Panel>
            </div>
          </>
        )}
      </div>
    </>
  );
}

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

export function Bars({ rows }: { rows: { label: string; count: number; loads: number; revenue: number }[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Nothing recorded for this period.</p>;
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
            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(row.loads / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
