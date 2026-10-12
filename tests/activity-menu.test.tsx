// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const mocks = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("../src/hooks/use-session", () => ({
  useSession: () => ({ session: { userId: "fixture" } }),
}));
vi.mock("../src/lib/data", () => ({ listRows: mocks.list }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
import { ActivityMenu } from "../src/components/app/ActivityMenu";
let client: QueryClient;
afterEach(() => {
  cleanup();
  client?.clear();
  vi.resetAllMocks();
  localStorage.clear();
});

test("activity loading can retry and uses record navigation with a return path", async () => {
  const today = new Date();
  const due = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  let attempts = 0;
  mocks.list.mockImplementation(async (table) => {
    if (table !== "tasks") return [];
    if (attempts++ === 0) throw new Error("Unavailable");
    return [
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Review equipment",
        due_date: due,
        status: "Open",
      },
    ];
  });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ActivityMenu />
    </QueryClientProvider>,
  );
  fireEvent.keyDown(screen.getByRole("button", { name: "Activity" }), { key: "Enter" });
  fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
  const link = await screen.findByRole("link", { name: /Review equipment/ });
  const target = new URL(link.getAttribute("href")!, window.location.origin);
  expect(target.pathname).toBe("/records/tasks/11111111-1111-4111-8111-111111111111");
  expect(target.searchParams.get("returnTo")).toBe(
    window.location.pathname + window.location.search,
  );
  expect(screen.getByText("Today")).toBeTruthy();
});
