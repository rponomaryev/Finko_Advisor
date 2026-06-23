import ExcelJS from "exceljs";

function cellText(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") {
    const record = value as { text?: unknown; richText?: Array<{ text?: unknown }>; result?: unknown; formula?: unknown; hyperlink?: unknown };
    if (record.text) return String(record.text);
    if (Array.isArray(record.richText)) return record.richText.map((part) => String(part.text ?? "")).join("");
    if (record.result !== undefined) return String(record.result);
    if (record.formula !== undefined) return String(record.formula);
    if (record.hyperlink !== undefined) return String(record.hyperlink);
    return "";
  }
  return String(value);
}

export async function workbookText(buffer: Buffer): Promise<{ sheetNames: string[]; text: string }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as never);
  const parts: string[] = [];
  workbook.eachSheet((sheet) => {
    parts.push(sheet.name);
    sheet.eachRow((row) => row.eachCell((cell) => parts.push(cellText(cell.value))));
  });
  return { sheetNames: workbook.worksheets.map((sheet) => sheet.name), text: parts.join("\n") };
}
