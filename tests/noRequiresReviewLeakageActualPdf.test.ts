import test from "node:test";
import assert from "node:assert/strict";
import { buildChildrenClothingActualPdfText } from "./helpers/pdfText.ts";

test("actual PDF does not leak requires-review placeholders in user-facing sections", async () => {
  const text = await buildChildrenClothingActualPdfText();
  for (const forbidden of [
    /требуется проверка/i,
    /Требуется ручная проверка/i,
    /requires review/i,
    /manual review required/i,
    /Данные нужно подтвердить/i
  ]) {
    assert.doesNotMatch(text, forbidden);
  }
});
