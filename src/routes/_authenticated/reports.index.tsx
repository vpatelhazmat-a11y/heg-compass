import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { Panel, StatTile } from "@/components/app/Panels";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState } from "@/components/app/EmptyState";
import { listRows } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { ReportWorkbench } from "@/components/app/ReportWorkbench";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ReportConfig } from "@/lib/reporting";
import { useSession } from "@/hooks/use-session";
import { canViewTable } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/reports/")({
  validateSearch: (
    search: Record<string, unknown>,
  ): Partial<ReportConfig> & { section?: "analysis" | "summary" } => ({
    ...(search["section"] === "summary" ? { section: "summary" } : {}),
    ...Object.fromEntries(
      ["source", "group", "measure", "search", "filter"].flatMap((key) =>
        typeof search[key] === "string" ? [[key, String(search[key]).slice(0, 120)]] : [],
      ),
    ),
    ...(search["view"] === "bars" ? { view: "bars" } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Reports — HEG Commercial Intelligence Hub" },
      {
        name: "description",
        content: "Commercial and capacity summaries drawn from records already in the Hub.",
      },
      { property: "og:title", content: "Reports — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Summary reporting for HazMat Environmental Group." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <>
      <PageHeader
        title="Reports"
        breadcrumbs={[{ label: "Apps", to: "/command-center" }, { label: "Reports" }]}
      />
      <Tabs
        value={search.section ?? "analysis"}
        onValueChange={(section) =>
          void navigate({
            search: { ...search, section: section === "summary" ? "summary" : "analysis" },
          })
        }
      >
        <TabsList className="mx-6 mt-3" aria-label="Report workspace">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
        <TabsContent value="analysis">
          <ReportWorkbench
            value={search}
            onChange={(config) =>
              void navigate({ search: { ...config, section: "analysis" }, replace: true })
            }
          />
        </TabsContent>
        <TabsContent value="summary">
          <ReportSummary />
        </TabsContent>
      </Tabs>
    </>
  );
}

function ReportSummary() {
  const { roles, session } = useSession();
  const visible = (kind: string) => canViewTable(roles, kind);
  const read = (kind: string, select: string) =>
    visible(kind) ? listRows(kind, { select }) : Promise.resolve([]);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["reports", session?.userId, roles.join(",")],
    enabled: Boolean(session?.userId && roles.length),
    queryFn: async () => {
      const [customers, sites, equipment, bids, opportunities, lost] = await Promise.all([
        read("customers", "id, status"),
        read("sites", "id, status"),
        read("equipment", "id, status"),
        read("bids", "id, status, estimated_revenue"),
        read("opportunities", "id, stage, estimated_revenue, capacity_status"),
        read(
          "lost_business",
          "id, estimated_revenue, capacity_issue, driver_issue, equipment_issue",
        ),
      ]);
      return { customers, sites, equipment, bids, opportunities, lost };
    },
  });

  if (error)
    return (
      <>
        <div className="p-6">
          <ErrorState
            message={error instanceof Error ? error.message : "Reports could not load."}
          />
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      </>
    );

  if (isLoading || !data) {
    return (
      <>
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
      <div className="space-y-6 p-6">
        <Panel
          title="Coverage"
          description="How much of the business is captured in the Hub so far"
        >
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Customers" value={data.customers.length} />
            <StatTile label="Sites" value={data.sites.length} />
            <StatTile label="Equipment units" value={data.equipment.length} />
            {visible("bids") && <StatTile label="Bids" value={data.bids.length} />}
          </div>
        </Panel>

        <Panel title="Commercial performance">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {visible("bids") && (
              <StatTile
                label="Bid win rate"
                value={winRate === null ? "—" : `${winRate}%`}
                hint={decided ? `${won} of ${decided} decided` : "No decided bids yet"}
              />
            )}
            <StatTile
              label="Open pipeline"
              value={formatMoney(
                data.opportunities
                  .filter((o) => !["Won", "Lost"].includes(o.stage))
                  .reduce((s, o) => s + Number(o.estimated_revenue ?? 0), 0),
              )}
            />
            <StatTile
              label="Blocked by capacity"
              value={
                data.opportunities.filter(
                  (o) => o.capacity_status && o.capacity_status !== "Serviceable",
                ).length
              }
              tone="warning"
            />
            <StatTile
              label="Revenue not served"
              value={formatMoney(
                data.lost.reduce((s, l) => s + Number(l.estimated_revenue ?? 0), 0),
              )}
            />
          </div>
        </Panel>

        <Panel title="Why HEG lost work">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatTile
              label="Capacity a factor"
              value={data.lost.filter((l) => l.capacity_issue).length}
            />
            <StatTile
              label="Driver availability a factor"
              value={data.lost.filter((l) => l.driver_issue).length}
            />
            <StatTile
              label="Equipment a factor"
              value={data.lost.filter((l) => l.equipment_issue).length}
            />
          </div>
        </Panel>
      </div>
    </>
  );
}
