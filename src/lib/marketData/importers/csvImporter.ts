import type { MarketDataPointInput } from "../types.ts";

const requiredFields = ["indicator", "year", "sourceName", "sourceType"];

function safeSourceUrl(value: unknown) {
  if (!value) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "https:") return raw;
    if (process.env.NODE_ENV !== "production" && parsed.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)) return raw;
    return undefined;
  } catch {
    return undefined;
  }
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === "\"") quoted = !quoted;
    else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values.map((value) => value.replace(/^"|"$/g, ""));
}

export function validateMarketDataRow(row: Record<string, unknown>) {
  const missing = requiredFields.filter((field) => !row[field]);
  if (missing.length) return { ok: false as const, missing };
  const year = Number(row.year);
  if (!Number.isInteger(year) || year < 1900) return { ok: false as const, missing: ["year"] };
  return { ok: true as const };
}

export function normalizeMarketDataRow(row: Record<string, unknown>): MarketDataPointInput | null {
  const validation = validateMarketDataRow(row);
  if (!validation.ok) return null;
  const value = row.value === undefined || row.value === "" ? null : Number(row.value);
  return {
    sector: String(row.sector ?? row.normalizedSector ?? "unknown"),
    businessType: row.businessType ? String(row.businessType) : undefined,
    indicator: String(row.indicator),
    year: Number(row.year),
    region: row.region ? String(row.region) : undefined,
    value: Number.isFinite(value) ? value : null,
    unit: row.unit ? String(row.unit) : undefined,
    currency: row.currency ? String(row.currency) : undefined,
    hsCode: row.hsCode ? String(row.hsCode) : undefined,
    activityCode: row.activityCode ? String(row.activityCode) : undefined,
    tradeType: row.tradeType ? String(row.tradeType).toLowerCase() : row.type ? String(row.type).toLowerCase() : undefined,
    country: row.country ? String(row.country) : undefined,
    productCategory: row.productCategory ? String(row.productCategory) : row.category ? String(row.category) : undefined,
    valueUsd: row.valueUsd === undefined || row.valueUsd === "" ? null : Number(row.valueUsd),
    volume: row.volume === undefined || row.volume === "" ? null : Number(row.volume),
    sourceName: String(row.sourceName),
    sourceUrl: safeSourceUrl(row.sourceUrl),
    sourceType: String(row.sourceType),
    lastUpdated: row.lastUpdated ? String(row.lastUpdated) : undefined
  };
}

export function parseCsvMarketData(csv: string): MarketDataPointInput[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).flatMap((line) => {
    const values = splitCsvLine(line);
    const raw = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    const normalized = normalizeMarketDataRow(raw);
    return normalized ? [normalized] : [];
  });
}
