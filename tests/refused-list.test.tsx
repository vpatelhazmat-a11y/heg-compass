// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  search: {
    from: "",
    to: "",
    customer: "__all__",
    reason: "__all__",
    rep: "__all__",
    view: "list",
    page: 0,
  },
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({
    options,
    useSearch: () => mocks.search,
    useNavigate: () => mocks.navigate,
  }),
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock("../src/hooks/use-session", () => ({ useSession: () => ({ canEdit: () => true }) }));
vi.mock("../src/lib/data", () => ({ listRows: async () => [] }));
vi.mock("../src/lib/lookups", () => ({ useLookup: () => ({ options: [] }) }));
vi.mock("../src/components/app/RecordWorkspace", () => ({
  RecordListPage: ({ extraFilters }: { extraFilters: React.ReactNode }) => (
    <div>{extraFilters}</div>
  ),
}));
import { Route } from "../src/routes/_authenticated/lost-loads.records";
const RefusedList = (Route.options as { component: React.ComponentType }).component;
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
test.each(["From", "To"])("%s date survives the router's deferred search reducer", (label) => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RefusedList />
    </QueryClientProvider>,
  );
  fireEvent.input(screen.getByLabelText(label), { target: { value: "2026-09-01" } });
  const reducer = mocks.navigate.mock.calls[0]![0].search;
  // React restores a controlled input before a deferred router reducer runs.
  expect((screen.getByLabelText(label) as HTMLInputElement).value).toBe("");
  expect(reducer(mocks.search)[label.toLowerCase()]).toBe("2026-09-01");
});
