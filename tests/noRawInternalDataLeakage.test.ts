import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeUserFacingTextareaValue } from "../src/lib/i18n/userFacingSanitizer.ts";

test("textarea sanitizer extracts human section note and removes raw internal data", () => {
  const raw = 'staffPlan: {"roles":[{"id":"cc0e46cf-5bd4-41c3-b856-8be7849e79a3","role":"Пекарь"}],"exchangeRateSnapshot":{"rate":12012.12}}; qualityControlPlan: true; sectionNotes.productionCapacity: Пекарня работает с 07:00 до 21:00. Плановая мощность — 120 заказов в день.; sample_neighborhood_bakery_operations_capacity_unit_process: Реалистичная мощность.';
  const clean = sanitizeUserFacingTextareaValue(raw, { fieldKey: "sectionNotes.productionCapacity", locale: "ru" });
  assert.match(clean, /Пекарня работает/);
  assert.doesNotMatch(clean, /staffPlan|exchangeRateSnapshot|sectionNotes|sample_neighborhood|__money|cc0e46cf/);
});

test("report sanitizer removes placeholder chains", () => {
  const clean = sanitizeUserFacingTextareaValue("показатель статистика показатель показатель показатель", { locale: "ru" });
  assert.doesNotMatch(clean, /показатель\s+показатель/);
  assert.match(clean, /Официальная статистика|Требуется ручная проверка/);
});
