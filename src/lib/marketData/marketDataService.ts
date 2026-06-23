import { officialDataNotFoundMessage, mappingClarificationMessage } from "./fallbackMarketData.ts";
import { mapBusinessToSector, shouldAskForMappingClarification } from "./hsCodeMapper.ts";
import { fetchOfficialMarketData } from "./officialDataClient.ts";
import type { Locale } from "../types/project.ts";
import type { MarketDataPoint, MarketDataResult } from "./types.ts";

export function isValidMarketDataPoint(point: MarketDataPoint) {
  return Boolean(point.indicator && point.year && point.sourceName && point.sourceType);
}

export function hasSourceBackedNumber(point: MarketDataPoint) {
  const primary = typeof point.value === "number" && Number.isFinite(point.value);
  const usd = typeof point.valueUsd === "number" && Number.isFinite(point.valueUsd);
  const volume = typeof point.volume === "number" && Number.isFinite(point.volume);
  return isValidMarketDataPoint(point) && (primary || usd || volume);
}

function normalizePoint(point: MarketDataPoint): MarketDataPoint {
  return {
    ...point,
    value: point.value === undefined ? null : point.value,
    valueUsd: point.valueUsd === undefined ? null : point.valueUsd,
    volume: point.volume === undefined ? null : point.volume,
    matchQuality: point.matchQuality ?? "broad_proxy",
    explanation: point.explanation ?? "Selected as contextual market data for the business profile."
  };
}

function isRelevantToBusinessProfile(point: MarketDataPoint, mapping: ReturnType<typeof mapBusinessToSector>) {
  const profileText = [mapping.businessType, mapping.normalizedSector, ...mapping.keywords.ru, ...mapping.keywords.en, ...mapping.keywords.uz].join(" ").toLowerCase();
  const indicatorText = `${point.indicator} ${point.productCategory ?? ""} ${point.sector ?? ""}`.toLowerCase();

  const isMacroImportExport = /exports of goods and services|imports of goods and services/.test(indicatorText);
  const hasTradeExposure = /import|export|cross-border|china|trade|импорт|экспорт|китай|поставка из китая/.test(profileText);
  if (isMacroImportExport && !hasTradeExposure) return false;

  const profileHasBakery = /bakery|bread|baked|pastry|пекар|хлеб|выпеч|самса|булоч/.test(profileText);
  if (profileHasBakery && /exports of goods and services|imports of goods and services/.test(indicatorText)) return false;

  const isBakeryIndicator = /bakery|bread|flour|wheat|food manufacturing|retail food|пекар|хлеб|мук|еда|food/.test(indicatorText);
  if (profileHasBakery && (point.matchQuality === "exact" || point.matchQuality === "close_proxy")) return isBakeryIndicator || /retail|production|price/.test(indicatorText);

  return true;
}

async function readUploadedMarketData(input: {
  businessType: string;
  normalizedSector: string;
  region?: string;
  hsCodes: string[];
}): Promise<MarketDataPoint[]> {
  const businessType = input.businessType.trim();
  const normalizedSector = input.normalizedSector.trim();
  const hsCodes = input.hsCodes.filter(Boolean);

  const rows = await import("../db/prisma.ts")
    .then(({ prisma }) => prisma.marketDataPoint.findMany({
      where: {
        OR: [
          { businessType: { contains: businessType } },
          { sector: { contains: normalizedSector } },
          ...(hsCodes.length ? [{ hsCode: { in: hsCodes } }] : [])
        ]
      },
      orderBy: [{ year: "desc" }, { indicator: "asc" }]
    }))
    .catch(() => []);

  const regionLower = input.region?.toLowerCase();
  const filtered = rows.filter((row: any) => {
    if (!regionLower || !row.region) return true;
    const pointRegion = String(row.region).toLowerCase();
    return pointRegion === "uzbekistan" || pointRegion === "узбекистан" || pointRegion.includes(regionLower) || regionLower.includes(pointRegion);
  });

  return filtered.map((row: any) => normalizePoint({
    id: row.id,
    sector: row.sector,
    businessType: row.businessType ?? undefined,
    indicator: row.indicator,
    year: row.year,
    region: row.region ?? undefined,
    value: row.value ?? null,
    unit: row.unit ?? undefined,
    currency: row.currency ?? undefined,
    hsCode: row.hsCode ?? undefined,
    activityCode: row.activityCode ?? undefined,
    tradeType: row.tradeType ?? undefined,
    country: row.country ?? undefined,
    productCategory: row.productCategory ?? undefined,
    valueUsd: row.valueUsd ?? null,
    volume: row.volume ?? null,
    sourceName: row.sourceName,
    sourceUrl: row.sourceUrl ?? undefined,
    sourceType: row.sourceType,
    lastUpdated: row.lastUpdated ?? undefined
  }));
}

export async function getMarketData(input: {
  businessType: string;
  region?: string;
  locale?: Locale;
  uploadedPoints?: MarketDataPoint[];
}): Promise<MarketDataResult> {
  const locale = input.locale ?? "ru";
  const mapping = mapBusinessToSector(input.businessType);
  const [databasePoints, officialPoints] = await Promise.all([
    readUploadedMarketData({
      businessType: input.businessType,
      normalizedSector: mapping.normalizedSector,
      hsCodes: mapping.possibleHsCodes,
      region: input.region
    }),
    fetchOfficialMarketData({ mapping, region: input.region })
  ]);

  const dataPoints = [...(input.uploadedPoints ?? []), ...databasePoints, ...officialPoints]
    .map(normalizePoint)
    .filter(isValidMarketDataPoint)
    .filter((point) => {
      const hasNoNumericValue = point.value === null && point.valueUsd === null && point.volume === null;
      return hasNoNumericValue || hasSourceBackedNumber(point);
    })
    .filter((point) => isRelevantToBusinessProfile(point, mapping));
  const messages = [];

  if (dataPoints.length === 0) messages.push(officialDataNotFoundMessage(locale));
  if (shouldAskForMappingClarification(mapping)) messages.push(mappingClarificationMessage(locale));

  const sourceMap = new Map<string, MarketDataResult["sources"][number]>();
  for (const point of dataPoints) {
    const key = `${point.sourceName}:${point.sourceUrl ?? ""}:${point.year}`;
    sourceMap.set(key, {
      sourceName: point.sourceName,
      sourceType: point.sourceType,
      sourceUrl: point.sourceUrl,
      year: point.year,
      lastUpdated: point.lastUpdated ? new Date(point.lastUpdated).toISOString() : undefined,
      notes: `${point.indicator} (${point.matchQuality ?? "broad_proxy"}). ${point.explanation ?? ""}`
    });
  }

  return {
    locale,
    businessType: input.businessType,
    region: input.region,
    mapping,
    dataPoints,
    messages,
    sources: [...sourceMap.values()]
  };
}
