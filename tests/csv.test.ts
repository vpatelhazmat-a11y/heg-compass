import { expect, test } from "vitest";
import { csvCell } from "../src/lib/csv";

test("CSV export quotes text and prevents spreadsheet formulas", () => {
  expect(csvCell('Hazmat "A"')).toBe('"Hazmat ""A"""');
  expect(csvCell('=HYPERLINK("https://example.com")')).toBe(
    '"\'=HYPERLINK(""https://example.com"")"',
  );
  expect(csvCell("  +1+2")).toBe('"\'  +1+2"');
  expect(csvCell(null)).toBe('""');
});
