import test from "node:test";
import assert from "node:assert/strict";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import { calculateBankReadinessScore, calculateFeasibilityScore } from "../src/lib/scoring/scoringService.ts";
import { generateFallbackReport } from "../src/lib/report/aiReportGenerator.ts";
import { childrenClothingProfile } from "./helpers/systemicFixtures.ts";

test("fallback AI analysis for children clothing is specific and clean", () => {
  const profile = childrenClothingProfile();
  const financial = calculateAll(profile, {} as never);
  const risks = generateRiskMatrix(profile);
  const feasibilityScore = calculateFeasibilityScore(profile, financial, risks);
  const bankReadinessScore = calculateBankReadinessScore(profile, financial, risks);
  const report = generateFallbackReport({ project: profile, financial, risks, feasibilityScore, bankReadinessScore, locale: "ru" });
  const text = Object.values(report).join("\n");
  assert.match(text, /131\s?040\s?000|131 040 000/);
  assert.match(text, /EBITDA|DSCR|разрыв|первая закуп|размер/i);
  assert.doesNotMatch(text, /требуется проверка|undefined|null|https?:\/\//i);
});
