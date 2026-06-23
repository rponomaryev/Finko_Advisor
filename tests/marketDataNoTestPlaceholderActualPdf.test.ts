import test from "node:test";
import assert from "node:assert/strict";
import { buildChildrenClothingActualPdfText } from "./helpers/pdfText.ts";

test("actual PDF market data has no test placeholders or fake numeric indicators", async () => {
  const text = await buildChildrenClothingActualPdfText();
  assert.doesNotMatch(text, /Контрольный числовой показатель/i);
  assert.doesNotMatch(text, /тестовой сборки/i);
  assert.doesNotMatch(text, /1\s*000\s*000\s*000\s*UZS/i);
  assert.doesNotMatch(text, /\b450[,.]5\b/);
  assert.match(text, /Оценка локального спроса/i);
  assert.match(text, /числовые данные/i);
  assert.match(text, /найдены/i);
  assert.match(text, /По выбранному региону\s+не/i);
});
