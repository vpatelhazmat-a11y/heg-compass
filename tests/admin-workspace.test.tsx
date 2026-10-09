// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const mocks = vi.hoisted(() => ({
  section: "people",
  admin: true,
  navigate: vi.fn(),
  list: vi.fn(async () => []),
  invite: vi.fn(),
  protect: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({
    options,
    useSearch: () => ({ section: mocks.section }),
    useNavigate: () => mocks.navigate,
  }),
  useNavigate: () => mocks.navigate,
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("../src/lib/data", () => ({ listRows: mocks.list }));
vi.mock("../src/hooks/use-session", () => ({
  ROLE_LABELS: { admin: "Administrator" },
  useSession: () => ({ isAdmin: mocks.admin, session: { userId: "fixture" } }),
}));
vi.mock("../src/hooks/use-draft-protection", () => ({ useDraftProtection: mocks.protect }));
vi.mock("../src/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: mocks.invite } },
}));
import { AdminPage } from "../src/routes/_authenticated/admin.index";
const clients: QueryClient[] = [];
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  const content = () => (
    <QueryClientProvider client={client}>
      <AdminPage />
    </QueryClientProvider>
  );
  const view = render(content());
  return () => view.rerender(content());
}
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((c) => c.clear());
  vi.clearAllMocks();
  mocks.section = "people";
  mocks.admin = true;
});
test("people landing hides invitation inputs and tab navigation preserves the invitation draft", async () => {
  const refresh = mount();
  expect(screen.queryByLabelText("Work email *")).toBeNull();
  fireEvent.mouseDown(screen.getByRole("tab", { name: "Invitations" }), {
    button: 0,
    ctrlKey: false,
  });
  expect(mocks.navigate).toHaveBeenCalledWith({ search: { section: "invitations" } });
  mocks.section = "invitations";
  refresh();
  fireEvent.change(screen.getByLabelText("Work email *"), {
    target: { value: "fixture@example.test" },
  });
  expect(mocks.protect).toHaveBeenLastCalledWith(true, "Invitation draft");
  mocks.section = "people";
  refresh();
  mocks.section = "invitations";
  refresh();
  expect(screen.getByLabelText("Work email *")).toHaveProperty("value", "fixture@example.test");
  expect(mocks.invite).not.toHaveBeenCalled();
});
test("a failed invitation preserves entered details and shows accessible feedback", async () => {
  mocks.section = "invitations";
  mocks.invite.mockResolvedValue({ data: null, error: new Error("Could not send invitation") });
  mount();
  fireEvent.change(screen.getByLabelText("Work email *"), {
    target: { value: "fixture@example.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send invitation" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Could not send invitation",
  );
  expect(screen.getByLabelText("Work email *")).toHaveProperty("value", "fixture@example.test");
});
test("non administrators do not load people, invitations, or audit data", async () => {
  mocks.admin = false;
  mount();
  await waitFor(() => expect(screen.queryByRole("tab", { name: "People" })).toBeNull());
  expect(mocks.list).not.toHaveBeenCalled();
  expect(mocks.invite).not.toHaveBeenCalled();
});

test("a failed people load retries without loading unrelated administration sections", async () => {
  mocks.list.mockRejectedValueOnce(new Error("People could not load"));
  mount();
  fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Try again" })).toBeNull());
  expect(
    mocks.list.mock.calls.every(([table]) => ["profiles", "user_roles"].includes(String(table))),
  ).toBe(true);
  expect(screen.getByRole("tab", { name: "People" }).getAttribute("data-state")).toBe("active");
});
