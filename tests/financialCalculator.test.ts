import test from "node:test";
import assert from "node:assert/strict";
import { calculateAll, calculateLoanRepaymentSchedule, calculateMonthlyPayment } from "../src/lib/calculator/financialCalculator.ts";
import { buildGenericBusinessTemplate } from "../src/lib/data/sectorTemplates/genericBusinessTemplate.ts";
import type { StructuredProjectData } from "../src/lib/types/project.ts";

test("annuity payment returns zero for empty principal", () => {
  assert.equal(calculateMonthlyPayment(0, 26, 36), 0);
});

test("annuity schedule uses PMT and constant monthly payment", () => {
  const schedule = calculateLoanRepaymentSchedule(100_000_000, 24, 36, "annuity");
  assert.equal(schedule.firstPayment, 3_923_285);
  assert.equal(schedule.lastPayment, 3_923_285);
  assert.equal(schedule.averagePayment, 3_923_285);
  assert.equal(schedule.debtServiceForDscr, 3_923_285);
  assert.equal(schedule.totalInterest, 41_238_260);
});

test("differentiated schedule repays equal principal and declining interest", () => {
  const schedule = calculateLoanRepaymentSchedule(100_000_000, 24, 36, "equal_principal");
  assert.equal(schedule.firstPayment, 4_777_778);
  assert.equal(schedule.lastPayment, 2_833_333);
  assert.equal(schedule.averagePayment, 3_805_556);
  assert.equal(schedule.maxPayment, schedule.firstPayment);
  assert.equal(schedule.debtServiceForDscr, schedule.firstPayment);
  assert.equal(schedule.totalInterest, 37_000_000);
  assert.equal(schedule.totalRepayment, 137_000_000);
});

test("loan schedule handles zero interest, one month and grace period", () => {
  const oneMonth = calculateLoanRepaymentSchedule(100_000_000, 0, 1, "annuity");
  assert.equal(oneMonth.firstPayment, 100_000_000);
  assert.equal(oneMonth.totalInterest, 0);

  const grace = calculateLoanRepaymentSchedule(100_000_000, 24, 36, "equal_principal", 3);
  assert.equal(grace.gracePeriodMonths, 3);
  assert.equal(grace.repaymentMonths, 33);
  assert.equal(grace.firstPayment, 5_030_303);
  assert.equal(grace.totalInterest, 40_000_000);
});

function baseProject(overrides: Partial<StructuredProjectData> = {}): StructuredProjectData {
  return {
    businessType: "Кофейня",
    monthlyCapacity: 2_800,
    salesUnitLabel: "заказов/мес.",
    averagePrice: 28_000,
    ownContributionAmount: 120_000_000,
    ownContributionCurrency: "UZS",
    creditNeeded: "yes",
    requestedLoanAmount: 180_000_000,
    requestedLoanCurrency: "UZS",
    requestedLoanUZS: 180_000_000,
    loanPurpose: "Оборудование",
    loanTermMonths: 36,
    loanAnnualRatePct: 24,
    requestedLeasingAmount: 0,
    equipmentCondition: "new",
    premisesStatus: "rent",
    ...overrides
  };
}

test("financial calculator builds a generic business financial model", () => {
  const template = buildGenericBusinessTemplate("Кофейня");
  const result = calculateAll(baseProject({ loanAnnualRatePct: undefined }), template.assumptions);

  assert.equal(result.revenue.monthlyCapacity, 2_800);
  assert.equal(result.revenue.unitLabel, "заказов/мес.");
  assert.equal(result.revenue.averagePrice, 28_000);
  assert.equal(result.revenue.expectedUtilizationPct, 100);
  assert.equal(result.revenue.effectiveUnits, 2_800);
  assert.equal(result.revenue.monthlyRevenue, 78_400_000);
  assert.equal(result.capex.moldCost, 0);
  assert.equal(result.workingCapital.requiredWorkingCapital, 77_520_000);
  assert.equal(result.financing.loanRequired, 180_000_000);
  assert.equal(result.financing.leasingRequired, 0);
  assert.ok(result.financing.dscr !== null);
  assert.equal(result.financing.loanAnnualRateSource, "assumption");
  assert.equal(result.warnings.some((warning) => warning.code === "loan_rate_assumption"), true);

  const conservative = calculateAll(baseProject({ loanAnnualRatePct: undefined, utilizationRatePct: 65 }), template.assumptions);
  assert.equal(conservative.revenue.expectedUtilizationPct, 65);
  assert.equal(conservative.revenue.effectiveUnits, 1_820);
  assert.equal(conservative.revenue.monthlyRevenue, 50_960_000);
});

test("loan and leasing terms are transparent when user provides rates", () => {
  const template = buildGenericBusinessTemplate("Кофейня");
  const result = calculateAll(
    baseProject({
      monthlyCapacity: 3_000,
      averagePrice: 30_000,
      ownContributionAmount: 200_000_000,
      requestedLoanAmount: 100_000_000,
      requestedLoanUZS: 100_000_000,
      loanRepaymentType: "annuity",
      needsLeasing: true,
      requestedLeasingAmount: 50_000_000,
      requestedLeasingCurrency: "UZS",
      leasingTermMonths: 24,
      leasingAnnualRatePct: 22
    }),
    template.assumptions
  );

  assert.equal(result.financing.loanAnnualRatePct, 24);
  assert.equal(result.financing.loanAnnualRateSource, "user_input");
  assert.equal(result.financing.leasingAnnualRateSource, "user_input");
  assert.equal(result.warnings.some((warning) => warning.code === "loan_rate_assumption"), false);
});

test("DSCR uses the conservative maximum payment for differentiated loans", () => {
  const template = buildGenericBusinessTemplate("Кофейня");
  const result = calculateAll(baseProject({ loanRepaymentType: "equal_principal" }), template.assumptions);

  assert.equal(result.financing.estimatedMonthlyLoanPayment, result.financing.loanFirstPayment);
  assert.equal(result.financing.totalMonthlyDebtService, result.financing.loanMaxPayment);
  assert.ok(result.financing.loanFirstPayment > result.financing.loanLastPayment);
});
