import test from "node:test";
import assert from "node:assert/strict";
import { calculateBankReadinessScore, calculateFeasibilityScore, getScoreLabel } from "../src/lib/scoring/scoringService.ts";

const project = {
  ownContribution: 250000000,
  requestedLoanAmount: 300000000,
  requestedLeasingAmount: 400000000,
  collateralAvailable: false,
  certificationAwareness: "not_aware",
  equipmentCondition: "used",
  experienceLevel: "medium"
};

const financial = {
  financing: {
    ownContributionPct: 35,
    dscr: 1.45
  },
  profitability: {
    ebitdaMarginPct: 16.5
  }
};

const risks = [
  { level: "high" },
  { level: "medium" },
  { level: "low" }
] as const;

test("scoring services return bounded scores and labels", () => {
  const feasibility = calculateFeasibilityScore(project, financial, risks);
  const bankReadiness = calculateBankReadinessScore(project, financial, risks);

  assert.ok(feasibility >= 0 && feasibility <= 100);
  assert.ok(bankReadiness >= 0 && bankReadiness <= 100);
  assert.equal(getScoreLabel(82), "Высокая готовность");
  assert.equal(getScoreLabel(58), "Требует доработки");
});
