import type { AppLocale } from "../i18n/index.ts";

export type SourceMetadata = {
  title?: unknown;
  author?: unknown;
  publisher?: unknown;
  organization?: unknown;
  sourceName?: unknown;
  siteName?: unknown;
  site?: unknown;
  url?: unknown;
  publishedYear?: unknown;
  year?: unknown;
  publishedDate?: unknown;
  date?: unknown;
  accessedDate?: unknown;
  accessDate?: unknown;
  lastUpdated?: unknown;
  sourceType?: unknown;
};

export type NormalizedSourceMetadata = {
  title?: string;
  author?: string;
  publisher?: string;
  siteName?: string;
  url?: string;
  publishedYear?: string;
  publishedDate?: string;
  accessedDate?: string;
  sourceType?: string;
  displayName: string;
};

const PLACEHOLDER_TERMS = [
  "Нужно проверить",
  "Данные нужно подтвердить",
  "Требуется проверка",
  "Требуется ручная проверка",
  "Требует уточнения",
  "needs verification",
  "needs confirmation",
  "manual verification",
  "manual check",
  "manual_check",
  "unknown",
  "undefined",
  "null",
  "NaN",
  "not available",
  "n/a"
];

const escapedPlaceholderTerms = PLACEHOLDER_TERMS.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const PLACEHOLDER_PATTERN = new RegExp(`(?:${escapedPlaceholderTerms})`, "gi");
const PLACEHOLDER_TEST_PATTERN = new RegExp(`(?:${escapedPlaceholderTerms})`, "i");
const DOMAIN_PATTERN = /\b(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)\b/i;

const neutralSourceTitle: Record<AppLocale, string> = {
  ru: "Статистический источник",
  uz: "Statistik manba",
  en: "Statistical source"
};

const neutralSourceOwner: Record<AppLocale, string> = {
  ru: "Источник",
  uz: "Manba",
  en: "Source"
};

const sourceUrlLabel: Record<AppLocale, string> = {
  ru: "Доступно по адресу",
  uz: "Manzil",
  en: "Available at"
};

const accessedLabel: Record<AppLocale, string> = {
  ru: "дата обращения",
  uz: "murojaat sanasi",
  en: "accessed"
};

export function sourceNeedsClarificationLabel(locale: AppLocale): string {
  if (locale === "en") return "Needs clarification";
  if (locale === "uz") return "Aniqlashtirish kerak";
  return "Требует уточнения";
}

export function hasSourcePlaceholderLeak(value: unknown): boolean {
  const text = String(value ?? "");
  return /Нужно\s+проверить\s+Нужно\s+проверить|Данные\s+нужно\s+подтвердить\s+Данные\s+нужно\s+подтвердить|Нужно\s+проверить\s*\/\s*[a-z0-9.-]+|\(\s*Нужно\s+проверить\s*:|22\s+Нужно\s+проверить\s+20\d{2}|undefined|null|NaN/i.test(text);
}

function containsPlaceholder(value: unknown): boolean {
  return PLACEHOLDER_TEST_PATTERN.test(String(value ?? ""));
}

function collapseRepeatedWords(value: string): string {
  const words = value.split(/\s+/).filter(Boolean);
  const result: string[] = [];
  for (const word of words) {
    if (result[result.length - 1]?.toLowerCase() === word.toLowerCase()) continue;
    result.push(word);
  }
  return result.join(" ");
}

function stripDanglingSeparators(value: string): string {
  return value
    .replace(/[\u00a0\t\r\n]+/g, " ")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/(?:^|\s)[/:;,.()]+(?=\s|$)/g, " ")
    .replace(/^[\s/:;,. '\"-]+|[\s/:;,. '\"-]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function cleanSourceMetadataText(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (["undefined", "null", "nan"].includes(lower)) return undefined;
  let cleaned = raw.replace(PLACEHOLDER_PATTERN, " ");
  cleaned = stripDanglingSeparators(cleaned);
  cleaned = collapseRepeatedWords(cleaned);
  if (!cleaned || /^[/:;,.()'\"-]+$/.test(cleaned)) return undefined;
  if (["undefined", "null", "nan", "unknown", "n/a"].includes(cleaned.toLowerCase())) return undefined;
  return cleaned;
}

function normalizeUrl(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  let raw = String(value).trim();
  if (!raw) return undefined;
  if (["undefined", "null", "nan", "unknown", "n/a"].includes(raw.toLowerCase())) return undefined;
  raw = raw.replace(PLACEHOLDER_PATTERN, " ").trim();
  const directMatch = raw.match(/https?:\/\/[^\s)]+/i);
  if (directMatch) return directMatch[0].replace(/[.,;]+$/g, "");
  const cleaned = cleanSourceMetadataText(raw);
  if (!cleaned) return undefined;
  const domain = cleaned.match(DOMAIN_PATTERN)?.[1];
  return domain ? `https://${domain.replace(/^www\./i, "")}` : undefined;
}

function canonicalDisplayHost(host: string | undefined): string | undefined {
  if (!host) return undefined;
  const normalized = host.replace(/^www\./i, "");
  if (/\.stat\.uz$/i.test(normalized)) return "stat.uz";
  return normalized;
}

function hostnameFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    return canonicalDisplayHost(new URL(url).hostname);
  } catch {
    const match = url.match(DOMAIN_PATTERN);
    return canonicalDisplayHost(match?.[1]);
  }
}

function siteNameFromText(value: unknown): string | undefined {
  const cleaned = cleanSourceMetadataText(value);
  if (!cleaned) return undefined;
  const domain = cleaned.match(DOMAIN_PATTERN)?.[1]?.replace(/^www\./i, "");
  return canonicalDisplayHost(domain) ?? cleaned;
}

function normalizeDate(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const raw = String(value).trim();
  if (!raw || containsPlaceholder(raw)) return undefined;
  const iso = raw.match(/\b(20\d{2}|19\d{2})-(0[1-9]|1[0-2])-([0-2]\d|3[01])\b/);
  if (iso) return iso[0];
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(raw)) return raw.replace(/\//g, "-");
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

function normalizeYear(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const raw = String(value).trim();
  if (!raw || containsPlaceholder(raw)) return undefined;
  const match = raw.match(/\b(19\d{2}|20\d{2})\b/);
  if (!match) return undefined;
  const year = Number(match[1]);
  const maxYear = new Date().getFullYear() + 1;
  if (!Number.isFinite(year) || year < 1900 || year > maxYear) return undefined;
  return String(year);
}

function sameText(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return a.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, " ").trim() === b.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, " ").trim();
}

