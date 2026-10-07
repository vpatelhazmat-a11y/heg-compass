// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const mocks = vi.hoisted(() => ({
  list: vi.fn(async () => [] as Record<string, unknown>[]),
  insert: vi.fn(),
  update: vi.fn(),
  protect: vi.fn(),
  clear: vi.fn(),
  canEdit: vi.fn(() => true),
  access: vi.fn(async () => ({ data: null, error: { message: "Migration not installed" } })),
}));
vi.mock("../src/integrations/supabase/client", () => ({ supabase: { rpc: mocks.access } }));
vi.mock("../src/lib/data", () => ({
  listRows: mocks.list,
  insertRow: mocks.insert,
  updateRow: mocks.update,
}));
vi.mock("../src/hooks/use-session", () => ({
  useSession: () => ({ session: { userId: "test" }, canEdit: mocks.canEdit }),
}));
vi.mock("../src/hooks/use-draft-protection", () => ({
  useDraftProtection: (dirty: boolean, label: string) => {
    mocks.protect(dirty, label);
    return mocks.clear;
  },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
import { RecordChatter } from "../src/components/app/RecordChatter";
function mount(table = "customers") {
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        })
      }
    >
      <RecordChatter table={table} id="record" />
    </QueryClientProvider>,
  );
}
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.canEdit.mockImplementation(() => true);
  mocks.list.mockImplementation(async () => []);
  mocks.access.mockImplementation(async () => ({
    data: null,
    error: { message: "Migration not installed" },
  }));
});
test("new record threads stay hidden until the database confirms access", async () => {
  mount("contacts");
  await waitFor(() => expect(mocks.access).toHaveBeenCalled());
  expect(screen.queryByRole("region", { name: "Chatter" })).toBeNull();
  expect(mocks.list).not.toHaveBeenCalled();
});
test("contacts support messages without advertising unsupported linked activities", async () => {
  mocks.access.mockResolvedValue({
    data: { readable: true, writable: true },
    error: null,
  } as never);
  mocks.insert.mockResolvedValue({ id: "message" });
  mount("contacts");
  await screen.findByRole("button", { name: "Log note" });
  expect(screen.queryByRole("button", { name: "Activity" })).toBeNull();
  expect(mocks.list.mock.calls.map((call) => call[0])).not.toContain("tasks");
  fireEvent.click(screen.getByRole("button", { name: "Log note" }));
  fireEvent.change(screen.getByLabelText("Internal note"), {
    target: { value: "Contact discussion" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(mocks.insert).toHaveBeenCalledWith(
      "mail_messages",
      expect.objectContaining({ linked_entity_type: "contact", body: "Contact discussion" }),
    ),
  );
});
test("record-specific write restrictions keep a visible thread read only", async () => {
  mocks.access.mockResolvedValue({
    data: { readable: true, writable: false },
    error: null,
  } as never);
  mount("documents");
  await screen.findByRole("region", { name: "Chatter" });
  expect(screen.queryByRole("button", { name: "Log note" })).toBeNull();
});
test("failed chatter saves preserve and protect the draft with inline feedback", async () => {
  mocks.insert.mockRejectedValue(new Error("Connection failed"));
  mount();
  fireEvent.click(screen.getByRole("button", { name: "Log note" }));
  fireEvent.change(screen.getByLabelText("Internal note"), { target: { value: "Unsaved note" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Connection failed");
  expect(screen.getByLabelText("Internal note")).toHaveProperty("value", "Unsaved note");
  expect(mocks.protect).toHaveBeenLastCalledWith(true, "Chatter draft");
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  fireEvent.click(screen.getByRole("button", { name: "Log note" }));
  expect(screen.getByLabelText("Internal note")).toHaveProperty("value", "");
});
test("record write permission alone does not allow creating an activity", async () => {
  mocks.canEdit.mockImplementation((table?: string) => table !== "tasks");
  mount();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Activity" })).toHaveProperty("disabled", true),
  );
  expect(screen.getByRole("button", { name: "Log note" })).toHaveProperty("disabled", false);
  expect(mocks.insert).not.toHaveBeenCalled();
});

test("activities can be assigned to another active colleague", async () => {
  mocks.list.mockImplementation(async (table?: string) =>
    table === "profiles"
      ? [
          { id: "colleague", full_name: "Active colleague", active: true },
          { id: "inactive", full_name: "Inactive colleague", active: false },
        ]
      : [],
  );
  mocks.insert.mockResolvedValue({ id: "activity" });
  mount();
  fireEvent.click(screen.getByRole("button", { name: "Activity" }));
  await screen.findByRole("option", { name: "Active colleague" });
  expect(screen.queryByRole("option", { name: "Inactive colleague" })).toBeNull();
  fireEvent.change(screen.getByLabelText("Activity title"), { target: { value: "Call customer" } });
  fireEvent.change(screen.getByLabelText("Due date"), { target: { value: "2026-10-07" } });
  fireEvent.change(screen.getByLabelText("Assigned to"), { target: { value: "colleague" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(mocks.insert).toHaveBeenCalledWith("tasks", {
      title: "Call customer",
      linked_entity_type: "customer",
      linked_entity_id: "record",
      owner: "colleague",
      due_date: "2026-10-07",
    }),
  );
});
