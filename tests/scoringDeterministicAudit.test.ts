import test from "node:test";
import assert from "node:assert/strict";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import { calculateBankReadinessScore, calculateFeasibilityScore } from "../src/lib/scoring/scoringService.ts";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import { genericProfile } from "./helpers/systemicFixtures.ts";
import type { StructuredProjectData } from "../src/lib/types/project.ts";

function score(profile: StructuredProjectData & Record<string, unknown>) {
  const assumptions = resolveTemplateForData(profile).assumptions;
  const financial = calculateAll(profile, assumptions);
  const risks = generateRiskMatrix({ ...profile, financialResult: financial } as StructuredProjectData & Record<string, unknown>);
  return {
    financial,
    risks,
    feasibility: calculateFeasibilityScore(profile, financial, risks),
    bank: calculateBankReadinessScore(profile, financial, risks)
  };
}

function base(overrides: Record<string, unknown> = {}) {
  return genericProfile({ businessType: "Автосервис / СТО", category: "services", volumeKey: "plannedVolumeMonthly", priceKey: "averageServiceTicket", overrides: { plannedVolumeMonthly: 700, averageServiceTicket: 350_000, cogsPct: 35, monthlyRent: 12_000_000, ownContributionAmount: 250_000_000, ownContributionUZS: 250_000_000, creditNeeded: "yes", requestedLoanAmount: 120_000_000, requestedLoanCurrency: "UZS", requestedLoanUZS: 120_000_000, loanTermMonths: 36, loanAnnualRatePct: 26, loanPurpose: "Запуск", loanRepaymentType: "annuity", collateralAvailable: true, certificationAwareness: "aware", supplierSelected: true, ...overrides } });
}

test("scoring is deterministic and does not require AI", () => {
  const a = score(base());
  const b = score(base());
  assert.equal(a.feasibility, b.feasibility);
  assert.equal(a.bank, b.bank);
});

test("bad DSCR and funding gap reduce financing readiness", () => {
  const strong = score(base({ requestedLoanAmount: 40_000_000, requestedLoanUZS: 40_000_000, ownContributionAmount: 350_000_000, ownContributionUZS: 350_000_000 }));
  const weakDscr = score(base({ requestedLoanAmount: 450_000_000, requestedLoanUZS: 450_000_000, ownContributionAmount: 250_000_000, ownContributionUZS: 250_000_000 }));
  const gapped = score(base({ creditNeeded: "no", requestedLoanAmount: 0, requestedLoanUZS: 0, ownContributionAmount: 20_000_000, ownContributionUZS: 20_000_000, collateralAvailable: false }));
  assert.ok((weakDscr.financial.financing.dscr ?? 0) < (strong.financial.financing.dscr ?? 99));
  assert.ok(gapped.financial.financing.financingGap > strong.financial.financing.financingGap);
  assert.ok(weakDscr.bank < strong.bank);
  assert.ok(gapped.bank < strong.bank);
});

test("confirmed documents and suppliers improve readiness", () => {
  const poor = score(base({ certificationAwareness: "not_aware", supplierSelected: false, hasAccountantOrConsultant: false }));
  const ready = score(base({ certificationAwareness: "aware", supplierSelected: true, hasAccountantOrConsultant: true, sectionNotes: { finance: "Подтверждены КП, договор аренды, поставщики и документы для банка по проекту автосервиса." } }));
  assert.ok(ready.bank > poor.bank);
});

test("leasing payment affects coverage and planned monthly volume affects revenue and score", () => {
  const noLease = score(base({ needsLeasing: false }));
  const withLease = score(base({ needsLeasing: true, leasingItem: "Подъемник", leasingAssetType: "equipment", requestedLeasingAmount: 90_000_000, requestedLeasingCurrency: "UZS", leasingTermMonths: 36, leasingAnnualRatePct: 24, leasingMonthlyPayment: 3_500_000 }));
  assert.ok(withLease.financial.financing.totalMonthlyDebtService > noLease.financial.financing.totalMonthlyDebtService);
  assert.ok((withLease.financial.financing.dscr ?? 0) < (noLease.financial.financing.dscr ?? 99));

  const lowVolume = score(base({ plannedVolumeMonthly: 120 }));
  const highVolume = score(base({ plannedVolumeMonthly: 420 }));
  assert.ok(highVolume.financial.revenue.monthlyRevenue > lowVolume.financial.revenue.monthlyRevenue);
  assert.ok(highVolume.feasibility >= lowVolume.feasibility);
});
