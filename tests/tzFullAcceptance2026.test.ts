import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness, approvedInterviewBlocks } from "../src/lib/business/businessClassifier.ts";
import { businessSamples } from "../src/lib/data/businessSamples/businessSamples.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";
import { createExportProject } from "./reportFixtures.ts";

const approved = new Set<string>(approvedInterviewBlocks);

function normalizeText(value: string) {
  return value.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]+/gi, " ").replace(/\s+/g, " ").trim();
}

test("explicit businessType sample match wins over noisy description", () => {
  const profile = classifyBusiness({
    businessType: "установка видеонаблюдения",
    businessIdea: "работаю с магазинами, кафе, складами и домами",
    productOrService: "монтаж IP-камер и обслуживание"
  });
  assert.equal(profile.aiClassification?.sampleId, "cctv_installation");
  assert.equal(profile.classificationAudit?.fallbackUsed, false);
  assert.ok((profile.confidence ?? 0) >= 0.8);
});

test("all sample labels and aliases classify through sample registry", () => {
  assert.equal(businessSamples.length, 120);
  for (const sample of businessSamples) {
    const examples = [sample.label.ru, sample.label.en, sample.aliases[0]].filter(Boolean) as string[];
    for (const example of examples) {
      const profile = classifyBusiness({ businessType: example, businessIdea: "Описание содержит кафе, склад, магазин и онлайн как шум." });
      assert.equal(profile.aiClassification?.sampleId, sample.id, `${sample.id} failed for ${example}`);
      assert.equal(profile.classificationAudit?.fallbackUsed, false, `${sample.id} should not fallback`);
    }
  }
});

test("dynamic interview uses only the eight approved blocks and deduplicates questions", () => {
  const scenarios = [
    "установка видеонаблюдения",
    "кофейня",
    "мини-пекарня",
    "интернет-магазин одежды",
    "компьютерный клуб",
    "мебельный цех"
  ];
  for (const businessType of scenarios) {
    const template = buildDynamicInterviewTemplate({ businessType, businessIdea: "Запуск бизнеса в Ташкенте", region: "Ташкент", userLanguage: "ru" });
    const blockIds = template.interviewBlocks.map((block) => block.id);
    assert.deepEqual(blockIds, [...approved], businessType);
    const questions = template.interviewBlocks.flatMap((block) => block.questions.map((question) => ({ ...question, blockId: block.id })));
    assert.ok(questions.length >= 12, `${businessType}: expected at least 12 questions`);
    for (const question of questions) assert.ok(approved.has(question.blockId), `${businessType}: invalid block ${question.blockId}`);
    const keys = questions.map((question) => question.key);
    assert.equal(new Set(keys).size, keys.length, `${businessType}: duplicate question key`);
    const texts = questions.map((question) => normalizeText(question.question || question.label || question.key)).filter(Boolean);
    assert.equal(new Set(texts).size, texts.length, `${businessType}: duplicate question text`);
  }
});

test("report export deduplicates sources and omits DSCR without debt", () => {
  const fixture = createExportProject("ru");
  (fixture as any).creditNeeded = "no";
  const report = (fixture as any).reportData;
  report.financialModel.financing.creditNeeded = "no";
  report.financialModel.financing.loanRequired = 0;
  report.financialModel.financing.leasingRequired = 0;
  report.marketData = {
    locale: "ru",
    businessType: "Кофейня",
    region: "Ташкент",
    mapping: { businessType: "Кофейня", normalizedSector: "food_service", possibleHsCodes: [], keywords: { ru: [], uz: [], en: [] }, confidence: "high", mappingSource: "static_dictionary" },
    dataPoints: [],
    messages: [],
    sources: [
      { sourceName: "Same source", sourceType: "official_statistics", sourceUrl: "https://example.com/a", year: 2025, notes: "exact" },
      { sourceName: "Same source", sourceType: "official_statistics", sourceUrl: "https://example.com/a", year: 2025, notes: "exact" }
    ]
  };
  const prepared = prepareReportExport(fixture, "ru");
  assert.equal(prepared.sources.filter((source) => source.url === "https://example.com/a").length, 1);
  assert.equal(prepared.financingRows.some((row) => row.item === "DSCR"), false);
});
