import { expect, test } from "vitest";
import {
  recordCreationDefaults,
  requiredRecordRelation,
  supportsRecordCreation,
} from "../src/lib/record-creation";
const customer = "11111111-1111-4111-8111-111111111111";
const site = "22222222-2222-4222-8222-222222222222";
test("creation scopes use real foreign keys and preserve customer consistency", () => {
  expect(
    recordCreationDefaults("contacts", "sites", site, { id: site, customer_id: customer }),
  ).toEqual({ site_id: site, customer_id: customer });
  expect(
    recordCreationDefaults("site_assessments", "sites", site, { id: site, customer_id: customer }),
  ).toEqual({ site_id: site });
  expect(
    recordCreationDefaults("lanes", "sites", site, { id: site, customer_id: customer }),
  ).toEqual({ customer_id: customer });
  expect(recordCreationDefaults("equipment_compliance", "equipment", site, { id: site })).toEqual({
    equipment_id: site,
  });
  expect(recordCreationDefaults("tasks", "contracts", site, { id: site })).toEqual({
    linked_entity_type: "contract",
    linked_entity_id: site,
  });
});
test("unavailable scopes never silently attach a new record", () => {
  expect(
    recordCreationDefaults("contacts", "sites", site, { id: site, archived_at: "2026-01-01" }),
  ).toEqual({});
  expect(recordCreationDefaults("contacts", "sites", "invalid", { customer_id: customer })).toEqual(
    {},
  );
  expect(recordCreationDefaults("contacts", "sites", site, null)).toEqual({});
  expect(supportsRecordCreation("rate_history")).toBe(false);
  expect(supportsRecordCreation("refused_loads")).toBe(false);
  expect(requiredRecordRelation("rates", "customer_id")).toBe(true);
  expect(requiredRecordRelation("equipment_leases", "equipment_id")).toBe(true);
});
