import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness, approvedInterviewBlocks } from "../src/lib/business/businessClassifier.ts";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { clearAIAdditionalInterviewQuestionsCacheForTests } from "../src/lib/interview/aiAdditionalQuestions.ts";
import { getStableQuestionsWithAI } from "../src/lib/services/interviewAIService.ts";
import type { StructuredProjectData } from "../src/lib/types/project.ts";

const approved = new Set<string>(approvedInterviewBlocks);
const genericScenarios = [
  {
    businessType: "сервис аренды дронов для агромониторинга",
    idea: "Сервис сдаёт дроны в аренду агрохозяйствам для мониторинга полей, съёмки и анализа состояния посевов.",
    monthlyCapacity: 90,
    averagePrice: 650000
  },
  {
    businessType: "мастерская 3D-печати на заказ",
    idea: "Изготовление прототипов и малых партий деталей по заявкам предпринимателей и инженеров.",
    monthlyCapacity: 140,
    averagePrice: 180000
  },
  {
    businessType: "платформа бронирования локальных гидов",
    idea: "Онлайн-сервис для бронирования экскурсий у локальных гидов и частных туроператоров.",
    monthlyCapacity: 220,
    averagePrice: 260000
  },
  {
    businessType: "аренда мобильных холодильных камер",
    idea: "Прокат мобильных холодильных камер для мероприятий, фермеров и небольших магазинов.",
    monthlyCapacity: 75,
    averagePrice: 480000
  },
  {
    businessType: "корпоративный сервис кибербезопасности для малого бизнеса",
    idea: "Аудит, настройка защиты и регулярный мониторинг для малых компаний без внутреннего ИТ-специалиста.",
    monthlyCapacity: 35,
    averagePrice: 1800000
  }
];

function countFallbackQuestions(data: StructuredProjectData) {
  return Object.values(data.interviewPlan?.blocks ?? {}).flatMap((block) => block.questions ?? []).filter((question) =>
    question.source === "fallback_ai" ||
    question.source === "fallback_template" ||
    question.capabilityTags?.some((tag) => tag === "unknown_business_ai_fallback" || tag === "unknown_business_fallback_template")
  );
}

test("unknown business flow persists safe fallback questions and does not duplicate them", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousMock = process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON;
  clearAIAdditionalInterviewQuestionsCacheForTests();
  delete process.env.OPENAI_API_KEY;
  delete process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON;
  try {
    for (const scenario of genericScenarios) {
      const data: StructuredProjectData = {
        userLanguage: "ru",
        businessType: scenario.businessType,
        businessIdea: scenario.idea,
        region: "Ташкент город"
      };
      const profile = classifyBusiness({ businessType: data.businessType, businessIdea: data.businessIdea, region: data.region, language: "ru", answers: data });
      assert.equal(profile.category, "generic", scenario.businessType);
      assert.equal(profile.aiClassification?.sampleId, undefined, scenario.businessType);
      assert.equal(profile._requiresAIClassification, true, scenario.businessType);
      assert.equal(profile.classificationAudit?.fallbackUsed, true, scenario.businessType);

      const first = await getStableQuestionsWithAI(data, "business_idea");
      const persisted = { ...data, ...(first.planPatch ?? {}) } as StructuredProjectData;
      const saved = countFallbackQuestions(persisted);
      assert.ok(saved.length >= 4, scenario.businessType);
      assert.ok(saved.every((question) => approved.has(question.blockId ?? "")), scenario.businessType);
      assert.ok(saved.every((question) => question.label.length <= 60 && question.question.length <= 220), scenario.businessType);
      assert.ok(saved.every((question) => question.label !== question.question), scenario.businessType);
      assert.equal(saved.some((question) => /[A-Za-z]{3,}|food cost|CAC|marketplace|cash flow|B2B|B2C/i.test(`${question.label} ${question.question} ${question.helpText ?? ""}`)), false, scenario.businessType);

      const second = await getStableQuestionsWithAI(persisted, "business_idea");
      const persistedAgain = { ...persisted, ...(second.planPatch ?? {}) } as StructuredProjectData;
      assert.equal(countFallbackQuestions(persistedAgain).length, saved.length, scenario.businessType);
      assert.equal(second.planPatch, undefined, scenario.businessType);
    }
  } finally {
    clearAIAdditionalInterviewQuestionsCacheForTests();
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey;
    if (previousMock === undefined) delete process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON; else process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON = previousMock;
  }
});

