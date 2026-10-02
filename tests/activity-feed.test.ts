import { expect, test } from "vitest";
import { buildActivityFeed } from "../src/lib/activity-feed";

test("activity feed includes actionable deadlines and sorts overdue work first", () => {
  const feed = buildActivityFeed(
    {
      tasks: [
        { id: "task-1", title: "Call customer", due_date: "2026-10-01", status: "Open" },
        { id: "task-2", title: "Done", due_date: "2026-10-01", status: "Completed" },
      ],
      bids: [
        { id: "bid-1", bid_name: "RFP", due_date: "2026-10-04", status: "Draft" },
        { id: "bid-2", bid_name: "Won RFP", due_date: "2026-10-02", status: "Won" },
      ],
      documents: [
        { id: "doc-1", document_name: "Permit", expiration_date: "2026-10-21", status: "Active" },
      ],
      contracts: [
        {
          id: "contract-1",
          contract_name: "Long term",
          expiration_date: "2027-01-01",
          status: "Active",
        },
      ],
    },
    "2026-10-02",
  );
  expect(feed.map((item) => item.title)).toEqual(["Call customer", "RFP", "Permit"]);
  expect(feed[0]).toMatchObject({ daysAway: -1, href: "/records/tasks/task-1" });
});
