// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ updateUser: vi.fn(), protect: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));
vi.mock("../src/hooks/use-session", () => ({
  useSession: () => ({
    session: {
      userId: "test",
      email: "person@example.test",
      fullName: "Test user",
      roles: ["admin"],
    },
  }),
}));
vi.mock("../src/integrations/supabase/client", () => ({
  supabase: { auth: { updateUser: mocks.updateUser } },
}));
vi.mock("../src/hooks/use-draft-protection", () => ({ useDraftProtection: mocks.protect }));
import { Route } from "../src/routes/_authenticated/settings";
const Settings = (Route.options as { component: React.ComponentType }).component;
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
test("email updates show feedback beside the account action and prevent duplicate requests", async () => {
  let finish!: (value: { error: null }) => void;
  mocks.updateUser.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(<Settings />);
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "updated@example.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Update email" }));
  expect(screen.getByRole("button", { name: "Updating…" })).toHaveProperty("disabled", true);
  expect(mocks.updateUser).toHaveBeenCalledTimes(1);
  finish({ error: null });
  expect(await screen.findByRole("status")).toHaveProperty(
    "textContent",
    "Check your email to confirm the address change.",
  );
  expect(screen.getByRole("button", { name: "Update email" })).toHaveProperty("disabled", true);
});
test("failed account requests retain the draft and show a recoverable result", async () => {
  mocks.updateUser.mockRejectedValue(new Error("Connection failed"));
  render(<Settings />);
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "draft@example.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Update email" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Connection failed"));
  expect(screen.getByLabelText("Email address")).toHaveProperty("value", "draft@example.test");
  expect(screen.getByRole("button", { name: "Update email" })).toHaveProperty("disabled", false);
  expect(mocks.protect).toHaveBeenLastCalledWith(true, "Account settings");
});
