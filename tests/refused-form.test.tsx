// @vitest-environment jsdom
import { afterEach, test, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RefusedLoadForm, toFormState } from "../src/components/app/RefusedLoadForm";
import { DataTable } from "../src/components/app/DataTable";
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);
const mocks = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn(), canEdit: vi.fn(() => true) }));
vi.mock("../src/lib/data", () => ({
  listRows: vi.fn(async (table: string) =>
    table === "customers" ? [{ id: "customer", legal_name: "Test Customer" }] : [],
  ),
  insertRow: mocks.insert,
  updateRow: mocks.update,
  recordAudit: vi.fn(),
}));
vi.mock("../src/hooks/use-session", () => ({ useSession: () => ({ canEdit: mocks.canEdit }) }));
vi.mock("../src/lib/lookups", () => ({
  useLookup: () => ({ options: [] }),
  usePeople: () => ({ options: [{ value: "Test Rep", label: "Test Rep" }] }),
}));
const initial = () =>
  toFormState({
    call_in_date: "2026-09-14",
    customer_id: "customer",
    equipment_type: "Product Tanker",
    load_count: 2,
    pickup_city: "Buffalo",
    pickup_state: "NY",
    delivery_city: "Albany",
    delivery_state: "NY",
    loss_reason: "Capacity",
    cs_rep: "Test Rep",
    estimated_lost_revenue: 500,
  });
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <RefusedLoadForm initial={initial()} />
    </QueryClientProvider>,
  );
}
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.canEdit.mockReturnValue(true);
});
test("Refused Load form submits schema-compatible fields without client audit attribution", async () => {
  mocks.insert.mockResolvedValue({ id: "created" });
  mount();
  fireEvent.click(screen.getByRole("button", { name: "Save & view record" }));
  await waitFor(() => expect(mocks.insert).toHaveBeenCalledOnce());
  const [table, payload] = mocks.insert.mock.calls[0];
  expect(table).toBe("refused_loads");
  expect(payload).toMatchObject({
    customer_id: "customer",
    load_count: 2,
    estimated_lost_revenue: 500,
  });
  expect(payload).not.toHaveProperty("created_by");
  expect(payload).not.toHaveProperty("updated_by");
});
test("fractional load counts are rejected before saving", async () => {
  const { container } = mount();
  fireEvent.change(screen.getByLabelText(/Number of loads/), { target: { value: "1.5" } });
  fireEvent.submit(container.querySelector("form")!);
  expect(await screen.findByText("Enter at least one load.")).toBeTruthy();
  expect(mocks.insert).not.toHaveBeenCalled();
});
test("read-only users cannot submit and specific equipment is collapsed", () => {
  mocks.canEdit.mockReturnValue(false);
  const { container } = mount();
  expect(
    (screen.getByRole("button", { name: "Save & view record" }) as HTMLButtonElement).disabled,
  ).toBe(true);
  expect(container.querySelector("details")?.open).toBe(false);
});
test("empty tables show a clear empty state without crashing", () => {
  render(
    <DataTable rows={[]} columns={[{ key: "id", header: "Record" }]} emptyTitle="No records" />,
  );
  expect(screen.getByText("No records")).toBeTruthy();
});
