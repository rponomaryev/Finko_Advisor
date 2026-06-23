import test from "node:test";
import assert from "node:assert/strict";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { translateBlock, translateQuestion } from "../src/lib/i18n/interviewLabels.ts";
import { labelValue } from "../src/lib/utils/labels.ts";

const scenarios = [
  { businessType: "Клининговые услуги", businessIdea: "Уборка квартир, офисов и B2B клиентов" },
  { businessType: "Автосервис", businessIdea: "Один бокс внутри большого автосервиса" },
  { businessType: "Кафе", businessIdea: "Кофе и десерты" },
  { businessType: "Мебельное производство", businessIdea: "Производство мебели" },
  { businessType: "Магазин косметики", businessIdea: "Розничный магазин косметики" },
  { businessType: "Импорт оборудования", businessIdea: "Импорт оборудования из Китая" },
  { businessType: "Учебный центр", businessIdea: "Курсы английского языка" },
  { businessType: "Медицинская клиника", businessIdea: "Частная клиника" },
  { businessType: "Логистика", businessIdea: "Доставка по городу" }
];

const rawEnumRegex = /^[a-z]+(_[a-z0-9]+)+$/;
const allowedRaw = new Set(["UZS", "USD", "EUR", "CNY", "RUB"]);

function renderedText(locale: "ru" | "en" | "uz") {
  return scenarios.flatMap((scenario) => {
    const template = buildDynamicInterviewTemplate(scenario);
    return template.interviewBlocks.flatMap((block) => {
      const translatedBlock = translateBlock(locale, block.id, block.name, block.description);
      const questionText = block.questions.flatMap((question) => {
        const translated = translateQuestion(locale, question);
        const optionLabels = question.options?.map((option) => labelValue(option, locale)) ?? [];
        return [translated.label, translated.question, translated.placeholder, translated.unit, ...optionLabels];
      });
      return [translatedBlock.name, translatedBlock.description, ...questionText];
    }).filter((value): value is string => typeof value === "string" && value.length > 0);
  });
}

test("rendered dynamic interview options do not expose raw enum values", () => {
  for (const locale of ["ru", "en", "uz"] as const) {
    const texts = renderedText(locale);
    for (const text of texts) {
      if (allowedRaw.has(text)) continue;
      assert.doesNotMatch(text, rawEnumRegex, `${locale}: ${text}`);
    }
  }
});

test("ru/en/uz interview labels do not leak wrong-language known phrases", () => {
  assert.doesNotMatch(renderedText("ru").join("\n"), /repeat_clients|sublease|online_only|not_needed|parent_service_flow|verbal_agreement/);
  assert.doesNotMatch(renderedText("en").join("\n"), /Какой|Сколько|Помещение|Автосервис|Клиенты/);
  assert.doesNotMatch(renderedText("uz").join("\n"), /Какой|Сколько|Помещение|Клиенты|Документы/);
});
