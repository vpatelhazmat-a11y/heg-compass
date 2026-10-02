import { recordHref } from "./record-registry";
import type { Row } from "./data";

export type ActivityItem = {
  id: string;
  title: string;
  kind: "Task" | "Bid" | "Document" | "Contract";
  dueDate: string;
  daysAway: number;
  href: string;
};

function daysBetween(date: string, today: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const due = Date.parse(`${date}T00:00:00Z`);
  const start = Date.parse(`${today}T00:00:00Z`);
  return Number.isFinite(due) && Number.isFinite(start)
    ? Math.round((due - start) / 86_400_000)
    : null;
}

export function buildActivityFeed(
  rows: { tasks: Row[]; bids: Row[]; documents: Row[]; contracts: Row[] },
  today: string,
): ActivityItem[] {
  const items: ActivityItem[] = [];
  const add = (
    kind: ActivityItem["kind"],
    table: string,
    row: Row,
    title: string,
    date: string | null | undefined,
    horizon: number,
  ) => {
    const daysAway = date ? daysBetween(date, today) : null;
    if (daysAway === null || daysAway > horizon) return;
    items.push({
      id: `${kind}:${row.id}`,
      kind,
      title,
      dueDate: date!,
      daysAway,
      href: recordHref(table, row.id),
    });
  };
  for (const row of rows.tasks) {
    if (["Completed", "Cancelled"].includes(row.status)) continue;
    add("Task", "tasks", row, row.title || "Untitled task", row.due_date, 7);
  }
  for (const row of rows.bids) {
    if (["Won", "Lost", "Withdrawn", "Cancelled"].includes(row.status)) continue;
    add("Bid", "bids", row, row.bid_name || "Bid deadline", row.due_date, 7);
  }
  for (const row of rows.documents) {
    if (row.status === "Archived") continue;
    add(
      "Document",
      "documents",
      row,
      row.document_name || "Document expiry",
      row.expiration_date,
      30,
    );
  }
  for (const row of rows.contracts) {
    if (["Expired", "Archived", "Terminated"].includes(row.status)) continue;
    add(
      "Contract",
      "contracts",
      row,
      row.contract_name || "Contract expiry",
      row.expiration_date,
      30,
    );
  }
  return items.sort((a, b) => a.daysAway - b.daysAway || a.kind.localeCompare(b.kind)).slice(0, 25);
}
