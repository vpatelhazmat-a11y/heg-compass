import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { Panel, StatTile } from "@/components/app/Panels";
import { EmptyState } from "@/components/app/EmptyState";
import { LostLoadTabs } from "@/components/app/LostLoadTabs";
import { Bars, groupCount } from "./lost-loads.index";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listRows, type Row } from "@/lib/data";
import { formatMoney, formatNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/lost-loads/analysis")({
  head: () => ({
    meta: [
      { title: "Lost Revenue Analysis — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Where HEG loses qualified business: by reason, customer, lane, product and equipment." },
      { property: "og:title", content: "Lost Revenue Analysis — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Breakdown of refused loads and the revenue behind them." },
    ],
  }),
  component: LostRevenueAnalysis,
});

function LostRevenueAnalysis() {
  const [range, setRange] = useState({ from: "", to: "" });

  const rows = useQuery({
    queryKey: ["refused-loads"],
    queryFn: () => listRows("refused_loads", { order: { column: "call_in_date", ascending: false } }),
  });
  const customers = useQuery({
    queryKey: ["customer-names"],
    queryFn: () => listRows("customers", { select: "id, legal_name, dba_name", order: { column: "legal_name", ascending: true } }),
  });

  const nameById = useMemo(
    () => new Map((customers.data ?? []).map((c: Row) => [c.id, c.legal_name ?? c.dba_name ?? "Unnamed customer"])),
    [customers.data],
  );

  const data = useMemo(
    () =>
      (rows.data ?? []).filter((row: Row) => {
        if (range.from && (row.call_in_date ?? "") < range.from) return false;
        if (range.to && (row.call_in_date ?? "") > range.to) return false;
        return true;
      }),
    [rows.data, range],
  );

  const totalLoads = data.reduce((sum: number, row: Row) => sum + Number(row.load_count ?? 0), 0);
  const knownRevenue = data.reduce((sum: number, row: Row) => sum + Number(row.estimated_lost_revenue ?? 0), 0);
  const missingRate = data.filter((row: Row) => row.estimated_lost_revenue == null).length;

  const byMonth = groupCount(data, (row) => (row.call_in_date ? String(row.call_in_date).slice(0, 7) : "No date")).sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  return (
    <>
      <PageHeader title="Lost revenue analysis" description="Where are we losing qualified business, and what does it cost?" />
      <LostLoadTabs />

      <div className="space-y-6 p-6">
        <Panel title="Period">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>From</Label>
              <Input type="date" value={range.from} onChange={(e) => setRange((p) => ({ ...p, from: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Input type="date" value={range.to} onChange={(e) => setRange((p) => ({ ...p, to: e.target.value }))} />
            </div>
          </div>
        </Panel>

        {data.length === 0 ? (
          <EmptyState
            title="No lost loads in this period"
            description="Widen the dates, or record refused loads to build the analysis."
          />
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Records" value={formatNumber(data.length)} />
              <StatTile label="Loads lost" value={formatNumber(totalLoads)} />
              <StatTile label="Known lost revenue" value={formatMoney(knownRevenue)} hint="Entries with a known rate only" />
              <StatTile
                label="Records without a rate"
                value={formatNumber(missingRate)}
                tone={missingRate ? "warning" : "neutral"}
                hint="Revenue impact not yet measurable"
              />
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="By reason">
                <Bars rows={groupCount(data, (row) => row.loss_reason ?? "Not recorded")} />
              </Panel>
              <Panel title="By customer">
                <Bars rows={groupCount(data, (row) => nameById.get(row.customer_id) ?? "Not linked").slice(0, 10)} />
              </Panel>
              <Panel title="By lane">
                <Bars
                  rows={groupCount(
                    data,
                    (row) =>
                      `${row.pickup_city ?? "?"}, ${row.pickup_state ?? "?"} → ${row.delivery_city ?? "?"}, ${row.delivery_state ?? "?"}`,
                  ).slice(0, 10)}
                />
              </Panel>
              <Panel title="By product">
                <Bars rows={groupCount(data, (row) => row.product ?? "Not recorded").slice(0, 10)} />
              </Panel>
              <Panel title="By equipment type">
                <Bars rows={groupCount(data, (row) => row.equipment_type ?? "Not recorded")} />
              </Panel>
              <Panel title="By pickup state">
                <Bars rows={groupCount(data, (row) => row.pickup_state ?? "Not recorded").slice(0, 10)} />
              </Panel>
              <Panel title="By delivery state">
                <Bars rows={groupCount(data, (row) => row.delivery_state ?? "Not recorded").slice(0, 10)} />
              </Panel>
              <Panel title="By CS representative">
                <Bars rows={groupCount(data, (row) => row.cs_rep ?? "Not recorded").slice(0, 10)} />
              </Panel>
              <Panel title="Trend by month" className="lg:col-span-2">
                <Bars rows={byMonth} />
              </Panel>
            </div>
          </>
        )}
      </div>
    </>
  );
}
