import test from "node:test";
import assert from "node:assert/strict";
import { buildChildrenClothingActualPdfText } from "./helpers/pdfText.ts";

test("actual PDF documents are deduplicated and retail-clothing specific", async () => {
  const text = await buildChildrenClothingActualPdfText();
  assert.match(text, /Документы и разрешения/);
  assert.match(text, /Онлайн-касса|фискальн|POS/i);
  assert.match(text, /товарн\w* накладн|документы поставщика/i);
  assert.match(text, /обмен|возврат/i);
  assert.match(text, /размерн\w* ряд|состав ткани|маркиров/i);
  assert.doesNotMatch(text, /обычн\w* сервисн\w* услуг/i);
  assert.doesNotMatch(text, /Специальная лицензия\s+НЕ требуется/i);
  assert.doesNotMatch(text, /Регистрация ИП[\s\S]{0,400}Регистрация ООО/i);
  assert.doesNotMatch(text, /Трудовой договор[\s\S]{0,400}Трудовые отношения/i);
});
