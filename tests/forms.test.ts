import { test, expect } from "vitest";
import { formPayload, validateFields, isValidDate } from "../src/lib/form-values";
import { hasApprovedAccess } from "../src/lib/auth-guard";
import { canEditTable } from "../src/lib/permissions";
import { scopeDefaults, scopeFilters } from "../src/lib/relations";
import { customerFields, siteFields, rateFields } from "../src/lib/entities";

test("authentication guard rejects missing, disabled and unapproved identities", () => {
  expect(hasApprovedAccess(null, true, ["admin"])).toBe(false);
  expect(hasApprovedAccess("user", false, ["admin"])).toBe(false);
  expect(hasApprovedAccess("user", true, [])).toBe(false);
  expect(hasApprovedAccess("user", true, ["read_only"])).toBe(true);
});
test("blank optional fields use database defaults during customer creation", () => {
  const payload = formPayload(customerFields, { legal_name: " Test Customer ", status: "" }, false);
  expect(payload).toEqual({ legal_name: "Test Customer" });
  expect(validateFields(customerFields, { legal_name: "  " })).toHaveProperty("legal_name");
});
test("invalid dates and non-finite or negative money cannot be submitted", () => {
  expect(isValidDate("2026-02-30")).toBe(false);
  expect(isValidDate("2024-02-29")).toBe(true);
  for (const amount of ["NaN", "Infinity", "-1"])
    expect(validateFields(rateFields, { amount, effective_date: "2026-09-14" })).toHaveProperty(
      "amount",
    );
});
test("site/customer and shared-record defaults use actual relationship columns", () => {
  expect(scopeDefaults("sites", "customer", "customer")).toEqual({ customer_id: "customer" });
  expect(scopeDefaults("site_assessments", "site", "site", { customer_id: "customer" })).toEqual({
    site_id: "site",
  });
  expect(scopeFilters("refused_loads", "customer", "customer")).toEqual({
    customer_id: "customer",
  });
  expect(scopeFilters("requirements", "site", "site")).toEqual({
    entity_type: "site",
    entity_id: "site",
  });
});
test("ordinary forms omit coordinates and manual import metadata", () => {
  expect(siteFields.map((f) => f.name)).not.toContain("latitude");
  expect(customerFields.map((f) => f.name)).not.toContain("strategic_priority");
});
test("management is read-only and edit controls follow record domain", () => {
  expect(canEditTable(["management"], "customers")).toBe(false);
  expect(canEditTable(["operations"], "equipment")).toBe(true);
  expect(canEditTable(["sales"], "equipment")).toBe(false);
  expect(canEditTable(["operations"], "refused_loads")).toBe(true);
  expect(canEditTable(["read_only"], "refused_loads")).toBe(false);
});
