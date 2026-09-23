// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RecordDetailPage } from "../src/components/app/RecordWorkspace";
import { DataTable } from "../src/components/app/DataTable";
import { SmartButtons } from "../src/components/app/SmartButtons";
import { AppLauncher } from "../src/components/app/AppLauncher";

const mocks = vi.hoisted(() => ({
  getRow: vi.fn(),
  listRows: vi.fn(),
  countRows: vi.fn(),
  update: vi.fn(),
  rpc: vi.fn(),
  canEdit: vi.fn(),
  toastError: vi.fn(),
}));
vi.mock("../src/lib/data", () => ({
  getRow: mocks.getRow,
  listRows: mocks.listRows,
  countRows: mocks.countRows,
  updateRow: mocks.update,
  insertRow: vi.fn(),
}));
vi.mock("../src/hooks/use-session", () => ({ useSession: () => ({ canEdit: mocks.canEdit }) }));
vi.mock("../src/integrations/supabase/client", () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: mocks.toastError } }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
    ...props
  }: {
    to: string;
    params?: Record<string, string>;
    children: React.ReactNode;
  }) => (
    <a
      href={Object.entries(params ?? {}).reduce(
        (path, [key, value]) => path.replace(`$${key}`, value),
        to,
      )}
      {...props}
    >
      {children}
    </a>
  ),
}));
const id = "11111111-1111-4111-8111-111111111111";
const customer = "22222222-2222-4222-8222-222222222222";
const clients: QueryClient[] = [];
function mount(children: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return render(<QueryClientProvider client={client}>{children}</QueryClientProvider>);
}
beforeEach(() => {
  mocks.canEdit.mockReturnValue(true);
  mocks.listRows.mockResolvedValue([]);
  mocks.countRows.mockResolvedValue(3);
  mocks.getRow.mockImplementation(async (table) =>
    table === "customers"
      ? { id: customer, legal_name: "Example customer" }
      : {
          id,
          customer_id: customer,
          amount: 100,
          effective_date: "2026-09-18",
          updated_at: "2026-09-18T12:00:00Z",
          quote_reference: "Rate A",
        },
  );
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.resetAllMocks();
});

test("launcher exposes all twelve workspaces with usable destinations", () => {
  mount(<AppLauncher />);
  const links = screen.getAllByRole("link");
  expect(links).toHaveLength(12);
  expect(screen.getByRole("link", { name: /Site Assessments/ }).getAttribute("href")).toBe(
    "/records/site_assessments",
  );
  expect(screen.getByRole("link", { name: /Refused Loads/ }).getAttribute("href")).toBe(
    "/lost-loads",
  );
});

test("supporting records open from lists and relationship links do not activate the row", async () => {
  const rowClick = vi.fn();
  const { unmount } = mount(
    <DataTable
      recordTable="bids"
      rows={[{ id, bid_name: "Bid A" }]}
      columns={[{ key: "bid_name", header: "Bid" }]}
    />,
  );
  expect(screen.getByRole("link", { name: /Open record/ }).getAttribute("href")).toBe(
    `/records/bids/${id}`,
  );
  unmount();
  mount(
    <DataTable
      onRowClick={rowClick}
      rows={[{ id, customer_id: customer }]}
      columns={[{ key: "customer_id", header: "Customer" }]}
    />,
  );
  fireEvent.click(await screen.findByRole("link", { name: "Example customer" }));
  expect(rowClick).not.toHaveBeenCalled();
});

