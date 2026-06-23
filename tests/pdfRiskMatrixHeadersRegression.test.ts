import test from "node:test";
import assert from "node:assert/strict";
import { buildChildrenClothingActualPdfText } from "./helpers/pdfText.ts";

test("actual Russian PDF uses localized readable risk matrix headers", async () => {
  const text = await buildChildrenClothingActualPdfText();
  assert.match(text, /Вероятность/);
  assert.match(text, /Влияние/);
  assert.match(text, /Балл/);
  assert.match(text, /Уровень/);
  assert.doesNotMatch(text, /Риск\s+требуется\s+проверка\s+требуется\s+проверка/i);
  assert.doesNotMatch(text, /проверкаУровень/i);
  assert.doesNotMatch(text, /\bP\b\s+\bI\b/);
});
