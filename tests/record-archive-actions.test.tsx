// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RecordArchiveActions } from "../src/components/app/RecordArchiveActions";
import { DraftContext } from "../src/hooks/use-draft-protection";
const mocks = vi.hoisted(() => ({ archive: vi.fn(), restore: vi.fn(), canEdit: vi.fn() }));
vi.mock("../src/lib/data", () => ({ archiveRow: mocks.archive, restoreRow: mocks.restore }));
vi.mock("../src/hooks/use-session", () => ({ useSession: () => ({ canEdit: mocks.canEdit }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.canEdit.mockReturnValue(true);
  client = new QueryClient();
});
afterEach(() => {
  cleanup();
  client.clear();
});
function mount(archived = false, dirty = false) {
  render(
    <QueryClientProvider client={client}>
      <DraftContext.Provider value={{ dirty, register: vi.fn() }}>
        <RecordArchiveActions table="customers" id="sample" archived={archived} />
      </DraftContext.Provider>
    </QueryClientProvider>,
  );
}
async function choose(name: string) {
  fireEvent.pointerDown(screen.getByRole("button", { name: "Record actions" }), {
    button: 0,
    ctrlKey: false,
  });
  fireEvent.click(await screen.findByRole("menuitem", { name }));
}
test("archive requires in-app confirmation and cancel does not mutate", async () => {
  mount();
  await choose("Archive");
  const dialog = await screen.findByRole("alertdialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
  expect(mocks.archive).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
});
test("failed archive keeps confirmation open and can retry", async () => {
  mocks.archive.mockRejectedValueOnce(new Error("Request failed")).mockResolvedValue({});
  mount();
  await choose("Archive");
  const dialog = await screen.findByRole("alertdialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Archive" }));
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Request failed");
  fireEvent.click(within(dialog).getByRole("button", { name: "Archive" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  expect(mocks.archive).toHaveBeenCalledTimes(2);
});
test("restore uses the existing recovery action", async () => {
  mount(true);
  await choose("Restore");
  await waitFor(() => expect(mocks.restore).toHaveBeenCalledWith("customers", "sample"));
  expect(mocks.archive).not.toHaveBeenCalled();
});
test("read-only records have no actions menu", () => {
  mocks.canEdit.mockReturnValue(false);
  mount();
  expect(screen.queryByRole("button", { name: "Record actions" })).toBeNull();
});
test("unsaved drafts prevent archive and restore actions", async () => {
  mount(false, true);
  fireEvent.pointerDown(screen.getByRole("button", { name: "Record actions" }), {
    button: 0,
    ctrlKey: false,
  });
  const action = await screen.findByRole("menuitem", { name: "Save or discard edits first" });
  expect(action.getAttribute("aria-disabled")).toBe("true");
  fireEvent.click(action);
  expect(mocks.archive).not.toHaveBeenCalled();
  expect(mocks.restore).not.toHaveBeenCalled();
  expect(screen.queryByRole("alertdialog")).toBeNull();
});
