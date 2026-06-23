import test from "node:test";
import assert from "node:assert/strict";
import { buildChildrenClothingActualPdfText } from "./helpers/pdfText.ts";

test("actual PDF conclusion is specific to the children clothing project", async () => {
  const text = await buildChildrenClothingActualPdfText();
  assert.match(text, /DSCR\s+0\.66/);
  assert.match(text, /EBITDA\s+3,2\s+млн|EBITDA\s+3\.2\s+млн|EBITDA около 3\s+208\s+000/i);
  assert.match(text, /129\s+480\s+000/);
  assert.match(text, /размерн[а-яё]*\s+ряд/i);
  assert.match(text, /сезонн[а-яё]*\s+остат/i);
  assert.match(text, /поставщик/i);
  assert.match(text, /трафик/i);
  assert.doesNotMatch(text, /критичных рисков не выявлено/i);
});
