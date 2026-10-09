import { expect, test } from "vitest";
import ExcelJS from "exceljs";
import { spreadsheetBuffer } from "../src/lib/spreadsheet-export";

test("spreadsheet export preserves literal text, zero, negative and missing values without executing formulas", async () => {
  const bytes = await spreadsheetBuffer(
    ["Group", "Records", "Revenue"],
    [
      ['=HYPERLINK("https://example.test")', 0, -12.5],
      ["+SUM(A1)", 2, null],
      ["@formula", 3, Infinity],
    ],
  );
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  const sheet = workbook.getWorksheet("Report")!;
  expect(sheet.getCell("A2").type).toBe(ExcelJS.ValueType.String);
  expect(sheet.getCell("A2").value).toBe('=HYPERLINK("https://example.test")');
  expect(sheet.getCell("B2").value).toBe(0);
  expect(sheet.getCell("C2").value).toBe(-12.5);
  expect(sheet.getCell("C3").value).toBeNull();
  expect(sheet.getCell("C4").value).toBeNull();
  expect(sheet.getCell("A3").type).toBe(ExcelJS.ValueType.String);
  expect(sheet.getRow(1).font?.bold).toBe(true);
  expect(sheet.views[0]?.state).toBe("frozen");
});
