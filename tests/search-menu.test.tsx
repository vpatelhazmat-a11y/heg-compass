// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DataTable } from "../src/components/app/DataTable";
import { saveView } from "../src/lib/saved-views";
vi.mock("../src/hooks/use-session", () => ({
  useSession: () => ({ session: { userId: "fixture" } }),
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
const value = {
  search: "Cascade",
  searchField: "name",
  filterField: "",
  filterValue: "",
  groupBy: "",
  view: "list" as const,
};
const mount = () =>
  render(
    <DataTable
      exportName="fixture-search"
      columns={[
        { key: "name", header: "Name" },
        { key: "status", header: "Status" },
      ]}
      rows={[
        { id: "1", name: "Cascade", status: "Active" },
        { id: "2", name: "Ridgeline", status: "Inactive" },
      ]}
    />,
  );
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
test("one search dropdown applies favorites and returns focus without a separate favorites control", async () => {
  saveView("fixture", "fixture-search", "My accounts", value);
  mount();
  const trigger = screen.getByRole("button", { name: "Search options" });
  expect(screen.queryByRole("button", { name: "Saved views" })).toBeNull();
  fireEvent.click(trigger);
  expect(screen.getByRole("region", { name: "Filters" })).toBeTruthy();
  expect(screen.getByRole("region", { name: "Group By" })).toBeTruthy();
  expect(screen.getByRole("region", { name: "Favorites" })).toBeTruthy();
  fireEvent.click(await screen.findByRole("button", { name: "My accounts" }));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Search options" })).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  expect(screen.getByRole("textbox", { name: "Search" })).toHaveProperty("value", "Cascade");
  expect(screen.queryByText("Ridgeline")).toBeNull();
});
test("favorite save failure keeps its name and Escape closes the shared menu", async () => {
  mount();
  const trigger = screen.getByRole("button", { name: "Search options" });
  fireEvent.click(trigger);
  fireEvent.change(await screen.findByLabelText("View name"), { target: { value: "My draft" } });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Full");
  });
  fireEvent.click(screen.getByRole("button", { name: "Save", exact: true }));
  expect(screen.getByRole("alert").textContent).toContain("could not be saved");
  expect(screen.getByLabelText("View name")).toHaveProperty("value", "My draft");
  fireEvent.keyDown(screen.getByLabelText("View name"), { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Search options" })).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});
