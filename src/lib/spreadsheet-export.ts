/** Strings remain literal cells, never formulas or hyperlinks. */
export async function spreadsheetBuffer(headings: string[], rows: unknown[][]) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HEG Compass";
  const sheet = workbook.addWorksheet("Report", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.addRow(headings);
  for (const row of rows)
    sheet.addRow(
      headings.map((_, index) => {
        const value = row[index];
        if (value === null || value === undefined) return null;
        if (typeof value === "number") return Number.isFinite(value) ? value : null;
        if (typeof value === "boolean") return value;
        return String(value);
      }),
    );
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF714B67" } };
  sheet.getRow(1).height = 24;
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(sheet.rowCount, 1), column: headings.length },
  };
  sheet.columns.forEach((column, index) => {
    column.width = Math.min(48, Math.max(16, (headings[index]?.length ?? 0) + 4));
  });
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

export async function downloadSpreadsheet(filename: string, headings: string[], rows: unknown[][]) {
  const bytes = await spreadsheetBuffer(headings, rows);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.xlsx`;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
