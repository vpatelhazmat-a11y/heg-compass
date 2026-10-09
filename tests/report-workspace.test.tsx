// @vitest-environment jsdom
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReportConfig } from "../src/lib/reporting";
const mocks = vi.hoisted(() => ({
  roles: ["sales"],
  list: vi.fn(async () => [{ id: "fixture", legal_name: "Fixture", status: "Active" }]),
  export: vi.fn(),
  spreadsheet: vi.fn(),
}));
vi.mock("../src/hooks/use-session", () => ({
  useSession: () => ({ roles: mocks.roles, session: { userId: "fixture" } }),
}));
vi.mock("../src/lib/data", () => ({ listRows: mocks.list }));
vi.mock("../src/lib/csv", () => ({ downloadCsv: mocks.export }));
vi.mock("../src/lib/spreadsheet-export", () => ({ downloadSpreadsheet: mocks.spreadsheet }));
import { ReportWorkbench } from "../src/components/app/ReportWorkbench";
const clients: QueryClient[] = [];
function mount(initial: Partial<ReportConfig> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  function Workspace() {
    const [value, onChange] = useState<Partial<ReportConfig>>(initial);
    return <ReportWorkbench value={value} onChange={onChange} />;
  }
  render(
    <QueryClientProvider client={client}>
      <Workspace />
    </QueryClientProvider>,
  );
}
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.clearAllMocks();
  mocks.roles = ["sales"];
  localStorage.clear();
});
test("report loads only its selected source and group changes update the projection", async () => {
  mount();
  await screen.findByRole("table");
  expect(screen.queryByRole("option", { name: "Drivers" })).toBeNull();
  expect(mocks.list).toHaveBeenCalledWith("customers", { select: "id,legal_name" });
  fireEvent.change(screen.getByLabelText("Group by"), { target: { value: "status" } });
  await screen.findByText("Active", { selector: "th" });
  expect(mocks.list).toHaveBeenLastCalledWith("customers", { select: "id,legal_name,status" });
  fireEvent.click(screen.getByRole("button", { name: "Bar view" }));
  expect(screen.getByRole("list", { name: "Customers bar report" })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Search records"), { target: { value: "missing" } });
  expect(screen.getByText("No matching records")).toBeTruthy();
  expect(mocks.export).not.toHaveBeenCalled();
});
test("failed report can retry without losing the selected source or search", async () => {
  mocks.list.mockRejectedValueOnce(new Error("Report unavailable"));
  mount({ search: "Fixture" });
  fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
  await screen.findByRole("table");
  expect(screen.getByLabelText("Search records")).toHaveProperty("value", "Fixture");
});
test("accounts without module access do not query report data", async () => {
  mocks.roles = [];
  mount();
  await waitFor(() => expect(screen.getByText("No report sources available")).toBeTruthy());
  expect(mocks.list).not.toHaveBeenCalled();
});

test("count export contains only matching groups and no duplicate measure column", async () => {
  mount({ search: "Fixture", group: "status" });
  await screen.findByRole("table");
  fireEvent.keyDown(screen.getByRole("button", { name: "Report actions" }), { key: "Enter" });
  fireEvent.click(await screen.findByRole("menuitem", { name: "Export CSV" }));
  expect(mocks.export).toHaveBeenCalledWith(
    "customers-report",
    ["Status", "Records"],
    [["Active", 1]],
  );
});

test("failed spreadsheet export preserves the report and offers the action again", async () => {
  mocks.spreadsheet.mockRejectedValueOnce(new Error("Export failed"));
  mount({ search: "Fixture", group: "status" });
  await screen.findByRole("table");
  fireEvent.keyDown(screen.getByRole("button", { name: "Report actions" }), { key: "Enter" });
  fireEvent.click(await screen.findByRole("menuitem", { name: "Export Excel" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "The spreadsheet could not be exported. Your report is unchanged; try again.",
  );
  expect(screen.getByLabelText("Search records")).toHaveProperty("value", "Fixture");
  fireEvent.keyDown(screen.getByRole("button", { name: "Report actions" }), { key: "Enter" });
  fireEvent.click(await screen.findByRole("menuitem", { name: "Export Excel" }));
  await waitFor(() => expect(mocks.spreadsheet).toHaveBeenCalledTimes(2));
  expect(mocks.spreadsheet).toHaveBeenLastCalledWith(
    "customers-report",
    ["Status", "Records"],
    [["Active", 1]],
  );
});
