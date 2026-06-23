import test from "node:test";
import assert from "node:assert/strict";
import { selectEvidenceFacts } from "../src/lib/report/evidenceEngine.ts";
import { buildCalculatedProject, genericProfile } from "./helpers/systemicFixtures.ts";

const forbidden = /Требует уточнения\s+Нужно проверить|Нужно проверить\s+Нужно проверить|проверить=|2024-Нужно проверить|2026c|2026d|\b(?:undefined|null|NaN)\b/i;

test("evidence extraction uses numeric statistics and source titles, filtering malformed placeholders", () => {
  const profile = genericProfile({ businessType: "Мобильная мойка мягкой мебели", category: "services", volumeKey: "monthlyOrders", priceKey: "averageTicket", overrides: { businessIdea: "выездная чистка диванов и мебели", businessProfile: { category: "services", subcategory: "services_cleaning_service", businessModel: "mobile_service" } } });
  const project = buildCalculatedProject(profile);
  const webResearch = {
    businessType: String(profile.businessType), region: "Ташкент город", researchDate: "2026-06-22", summary: "", marketContext: "", searchQueriesUsed: [], warnings: [], harvardReferences: [],
    statistics: [
      { id: "bad", indicator: "статистика Требует уточнения Нужно проверить", value: "123", unit: "проверить=123", year: "2026d", geography: "Ташкент", sourceId: "bad", matchQuality: "direct" as const, confidence: "high" as const, relevance: "bad", businessInterpretation: "bad", howToUseInModel: "bad", limitations: "bad" }
    ],
    sources: [
      { id: "bad", organization: "Требует уточнения Нужно проверить", title: "2024-Нужно проверить", year: "2026d", publishedDate: null, accessedDate: "2026-06-22", url: "https://stat.uz", geography: "Узбекистан", sourceType: "official_statistics" as const, reliability: "high" as const },
      { id: "good", organization: "Национальный комитет по статистике", title: "Объем рыночных услуг вырос на 12,3 % в 2025 году", year: "2025", publishedDate: null, accessedDate: "2026-06-22", url: "https://stat.uz/services", geography: "Узбекистан", sourceType: "official_statistics" as const, reliability: "high" as const }
    ]
  };
  const facts = selectEvidenceFacts({ project: profile, financial: project.financialResult as never, webResearch, locale: "ru" });
  assert.ok(facts.length >= 1);
  assert.match(JSON.stringify(facts), /12,3\s*%|12,3/i);
  assert.doesNotMatch(JSON.stringify(facts), forbidden);
});
