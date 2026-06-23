import test from "node:test";
import assert from "node:assert/strict";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { translateQuestion } from "../src/lib/i18n/interviewLabels.ts";
import { labelValue } from "../src/lib/utils/labels.ts";
import { findUnexpectedLatinTokens } from "../src/lib/i18n/userFacingSanitizer.ts";

const template = buildDynamicInterviewTemplate({
  businessType: "Магазин детской одежды",
  businessIdea: "Офлайн точка, Instagram и Telegram продажи",
  userLanguage: "ru"
});
const questions = template.interviewBlocks.flatMap((block) => block.questions.map((question) => ({ ...question, blockId: block.id })));

function questionByKey(key: string) {
  const question = questions.find((item) => item.key === key);
  assert.ok(question, `Expected question ${key}`);
  return question;
}

test("children clothing business type label uses the canonical locale dictionary", () => {
  assert.equal(labelValue("children_clothing_store", "ru"), "Магазин детской одежды");
  assert.equal(labelValue("children_clothing_store", "uz"), "Bolalar kiyim do'koni");
  assert.equal(labelValue("children_clothing_store", "en"), "Children's Clothing Store");
});

test("reported children clothing options are localized in Russian", () => {
  const expected = new Map([
    ["everyday_clothing", "Повседневная одежда"],
    ["outerwear", "Верхняя одежда"],
    ["shoes", "Обувь"],
    ["school_uniform", "Школьная форма"],
    ["baby_clothes", "Одежда для малышей"],
    ["accessories", "Аксессуары"],
    ["seasonal_collection", "Сезонная коллекция"],
    ["mall_point", "Точка в ТЦ"],
    ["street_retail_rent", "Аренда стрит-ритейла"],
    ["location_based_retail", "Офлайн-розница с локацией"],
    ["hybrid_offline_online", "Офлайн + онлайн-продажи"]
  ]);

  for (const [id, label] of expected) {
    assert.equal(labelValue(id, "ru"), label, id);
    assert.deepEqual(findUnexpectedLatinTokens(labelValue(id, "ru"), "ru"), [], id);
  }
});

test("children clothing key questions have specific localized copy", () => {
  const expected = {
    ru: ["Категории товаров", "Какие категории детской одежды будут продаваться?", "Формат продаж", "Какой формат магазина планируется?", "Помещение"],
    uz: ["Tovar kategoriyalari", "Bolalar kiyimining qaysi kategoriyalari sotiladi?", "Savdo formati", "Do'konning qaysi formati rejalashtirilgan?", "Joy"],
    en: ["Product categories", "Which children's clothing categories will be sold?", "Sales format", "Which store format is planned?", "Premises"]
  } as const;

  for (const locale of ["ru", "uz", "en"] as const) {
    const product = translateQuestion(locale, questionByKey("productCategories"));
    const operational = translateQuestion(locale, questionByKey("operationalModel"));
    const premises = translateQuestion(locale, questionByKey("premisesStatus"));
    assert.equal(product.label, expected[locale][0]);
    assert.equal(product.question, expected[locale][1]);
    assert.equal(operational.label, expected[locale][2]);
    assert.equal(operational.question, expected[locale][3]);
    assert.equal(premises.label, expected[locale][4]);
  }
});
