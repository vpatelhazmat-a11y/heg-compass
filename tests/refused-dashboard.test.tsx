// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route as Dashboard } from "../src/routes/_authenticated/lost-loads.index";
import { LostRevenueAnalysis } from "../src/components/app/LostRevenueAnalysis";
const Analysis = { options: { component: LostRevenueAnalysis } };

const mocks = vi.hoisted(() => ({ listRows: vi.fn() }));
vi.mock("../src/lib/data", () => ({ listRows: mocks.listRows }));
vi.mock("../src/hooks/use-session", () => ({
  useSession: () => ({ canWrite: false, canEdit: () => false }),
}));
vi.mock("../src/components/app/LostLoadTabs", () => ({ LostLoadTabs: () => null }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

for (const [name, route] of [
  ["dashboard", Dashboard],
  ["analysis", Analysis],
] as const) {
  function mount() {
    const Component = route.options.component!;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Component />
      </QueryClientProvider>,
    );
    return client;
  }
  test(`${name} shows loading instead of zero totals while data is pending`, () => {
    mocks.listRows.mockImplementation(() => new Promise(() => {}));
    const client = mount();
    expect(screen.getByRole("status").textContent).toBe("Loading");
    expect(screen.queryByText(/\$0/)).toBeNull();
    client.clear();
  });
  for (const failedTable of ["refused_loads", "customers"]) {
    test(`${name} reports ${failedTable} failures and retries instead of showing zero totals`, async () => {
      mocks.listRows.mockImplementation(async (table) => {
        if (table === failedTable) throw new Error("Connection failed");
        return [];
      });
      const client = mount();
      expect(await screen.findByText("Connection failed")).toBeTruthy();
      expect(screen.queryByText(/\$0/)).toBeNull();
      mocks.listRows.mockResolvedValue([]);
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      await vi.waitFor(() => expect(screen.queryByText("Connection failed")).toBeNull());
      client.clear();
    });
  }
}