function firstKnown(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => value && value.trim());
}

export function normalizeSourceMetadata(source: SourceMetadata, locale: AppLocale = "ru"): NormalizedSourceMetadata {
  const url = normalizeUrl(source.url);
  const urlHost = hostnameFromUrl(url);
  const siteName = firstKnown(
    siteNameFromText(source.siteName),
    siteNameFromText(source.site),
    siteNameFromText(source.sourceName),
    urlHost
  );
  const author = cleanSourceMetadataText(source.author);
  const publisher = firstKnown(
    cleanSourceMetadataText(source.publisher),
    cleanSourceMetadataText(source.organization),
    cleanSourceMetadataText(source.sourceName)
  );
  const title = cleanSourceMetadataText(source.title);
  const publishedDate = normalizeDate(source.publishedDate ?? source.date);
  const publishedYear = firstKnown(
    normalizeYear(source.publishedYear),
    normalizeYear(source.year),
    normalizeYear(source.publishedDate ?? source.date)
  );
  const accessedDate = normalizeDate(source.accessedDate ?? source.accessDate ?? source.lastUpdated);
  const displayName = firstKnown(author, publisher, siteName, urlHost, neutralSourceOwner[locale]) ?? neutralSourceOwner[locale];
  return {
    title,
    author,
    publisher,
    siteName,
    url,
    publishedYear,
    publishedDate,
    accessedDate,
    sourceType: cleanSourceMetadataText(source.sourceType),
    displayName
  };
}

function ensureTerminalPeriod(value: string): string {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

export function formatSourceListItem(source: SourceMetadata, locale: AppLocale = "ru"): string {
  const normalized = normalizeSourceMetadata(source, locale);
  const lead = normalized.displayName;
  const title = normalized.title && !sameText(normalized.title, lead) ? normalized.title : neutralSourceTitle[locale];
  const core = normalized.publishedYear
    ? `${lead} (${normalized.publishedYear}) ${title}`
    : `${lead}. ${title}`;
  const parts = [ensureTerminalPeriod(core.replace(/\s+/g, " ").trim())];
  if (normalized.url) {
    const access = normalized.accessedDate ? ` (${accessedLabel[locale]}: ${normalized.accessedDate})` : "";
    parts.push(`${sourceUrlLabel[locale]}: ${normalized.url}${access}`);
  }
  return parts.join(" ").replace(/\s{2,}/g, " ").trim();
}

export function formatSourceCitation(source: SourceMetadata, locale: AppLocale = "ru"): string {
  const normalized = normalizeSourceMetadata(source, locale);
  const lead = normalized.displayName;
  return normalized.publishedYear ? `(${lead}, ${normalized.publishedYear})` : `(${lead})`;
}

export function formatInlineSourceReference(source: SourceMetadata, locale: AppLocale = "ru"): string {
  return formatSourceCitation(source, locale);
}

export function cleanInlineSourcePlaceholders(value: string, locale: AppLocale = "ru"): string {
  const text = String(value ?? "");
  const neutral = sourceNeedsClarificationLabel(locale).toLowerCase();
  return text
    .replace(/\(\s*Нужно\s+проверить\s*\/\s*([a-z0-9.-]+)\s*,\s*(20\d{2}|19\d{2})\s*\)/gi, "($1, $2)")
    .replace(/\(\s*Нужно\s+проверить\s*:\s*[^)]*\)/gi, "")
    .replace(/Нужно\s+проверить\s*:\s*\d{1,2}\s+Нужно\s+проверить\s+(?:19|20)\d{2}/gi, "")
    .replace(/([.!?])\s*Нужно\s+проверить\s+(?=(?:References|Список источников|Источники)\b)/gi, "$1 ")
    .replace(/([.!?])\s*Нужно\s+проверить\s*(?=\n|$)/gi, "$1")
    .replace(/(?:^|\n)\s*Нужно\s+проверить\s*(?=\n|$)/gi, "\n")
    .replace(/Нужно\s+проверить\s+Нужно\s+проверить/gi, sourceNeedsClarificationLabel(locale))
    .replace(/Данные\s+нужно\s+подтвердить\s+Данные\s+нужно\s+подтвердить/gi, sourceNeedsClarificationLabel(locale))
    .replace(/\s*(?:References|Список источников|Источники)\b[\s\S]*$/i, "")
    .replace(/(?:^|\n)\s*\d+\.\s*Нужно\s+проверить\s*\/\s*[a-z0-9.-]+[\s\S]*$/gi, "")
    .replace(new RegExp(`(?:${neutral})\\s+(?:${neutral})`, "gi"), sourceNeedsClarificationLabel(locale))
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}
