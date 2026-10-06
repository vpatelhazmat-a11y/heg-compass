// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const mocks = vi.hoisted(() => ({ list: vi.fn(), roles: ["admin"] as string[] }));
vi.mock("../src/lib/data", () => ({ listRowsPage: mocks.list }));
vi.mock("../src/hooks/use-session", () => ({ useSession: () => ({ roles: mocks.roles }) }));
import { DocumentFolderTree } from "../src/components/app/DocumentFolderTree";
const clients: QueryClient[] = [];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  const select = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <DocumentFolderTree onSelect={select} />
    </QueryClientProvider>,
  );
  return select;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.roles = ["admin"];
  mocks.list.mockResolvedValue({ rows: [], count: 0 });
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
});
test("supported commercial and incident folders obey the user's read permissions", () => {
  mocks.roles = ["read_only"];
  mount();
  expect(screen.getByRole("button", { name: "Customers" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Rates" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Incidents" })).toBeNull();
});
test("folders page through all records instead of stopping at thirty", async () => {
  mocks.list.mockResolvedValue({
    rows: [{ id: "record", legal_name: "Last customer" }],
    count: 31,
  });
  mount();
  fireEvent.click(screen.getByRole("button", { name: "Customers" }));
  await screen.findByRole("button", { name: "Last customer" });
  fireEvent.click(screen.getByRole("button", { name: "Next folder page" }));
  await waitFor(() =>
    expect(mocks.list).toHaveBeenLastCalledWith(
      "customers",
      expect.objectContaining({ offset: 30, limit: 30 }),
    ),
  );
  fireEvent.change(screen.getByLabelText("Find customers folder"), { target: { value: "Other" } });
  await waitFor(() =>
    expect(mocks.list).toHaveBeenLastCalledWith(
      "customers",
      expect.objectContaining({ offset: 0, search: "Other" }),
    ),
  );
});
test("failed folder loads can be retried without leaving the current folder", async () => {
  mocks.list.mockRejectedValueOnce(new Error("Connection failed"));
  const select = mount();
  fireEvent.click(screen.getByRole("button", { name: "Contracts" }));
  await screen.findByRole("alert");
  mocks.list.mockResolvedValue({
    rows: [{ id: "contract", contract_name: "Recovered contract" }],
    count: 1,
  });
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  fireEvent.click(await screen.findByRole("button", { name: "Recovered contract" }));
  expect(select).toHaveBeenLastCalledWith({
    folder: "contract",
    parent: "contracts",
    parentId: "contract",
    page: 0,
  });
});
