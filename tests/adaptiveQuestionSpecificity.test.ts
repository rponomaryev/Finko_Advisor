import test from "node:test";
import assert from "node:assert/strict";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";

function questionText(businessType: string) {
  const template = buildDynamicInterviewTemplate({ businessType, businessIdea: businessType, userLanguage: "ru" as const });
  return template.interviewBlocks
    .flatMap((block) => block.questions.map((question) => `${question.label} ${question.question}`))
    .join("\n");
}

const forbiddenManufacturingWording = /производственная линия|сырье|сырьё|выпуск продукции|смена производства|цех|партия|factory|production line|manufacturing|raw materials|batch production/i;

test("inside partner location asks about traffic, agreement and area", () => {
  const text = questionText("Ателье внутри ТЦ");
  assert.match(text, /поток|ТЦ/i);
  assert.match(text, /договор|аренд/i);
  assert.match(text, /площад/i);
  assert.match(text, /заказ|пошив|ремонт одежды|примерк|мастер|средний чек/i);
  assert.doesNotMatch(text, forbiddenManufacturingWording);
});

test("children electric car rental asks about safety, sessions, charging and supervisor", () => {
  const text = questionText("Прокат детских электромобилей внутри ТЦ");
  assert.match(text, /прокат|аренд|единиц|машин/i);
  assert.match(text, /длится|минут|сесс/i);
  assert.match(text, /безопасност/i);
  assert.match(text, /заряд|ремонт|износ/i);
  assert.match(text, /ТЦ|поток|аренд|партнер/i);
  assert.doesNotMatch(text, forbiddenManufacturingWording);
});

test("mobile service asks about service area, visits, travel and transport", () => {
  const text = questionText("Мобильная мойка мягкой мебели");
  assert.match(text, /Зона обслуживания|локац|район/i);
  assert.match(text, /Выездов|заказов/i);
  assert.match(text, /дорог|средний чек|мастер/i);
  assert.match(text, /Транспорт|расходные материалы|реклама|повторные клиенты/i);
  assert.doesNotMatch(text, /food service|кухн|производственная линия|сырье|сырьё|выпуск продукции|factory|production line|manufacturing|raw materials|batch production/i);
});

test("phone repair mobile service asks about repairs, spare parts and warranty", () => {
  const text = questionText("Ремонт телефонов на выезде");
  assert.match(text, /заявк|заказ|выезд|район/i);
  assert.match(text, /ремонт|запчаст|гарант|претенз/i);
  assert.match(text, /мастер|средний чек|время дороги|ответственность/i);
  assert.doesNotMatch(text, forbiddenManufacturingWording);
});
