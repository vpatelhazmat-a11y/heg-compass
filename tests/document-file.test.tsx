// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const mocks = vi.hoisted(() => ({ exists: vi.fn(), signed: vi.fn(), canEdit: vi.fn(() => true) }));
vi.mock("../src/integrations/supabase/client", () => ({
  supabase: { storage: { from: () => ({ exists: mocks.exists, createSignedUrl: mocks.signed }) } },
}));
vi.mock("../src/hooks/use-session", () => ({ useSession: () => ({ canEdit: mocks.canEdit }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import { DocumentFile } from "../src/components/app/DocumentFile";
const clients: QueryClient[] = [];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <DocumentFile
        document={{ id: "doc", file_path: "doc/private.pdf", file_name: "private.pdf" }}
      />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.canEdit.mockReturnValue(true);
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
});
test("an unchecked or failed attachment does not offer a working download", async () => {
  let reject: (reason: Error) => void = () => {};
  mocks.exists.mockImplementationOnce(
    () =>
      new Promise((_resolve, fail) => {
        reject = fail;
      }),
  );
  mount();
  expect(screen.getByRole("status").textContent).toBe("Checking attachment…");
  expect(screen.queryByRole("button", { name: "Download file" })).toBeNull();
  reject(new Error("Network failed"));
  await screen.findByRole("alert");
  expect(screen.queryByRole("button", { name: "Download file" })).toBeNull();
  mocks.exists.mockResolvedValue({ data: true, error: null });
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByRole("button", { name: "Download file" });
});
test("read-only users receive a missing-file explanation rather than an upload control", async () => {
  mocks.canEdit.mockReturnValue(false);
  mocks.exists.mockResolvedValue({ data: false, error: { status: 404 } });
  mount();
  await screen.findByText(/The attached file is missing/);
  expect(screen.queryByRole("button", { name: "Download file" })).toBeNull();
  expect(screen.queryByText(/Retry upload/)).toBeNull();
});
test("failed signed downloads display an actionable inline error", async () => {
  mocks.exists.mockResolvedValue({ data: true, error: null });
  mocks.signed.mockResolvedValue({ data: null, error: new Error("Access expired. Try again.") });
  mount();
  fireEvent.click(await screen.findByRole("button", { name: "Download file" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Access expired. Try again.");
  expect(screen.getByRole("button", { name: "Download file" })).toHaveProperty("disabled", false);
});
