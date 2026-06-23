import test from "node:test";
import assert from "node:assert/strict";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { calculateInterviewProgress } from "../src/lib/interview/interviewProgress.ts";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import { genericProfile } from "./helpers/systemicFixtures.ts";

function autoService(overrides: Record<string, unknown> = {}) {
  return genericProfile({
    businessType: "Автосервис / СТО",
    category: "services",
    volumeKey: "plannedVolumeMonthly",
    priceKey: "averageServiceTicket",
    overrides: {
      plannedVolumeMonthly: 300,
      averageServiceTicket: 350_000,
      cogsPct: 35,
      creditNeeded: "no",
      needsLeasing: false,
      ...overrides
    }
  });
}

test("leasing questions appear only behind needsLeasing=true and credit flow remains separate", () => {
  const template = resolveTemplateForData(autoService());
  const financing = template.interviewBlocks.find((block) => block.id === "financing");
  assert.ok(financing);
  const leasingQuestions = financing.questions.filter((question) => question.showIf && Object.prototype.hasOwnProperty.call(question.showIf, "needsLeasing"));
  const keys = leasingQuestions.map((question) => question.key);
  for (const key of ["leasingItem", "leasingAssetType", "requestedLeasingAmount", "leasingTermMonths", "leasingAnnualRatePct", "leasingMonthlyPayment", "leasingSupplier", "leasingDocuments", "leasingAssetRevenueImpact"]) {
    assert.ok(keys.includes(key), `${key} missing from leasing flow: ${keys.join(", ")}`);
  }
  assert.ok(financing.questions.some((question) => question.key === "requestedLoanAmount" && question.showIf && Object.prototype.hasOwnProperty.call(question.showIf, "creditNeeded")));
});

test("leasing required fields are enforced only when leasing is selected", () => {
  const withoutLeasing = autoService({ needsLeasing: false });
  const template = resolveTemplateForData(withoutLeasing);
  const progressNo = calculateInterviewProgress({ data: withoutLeasing, template, currentBlockId: "financing", locale: "ru" });
  assert.equal(progressNo.blocks.find((block) => block.blockId === "financing")?.missingRequiredFields.includes("leasingItem"), false);

  const withLeasing = autoService({ needsLeasing: true });
  const progressYes = calculateInterviewProgress({ data: withLeasing, template: resolveTemplateForData(withLeasing), currentBlockId: "financing", locale: "ru" });
  const financing = progressYes.blocks.find((block) => block.blockId === "financing");
  assert.ok(financing?.missingRequiredFields.includes("leasingItem"));
  assert.ok(financing?.missingRequiredFields.includes("requestedLeasingAmount"));
});

test("credit, leasing, credit+leasing and no-debt scenarios affect financial model separately", () => {
  const assumptions = resolveTemplateForData(autoService()).assumptions;
  const noDebt = calculateAll(autoService(), assumptions);
  assert.equal(noDebt.financing.totalMonthlyDebtService, 0);
  assert.equal(noDebt.financing.dscr, null);

  const creditOnly = calculateAll(autoService({ creditNeeded: "yes", requestedLoanAmount: 120_000_000, requestedLoanCurrency: "UZS", requestedLoanUZS: 120_000_000, loanTermMonths: 36, loanAnnualRatePct: 26, loanPurpose: "Оборудование", loanRepaymentType: "annuity" }), assumptions);
  assert.ok(creditOnly.financing.estimatedMonthlyLoanPayment > 0);
  assert.equal(creditOnly.financing.estimatedMonthlyLeasingPayment, 0);

  const leasingOnly = calculateAll(autoService({ needsLeasing: true, leasingItem: "Диагностическое оборудование", leasingAssetType: "equipment", requestedLeasingAmount: 85_000_000, requestedLeasingCurrency: "UZS", leasingTermMonths: 36, leasingAnnualRatePct: 24, leasingMonthlyPayment: 3_300_000 }), assumptions);
  assert.equal(leasingOnly.financing.estimatedMonthlyLoanPayment, 0);
  assert.equal(leasingOnly.financing.estimatedMonthlyLeasingPayment, 3_300_000);
  assert.equal(leasingOnly.financing.totalMonthlyDebtService, 3_300_000);
  assert.ok(leasingOnly.financing.dscr !== null);

  const both = calculateAll(autoService({ creditNeeded: "yes", requestedLoanAmount: 120_000_000, requestedLoanCurrency: "UZS", requestedLoanUZS: 120_000_000, loanTermMonths: 36, loanAnnualRatePct: 26, loanPurpose: "Оборудование", loanRepaymentType: "annuity", needsLeasing: true, leasingItem: "Подъемник", leasingAssetType: "equipment", requestedLeasingAmount: 60_000_000, requestedLeasingCurrency: "UZS", leasingTermMonths: 36, leasingAnnualRatePct: 24, leasingMonthlyPayment: 2_500_000 }), assumptions);
  assert.equal(both.financing.totalMonthlyDebtService, both.financing.estimatedMonthlyLoanPayment + both.financing.estimatedMonthlyLeasingPayment);
});
