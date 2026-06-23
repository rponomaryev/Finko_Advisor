import test from "node:test";
import assert from "node:assert/strict";
import { generateFallbackReport } from "../src/lib/report/aiReportGenerator.ts";
import { buildCalculatedProject, genericProfile } from "./helpers/systemicFixtures.ts";

const forbidden = /Официальные числовые рыночные данные.*не найдены|Требует уточнения\s+Нужно проверить|проверить=|2026c|2026d|\b(?:undefined|null|NaN)\b/i;

test("market evidence narrative uses clean evidence facts instead of data-not-found wording", () => {
  const profile = genericProfile({ businessType: "Ателье по ремонту одежды", category: "services", volumeKey: "plannedVolumeMonthly", priceKey: "averageServiceTicket", overrides: { businessIdea: "ремонт одежды и подгонка", businessProfile: { category: "services", subcategory: "tailoring_repair", businessModel: "service" } } });
  const project = buildCalculatedProject(profile);
  const webResearch = {
    businessType: String(profile.businessType),
    region: "Ташкент город",
    researchDate: "2026-06-22",
    summary: "",
    marketContext: "",
    searchQueriesUsed: [],
    warnings: [],
    harvardReferences: [],
    statistics: [{ id: "price", indicator: "Цены на швейные услуги", value: "7,1", unit: "%", year: "2025", geography: "Узбекистан", sourceId: "stat_price", matchQuality: "strong_proxy" as const, confidence: "high" as const, relevance: "pricing", businessInterpretation: "Прайс нужно регулярно сверять с рынком.", howToUseInModel: "Сравнить средний чек с конкурентами.", limitations: "Не доказывает спрос точки." }],
    sources: [{ id: "stat_price", organization: "Национальный комитет по статистике", title: "Цены на швейные услуги выросли на 7,1 % в 2025 году", year: "2025", publishedDate: null, accessedDate: "2026-06-22", url: "https://stat.uz/ru/press-tsentr/novosti-goskomstata/66772", geography: "Узбекистан", sourceType: "official_statistics" as const, reliability: "high" as const }]
  };
  const report = generateFallbackReport({ project: profile, financial: project.financialResult as never, risks: project.riskResult as never, feasibilityScore: project.feasibilityScore as number, bankReadinessScore: project.bankReadinessScore as number, webResearch, locale: "ru" });
  assert.match(report.marketAnalysis, /7,1\s*%/);
  assert.match(report.marketAnalysis, /Для проекта это важно/i);
  assert.doesNotMatch(report.marketAnalysis, forbidden);
});
