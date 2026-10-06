// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  update: vi.fn(),
  protect: vi.fn(),
  clear: vi.fn(),
  canEdit: vi.fn(() => true),
}));
vi.mock("../src/lib/data", () => ({
  listRows: async () => [],
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
function mount() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        })
      }
    >
      <RecordChatter table="customers" id="record" />
    </QueryClientProvider>,
  );
}
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.canEdit.mockImplementation(() => true);
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
