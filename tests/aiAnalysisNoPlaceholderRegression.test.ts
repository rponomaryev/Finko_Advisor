import test from "node:test";
import assert from "node:assert/strict";
import { generateFallbackReport } from "../src/lib/report/aiReportGenerator.ts";
import { selectEvidenceFacts } from "../src/lib/report/evidenceEngine.ts";
import { buildCalculatedProject, genericProfile } from "./helpers/systemicFixtures.ts";

const forbidden = /Требует уточнения\s+Нужно проверить|Нужно проверить|проверить=|2024-Нужно проверить|2026c|2026d|\b(?:undefined|null|NaN)\b/i;

function badWebResearch() {
  return {
    businessType: "Ателье по ремонту одежды",
    region: "Ташкент город, Чиланзар",
    researchDate: "2026-06-22",
    summary: "статистика Требует уточнения Нужно проверить",
    marketContext: "Требует уточнения: проверить=659617",
    searchQueriesUsed: [],
    warnings: [],
    harvardReferences: ["Нужно проверить Нужно проверить"],
    statistics: [
      {
        id: "bad",
        indicator: "статистика Требует уточнения Нужно проверить",
        value: "659617",
        unit: "проверить=659617",
        year: "2024-Нужно проверить",
        geography: "Ташкент город",
        sourceId: "src_bad",
        matchQuality: "direct" as const,
        confidence: "high" as const,
        relevance: "Требует уточнения Нужно проверить",
        businessInterpretation: "Требует уточнения: проверить=659617",
        howToUseInModel: "Нужно проверить",
        limitations: "Нужно проверить"
      },
      {
        id: "good_price",
        indicator: "Цены на швейные услуги выросли",
        value: "7,1",
        unit: "%",
        year: "2025",
        geography: "Узбекистан",
        sourceId: "src_price",
        matchQuality: "strong_proxy" as const,
        confidence: "high" as const,
        relevance: "proxy для цены услуги",
        businessInterpretation: "Показывает, что прайс нужно сверять с рынком и регулярно обновлять.",
        howToUseInModel: "Сверить средний чек и цены конкурентов.",
        limitations: "Не доказывает спрос конкретной точки."
      }
    ],
    sources: [
      { id: "src_bad", organization: "статистика Требует уточнения Нужно проверить", title: "Требует уточнения 2026–2028", year: "2026d", publishedDate: null, accessedDate: "2026-06-22", url: "https://stat.uz", geography: "Узбекистан", sourceType: "official_statistics" as const, reliability: "high" as const },
      { id: "src_price", organization: "Национальный комитет по статистике", title: "Цены на швейные услуги выросли на 7,1 % в 2025 году", year: "2025", publishedDate: null, accessedDate: "2026-06-22", url: "https://stat.uz/ru/press-tsentr/novosti-goskomstata/66772", geography: "Узбекистан", sourceType: "official_statistics" as const, reliability: "high" as const }
    ]
  };
}

test("bad raw source/status fields are filtered from AI analysis and evidence facts", () => {
  const profile = genericProfile({ businessType: "Ателье по ремонту одежды", category: "services", volumeKey: "plannedVolumeMonthly", priceKey: "averageServiceTicket", overrides: { businessIdea: "ремонт одежды, подгонка, подшив", businessProfile: { category: "services", subcategory: "tailoring_repair", businessModel: "service" } } });
  const project = buildCalculatedProject(profile);
  const webResearch = badWebResearch();
  const facts = selectEvidenceFacts({ project: profile, financial: project.financialResult as never, webResearch, locale: "ru" });
  assert.ok(facts.length >= 1);
  assert.ok(facts.some((fact) => /швейные услуги/i.test(fact.metricName)));
  assert.doesNotMatch(JSON.stringify(facts), forbidden);

  const report = generateFallbackReport({
    project: profile,
    financial: project.financialResult as never,
    risks: project.riskResult as never,
    feasibilityScore: project.feasibilityScore as number,
    bankReadinessScore: project.bankReadinessScore as number,
    webResearch,
    locale: "ru"
  });
  assert.match(report.fullNarrative, /7,1\s*%|7,1/i);
  assert.match(report.fullNarrative, /Для проекта это важно/i);
  assert.doesNotMatch(JSON.stringify(report), forbidden);
});
