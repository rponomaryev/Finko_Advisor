import test from "node:test";
import assert from "node:assert/strict";
import { clearAIAdditionalInterviewQuestionsCacheForTests, generateAIAdditionalInterviewQuestions } from "../src/lib/interview/aiAdditionalQuestions.ts";
import { hasForbiddenUserFacingTerms } from "../src/lib/i18n/userFacingSanitizer.ts";

test("AI-generated Russian questions are sanitized or replaced before user display", async () => {
  const previousMock = process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON;
  const previousKey = process.env.OPENAI_API_KEY;
  clearAIAdditionalInterviewQuestionsCacheForTests();
  process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON = JSON.stringify([
    {
      key: "bad_locale_terms",
      block: "sales",
      type: "textarea",
      label: "Sales validation",
      question: "Укажите food cost, CAC, marketplace channels и cash flow.",
      helpText: "Use structured fields and unit economics before report generation."
    }
  ]);
  delete process.env.OPENAI_API_KEY;

  try {
    const questions = await generateAIAdditionalInterviewQuestions({
      businessType: "Нестандартный сервис",
      businessIdea: "Проверка дополнительных вопросов",
      locale: "ru",
      profile: {
        category: "service",
        additionalInterviewTopics: ["sales", "finance"]
      } as any
    });
    assert.ok(questions.length >= 1);
    const visible = questions.map((question) => [question.label, question.question, question.helpText ?? ""].join(" ")).join("\n");
    assert.equal(hasForbiddenUserFacingTerms(visible, "ru"), false);
    assert.doesNotMatch(visible, /food cost|CAC|marketplace|channels|cash flow|structured fields|unit economics/i);
    assert.match(visible, /себестоимость продаж|стоимость привлечения клиента|резервный вопрос|Уточните ключевые детали проекта/);
  } finally {
    clearAIAdditionalInterviewQuestionsCacheForTests();
    if (previousMock === undefined) delete process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON;
    else process.env.FINKO_MOCK_AI_ADDITIONAL_QUESTIONS_JSON = previousMock;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});
