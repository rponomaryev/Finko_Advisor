import { prisma } from "../db/prisma.ts";
import type { ExchangeRateSnapshot } from "../types/project.ts";

const CBU_USD_ARCHIVE_URL = "https://cbu.uz/ru/arkhiv-kursov-valyut/";
const CBU_USD_JSON_BASE = `${CBU_USD_ARCHIVE_URL}json/USD`;
const CACHE_TTL_MS = 60 * 60 * 1000;
const UZBEKISTAN_TIME_ZONE = "Asia/Tashkent";

const memoryCache = new Map<string, { value: ExchangeRateSnapshot; expiresAt: number }>();

type CbuCurrency = {
  Ccy?: string;
  Rate?: string;
  Date?: string;
};

export class ExchangeRateUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "ExchangeRateUnavailableError";
    if (options?.cause) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export function isExchangeRateUnavailableError(error: unknown): error is ExchangeRateUnavailableError {
  return error instanceof ExchangeRateUnavailableError;
}

function normalizeIsoDate(value?: string | Date | null): string {
  if (value instanceof Date) return toUzbekistanDate(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return toUzbekistanDate(parsed);
  }
  return toUzbekistanDate(new Date());
}

export function toUzbekistanDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: UZBEKISTAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export function cbuUsdRateUrl(requestedDate: string): string {
  return `${CBU_USD_JSON_BASE}/${requestedDate}/`;
}

function cacheKey(requestedDate: string) {
  return `USD:UZS:${requestedDate}`;
}

function parseDecimal(value: unknown): number {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return Number.NaN;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.NaN;
}

function normalizeCbuDate(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const text = value.trim();
  const dotDate = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dotDate) return `${dotDate[3]}-${dotDate[2]}-${dotDate[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? fallback : toUzbekistanDate(parsed);
}

export function parseCbuUsdRatePayload(payload: unknown, requestedDateInput: string): ExchangeRateSnapshot {
  const requestedDate = normalizeIsoDate(requestedDateInput);
  if (!Array.isArray(payload)) {
    throw new ExchangeRateUnavailableError("CBU returned an unexpected exchange-rate payload.");
  }

  const usd = payload.find((item: CbuCurrency) => item?.Ccy === "USD") as CbuCurrency | undefined;
  const rate = parseDecimal(usd?.Rate);
  if (!usd || !Number.isFinite(rate)) {
    throw new ExchangeRateUnavailableError("CBU USD/UZS rate was not found for the requested date.");
  }

  const sourceUrl = cbuUsdRateUrl(requestedDate);
  const rateDate = normalizeCbuDate(usd.Date, requestedDate);
  return {
    sourceCurrency: "USD",
    targetCurrency: "UZS",
    currency: "USD",
    rate,
    requestedDate,
    rateDate,
    date: rateDate,
    source: "CBU",
    sourceUrl,
    fetchedAt: new Date().toISOString()
  };
}

async function saveRate(snapshot: ExchangeRateSnapshot) {
  const db = prisma as any;
  if (!db.exchangeRate) return;
  await db.exchangeRate.upsert({
    where: {
      currency_base_requestedDate: {
        currency: "USD",
        base: "UZS",
        requestedDate: snapshot.requestedDate
      }
    },
    update: {
      rate: snapshot.rate,
      rateDate: snapshot.rateDate,
      source: snapshot.source,
      sourceUrl: snapshot.sourceUrl,
      fetchedAt: new Date(snapshot.fetchedAt)
    },
    create: {
      currency: "USD",
      base: "UZS",
      sourceCurrency: "USD",
      targetCurrency: "UZS",
      rate: snapshot.rate,
      requestedDate: snapshot.requestedDate,
      rateDate: snapshot.rateDate,
      source: snapshot.source,
      sourceUrl: snapshot.sourceUrl,
      fetchedAt: new Date(snapshot.fetchedAt)
    }
  }).catch(() => undefined);
}

async function getStoredRate(requestedDate: string): Promise<ExchangeRateSnapshot | null> {
  const db = prisma as any;
  if (!db.exchangeRate) return null;
  const stored = await db.exchangeRate.findFirst({
    where: { currency: "USD", base: "UZS", requestedDate },
    orderBy: { fetchedAt: "desc" }
  }).catch(() => null);
  if (!stored) return null;
  const rate = Number(stored.rate);
  if (!Number.isFinite(rate) || rate <= 0) return null;
  const rateDate = String(stored.rateDate ?? stored.date ?? requestedDate);
  return {
    sourceCurrency: "USD",
    targetCurrency: "UZS",
    currency: "USD",
    rate,
    requestedDate,
    rateDate,
    date: rateDate,
    source: "CBU",
    sourceUrl: String(stored.sourceUrl ?? cbuUsdRateUrl(requestedDate)),
    fetchedAt: stored.fetchedAt?.toISOString?.() ?? new Date().toISOString(),
    cached: true
  };
}

export async function getUsdUzsExchangeRate(requestedDateInput?: string | Date): Promise<ExchangeRateSnapshot> {
  const requestedDate = normalizeIsoDate(requestedDateInput);
  const key = cacheKey(requestedDate);
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const sourceUrl = cbuUsdRateUrl(requestedDate);
  try {
    const response = await fetch(sourceUrl, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new ExchangeRateUnavailableError(`CBU responded with HTTP ${response.status}.`);
    const snapshot = parseCbuUsdRatePayload(await response.json(), requestedDate);
    memoryCache.set(key, { value: snapshot, expiresAt: Date.now() + CACHE_TTL_MS });
    await saveRate(snapshot);
    return snapshot;
  } catch (error) {
    const stored = await getStoredRate(requestedDate);
    if (stored) {
      memoryCache.set(key, { value: stored, expiresAt: Date.now() + CACHE_TTL_MS });
      return stored;
    }
    throw new ExchangeRateUnavailableError(
      `Official CBU USD/UZS rate is unavailable for ${requestedDate}.`,
      { cause: error }
    );
  }
}

export function clearExchangeRateCache() {
  memoryCache.clear();
}

export const officialCbuExchangeRatePage = CBU_USD_ARCHIVE_URL;
