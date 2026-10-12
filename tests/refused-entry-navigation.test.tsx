// @vitest-environment jsdom
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  editable: true,
  returnTo: "/lost-loads/records?reason=Capacity&page=2",
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({
    options,
    useSearch: () => ({ returnTo: mocks.returnTo }),
  }),
  useNavigate: () => mocks.navigate,
}));
vi.mock("../src/hooks/use-session", () => ({
  useSession: () => ({ canEdit: () => mocks.editable }),
}));
vi.mock("../src/components/app/RecordWorkspace", () => ({
  RecordCreationLayout: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("../src/components/app/RefusedLoadForm", () => ({
  RefusedLoadForm: ({
    onCancel,
    onSaved,
  }: {
    onCancel: () => void;
    onSaved: (row: { id: string }, mode: "again" | "view") => void;
  }) => (
    <>
      <button onClick={onCancel}>Cancel</button>
      <button onClick={() => onSaved({ id: "fixture" }, "view")}>Save and view</button>
      <button onClick={() => onSaved({ id: "fixture" }, "again")}>Save another</button>
    </>
  ),
}));
import { RefusedLoadEntry } from "../src/routes/_authenticated/lost-loads.new";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.editable = true;
  mocks.returnTo = "/lost-loads/records?reason=Capacity&page=2";
});
test("cancel returns to the filtered refused-load list", () => {
  render(<RefusedLoadEntry />);
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(mocks.navigate).toHaveBeenCalledWith({ to: mocks.returnTo });
});
test("saved record retains the list return path and save-another stays in entry", () => {
  render(<RefusedLoadEntry />);
  fireEvent.click(screen.getByRole("button", { name: "Save another" }));
  expect(mocks.navigate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Save and view" }));
  const target = mocks.navigate.mock.calls[0]![0].to;
  const url = new URL(target, "https://heg.invalid");
  expect(url.pathname).toBe("/records/refused_loads/fixture");
  expect(url.searchParams.get("returnTo")).toBe(mocks.returnTo);
});
test("external return paths cannot redirect record entry away from the app", () => {
  mocks.returnTo = "https://example.test";
  render(<RefusedLoadEntry />);
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(mocks.navigate).toHaveBeenCalledWith({ to: "/lost-loads/records" });
});
test("view-only accounts cannot open the entry form", () => {
  mocks.editable = false;
  render(<RefusedLoadEntry />);
  expect(screen.getByText("You have view-only access")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Save and view" })).toBeNull();
});
