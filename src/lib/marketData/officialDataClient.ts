import { officialSourceRegistry } from "./sourceRegistry.ts";
import type { MarketDataPoint, SectorMapping } from "./types.ts";

type OfficialDataInput = {
  mapping: SectorMapping;
  region?: string;
};

type CandidateDataset = {
  slug: string;
  indicator: string;
  sector: string;
  unit?: string;
  matchQuality?: "exact" | "close_proxy" | "broad_proxy" | "not_found";
  explanation?: string;
};

const FETCH_TIMEOUT_MS = Number(process.env.OFFICIAL_DATA_TIMEOUT_MS ?? 4500);
const MAX_STAT_UZ_DATASETS = Number(process.env.OFFICIAL_DATA_MAX_STAT_UZ_DATASETS ?? 3);
const STAT_UZ_BASE = "https://api.stat.uz/api/v1.0/data";
const WORLD_BANK_BASE = "https://api.worldbank.org/v2/country/UZB/indicator";

const commonStatUzDatasets: CandidateDataset[] = [
  {
    slug: "yanvar-dekabr",
    indicator: "Socio-economic indicators, January-December",
    sector: "economy",
    matchQuality: "broad_proxy",
    explanation: "Broad macro context; not a product-specific statistic."
  },
  {
    slug: "sanoat-mahsulotlari-ishlab-chiqaruvchilar-narxlari-2",
    indicator: "Producer price index for industrial products",
    sector: "industry",
    unit: "%",
    matchQuality: "broad_proxy",
    explanation: "Broad industrial price context; not a product-specific statistic."
  }
];

