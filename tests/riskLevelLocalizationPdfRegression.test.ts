import test from "node:test";
import assert from "node:assert/strict";
import { formatRiskLevel, normalizeRiskLevel } from "../src/lib/risk/riskScoring.ts";
import { buildChildrenClothingActualPdfText } from "./helpers/pdfText.ts";

test("localized risk levels normalize consistently for PDF/web/Excel", () => {
  assert.equal(normalizeRiskLevel("высокий", 9), "high");
  assert.equal(formatRiskLevel("высокий", "ru", 9), "Высокий");
  assert.equal(formatRiskLevel("средний", "ru", 6), "Средний");
  assert.equal(formatRiskLevel("низкий", "ru", 2), "Низкий");
  assert.equal(formatRiskLevel("unknown-localized", "ru", 9), "Высокий");
});

test("actual PDF renders score 9 localized high level, not low", async () => {
  const text = await buildChildrenClothingActualPdfText();
  assert.match(text, /Высокий/);
  assert.doesNotMatch(text, /9\s+Низкий/);
});
