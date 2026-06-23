import test from "node:test";
import assert from "node:assert/strict";
import { buildChildrenClothingActualPdfText } from "./helpers/pdfText.ts";


test("actual PDF references are from the selected used source pack", async () => {
  const text = await buildChildrenClothingActualPdfText();
  const references = text.slice(text.indexOf("Список источников"));
  assert.match(references, /stat\.uz/);
  assert.match(references, /cbu\.uz|soliq\.uz|my\.gov\.uz|lex\.uz/);
  assert.match(references, /\(202\d\).*Доступно по адресу:\s+https?:\/\//s);
  assert.doesNotMatch(references, /\|/);
  assert.doesNotMatch(references, /Контрольный числовой показатель|тестовой сборки|fake|synthetic|требуется проверка/i);
});
