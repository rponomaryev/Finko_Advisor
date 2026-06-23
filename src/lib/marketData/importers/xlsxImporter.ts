import ExcelJS from "exceljs";
import { normalizeMarketDataRow } from "./csvImporter.ts";
import type { MarketDataPointInput } from "../types.ts";

export function parseJsonMarketData(json: unknown): MarketDataPointInput[] {
  const rows = Array.isArray(json) ? json : [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const normalized = normalizeMarketDataRow(row as Record<string, unknown>);
    return normalized ? [normalized] : [];
  });
}

export async function parseXlsxMarketData(buffer: Buffer): Promise<MarketDataPointInput[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  const headerRow = sheet.getRow(1);
  const headers = headerRow.values as Array<string | number | undefined>;
  const normalizedHeaders = headers.slice(1).map((header) => String(header ?? "").trim());
  const rows: MarketDataPointInput[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values as Array<string | number | undefined>;
    const raw = Object.fromEntries(normalizedHeaders.map((header, index) => [header, values[index + 1] ?? ""]));
    const normalized = normalizeMarketDataRow(raw);
    if (normalized) rows.push(normalized);
  });

  return rows;
}
