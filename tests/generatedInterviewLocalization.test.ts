import test from "node:test";
import assert from "node:assert/strict";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { translateBlock, translateQuestion } from "../src/lib/i18n/interviewLabels.ts";
import { labelValue } from "../src/lib/utils/labels.ts";

const rawEnumPattern = /\b(cosmetics|clothes|electronics|production_process|retail_sku|food_service_menu|not_needed|online_only|sublease|repeat_clients|templateSignature|businessProfileSignature|excludedInterviewBlocks)\b/;

test("generated interview blocks, questions and options localize without raw enum leakage", () => {
  const template = buildDynamicInterviewTemplate({ businessType: "Мобильный груминг животных", businessIdea: "Выездной груминг собак и кошек, Instagram и Telegram", region: "Ташкент город" });
  for (const locale of ["ru", "en", "uz"] as const) {
    const rendered = template.interviewBlocks.flatMap((block) => {
      const b = translateBlock(locale, block.id, block.name, block.description);
      return [
        b.name,
        b.description,
        ...block.questions.flatMap((question) => {
          const q = translateQuestion(locale, question);
          return [q.label, q.question, q.helpText ?? "", q.placeholder ?? "", ...(question.options ?? []).map((option) => labelValue(option, locale))];
        })
      ];
    }).join("\n");
    assert.doesNotMatch(rendered, rawEnumPattern);
  }
});
