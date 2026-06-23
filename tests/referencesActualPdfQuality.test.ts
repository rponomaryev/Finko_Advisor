import test from "node:test";
import assert from "node:assert/strict";
import { buildChildrenClothingActualPdfText } from "./helpers/pdfText.ts";

test("actual PDF references are Harvard-like and placeholder-free", async () => {
  const text = await buildChildrenClothingActualPdfText();
  const references = text.slice(text.indexOf("Список источников"));
  assert.match(references, /Список источников/);
  assert.match(references, /\(202\d\).*Доступно по адресу:\s+https?:\/\/.*дата обращения:/s);
  assert.match(references, /stat\.uz|cbu\.uz|soliq\.uz|lex\.uz|my\.gov\.uz/i);
  assert.doesNotMatch(references, /\|/);
  assert.doesNotMatch(references, /требуется проверка|Контрольный|тестов|unknown author|unknown title/i);
});
