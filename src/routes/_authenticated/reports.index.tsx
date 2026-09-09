import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { Panel, StatTile } from "@/components/app/Panels";
import { LoadingState } from "@/components/app/EmptyState";
import { listRows } from "@/lib/data";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reports/")({
  head: () => ({
    meta: [
      { title: "Reports — HEG Commercial Intelligence Hub" },
      { name: "description", content: "Commercial and capacity summaries drawn from records already in the Hub." },
      { property: "og:title", content: "Reports — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Summary reporting for HazMat Environmental Group." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const [customers, sites, equipment, bids, opportunities, lost] = await Promise.all([
        listRows("customers", { select: "id, status" }),
        listRows("sites", { select: "id, status" }),
        listRows("equipment", { select: "id, status" }),
        listRows("bids", { select: "id, status, estimated_revenue" }),
        listRows("opportunities", { select: "id, stage, estimated_revenue, capacity_status" }),
        listRows("lost_business", { select: "id, estimated_revenue, capacity_issue, driver_issue, equipment_issue" }),
      ]);
      return { customers, sites, equipment, bids, opportunities, lost };
    },
  });

  if (isLoading || !data) {
    return (
      <>
        <PageHeader title="Reports" />
        <div className="p-6">
          <LoadingState />
        </div>
      </>
    );
  }

  const won = data.bids.filter((b) => b.status === "Won").length;
  const decided = data.bids.filter((b) => ["Won", "Lost"].includes(b.status)).length;
  const winRate = decided ? Math.round((won / decided) * 100) : null;

  return (
    <>
      <PageHeader
        title="Reports"
        description="Summaries built only from what has been recorded — no estimates, no filler."
      />
      <div className="space-y-6 p-6">
        <Panel title="Coverage" description="How much of the business is captured in the Hub so far">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Customers" value={data.customers.length} />
            <StatTile label="Sites" value={data.sites.length} />
            <StatTile label="Equipment units" value={data.equipment.length} />
            <StatTile label="Bids" value={data.bids.length} />
          </div>
        </Panel>

        <Panel title="Commercial performance">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Bid win rate" value={winRate === null ? "—" : `${winRate}%`} hint={decided ? `${won} of ${decided} decided` : "No decided bids yet"} />
            <StatTile
              label="Open pipeline"
              value={formatMoney(
                data.opportunities.filter((o) => !["Won", "Lost"].includes(o.stage)).reduce((s, o) => s + Number(o.estimated_revenue ?? 0), 0),
              )}
            />
            <StatTile
              label="Blocked by capacity"
              value={data.opportunities.filter((o) => o.capacity_status && o.capacity_status !== "Serviceable").length}
              tone="warning"
            />
            <StatTile
              label="Revenue not served"
              value={formatMoney(data.lost.reduce((s, l) => s + Number(l.estimated_revenue ?? 0), 0))}
            />
          </div>
        </Panel>

        <Panel title="Why HEG lost work">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatTile label="Capacity a factor" value={data.lost.filter((l) => l.capacity_issue).length} />
            <StatTile label="Driver availability a factor" value={data.lost.filter((l) => l.driver_issue).length} />
            <StatTile label="Equipment a factor" value={data.lost.filter((l) => l.equipment_issue).length} />
          </div>
        </Panel>
      </div>
    </>
  );
}
