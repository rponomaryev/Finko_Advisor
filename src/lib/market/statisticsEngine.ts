import type { StructuredProjectData } from "../types/project.ts";
import { selectSourcesForBusiness } from "../data/sourceRegistry.ts";
import type { DataSource } from "../data/sourceRegistry.ts";
import { getBusinessProfileForData } from "../interview/dynamicInterviewEngine.ts";

export type MarketEvidence = {
  id: string;
  indicator: string;
  value?: number | string;
  unit?: string;
  geography: "national" | "region" | "city" | "district" | "global";
  period?: string;
  sourceId: string;
  sourceName: string;
  sourceType: string;
  confidence: "very_high" | "high" | "medium" | "low";
  extractedAt: string;
  relevanceToBusiness: string;
  limitation?: string;
};

function confidence(source: DataSource): MarketEvidence["confidence"] {
  if (source.reliability === "very_high") return "very_high";
  if (source.reliability === "high") return "high";
  return "medium";
}

function geography(source: DataSource, data: Partial<StructuredProjectData>): MarketEvidence["geography"] {
  if (data.region) return "region";
  return source.countryScope === "UZ" ? "national" : "global";
}

function indicatorForSource(source: DataSource): string {
  return source.indicators[0] ?? "Показатель рыночного контекста";
}

function relevanceForSource(source: DataSource, category: string): string {
  const useCase = source.useCases[0];
  if (useCase) return `${useCase}; применимо для категории ${category}.`;
  return `Источник выбран как релевантный для проверки рыночного контекста категории ${category}.`;
}

function limitationForSource(source: DataSource): string | undefined {
  const explicit = source.limitations?.join("; ");
  if (explicit) return explicit;
  if (source.sourceType === "market_proxy" || source.sourceType === "commerce_platform" || source.sourceType === "geospatial") {
    return "Это proxy-источник: использовать только как ориентир, не как официальную статистику.";
  }
  return "Числовое значение не извлекалось автоматически; требуется ручная проверка актуального показателя в источнике.";
}

export function buildMarketEvidence(data: Partial<StructuredProjectData>, limit = 12): MarketEvidence[] {
  const profile = getBusinessProfileForData(data);
  const sourceCategories = Array.from(new Set([...(profile.sourceCategories ?? []), ...(profile.recommendedSourceCategories ?? [])]));
  const sources = selectSourcesForBusiness(profile.category, sourceCategories, limit);
  const extractedAt = new Date().toISOString();

  const seen = new Set<string>();
  return sources.map((source, index) => ({
    id: `${source.id}_${index + 1}`,
    indicator: indicatorForSource(source),
    geography: geography(source, data),
    period: source.updateFrequency ? `Обновление: ${source.updateFrequency}` : undefined,
    sourceId: source.id,
    sourceName: source.name,
    sourceType: source.sourceType,
    confidence: confidence(source),
    extractedAt,
    relevanceToBusiness: relevanceForSource(source, profile.category),
    limitation: limitationForSource(source),
  })).filter((item) => {
    const key = `${item.indicator}:${item.sourceName}:${item.geography}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getRecommendedMarketSources(data: Partial<StructuredProjectData>, limit = 12): DataSource[] {
  const profile = getBusinessProfileForData(data);
  const sourceCategories = Array.from(new Set([...(profile.sourceCategories ?? []), ...(profile.recommendedSourceCategories ?? [])]));
  return selectSourcesForBusiness(profile.category, sourceCategories, limit);
}
