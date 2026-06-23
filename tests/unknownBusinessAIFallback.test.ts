import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness, approvedInterviewBlocks } from "../src/lib/business/businessClassifier.ts";
import { clearAIAdditionalInterviewQuestionsCacheForTests } from "../src/lib/interview/aiAdditionalQuestions.ts";
import { getStableQuestionsWithAI } from "../src/lib/services/interviewAIService.ts";
import type { StructuredProjectData } from "../src/lib/types/project.ts";

const approved = new Set<string>(approvedInterviewBlocks);

test("unknown drone agromonitoring rental business uses AI fallback questions inside approved blocks", async () => {
  const previousMock = process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON;
  const previousKey = process.env.OPENAI_API_KEY;
  clearAIAdditionalInterviewQuestionsCacheForTests();

  process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON = JSON.stringify([
    {
      key: "drone_fleet_payloads",
      block: "equipment_launch",
      type: "text",
      label: "Какие дроны, камеры, мультиспектральные сенсоры, батареи и ПО нужны для агромониторинга полей?",
      affects: ["capex", "riskScore"],
      source: "fallback_ai"
    },
    {
      key: "agro_flight_capacity",
      block: "operations",
      type: "number",
      label: "Сколько гектаров команда может обследовать за день с учетом выезда, погоды и обработки данных?",
      affects: ["opex", "staffing", "riskScore"],
      source: "fallback_ai"
    },
    {
      key: "farm_contract_validation",
      block: "sales",
      type: "text",
      label: "Есть ли предварительные договоренности с фермерскими хозяйствами на сезонный агромониторинг дронами?",
      affects: ["revenue", "marketValidation", "seasonality"],
      source: "fallback_ai"
    },
    {
      key: "uav_regulatory_readiness",
      block: "documents_experience",
      type: "text",
      label: "Какие требования к полетам БПЛА, страхованию ответственности и хранению геоданных нужно проверить?",
      affects: ["documents", "riskScore"],
      source: "fallback_ai"
    }
  ]);
  delete process.env.OPENAI_API_KEY;

  try {
    const data: StructuredProjectData = {
      businessType: "сервис аренды дронов для агромониторинга полей",
      businessIdea: "B2B сервис для фермерских хозяйств: аренда дронов с оператором, съемка полей, NDVI и отчеты агроному.",
      region: "Ташкентская область",
      userLanguage: "ru"
    };

    const classified = classifyBusiness({
      businessType: data.businessType,
      businessIdea: data.businessIdea,
      region: data.region,
      language: data.userLanguage,
      answers: data
    });

    assert.equal(classified.aiClassification?.sampleId, undefined);
    assert.equal(classified.classificationAudit?.fallbackUsed, true);
    assert.equal(classified._requiresAIClassification, true);

    const stable = await getStableQuestionsWithAI(data, "equipment_launch");

    assert.equal(stable.response.blockId, "equipment_launch");
    assert.equal(stable.response.questions.some((question) => question.blockId === "adaptive_question_pack"), false);
    assert.ok(stable.response.questions.some((question) => /дрон|агромониторинг|полей/i.test(`${question.label} ${question.question}`)));

    const patchedBlocks = stable.planPatch?.interviewPlan?.blocks ?? {};
    assert.ok(Object.keys(patchedBlocks).length >= 3);
    assert.equal(Object.keys(patchedBlocks).includes("adaptive_question_pack"), false);

    const aiQuestions = Object.values(patchedBlocks).flatMap((block) => block.questions.filter((question) => question.source === "fallback_ai"));
    assert.ok(aiQuestions.length >= 3);
    assert.ok(aiQuestions.some((question) => /дрон|БПЛА|агромониторинг|геоданн/i.test(`${question.label} ${question.question}`)));
    assert.ok(aiQuestions.every((question) => approved.has(question.blockId ?? "")));
  } finally {
    clearAIAdditionalInterviewQuestionsCacheForTests();
    if (previousMock === undefined) delete process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON;
    else process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON = previousMock;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

function countFallbackQuestions(data: StructuredProjectData) {
  return Object.values(data.interviewPlan?.blocks ?? {}).flatMap((block) => block.questions ?? []).filter((question) =>
    question.source === "fallback_ai" ||
    question.source === "fallback_template" ||
    question.capabilityTags?.some((tag) => tag === "unknown_business_ai_fallback" || tag === "unknown_business_fallback_template")
  );
}

test("unknown business deterministic fallback is persisted, safe, and not duplicated on repeated calls", async () => {
  const previousMock = process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON;
  const previousAltMock = process.env.OPENAI_ADDITIONAL_QUESTIONS_MOCK_JSON;
  const previousKey = process.env.OPENAI_API_KEY;
  clearAIAdditionalInterviewQuestionsCacheForTests();
  delete process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON;
  delete process.env.OPENAI_ADDITIONAL_QUESTIONS_MOCK_JSON;
  delete process.env.OPENAI_API_KEY;

  try {
    const data: StructuredProjectData = {
      businessType: "сервис аренды дронов для агромониторинга",
      businessIdea: "Сервис сдаёт дроны в аренду агрохозяйствам для мониторинга полей, съёмки и анализа состояния посевов.",
      region: "Ташкентская область",
      userLanguage: "ru"
    };

    const classified = classifyBusiness({
      businessType: data.businessType,
      businessIdea: data.businessIdea,
      region: data.region,
      language: data.userLanguage,
      answers: data
    });
    assert.equal(classified.aiClassification?.sampleId, undefined);
    assert.equal(classified._requiresAIClassification, true);
    assert.equal(classified.classificationAudit?.fallbackUsed, true);
    assert.equal(classified.category, "generic");

    const first = await getStableQuestionsWithAI(data, "business_idea");
    const persisted = { ...data, ...(first.planPatch ?? {}) } as StructuredProjectData;
    const savedQuestions = countFallbackQuestions(persisted);

    assert.ok(savedQuestions.length >= 4);
    assert.ok(savedQuestions.every((question) => question.source === "fallback_template"));
    assert.ok(savedQuestions.every((question) => question.capabilityTags?.includes("unknown_business_fallback_template")));
    assert.ok(savedQuestions.every((question) => approved.has(question.blockId ?? "")));
    assert.ok(savedQuestions.every((question) => question.label.length <= 60));
    assert.ok(savedQuestions.every((question) => question.question.length <= 220));
    assert.ok(savedQuestions.every((question) => question.label !== question.question));
    assert.equal(savedQuestions.some((question) => /NDVI|food cost|CAC|marketplace|cash flow/i.test(`${question.label} ${question.question} ${question.helpText ?? ""}`)), false);

    const second = await getStableQuestionsWithAI(persisted, "business_idea");
    const persistedAgain = { ...persisted, ...(second.planPatch ?? {}) } as StructuredProjectData;
    assert.equal(countFallbackQuestions(persistedAgain).length, savedQuestions.length);
    assert.equal(second.planPatch, undefined);
  } finally {
    clearAIAdditionalInterviewQuestionsCacheForTests();
    if (previousMock === undefined) delete process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON;
    else process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON = previousMock;
    if (previousAltMock === undefined) delete process.env.OPENAI_ADDITIONAL_QUESTIONS_MOCK_JSON;
    else process.env.OPENAI_ADDITIONAL_QUESTIONS_MOCK_JSON = previousAltMock;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test("bad-language AI output is rejected and replaced by Russian safe fallback", async () => {
  const previousMock = process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON;
  const previousKey = process.env.OPENAI_API_KEY;
  clearAIAdditionalInterviewQuestionsCacheForTests();
  process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON = JSON.stringify([
    {
      key: "bad_language_question",
      blockId: "sales",
      type: "text",
      label: "Укажите food cost, CAC, marketplace channels и cash flow.",
      question: "Укажите food cost, CAC, marketplace channels и cash flow.",
      source: "fallback_ai"
    }
  ]);
  delete process.env.OPENAI_API_KEY;

  try {
    const data: StructuredProjectData = {
      businessType: "сервис аренды дронов для агромониторинга",
      businessIdea: "Сервис для мониторинга полей.",
      region: "Ташкентская область",
      userLanguage: "ru"
    };
    const stable = await getStableQuestionsWithAI(data, "business_idea");
    const patchedQuestions = Object.values(stable.planPatch?.interviewPlan?.blocks ?? {}).flatMap((block) => block.questions ?? []);
    const visible = patchedQuestions.map((question) => `${question.label} ${question.question} ${question.helpText ?? ""}`).join("\n");
    assert.ok(patchedQuestions.length >= 1);
    assert.doesNotMatch(visible, /food cost|CAC|marketplace|cash flow|channels/i);
    assert.match(visible, /себестоимость|стоимость привлечения|онлайн-площад|денежный поток|Уточните ключевые детали/);
    assert.ok(patchedQuestions.every((question) => approved.has(question.blockId ?? "")));
  } finally {
    clearAIAdditionalInterviewQuestionsCacheForTests();
    if (previousMock === undefined) delete process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON;
    else process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON = previousMock;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test("AI fallback repairs unknown block ids to approved interview blocks", async () => {
  const previousMock = process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON;
  const previousKey = process.env.OPENAI_API_KEY;
  clearAIAdditionalInterviewQuestionsCacheForTests();
  process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON = JSON.stringify([
    {
      key: "unknown_block_question",
      blockId: "adaptive_question_pack",
      type: "text",
      label: "Дроны и сенсоры",
      question: "Какие дроны, камеры и сенсоры нужны для запуска?",
      source: "fallback_ai"
    }
  ]);
  delete process.env.OPENAI_API_KEY;

  try {
    const data: StructuredProjectData = {
      businessType: "сервис аренды дронов для агромониторинга",
      businessIdea: "Сервис для мониторинга полей.",
      region: "Ташкентская область",
      userLanguage: "ru"
    };
    const stable = await getStableQuestionsWithAI(data, "equipment_launch");
    const patchedQuestions = Object.values(stable.planPatch?.interviewPlan?.blocks ?? {}).flatMap((block) => block.questions ?? []);
    assert.ok(patchedQuestions.length >= 1);
    assert.ok(patchedQuestions.every((question) => approved.has(question.blockId ?? "")));
    assert.equal(patchedQuestions.some((question) => question.blockId === "adaptive_question_pack"), false);
  } finally {
    clearAIAdditionalInterviewQuestionsCacheForTests();
    if (previousMock === undefined) delete process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON;
    else process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON = previousMock;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});
