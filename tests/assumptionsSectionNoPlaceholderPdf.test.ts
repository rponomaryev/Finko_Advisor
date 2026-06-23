import test from "node:test";
import assert from "node:assert/strict";
import { buildChildrenClothingActualPdfText } from "./helpers/pdfText.ts";

test("actual PDF assumptions section has meaningful labels", async () => {
  const text = await buildChildrenClothingActualPdfText();
  assert.match(text, /Неподтверждённые данные/);
  assert.match(text, /Официальные показатели/);
  assert.match(text, /Финансовые допущения/);
  assert.doesNotMatch(text, /Допущения и пробелы в данных[\s\S]{0,300}требуется проверка/i);
});