test("generic businesses warn when revenue units are missing and calculate once units are provided", () => {
  for (const scenario of genericScenarios) {
    const missingUnits: StructuredProjectData = {
      userLanguage: "ru",
      businessType: scenario.businessType,
      businessIdea: scenario.idea,
      region: "Ташкент город",
      ownContributionAmount: 50000000,
      ownContributionCurrency: "UZS",
      creditNeeded: "no"
    };
    const profile = classifyBusiness({ businessType: missingUnits.businessType, businessIdea: missingUnits.businessIdea, region: missingUnits.region, language: "ru", answers: missingUnits });
    const template = buildDynamicInterviewTemplate(missingUnits);
    const missingFinancial = calculateAll({ ...missingUnits, businessProfile: profile as any }, template.assumptions);
    assert.equal(missingFinancial.revenue.monthlyRevenue, 0, scenario.businessType);
    assert.ok(missingFinancial.warnings.some((warning) => warning.code === "generic_revenue_units_missing"), scenario.businessType);

    const complete: StructuredProjectData = {
      ...missingUnits,
      businessProfile: profile as any,
      monthlyCapacity: scenario.monthlyCapacity,
      averagePrice: scenario.averagePrice,
      salesUnitLabel: "заказов/мес.",
      utilizationRatePct: 70,
      rawMaterialCostPerUnit: Math.round(scenario.averagePrice * 0.35),
      equipmentCapex: 80000000,
      monthlyRent: 4000000,
      staffPlan: { roles: [{ role: "Специалист", count: 2, monthlySalaryAmount: 6000000, monthlySalaryCurrency: "UZS" }] }
    };
    const completeFinancial = calculateAll(complete, template.assumptions);
    assert.equal(completeFinancial.revenue.monthlyCapacity, scenario.monthlyCapacity, scenario.businessType);
    assert.equal(completeFinancial.revenue.monthlyRevenue, Math.round(scenario.monthlyCapacity * scenario.averagePrice * 0.7), scenario.businessType);
    assert.equal(completeFinancial.warnings.some((warning) => warning.code === "generic_revenue_units_missing"), false, scenario.businessType);
    assert.equal(Number.isFinite(completeFinancial.profitability.monthlyEBITDA), true, scenario.businessType);
  }
});

test("bad AI language is not persisted for unknown business questions", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousMock = process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON;
  clearAIAdditionalInterviewQuestionsCacheForTests();
  delete process.env.OPENAI_API_KEY;
  process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON = JSON.stringify([
    { key: "bad", blockId: "bad_block", type: "text", label: "Укажите food cost, CAC, marketplace channels и cash flow.", question: "Укажите food cost, CAC, marketplace channels и cash flow.", source: "fallback_ai" }
  ]);
  try {
    const data: StructuredProjectData = {
      userLanguage: "ru",
      businessType: "сервис аренды дронов для агромониторинга",
      businessIdea: "Сервис для мониторинга полей.",
      region: "Ташкент город"
    };
    const stable = await getStableQuestionsWithAI(data, "sales");
    const patched = Object.values(stable.planPatch?.interviewPlan?.blocks ?? {}).flatMap((block) => block.questions ?? []);
    assert.ok(patched.length >= 1);
    const visible = patched.map((question) => `${question.label} ${question.question} ${question.helpText ?? ""}`).join("\n");
    assert.doesNotMatch(visible, /food cost|CAC|marketplace|cash flow|channels|[A-Za-z]{3,}/i);
    assert.ok(patched.every((question) => approved.has(question.blockId ?? "")));
  } finally {
    clearAIAdditionalInterviewQuestionsCacheForTests();
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey;
    if (previousMock === undefined) delete process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON; else process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON = previousMock;
  }
});
