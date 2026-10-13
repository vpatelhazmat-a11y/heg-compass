// @vitest-environment jsdom
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: ReactNode;
    "aria-current"?: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
import { ModuleNavigation } from "../src/components/app/ModuleNavigation";
import { visibleModuleLinks } from "../src/lib/module-navigation";
import { HUB_MODULES, visibleModules } from "../src/lib/modules";
afterEach(cleanup);
test("launcher and command apps follow existing role access", () => {
  const readOnly = visibleModules(["read_only"]).map((module) => module.id);
  expect(readOnly).toContain("customers");
  expect(readOnly).toContain("settings");
  expect(readOnly).not.toContain("bids");
  expect(readOnly).not.toContain("safety");
  expect(readOnly).not.toContain("site-assessments");
  expect(visibleModules(["operations"])).toEqual(HUB_MODULES);
  expect(visibleModules(["admin"])).toEqual(HUB_MODULES);
  expect(visibleModules([])).toEqual([]);
});
test("read-only customer menus exclude restricted commercial pages", () => {
  const hrefs = visibleModuleLinks("/customers", ["read_only"]).map(([, href]) => href);
  expect(hrefs).not.toContain("/records/rates");
  expect(hrefs).not.toContain("/records/contracts");
  expect(hrefs).toContain("/records/contacts");
  expect(visibleModuleLinks("/sites", ["sales"])).toEqual([]);
});
test("users and access is offered only to administrators", () => {
  render(<ModuleNavigation pathname="/admin" roles={["admin"]} />);
  expect(screen.getByRole("link", { name: "Users and access" }).getAttribute("aria-current")).toBe(
    "page",
  );
  cleanup();
  render(<ModuleNavigation pathname="/settings" roles={["read_only"]} />);
  expect(screen.queryByRole("link", { name: "Users and access" })).toBeNull();
  expect(screen.getByRole("link", { name: "Profile" })).toBeTruthy();
});
test("equipment menus include agreements and mark the active nested page", () => {
  render(<ModuleNavigation pathname="/records/equipment_leases/fixture" roles={["operations"]} />);
  expect(screen.getByRole("link", { name: "Agreements" }).getAttribute("href")).toBe(
    "/records/equipment_leases",
  );
  expect(screen.getByRole("link", { name: "Agreements" }).getAttribute("aria-current")).toBe(
    "page",
  );
});
