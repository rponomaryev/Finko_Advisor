import test from "node:test";
import assert from "node:assert/strict";
import { businessSamples } from "../src/lib/data/businessSamples/businessSamples.ts";
import { approvedInterviewBlocks } from "../src/lib/business/businessClassifier.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { translateQuestion } from "../src/lib/i18n/interviewLabels.ts";
import { hasForbiddenUserFacingTerms } from "../src/lib/i18n/userFacingSanitizer.ts";

function normalize(value: string) {
  return value.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9ўғқҳ]+/gi, " ").replace(/\s+/g, " ").trim();
}

test("all 120 sample-specific questions are concise, localized and non-duplicated in RU/UZ", () => {
  for (const sample of businessSamples) {
    const template = buildDynamicInterviewTemplate({
      businessType: sample.label.ru,
      businessIdea: "Тестовая идея для проверки локализации sample-specific вопросов.",
      region: "Ташкент город",
      userLanguage: "ru"
    });
    assert.deepEqual(template.interviewBlocks.map((block) => block.id).sort(), [...approvedInterviewBlocks].sort(), `${sample.id}: all 8 blocks must exist`);

    for (const locale of ["ru", "uz"] as const) {
      for (const block of template.interviewBlocks) {
        const seen = new Set<string>();
        const sampleQuestions = block.questions.filter((question) => question.key.startsWith(`sample_${sample.id}_`));
        assert.ok(sampleQuestions.length >= 3, `${sample.id}/${locale}/${block.id}: expected sample-specific questions`);
        for (const rawQuestion of sampleQuestions) {
          const question = translateQuestion(locale, rawQuestion);
          assert.ok(question.label?.trim(), `${sample.id}/${locale}/${rawQuestion.key}: missing label`);
          assert.ok(question.question?.trim(), `${sample.id}/${locale}/${rawQuestion.key}: missing question`);
          assert.ok((question.helpText ?? "").trim(), `${sample.id}/${locale}/${rawQuestion.key}: missing helpText`);
          assert.ok(question.label.length <= 60, `${sample.id}/${locale}/${rawQuestion.key}: label too long`);
          assert.ok(question.question.length <= 220, `${sample.id}/${locale}/${rawQuestion.key}: question too long`);
          assert.ok((question.helpText ?? "").length <= 700, `${sample.id}/${locale}/${rawQuestion.key}: helpText too long`);
          const visible = [question.label, question.question, question.helpText ?? "", question.placeholder ?? ""].join(" ");
          assert.equal(hasForbiddenUserFacingTerms(visible, locale), false, `${sample.id}/${locale}/${rawQuestion.key}: forbidden English term leaked`);
          if (locale === "uz") assert.doesNotMatch(visible, /[А-Яа-яЁё]{2,}/, `${sample.id}/${rawQuestion.key}: Russian text leaked into Uzbek copy`);
          const duplicateKey = normalize(`${question.label} ${question.question}`);
          assert.equal(seen.has(duplicateKey), false, `${sample.id}/${locale}/${block.id}: duplicate question ${duplicateKey}`);
          seen.add(duplicateKey);
        }
      }
    }
  }
});
