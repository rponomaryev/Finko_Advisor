import test from "node:test";
import assert from "node:assert/strict";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { translateBlock, translateOptionValue, translateQuestion } from "../src/lib/i18n/interviewLabels.ts";
import type { AppLocale } from "../src/lib/i18n/index.ts";

const locales: AppLocale[] = ["ru", "uz", "en"];
const projects = [
  "Ателье внутри ТЦ",
  "Прокат детских электромобилей внутри ТЦ",
  "Мобильная мойка мягкой мебели",
  "Ремонт телефонов на выезде",
  "Кофе-точка внутри супермаркета",
  "Мини-склад для сезонного хранения"
];
const rawEnum = /\b[a-z]+_[a-z0-9_]+\b/i;
const englishLeakageRuUz = /Customer acquisition channels|Premises status|Credit needed|Tax cash register|Sewing equipment|Tailoring order/i;

test("interview blocks, questions, labels, options, units and placeholders follow locale", () => {
  for (const locale of locales) {
    for (const businessType of projects) {
      const template = buildDynamicInterviewTemplate({ businessType, businessIdea: businessType, userLanguage: locale as any });
      for (const block of template.interviewBlocks) {
        const translatedBlock = translateBlock(locale, block.id, block.name, block.description);
        const blockText = `${translatedBlock.name} ${translatedBlock.description}`;
        assert.doesNotMatch(blockText, rawEnum, `${locale} ${businessType} block leaked raw enum`);
        if (locale !== "en") assert.doesNotMatch(blockText, englishLeakageRuUz);
        for (const question of block.questions) {
          const translated = translateQuestion(locale, question);
          const optionText = (translated.options ?? []).map((option) => translateOptionValue(locale, option)).join(" ");
          const text = [translated.label, translated.question, translated.helpText, translated.placeholder, translated.unit, optionText].filter(Boolean).join(" ");
          assert.doesNotMatch(text, rawEnum, `${locale} ${businessType} ${question.key} leaked raw enum`);
          if (locale !== "en") assert.doesNotMatch(text, englishLeakageRuUz, `${locale} ${businessType} ${question.key} leaked English`);
        }
      }
    }
  }
});
