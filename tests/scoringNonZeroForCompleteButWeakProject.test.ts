import test from "node:test";
import assert from "node:assert/strict";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import { calculateBankReadinessScore, calculateFeasibilityScore } from "../src/lib/scoring/scoringService.ts";
import { childrenClothingProfile } from "./helpers/systemicFixtures.ts";

test("complete but financially weak project does not get 0/100", () => {
  const profile = childrenClothingProfile({ loanAnnualRatePct: 26, requestedLoanAmount: 120_000_000 });
  const financial = calculateAll(profile, {} as never);
  const risks = generateRiskMatrix(profile);
  const feasibility = calculateFeasibilityScore(profile, financial, risks);
  const bank = calculateBankReadinessScore(profile, financial, risks);
  assert.ok(feasibility >= 45, `feasibility=${feasibility}`);
  assert.ok(bank >= 40, `bank=${bank}`);
  assert.notEqual(feasibility, 0);
  assert.notEqual(bank, 0);
});
