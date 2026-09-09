import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, ClipboardCheck, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Panel, StatTile } from "@/components/app/Panels";
import { EmptyState, LoadingState } from "@/components/app/EmptyState";
import { StatusBadge } from "@/components/app/StatusBadge";
import { listRows, type Row } from "@/lib/data";
import { daysUntil, dueLabel, formatDate, formatMoney, isoInDays, todayISO } from "@/lib/format";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/command-center")({
  head: () => ({
    meta: [
      { title: "Command Center — HEG Commercial Intelligence Hub" },
      { name: "description", content: "What needs attention today across customers, bids, capacity and safety." },
      { property: "og:title", content: "Command Center — HEG Commercial Intelligence Hub" },
      { property: "og:description", content: "Today's exceptions across commercial and safety activity." },
    ],
  }),
  component: CommandCenter,
});

function useCommandData() {
  return useQuery({
    queryKey: ["command-center"],
    queryFn: async () => {
      const [tasks, bids, contracts, assessments, incidents, actions, opportunities, lost] = await Promise.all([
        listRows("tasks", { order: { column: "due_date", ascending: true } }),
        listRows("bids", { order: { column: "due_date", ascending: true } }),
        listRows("contracts", { order: { column: "expiration_date", ascending: true } }),
        listRows("site_assessments", { order: { column: "next_review_date", ascending: true } }),
        listRows("incidents", { order: { column: "incident_date", ascending: false } }).catch(() => [] as Row[]),
        listRows("corrective_actions", { order: { column: "due_date", ascending: true } }).catch(() => [] as Row[]),
        listRows("opportunities", { order: { column: "expected_close_date", ascending: true } }),
        listRows("lost_business", { order: { column: "occurred_on", ascending: false } }),
      ]);
      return { tasks, bids, contracts, assessments, incidents, actions, opportunities, lost };
    },
  });
}

