import test from "node:test";
import assert from "node:assert/strict";
import { buildChildrenClothingActualPdfText } from "./helpers/pdfText.ts";

test("actual generated PDF for children clothing is clean end-to-end", async () => {
  const text = await buildChildrenClothingActualPdfText();
  assert.match(text, /Месячная выручка[\s\S]{0,80}131\s+040\s+000/);
  assert.match(text, /Годовая выручка[\s\S]{0,80}1\s+572\s+480\s+000/);
  assert.match(text, /Расчётный объем продаж[\s\S]{0,80}728\s+продаж\/мес\./);
  assert.doesNotMatch(text, /728\s+посетителей\/мес\./i);
  assert.doesNotMatch(text, /Профильный показатель|Контрольный числовой показатель|тестовой сборки|Риск\s+требуется проверка|проверкаУровень|требуется проверка/i);
  assert.doesNotMatch(text, /9\s+Низкий/);
  assert.match(text, /Высокий/);
  assert.match(text, /Список источников[\s\S]+\(202\d\)[\s\S]+Доступно по адресу:\s+https?:\/\//);
});
