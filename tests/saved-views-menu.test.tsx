// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SavedViews } from "../src/components/app/SavedViews";
import { saveView } from "../src/lib/saved-views";
const value = {
  search: "Cascade",
  searchField: "legal_name",
  filterField: "",
  filterValue: "",
  groupBy: "",
  view: "list" as const,
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});
test("failed removal keeps the saved view available until storage recovers", async () => {
  saveView("user", "customers", "My customers", value);
  render(<SavedViews userId="user" scope="customers" value={value} onApply={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Saved views" }));
  const remove = await screen.findByRole("button", { name: "Remove saved view My customers" });
  const fail = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Storage unavailable");
  });
  fireEvent.click(remove);
  expect(screen.getByRole("alert").textContent).toContain("could not be removed");
  expect(screen.getByRole("button", { name: "My customers" })).toBeTruthy();
  fail.mockRestore();
  fireEvent.click(remove);
  await waitFor(() => expect(screen.queryByRole("button", { name: "My customers" })).toBeNull());
  expect(screen.queryByRole("alert")).toBeNull();
});
test("saved view menus close with Escape and return focus to their trigger", async () => {
  render(<SavedViews userId="user" scope="customers" value={value} onApply={() => {}} />);
  const trigger = screen.getByRole("button", { name: "Saved views" });
  fireEvent.click(trigger);
  await screen.findByRole("dialog", { name: "Saved views" });
  fireEvent.keyDown(screen.getByLabelText("View name"), { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Saved views" })).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});
test("storage failures retain the view name and explain that it was not saved", async () => {
  render(<SavedViews userId="user" scope="customers" value={value} onApply={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Saved views" }));
  fireEvent.change(await screen.findByLabelText("View name"), {
    target: { value: "My customers" },
  });
  const fail = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Storage full");
  });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.getByRole("alert").textContent).toContain("could not be saved");
  expect(screen.getByLabelText("View name")).toHaveProperty("value", "My customers");
  expect(screen.queryByRole("button", { name: "My customers" })).toBeNull();
  fail.mockRestore();
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByRole("button", { name: "My customers" });
  expect(screen.queryByRole("alert")).toBeNull();
});
