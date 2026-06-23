import test from "node:test";
import assert from "node:assert/strict";
import { buildPdfReportBuffer } from "../src/lib/export/pdfReportExporter.ts";
import { generateFallbackReport } from "../src/lib/report/aiReportGenerator.ts";
import { extractPdfText } from "./helpers/pdfText.ts";
import { buildCalculatedProject, genericProfile } from "./helpers/systemicFixtures.ts";

const forbidden = /Требует уточнения\s+Нужно проверить|Нужно проверить\s+Нужно проверить|Нужно проверить\s*\/|проверить=|2024-Нужно проверить|2026c|2026d|\b(?:undefined|null|NaN)\b/i;

function webResearchForAtelier() {
  return {
    businessType: "Ателье по ремонту одежды",
    region: "Ташкент город, Чиланзар",
    researchDate: "2026-06-22",
    summary: "",
    marketContext: "",
    searchQueriesUsed: [],
    warnings: [],
    harvardReferences: [],
    statistics: [
      { id: "sewing_price", indicator: "Цены на швейные услуги", value: "7,1", unit: "%", year: "2025", geography: "Узбекистан", sourceId: "src_price", matchQuality: "strong_proxy" as const, confidence: "high" as const, relevance: "pricing proxy", businessInterpretation: "Для ателье это означает, что прайс нужно сверять с рынком и регулярно обновлять.", howToUseInModel: "Проверить средний чек и цены конкурентов.", limitations: "Не доказывает спрос конкретной точки." },
      { id: "bad", indicator: "статистика Требует уточнения Нужно проверить", value: "659617", unit: "проверить=659617", year: "2024-Нужно проверить", geography: "Ташкент", sourceId: "bad", matchQuality: "direct" as const, confidence: "high" as const, relevance: "bad", businessInterpretation: "bad", howToUseInModel: "bad", limitations: "bad" }
    ],
    sources: [
      { id: "src_price", organization: "Национальный комитет по статистике", title: "Цены на швейные услуги выросли на 7,1 % в 2025 году", year: "2025", publishedDate: null, accessedDate: "2026-06-22", url: "https://stat.uz/ru/press-tsentr/novosti-goskomstata/66772", geography: "Узбекистан", sourceType: "official_statistics" as const, reliability: "high" as const },
      { id: "bad", organization: "статистика Требует уточнения Нужно проверить", title: "Требует уточнения 2026–2028", year: "2026d", publishedDate: null, accessedDate: "2026-06-22", url: "https://stat.uz", geography: "Узбекистан", sourceType: "official_statistics" as const, reliability: "high" as const },
      { id: "construction_bad", organization: "stat.uz", title: "Количество строительных предприятий на 1 июля 2024 года", year: "2024", publishedDate: null, accessedDate: "2026-06-22", url: "https://stat.uz/img/qurilish-", geography: "Узбекистан", sourceType: "official_statistics" as const, reliability: "high" as const }
    ]
  };
}

test("PDF AI analysis is evidence-driven and clean on the observed atelier scenario", async () => {
  const profile = genericProfile({ businessType: "Ателье по ремонту одежды", category: "services", volumeKey: "plannedVolumeMonthly", priceKey: "averageServiceTicket", overrides: { businessIdea: "ремонт одежды, подгонка, подшив, замена молний, примерки и срочные заказы", region: "Ташкент город", district: "Чиланзар", plannedVolumeMonthly: 300, averageServiceTicket: 180_000, businessProfile: { category: "services", subcategory: "tailoring_repair", businessModel: "service", volumeField: "plannedVolumeMonthly", averageTicketField: "averageServiceTicket" } } });
  const project = buildCalculatedProject(profile);
  const reportData = project.reportData as Record<string, unknown>;
  const webResearch = webResearchForAtelier();
  reportData.webResearchData = webResearch;
  reportData.aiReport = generateFallbackReport({
    project: profile,
    financial: project.financialResult as never,
    risks: project.riskResult as never,
    feasibilityScore: project.feasibilityScore as number,
    bankReadinessScore: project.bankReadinessScore as number,
    webResearch,
    locale: "ru"
  });
  const text = await extractPdfText(await buildPdfReportBuffer(project, "ru"));
  assert.match(text, /ИИ Анализ и рекомендации/);
  assert.match(text, /По данным Национальный комитет по\s+статистике|По данным Национального комитета/i);
  assert.match(text, /7,1\s*%/);
  assert.match(text, /месячная выручка|Месячная выручка/);
  assert.doesNotMatch(text, forbidden);
  assert.doesNotMatch(text, /Количество строительных предприятий/i);
});

import { cleanAiAnalysisText } from "../src/lib/report/evidenceEngine.ts";

test("AI analysis markdown headings are separated and placeholder noise is softened", () => {
  const cleaned = cleanAiAnalysisText("Текст первого раздела. ### 2. Демография и спрос\nТребует уточнения Требует уточнения. Нужно проверить", "ru");
  assert.match(cleaned, /Текст первого раздела\.\n\n### 2\. Демография и спрос/);
  assert.doesNotMatch(cleaned, /Требует уточнения Требует уточнения|Нужно проверить/);
  assert.match(cleaned, /требует подтверждения/);
});