test("read-only rate detail offers navigation and history without edit controls", async () => {
  mocks.canEdit.mockReturnValue(false);
  mount(<RecordDetailPage table="rates" id={id} />);
  expect(await screen.findByRole("heading", { name: "Rate A" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  expect(await screen.findByRole("link", { name: "Example customer" })).toBeTruthy();
  expect(screen.getByRole("region", { name: "Rate history" })).toBeTruthy();
});

test("rate editor requires a fresh reason and uses the versioned RPC without identity fields", async () => {
  mocks.rpc.mockResolvedValue({ data: { id }, error: null });
  mount(<RecordDetailPage table="rates" id={id} />);
  fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
  fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: "125" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByText("Reason for change is required")).toBeTruthy();
  expect(mocks.rpc).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText(/Reason for change/), {
    target: { value: "Annual review" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(mocks.rpc).toHaveBeenCalledOnce());
  expect(mocks.rpc).toHaveBeenCalledWith("revise_rate", {
    _id: id,
    _expected_updated_at: "2026-09-18T12:00:00Z",
    _values: {
      amount: 125,
      effective_date: "2026-09-18",
      quote_reference: "Rate A",
      change_reason: "Annual review",
    },
  });
  expect(mocks.update).not.toHaveBeenCalled();
});

test("stale rate save keeps the editor open and displays the refresh error", async () => {
  mocks.rpc.mockResolvedValue({
    data: null,
    error: { message: "This rate changed. Refresh before saving." },
  });
  mount(<RecordDetailPage table="rates" id={id} />);
  fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
  fireEvent.change(screen.getByLabelText(/Reason for change/), { target: { value: "Review" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(mocks.toastError).toHaveBeenCalledWith("This rate changed. Refresh before saving."),
  );
  expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
});

test("smart buttons count and link to the same scoped records", async () => {
  mount(<SmartButtons table="customers" id={customer} />);
  await waitFor(() => expect(screen.getByRole("link", { name: /3 Sites/ })).toBeTruthy());
  expect(screen.getByRole("link", { name: /3 Sites/ }).getAttribute("href")).toBe(
    `/records/sites?parent=customers&parentId=${customer}`,
  );
  expect(mocks.countRows).toHaveBeenCalledWith("sites", {
    customer_id: customer,
    archived_at: null,
  });
  expect(mocks.countRows).toHaveBeenCalledWith("documents", {
    linked_entity_type: "customer",
    linked_entity_id: customer,
  });
});

test("unknown record routes cannot read arbitrary database tables", () => {
  mount(<RecordDetailPage table="user_roles" id={id} />);
  expect(screen.getByText("Record not found")).toBeTruthy();
  expect(mocks.getRow).not.toHaveBeenCalled();
});

test("inline record editing cancels without changing the stored rate", async () => {
  mount(<RecordDetailPage table="rates" id={id} />);
  fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
  expect(screen.getByRole("region", { name: "Edit rate" })).toBeTruthy();
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: "999" } });
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("region", { name: "Edit rate" })).toBeNull();
  expect(screen.getByRole("article", { name: "Record details" })).toBeTruthy();
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
});

test("toolbar pagination resets to the first matching record after a search", () => {
  mount(
    <DataTable
      rows={[
        { id: 1, name: "Alpha" },
        { id: 2, name: "Beta" },
        { id: 3, name: "Gamma" },
      ]}
      columns={[{ key: "name", header: "Name" }]}
      pageSize={1}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(screen.getByRole("cell", { name: "Beta" })).toBeTruthy();
  fireEvent.change(screen.getByRole("textbox", { name: "Search" }), { target: { value: "Gamma" } });
  expect(screen.getByRole("cell", { name: "Gamma" })).toBeTruthy();
  expect((screen.getByRole("button", { name: "Next page" }) as HTMLButtonElement).disabled).toBe(
    true,
  );
  expect(
    (screen.getByRole("button", { name: "Previous page" }) as HTMLButtonElement).disabled,
  ).toBe(true);
});

test("column picker hides a column while keeping at least one visible", async () => {
  mount(
    <DataTable
      rows={[{ id: 1, name: "Alpha", status: "Active" }]}
      columns={[
        { key: "name", header: "Name" },
        { key: "status", header: "Status" },
      ]}
    />,
  );
  fireEvent.keyDown(screen.getByRole("button", { name: "Choose columns" }), { key: "Enter" });
  const status = await screen.findByRole("menuitemcheckbox", { name: "Status" });
  fireEvent.click(status);
  expect(screen.getByRole("menuitemcheckbox", { name: "Name" }).getAttribute("aria-disabled")).toBe(
    "true",
  );
  fireEvent.keyDown(status, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  expect(screen.queryByRole("columnheader", { name: "Status" })).toBeNull();
  expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
});
