import { useMemo } from "react";
import { createFileRoute, Link, type SearchSchemaInput } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { RecordListPage } from "@/components/app/RecordWorkspace";
import { parseRecordListSearch } from "@/lib/record-lists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listRows, type Row } from "@/lib/data";
import { useLookup } from "@/lib/lookups";
import { formatDate, formatMoney, orDash } from "@/lib/format";
import { useSession } from "@/hooks/use-session";

const ALL = "__all__";

export const Route = createFileRoute("/_authenticated/lost-loads/records")({
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) => ({
    ...parseRecordListSearch(search),
    from:
      typeof search["from"] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(search["from"])
        ? search["from"]
        : "",
    to:
      typeof search["to"] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(search["to"])
        ? search["to"]
        : "",
    customer: typeof search["customer"] === "string" ? search["customer"].slice(0, 120) : ALL,
    reason: typeof search["reason"] === "string" ? search["reason"].slice(0, 120) : ALL,
    rep: typeof search["rep"] === "string" ? search["rep"].slice(0, 120) : ALL,
  }),
  head: () => ({
    meta: [
      { title: "Refused Load Records — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Search, filter and edit every recorded refused load." },
      { property: "og:title", content: "Refused Load Records — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "The full record of refused loads at HEG." },
    ],
  }),
  component: LostLoadRecords,
});

function LostLoadRecords() {
  const { canEdit } = useSession();
  const canWrite = canEdit("refused_loads");
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();
  const setFilters = (next: (previous: typeof filters) => typeof filters) =>
    void navigate({ search: (previous) => ({ ...next(previous), page: 0 }), replace: true });
  const activeFilters = Boolean(
    filters.from ||
    filters.to ||
    [filters.customer, filters.reason, filters.rep].some((value) => value !== ALL),
  );

  const rows = useQuery({
    queryKey: ["refused-load-reps"],
    queryFn: () =>
      listRows("refused_loads", {
        select: "id,cs_rep,created_at",
        order: { column: "cs_rep", ascending: true },
      }),
  });
  const customers = useQuery({
    queryKey: ["customer-names"],
    queryFn: () =>
      listRows("customers", {
        select: "id, legal_name, dba_name",
        order: { column: "legal_name", ascending: true },
      }),
  });
  const reasons = useLookup("lost_reason");

  const nameById = useMemo(
    () =>
      new Map(
        (customers.data ?? []).map((c: Row) => [
          c.id,
          c.legal_name ?? c.dba_name ?? "Unnamed customer",
        ]),
      ),
    [customers.data],
  );

  const reps = useMemo(
    () => [...new Set((rows.data ?? []).map((row: Row) => row.cs_rep).filter(Boolean))] as string[],
    [rows.data],
  );

  return (
    <>
      <RecordListPage
        table="refused_loads"
        state={{
          search: filters.q,
          searchField: filters.field,
          filterField: filters.filterField,
          filterValue: filters.filterValue,
          groupBy: filters.groupBy,
          sort: filters.sort,
          ascending: filters.ascending,
          page: filters.page,
          view: filters.view,
          refused: {
            from: filters.from,
            to: filters.to,
            customer: filters.customer,
            reason: filters.reason,
            rep: filters.rep,
          },
        }}
        onChange={(patch) => {
          const { refused, ...rest } = patch;
          void navigate({
            search: (previous) => ({
              ...previous,
              ...rest,
              ...("refused" in patch
                ? { from: "", to: "", customer: ALL, reason: ALL, rep: ALL, ...refused }
                : {}),
            }),
            replace: true,
          });
        }}
        actions={
          canWrite ? (
            <Button asChild>
              <Link to="/lost-loads/new">
                <Plus className="h-4 w-4" aria-hidden /> Enter refused load
              </Link>
            </Button>
          ) : undefined
        }
        activeFilters={
          activeFilters ? (
            <div className="table-active-filters">
              <button
                onClick={() =>
                  setFilters((previous) => ({
                    ...previous,
                    from: "",
                    to: "",
                    customer: ALL,
                    reason: ALL,
                    rep: ALL,
                  }))
                }
              >
                Refused load filters ×
              </button>
            </div>
          ) : undefined
        }
        extraFilters={
          <div className="space-y-3">
            <p className="field-label">Refused load filters</p>
            <div>
              <Label htmlFor="refused-from">From</Label>
              <Input
                id="refused-from"
                type="date"
                value={filters.from}
                onChange={(event) => {
                  const value = event.target.value;
                  setFilters((previous) => ({ ...previous, from: value }));
                }}
              />
            </div>
            <div>
              <Label htmlFor="refused-to">To</Label>
              <Input
                id="refused-to"
                type="date"
                value={filters.to}
                onChange={(event) => {
                  const value = event.target.value;
                  setFilters((previous) => ({ ...previous, to: value }));
                }}
              />
            </div>
            <Picker
              label="Customer"
              value={filters.customer}
              onChange={(value) => setFilters((previous) => ({ ...previous, customer: value }))}
              options={(customers.data ?? []).map((row: Row) => ({
                value: row.id,
                label: row.legal_name ?? "Unnamed customer",
              }))}
            />
            <Picker
              label="Reason"
              value={filters.reason}
              onChange={(value) => setFilters((previous) => ({ ...previous, reason: value }))}
              options={reasons.options}
            />
            <Picker
              label="CS rep"
              value={filters.rep}
              onChange={(value) => setFilters((previous) => ({ ...previous, rep: value }))}
              options={reps.map((value) => ({ value, label: value }))}
            />
          </div>
        }
        columns={[
          {
            key: "call_in_date",
            header: "Call in",
            render: (row) => formatDate(row.call_in_date),
          },
          {
            key: "customer",
            header: "Customer",
            sortable: false,
            value: (row) => nameById.get(row.customer_id) ?? "",
            render: (row) => orDash(nameById.get(row.customer_id)),
          },
          {
            key: "equipment_type",
            header: "Equipment",
            render: (row) => orDash(row.equipment_type),
          },
          { key: "load_count", header: "Loads", align: "right" },
          {
            key: "lane",
            sortable: false,
            header: "Lane",
            value: (row) =>
              `${orDash(row.pickup_city)}, ${orDash(row.pickup_state)} → ${orDash(row.delivery_city)}, ${orDash(row.delivery_state)}`,
            render: (row) =>
              `${orDash(row.pickup_city)}, ${orDash(row.pickup_state)} → ${orDash(row.delivery_city)}, ${orDash(row.delivery_state)}`,
          },
          { key: "loss_reason", header: "Reason", render: (row) => orDash(row.loss_reason) },
          {
            key: "estimated_lost_revenue",
            header: "Lost revenue",
            align: "right",
            render: (row) =>
              row.estimated_lost_revenue == null
                ? "Rate unknown"
                : formatMoney(row.estimated_lost_revenue),
          },
          { key: "cs_rep", header: "CS rep", render: (row) => orDash(row.cs_rep) },
        ]}
      />
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
        <SelectTrigger aria-label={label}>
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
