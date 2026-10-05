// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Link,
  Outlet,
  RouterProvider,
  useNavigate,
} from "@tanstack/react-router";
import { DraftProtection } from "../src/components/app/DraftProtection";
import { useDraftProtection } from "../src/hooks/use-draft-protection";

function Editor() {
  const [dirty, setDirty] = useState(false);
  const clearDraft = useDraftProtection(dirty, "Customer details");
  const navigate = useNavigate();
  return (
    <>
      <h1>Customer editor</h1>
      <button onClick={() => setDirty(true)}>Change field</button>
      <button onClick={() => setDirty(false)}>Discard field changes</button>
      <button
        onClick={() => {
          clearDraft();
          setDirty(false);
          void navigate({ to: "/settings" });
        }}
      >
        Save and navigate
      </button>
      <Link to="/settings">Open settings</Link>
    </>
  );
}
function mount() {
  const root = createRootRoute({
    component: () => (
      <DraftProtection>
        <Outlet />
      </DraftProtection>
    ),
  });
  const editor = createRoute({ getParentRoute: () => root, path: "/customers", component: Editor });
  const settings = createRoute({
    getParentRoute: () => root,
    path: "/settings",
    component: () => <h1>Settings page</h1>,
  });
  const router = createRouter({
    routeTree: root.addChildren([editor, settings]),
    history: createMemoryHistory({ initialEntries: ["/customers"] }),
  });
  render(<RouterProvider router={router} />);
  return router;
}
afterEach(cleanup);

test("dirty navigation retains the editor until the user chooses to leave", async () => {
  const router = mount();
  await screen.findByRole("heading", { name: "Customer editor" });
  fireEvent.click(screen.getByRole("button", { name: "Change field" }));
  fireEvent.click(screen.getByRole("link", { name: "Open settings" }));
  await screen.findByRole("alertdialog");
  expect(router.state.location.pathname).toBe("/customers");
  fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  expect(router.state.location.pathname).toBe("/customers");
  fireEvent.click(screen.getByRole("link", { name: "Open settings" }));
  await screen.findByRole("alertdialog");
  fireEvent.click(screen.getByRole("button", { name: "Discard and leave" }));
  await screen.findByRole("heading", { name: "Settings page" });
  expect(router.state.location.pathname).toBe("/settings");
});

test("cleaned drafts allow ordinary navigation without a dialog", async () => {
  mount();
  await screen.findByRole("heading", { name: "Customer editor" });
  fireEvent.click(screen.getByRole("button", { name: "Change field" }));
  fireEvent.click(screen.getByRole("button", { name: "Discard field changes" }));
  fireEvent.click(screen.getByRole("link", { name: "Open settings" }));
  await screen.findByRole("heading", { name: "Settings page" });
  expect(screen.queryByRole("alertdialog")).toBeNull();
});

test("successful save clears the blocker before immediate navigation", async () => {
  mount();
  await screen.findByRole("heading", { name: "Customer editor" });
  fireEvent.click(screen.getByRole("button", { name: "Change field" }));
  fireEvent.click(screen.getByRole("button", { name: "Save and navigate" }));
  await screen.findByRole("heading", { name: "Settings page" });
  expect(screen.queryByRole("alertdialog")).toBeNull();
});
