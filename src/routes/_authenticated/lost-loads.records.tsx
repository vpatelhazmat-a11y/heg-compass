import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Panel } from "@/components/app/Panels";
import { DataTable } from "@/components/app/DataTable";
import { LostLoadTabs } from "@/components/app/LostLoadTabs";
import { RefusedLoadForm, toFormState } from "@/components/app/RefusedLoadForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listRows, type Row } from "@/lib/data";
import { useLookup } from "@/lib/lookups";
import { formatDate, formatMoney, orDash } from "@/lib/format";
import { useSession } from "@/hooks/use-session";

const ALL = "__all__";

export const Route = createFileRoute("/_authenticated/lost-loads/records")({
  head: () => ({
    meta: [
      { title: "Lost Load Records — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Search, filter and edit every recorded refused load." },
      { property: "og:title", content: "Lost Load Records — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "The full record of refused loads at HEG." },
    ],
  }),
  component: LostLoadRecords,
});

function LostLoadRecords() {
  const { canWrite } = useSession();
  const [editing, setEditing] = useState<Row | null>(null);
  const [filters, setFilters] = useState({ from: "", to: "", customer: ALL, reason: ALL, rep: ALL });

  const rows = useQuery({
    queryKey: ["refused-loads"],
    queryFn: () => listRows("refused_loads", { order: { column: "call_in_date", ascending: false } }),
  });
  const customers = useQuery({
    queryKey: ["customer-names"],
    queryFn: () => listRows("customers", { select: "id, legal_name, dba_name", order: { column: "legal_name", ascending: true } }),
  });
  const reasons = useLookup("loss_reason");

  const nameById = useMemo(
    () => new Map((customers.data ?? []).map((c: Row) => [c.id, c.legal_name ?? c.dba_name ?? "Unnamed customer"])),
    [customers.data],
  );

  const reps = useMemo(
    () => [...new Set((rows.data ?? []).map((row: Row) => row.cs_rep).filter(Boolean))] as string[],
    [rows.data],
  );

  const filtered = useMemo(() => {
    return (rows.data ?? []).filter((row: Row) => {
      if (filters.from && (row.call_in_date ?? "") < filters.from) return false;
      if (filters.to && (row.call_in_date ?? "") > filters.to) return false;
      if (filters.customer !== ALL && row.customer_id !== filters.customer) return false;
      if (filters.reason !== ALL && row.loss_reason !== filters.reason) return false;
      if (filters.rep !== ALL && row.cs_rep !== filters.rep) return false;
      return true;
    });
  }, [rows.data, filters]);

  return (
    <>
      <PageHeader
        title="Lost load records"
        description="Every refused load, searchable and editable."
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
        <Panel title="Filters">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label>From</Label>
              <Input type="date" value={filters.from} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Input type="date" value={filters.to} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))} />
            </div>
            <Picker
              label="Customer"
              value={filters.customer}
              onChange={(v) => setFilters((p) => ({ ...p, customer: v }))}
              options={(customers.data ?? []).map((c: Row) => ({ value: c.id, label: c.legal_name ?? "Unnamed customer" }))}
            />
            <Picker
              label="Reason"
              value={filters.reason}
              onChange={(v) => setFilters((p) => ({ ...p, reason: v }))}
              options={reasons.options}
            />
            <Picker
              label="CS rep"
              value={filters.rep}
              onChange={(v) => setFilters((p) => ({ ...p, rep: v }))}
              options={reps.map((rep) => ({ value: rep, label: rep }))}
            />
          </div>
        </Panel>

        <DataTable
          rows={filtered}
          isLoading={rows.isLoading}
          error={rows.error}
          exportName="heg-lost-loads"
          searchPlaceholder="Search lost loads"
          emptyTitle="No lost loads match these filters"
          emptyDescription="Clear the filters, or record a refused load to start tracking lost revenue."
          onRowClick={canWrite ? (row) => setEditing(row) : undefined}
          columns={[
            { key: "call_in_date", header: "Call in", render: (row) => formatDate(row.call_in_date) },
            { key: "customer", header: "Customer", value: (row) => nameById.get(row.customer_id) ?? "", render: (row) => orDash(nameById.get(row.customer_id)) },
            { key: "equipment_type", header: "Equipment", render: (row) => orDash(row.equipment_type) },
            { key: "load_count", header: "Loads", align: "right" },
            {
              key: "lane",
              header: "Lane",
              value: (row) => `${row.pickup_city ?? ""} ${row.pickup_state ?? ""} ${row.delivery_city ?? ""} ${row.delivery_state ?? ""}`,
              render: (row) =>
                `${orDash(row.pickup_city)}, ${orDash(row.pickup_state)} → ${orDash(row.delivery_city)}, ${orDash(row.delivery_state)}`,
            },
            { key: "loss_reason", header: "Reason", render: (row) => orDash(row.loss_reason) },
            {
              key: "estimated_lost_revenue",
              header: "Lost revenue",
              align: "right",
              render: (row) => (row.estimated_lost_revenue == null ? "Rate unknown" : formatMoney(row.estimated_lost_revenue)),
            },
            { key: "cs_rep", header: "CS rep", render: (row) => orDash(row.cs_rep) },
          ]}
        />

        {editing && (
          <Panel title="Edit refused load" description={`Recorded ${formatDate(editing.call_in_date)}`}>
            <RefusedLoadForm
              recordId={editing.id}
              initial={toFormState(editing)}
              onSaved={() => setEditing(null)}
              onCancel={() => setEditing(null)}
            />
          </Panel>
        )}
      </div>
    </>
  );
}

function Picker({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value={ALL}>All</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
