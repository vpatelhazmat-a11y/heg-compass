import { expect, test } from "vitest";
import {
  validReport,
  reportColumns,
  summarizeReport,
  validReportDate,
  reportDateError,
} from "../src/lib/reporting";

test("date ranges use real calendar dates and include both bounds", () => {
  expect(validReportDate("2026-02-30")).toBe("");
  expect(validReportDate("2024-02-29")).toBe("2024-02-29");
  const config = validReport(
    { source: "bids", dateField: "due_date", from: "2026-10-01", to: "2026-10-31" },
    ["admin"],
  )!;
  expect(reportColumns(config)).toContain("due_date");
  const report = summarizeReport(
    [
      { due_date: "2026-10-01" },
      { due_date: "2026-10-31" },
      { due_date: "2026-11-01" },
      { due_date: null },
      { due_date: "invalid" },
    ],
    config,
  );
  expect(report.records).toBe(2);
  expect(summarizeReport([{ due_date: null }], { ...config, from: "", to: "" }).records).toBe(1);
  const reversed = { ...config, from: "2026-11-01" };
  expect(reportDateError(reversed)).toContain("end date");
  expect(summarizeReport([{ due_date: "2026-10-31" }], reversed).records).toBe(0);
  expect(
    validReport({ source: "bids", dateField: "private_field", from: "2026-10-01" }, ["admin"])
      ?.dateField,
  ).toBe("");
  expect(() => reportColumns({ ...config, dateField: "private_field" })).toThrow(
    "Unknown date field",
  );
});

test("report configuration excludes restricted sources and unregistered projections", () => {
  expect(validReport({}, [])).toBeNull();
  const config = validReport(
    { source: "drivers", group: "private_field", measure: "sum:password" },
    ["sales"],
  )!;
  expect(config.source).toBe("customers");
  expect(config.group).toBe("");
  expect(config.measure).toBe("count");
  expect(reportColumns(config)).toEqual(["id", "legal_name"]);
  expect(() => reportColumns({ ...config, group: "private_field" })).toThrow("Unknown grouping");
  expect(() => reportColumns({ ...config, measure: "sum:amount" })).toThrow(
    "Unknown report measure",
  );
});

test("revenue averages ignore missing and malformed values while retaining genuine zeroes", () => {
  const config = validReport(
    { source: "bids", group: "status", measure: "average:estimated_revenue" },
    ["admin"],
  )!;
  const report = summarizeReport(
    [
      { status: "Won", estimated_revenue: 0 },
      { status: "Won", estimated_revenue: "120.50" },
      { status: "Won", estimated_revenue: null },
      { status: "Won", estimated_revenue: "" },
      { status: "Won", estimated_revenue: "broken" },
      { status: "Lost", estimated_revenue: Infinity },
    ],
    config,
  );
  expect(report.records).toBe(6);
  expect(report.measured).toBe(2);
  expect(report.value).toBe(60.25);
  expect(report.groups.find((group) => group.label === "Lost")?.value).toBeNull();
});

test("search and grouping filters govern the same rows used for totals and export", () => {
  const config = validReport(
    {
      source: "bids",
      group: "status",
      measure: "sum:estimated_revenue",
      search: "ROAD",
      filter: "Won",
    },
    ["admin"],
  )!;
  const result = summarizeReport(
    [
      { bid_name: "Road contract", status: "Won", estimated_revenue: "42" },
      { bid_name: "Road quote", status: "Lost", estimated_revenue: 100 },
      { bid_name: "Rail contract", status: "Won", estimated_revenue: 100 },
    ],
    config,
  );
  expect(result.records).toBe(1);
  expect(result.value).toBe(42);
  expect(result.groups).toEqual([{ key: "value:Won", label: "Won", records: 1, value: 42 }]);
});

test("missing groups stay distinct from a literal Unspecified value and negative amounts stay signed", () => {
  const config = validReport(
    { source: "bids", group: "status", measure: "sum:estimated_revenue" },
    ["admin"],
  )!;
  const report = summarizeReport(
    [
      { status: null, estimated_revenue: -10 },
      { status: "Unspecified", estimated_revenue: 20 },
    ],
    config,
  );
  expect(new Set(report.groups.map((group) => group.key)).size).toBe(2);
  expect(report.value).toBe(10);
  expect(report.groups.find((group) => group.key === "missing")?.value).toBe(-10);
});