function CommandCenter() {
  const { session, canViewSafety } = useSession();
  const { data, isLoading } = useCommandData();

  if (isLoading || !data) {
    return (
      <>
        <PageHeader title="Command Center" description="What needs your attention today." />
        <div className="p-6">
          <LoadingState />
        </div>
      </>
    );
  }

  const today = todayISO();
  const soon = isoInDays(14);

  const overdueTasks = data.tasks.filter(
    (task) => !["Completed", "Cancelled"].includes(task.status) && task.due_date && task.due_date < today,
  );
  const openTasks = data.tasks.filter((task) => !["Completed", "Cancelled"].includes(task.status));
  const liveBids = data.bids.filter((bid) => !["Won", "Lost", "Withdrawn", "Cancelled", "Submitted"].includes(bid.status));
  const bidsDue = liveBids.filter((bid) => bid.due_date && bid.due_date <= soon);
  const overdueBids = liveBids.filter((bid) => bid.due_date && bid.due_date < today);
  const renewals = data.contracts.filter(
    (contract) => contract.expiration_date && contract.expiration_date <= isoInDays(90),
  );
  const assessmentsDue = data.assessments.filter(
    (assessment) => assessment.next_review_date && assessment.next_review_date <= isoInDays(90),
  );
  const openIncidents = data.incidents.filter((incident) => ["Open", "In Process"].includes(incident.status));
  const overdueActions = data.actions.filter(
    (action) => !["Completed", "Cancelled"].includes(action.status) && action.due_date && action.due_date < today,
  );
  const openOpportunities = data.opportunities.filter((opp) => !["Won", "Lost"].includes(opp.stage));
  const pipelineValue = openOpportunities.reduce((sum, opp) => sum + Number(opp.estimated_revenue ?? 0), 0);
  const blocked = openOpportunities.filter((opp) => opp.capacity_status && opp.capacity_status !== "Serviceable");
  const capacityLost = data.lost.filter((row) => row.capacity_issue || row.driver_issue || row.equipment_issue);
  const capacityLostRevenue = capacityLost.reduce((sum, row) => sum + Number(row.estimated_revenue ?? 0), 0);

  const nothingYet =
    data.tasks.length === 0 &&
    data.bids.length === 0 &&
    data.opportunities.length === 0 &&
    data.incidents.length === 0;

  const firstName = session?.fullName?.split(" ")[0];

  return (
    <>
      <PageHeader
        title={firstName ? `Good day, ${firstName}` : "Command Center"}
        description="Exceptions first: what is overdue, due soon, or blocked."
      />

      <div className="space-y-6 p-6">
        {nothingYet && (
          <EmptyState
            title="Your Hub is ready and empty"
            description="No customer, bid, opportunity or safety information has been added yet. Create your first record with the New button, or bring information in through the Import Center once your spreadsheets are ready."
          />
        )}

        <section aria-labelledby="today-heading" className="space-y-3">
          <h2 id="today-heading" className="section-title">
            Today
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Overdue tasks" value={overdueTasks.length} tone={overdueTasks.length ? "danger" : "neutral"} />
            <StatTile label="Bids due in 14 days" value={bidsDue.length} tone={overdueBids.length ? "danger" : bidsDue.length ? "warning" : "neutral"} hint={overdueBids.length ? `${overdueBids.length} overdue` : undefined} />
            <StatTile label="Contract renewals (90 days)" value={renewals.length} tone={renewals.length ? "warning" : "neutral"} />
            <StatTile
              label="Assessments due (90 days)"
              value={canViewSafety ? assessmentsDue.length : "—"}
              tone={assessmentsDue.length ? "warning" : "neutral"}
            />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Bids needing attention" description="Live bids sorted by due date">
            {bidsDue.length === 0 ? (
              <EmptyState title="No bid deadlines in the next two weeks" description="Add a bid to start tracking its deadlines." />
            ) : (
              <ul className="divide-y divide-border">
                {bidsDue.slice(0, 6).map((bid) => {
                  const due = dueLabel(bid.due_date);
                  return (
                    <li key={bid.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <Link to="/bids" className="truncate text-sm font-medium text-foreground hover:underline">
                          {bid.bid_name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{formatDate(bid.due_date)}</p>
                      </div>
                      <StatusBadge status={due.label} tone={due.tone === "neutral" ? "info" : due.tone} />
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Open tasks" description="Yours and your team's">
            {openTasks.length === 0 ? (
              <EmptyState title="No open tasks" description="Tasks created from meetings, bids and incidents appear here." />
            ) : (
              <ul className="divide-y divide-border">
                {openTasks.slice(0, 6).map((task) => {
                  const due = dueLabel(task.due_date);
                  return (
                    <li key={task.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.priority} priority</p>
                      </div>
                      <StatusBadge status={due.label} tone={due.tone === "neutral" ? "neutral" : due.tone} />
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-3">
              <Link to="/tasks" className="text-sm font-medium text-primary hover:underline">
                View all tasks
              </Link>
            </div>
          </Panel>
        </div>

        <section aria-labelledby="sales-heading" className="space-y-3">
          <h2 id="sales-heading" className="section-title">
            Sales
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Open opportunities" value={openOpportunities.length} />
            <StatTile label="Open pipeline value" value={formatMoney(pipelineValue)} hint="Sales estimates" />
            <StatTile label="Blocked by capacity" value={blocked.length} tone={blocked.length ? "warning" : "neutral"} />
            <StatTile label="Live bids" value={liveBids.length} />
          </div>
        </section>

        <section aria-labelledby="capacity-heading" className="space-y-3">
          <h2 id="capacity-heading" className="section-title">
            Capacity
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Lost business records" value={data.lost.length} />
            <StatTile
              label="Lost because of capacity"
              value={capacityLost.length}
              tone={capacityLost.length ? "warning" : "neutral"}
              hint="Driver, equipment or capacity"
            />
            <StatTile label="Revenue not served" value={formatMoney(capacityLostRevenue)} hint="Recorded by Sales" />
            <StatTile
              label="Potentially recoverable"
              value={data.lost.filter((row) => row.recoverable).length}
              tone="info"
            />
          </div>
        </section>

        {canViewSafety && (
          <section aria-labelledby="safety-heading" className="space-y-3">
            <h2 id="safety-heading" className="section-title">
              Safety
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Open incidents" value={openIncidents.length} tone={openIncidents.length ? "warning" : "neutral"} />
              <StatTile label="Overdue corrective actions" value={overdueActions.length} tone={overdueActions.length ? "danger" : "neutral"} />
              <StatTile
                label="Assessments expired"
                value={data.assessments.filter((a) => (daysUntil(a.next_review_date) ?? 1) < 0).length}
                tone="danger"
              />
              <StatTile label="Assessments on file" value={data.assessments.length} />
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Panel title="Contract renewals" className="lg:col-span-1">
            {renewals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing expiring in the next 90 days.</p>
            ) : (
              <ul className="space-y-2.5">
                {renewals.slice(0, 5).map((contract) => (
                  <li key={contract.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{contract.contract_name ?? contract.contract_number}</span>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(contract.expiration_date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Assessments due" className="lg:col-span-1">
            {assessmentsDue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No site assessments are due in the next 90 days.</p>
            ) : (
              <ul className="space-y-2.5">
                {assessmentsDue.slice(0, 5).map((assessment) => (
                  <li key={assessment.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{assessment.assessment_type ?? "Site assessment"}</span>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(assessment.next_review_date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Where to start" className="lg:col-span-1">
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <ClipboardCheck className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
                <Link to="/customers" className="hover:underline">
                  Add a customer and its sites
                </Link>
              </li>
              <li className="flex items-start gap-2">
                <CalendarClock className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
                <Link to="/bids" className="hover:underline">
                  Track a bid deadline
                </Link>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
                <Link to="/sales" className="hover:underline">
                  Record business we lost and why
                </Link>
              </li>
              <li className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
                <Link to="/safety" className="hover:underline">
                  Log an incident or assessment
                </Link>
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