function datasetsForMapping(mapping: SectorMapping): CandidateDataset[] {
  const haystack = [mapping.businessType, mapping.normalizedSector, ...mapping.keywords.ru, ...mapping.keywords.en, ...mapping.keywords.uz]
    .join(" ")
    .toLowerCase();

  if (/bakery|bread|baked|pastry|пекар|хлеб|выпеч|самса|булоч|nonvoy|somsa|pishiriq/.test(haystack)) {
    return [
      { slug: "sanoat-mahsulotlari-ishlab-chiqarish-hajmi", indicator: "Industrial production volume - food manufacturing proxy", sector: "food manufacturing", matchQuality: "close_proxy", explanation: "Close proxy for local production where official bakery-specific data is not available." },
      { slug: "chakana-savdo-aylanmasi", indicator: "Retail trade turnover - food retail demand proxy", sector: "retail food trade", matchQuality: "close_proxy", explanation: "Close proxy for local retail demand for food products." },
      { slug: "sanoat-mahsulotlari-ishlab-chiqaruvchilar-narxlari-2", indicator: "Producer price index for industrial products", sector: "input prices", unit: "%", matchQuality: "broad_proxy", explanation: "Broad proxy for input-cost pressure; not a bakery-specific statistic." }
    ];
  }

  if (/car wash|carwash|vehicle wash|автомой|мойка автомобил|мойка машин|avtoyuvish|avto yuvish/.test(haystack)) {
    return [
      { slug: "xizmatlar-hajmi", indicator: "Volume of market services - car wash demand proxy", sector: "services", matchQuality: "close_proxy", explanation: "Official services-sector proxy for demand in service businesses such as car wash." },
      { slug: "yo-lovchi-transporti-asosiy-ko-rsatkichlari", indicator: "Transport activity - vehicle flow proxy", sector: "transport", matchQuality: "broad_proxy", explanation: "Transport activity can be used as a proxy for vehicle-flow context around car-related services." },
      { slug: "aholi-soni", indicator: "Population by region - local demand base", sector: "demography", matchQuality: "broad_proxy", explanation: "Regional population helps assess the local customer base for a neighborhood car wash." },
      ...commonStatUzDatasets
    ];
  }

  if (/coffee|cafe|кофе|кафе|qahva|kafe|food service|общепит/.test(haystack)) {
    return [
      { slug: "xizmatlar-hajmi", indicator: "Volume of market services", sector: "services", matchQuality: "close_proxy", explanation: "Service-sector demand proxy relevant to the selected service business." },
      { slug: "chakana-savdo-aylanmasi", indicator: "Retail trade turnover", sector: "retail", matchQuality: "close_proxy", explanation: "Retail demand proxy relevant to the selected sales channel." },
      ...commonStatUzDatasets
    ];
  }

  if (/sew|garment|apparel|textile|швей|пошив|одеж|tikuv|kiyim|to'qimachilik/.test(haystack)) {
    return [
      { slug: "to-qimachilik-mahsulotlarini-ishlab-chiqarish", indicator: "Textile production", sector: "manufacturing", matchQuality: "close_proxy", explanation: "Close proxy for garment and sewing production." },
      { slug: "sanoat-mahsulotlari-ishlab-chiqaruvchilar-narxlari-2", indicator: "Producer price index for industrial products", sector: "industry", unit: "%" },
      ...commonStatUzDatasets
    ];
  }

  if (/toy|игруш|oyinchoq|o'yinchoq|manufacturing|производ/.test(haystack)) {
    return [
      { slug: "sanoat-mahsulotlari-ishlab-chiqarish-hajmi", indicator: "Industrial production volume", sector: "industry", matchQuality: "broad_proxy", explanation: "Broad production context for manufacturing businesses." },
      { slug: "sanoat-mahsulotlari-ishlab-chiqaruvchilar-narxlari-2", indicator: "Producer price index for industrial products", sector: "industry", unit: "%" },
      ...commonStatUzDatasets
    ];
  }

  if (/retail|shop|магазин|торгов|savdo|e-?commerce|marketplace/.test(haystack)) {
    return [
      { slug: "chakana-savdo-aylanmasi", indicator: "Retail trade turnover", sector: "retail", matchQuality: "close_proxy", explanation: "Retail demand proxy relevant to the selected sales channel." },
      { slug: "ulgurji-savdo-aylanmasi", indicator: "Wholesale trade turnover", sector: "trade", matchQuality: "close_proxy", explanation: "Wholesale trade proxy for businesses with bulk sales or import activity." },
      ...commonStatUzDatasets
    ];
  }

  return commonStatUzDatasets;
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[’'`ʻʼ]/g, "")
    .replace(/[^a-zа-яё0-9]+/gi, " ")
    .trim();
}

function regionMatches(value: unknown, requested?: string) {
  const text = normalizeText(value);
  if (!text) return false;
  if (!requested) {
    return /o‘zbekiston|uzbekistan|узбекистан|республика узбекистан/.test(text);
  }
  const wanted = normalizeText(requested);
  if (!wanted) return /o‘zbekiston|uzbekistan|узбекистан|республика узбекистан/.test(text);
  return text.includes(wanted) || wanted.includes(text);
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === null || value === undefined) return null;
  const cleaned = String(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s/g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.\-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseYear(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value >= 1990 && value <= 2100) return value;
  const match = String(value ?? "").match(/(?:19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

function rowsFromUnknown(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) {
    if (payload.every((item) => item && typeof item === "object" && !Array.isArray(item))) return payload as Array<Record<string, unknown>>;
    return payload.flatMap(rowsFromUnknown);
  }
  if (!payload || typeof payload !== "object") return [];
  const objectPayload = payload as Record<string, unknown>;
  const preferredKeys = ["data", "rows", "items", "result", "values"];
  for (const key of preferredKeys) {
    const rows = rowsFromUnknown(objectPayload[key]);
    if (rows.length) return rows;
  }
  return [];
}

function pointsFromJson(input: { payload: unknown; dataset: CandidateDataset; mapping: SectorMapping; region?: string; sourceUrl: string }): MarketDataPoint[] {
  const rows = rowsFromUnknown(input.payload);
  const points: MarketDataPoint[] = [];

  for (const row of rows) {
    const values = Object.values(row);
    const regionValue = values.find((value) => typeof value === "string" && (regionMatches(value, input.region) || regionMatches(value)));
    if (!regionValue) continue;

    for (const [key, value] of Object.entries(row)) {
      const year = parseYear(key) ?? parseYear((row as Record<string, unknown>).year) ?? parseYear((row as Record<string, unknown>).Year);
      const numeric = parseNumeric(value);
      if (!year || numeric === null) continue;
      points.push({
        sector: input.dataset.sector,
        businessType: input.mapping.businessType,
        indicator: input.dataset.indicator,
        year,
        region: String(regionValue),
        value: numeric,
        unit: input.dataset.unit,
        sourceName: officialSourceRegistry.uzStatisticsAgency.sourceName,
        sourceUrl: input.sourceUrl,
        sourceType: officialSourceRegistry.uzStatisticsAgency.sourceType,
        lastUpdated: new Date().toISOString(),
        matchQuality: input.dataset.matchQuality ?? "close_proxy",
        explanation: input.dataset.explanation ?? `Official indicator selected for ${input.mapping.normalizedSector}.`
      });
    }
  }

  return latestPoints(points);
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function pointsFromCsv(input: { text: string; dataset: CandidateDataset; mapping: SectorMapping; region?: string; sourceUrl: string }): MarketDataPoint[] {
  const rows = input.text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map(parseCsvLine)
    .filter((row) => row.some(Boolean));

  const indicator = rows[0]?.find(Boolean) || input.dataset.indicator;
  const headerIndex = rows.findIndex((row) => row.some((cell) => parseYear(cell)));
  if (headerIndex < 0) return [];
  const header = rows[headerIndex];
  const yearColumns = header
    .map((cell, index) => ({ year: parseYear(cell), index }))
    .filter((item): item is { year: number; index: number } => Boolean(item.year));

  const dataRows = rows.slice(headerIndex + 1);
  const matchedRows = dataRows.filter((row) => row.some((cell) => regionMatches(cell, input.region)));
  const fallbackRows = matchedRows.length ? matchedRows : dataRows.filter((row) => row.some((cell) => regionMatches(cell)));
  const points: MarketDataPoint[] = [];

  for (const row of fallbackRows.slice(0, 2)) {
    const region = row.find((cell) => regionMatches(cell, input.region)) ?? row.find((cell) => regionMatches(cell)) ?? input.region;
    for (const column of yearColumns) {
      const numeric = parseNumeric(row[column.index]);
      if (numeric === null) continue;
      points.push({
        sector: input.dataset.sector,
        businessType: input.mapping.businessType,
        indicator,
        year: column.year,
        region: region ? String(region) : input.region,
        value: numeric,
        unit: input.dataset.unit,
        sourceName: officialSourceRegistry.uzStatisticsAgency.sourceName,
        sourceUrl: input.sourceUrl,
        sourceType: officialSourceRegistry.uzStatisticsAgency.sourceType,
        lastUpdated: new Date().toISOString(),
        matchQuality: input.dataset.matchQuality ?? "close_proxy",
        explanation: input.dataset.explanation ?? `Official indicator selected for ${input.mapping.normalizedSector}.`
      });
    }
  }

  return latestPoints(points);
}

function latestPoints(points: MarketDataPoint[]) {
  const byIndicator = new Map<string, MarketDataPoint>();
  for (const point of points) {
    const key = `${point.indicator}:${point.region ?? ""}:${point.sourceName}`;
    const existing = byIndicator.get(key);
    if (!existing || point.year > existing.year) byIndicator.set(key, point);
  }
  return [...byIndicator.values()];
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { Accept: "application/json,text/csv,text/plain;q=0.9,*/*;q=0.8" },
      signal: controller.signal,
      next: { revalidate: 60 * 60 * 24 }
    } as RequestInit & { next?: { revalidate: number } });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchStatUzDataset(dataset: CandidateDataset, input: OfficialDataInput): Promise<MarketDataPoint[]> {
  const jsonUrl = `${STAT_UZ_BASE}/${dataset.slug}?format=json&lang=ru`;
  try {
    const jsonResponse = await fetchWithTimeout(jsonUrl);
    if (jsonResponse.ok) {
      const payload = await jsonResponse.json().catch(() => null);
      const points = pointsFromJson({ payload, dataset, mapping: input.mapping, region: input.region, sourceUrl: jsonUrl });
      if (points.length) return points;
    }
  } catch {
    // Continue with CSV fallback.
  }

  const csvUrl = `${STAT_UZ_BASE}/${dataset.slug}?format=csv&lang=ru`;
  try {
    const csvResponse = await fetchWithTimeout(csvUrl);
    if (!csvResponse.ok) return [];
    const text = await csvResponse.text();
    return pointsFromCsv({ text, dataset, mapping: input.mapping, region: input.region, sourceUrl: csvUrl });
  } catch {
    return [];
  }
}

const worldBankIndicators = [
  { code: "NE.EXP.GNFS.CD", indicator: "Exports of goods and services", tradeType: "export" as const, sectorPattern: /import|export|cross-border|china|trade|импорт|экспорт|китай/, matchQuality: "broad_proxy" as const, explanation: "Broad macro trade context only for businesses with import/export exposure." },
  { code: "NE.IMP.GNFS.CD", indicator: "Imports of goods and services", tradeType: "import" as const, sectorPattern: /import|export|cross-border|china|trade|импорт|экспорт|китай/, matchQuality: "broad_proxy" as const, explanation: "Broad macro trade context only for businesses with import/export exposure." },
  { code: "NV.SRV.TOTL.CD", indicator: "Services value added", sectorPattern: /service|car wash|carwash|vehicle wash|автомой|coffee|cafe|кафе|кофе|retail|trade|beauty|personal|salon/, matchQuality: "broad_proxy" as const, explanation: "Broad services-sector context; not a product-specific statistic." },
  { code: "NV.IND.MANF.CD", indicator: "Manufacturing value added", sectorPattern: /manufact|industry|sew|garment|toy|furniture|производ|швей|игруш|мебел/, matchQuality: "broad_proxy" as const, explanation: "Broad manufacturing-sector context; not a product-specific statistic." }
];

async function fetchWorldBankPoint(indicator: typeof worldBankIndicators[number], mapping: SectorMapping): Promise<MarketDataPoint[]> {
  const haystack = `${mapping.businessType} ${mapping.normalizedSector}`.toLowerCase();
  if (indicator.sectorPattern && !indicator.sectorPattern.test(haystack)) return [];
  const url = `${WORLD_BANK_BASE}/${indicator.code}?format=json&per_page=8`;
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return [];
    const payload = await response.json() as unknown;
    const rows = Array.isArray(payload) && Array.isArray(payload[1]) ? payload[1] as Array<Record<string, unknown>> : [];
    const row = rows.find((item) => parseNumeric(item.value) !== null && parseYear(item.date));
    const value = parseNumeric(row?.value);
    const year = parseYear(row?.date);
    if (value === null || !year) return [];
    return [{
      sector: mapping.normalizedSector,
      businessType: mapping.businessType,
      indicator: indicator.indicator,
      year,
      region: "Uzbekistan",
      valueUsd: value,
      currency: "USD",
      tradeType: indicator.tradeType,
      sourceName: officialSourceRegistry.worldBank.sourceName,
      sourceUrl: url,
      sourceType: officialSourceRegistry.worldBank.sourceType,
      lastUpdated: new Date().toISOString(),
      matchQuality: indicator.matchQuality ?? "broad_proxy",
      explanation: indicator.explanation ?? "Broad official context indicator."
    }];
  } catch {
    return [];
  }
}

export async function fetchOfficialMarketData(input: OfficialDataInput): Promise<MarketDataPoint[]> {
  const datasets = datasetsForMapping(input.mapping).slice(0, MAX_STAT_UZ_DATASETS);
  const [statUzPoints, worldBankPoints] = await Promise.all([
    Promise.all(datasets.map((dataset) => fetchStatUzDataset(dataset, input))).then((groups) => groups.flat()),
    Promise.all(worldBankIndicators.map((indicator) => fetchWorldBankPoint(indicator, input.mapping))).then((groups) => groups.flat())
  ]);

  return latestPoints([...statUzPoints, ...worldBankPoints]);
}
