import test from "node:test";
import assert from "node:assert/strict";
import { buildChildrenClothingActualPdfText } from "./helpers/pdfText.ts";

test("business profile in actual PDF is retail-clothing specific and user-facing", async () => {
  const text = await buildChildrenClothingActualPdfText();
  assert.match(text, /Категория\s+Розница/);
  assert.match(text, /Подкатегория\s+Магазин детской одежды/);
  assert.match(text, /Единица продажи\s+чек\s*\/\s*покупка/);
  assert.match(text, /поток покупателей|конверсия|средний чек/i);
  assert.doesNotMatch(text, /Профильный показатель/i);
  assert.doesNotMatch(text, /Требуется ручная проверка/i);
  assert.doesNotMatch(text, /обычн\w* сервисн\w* услуг/i);
  assert.doesNotMatch(text, /Специальная лицензия/i);
});
