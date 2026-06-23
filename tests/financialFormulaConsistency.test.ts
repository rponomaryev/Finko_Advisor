import assert from "node:assert/strict";
import test from "node:test";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";

function sumAmounts(items: Array<{ amount: number }>) {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

test("financial formulas stay internally consistent for a dynamic service business", () => {
  const project: any = {
    businessType: "Выездная служба диагностики энергоэффективности зданий",
    businessIdea: "Выездная диагностика энергоэффективности квартир, офисов, кафе, ресторанов, гостиниц и небольших производственных помещений.",
    region: "Ташкентская область",
    userLanguage: "ru",
    monthlyCapacity: 75,
    averagePrice: 35_000_000,
    utilizationRatePct: 60,
    equipmentCapex: 154_000_000,
    premisesSetupCapex: 44_000_000,
    trainingLaunchCapex: 220_000_000,
    firstMonthRawMaterialStockUZS: 45_000_000,
    staffPlan: {
      roles: [
        { role: "Специалист", count: 17, monthlySalaryAmount: 6_000_000 },
        { role: "Оператор", count: 2, monthlySalaryAmount: 5_000_000 },
        { role: "Маркетолог", count: 1, monthlySalaryAmount: 8_000_000 },
        { role: "Бухгалтер", count: 1, monthlySalaryAmount: 7_000_000 }
      ]
    },
    ownContributionAmount: 650_000_000,
    ownContributionCurrency: "UZS",
    creditNeeded: "yes",
    requestedLoanAmount: 100_000_000,
    requestedLoanCurrency: "UZS",
    loanTermMonths: 46,
    loanAnnualRatePct: 26,
    loanPurpose: "Оборудование",
    workingCapitalBufferMonths: 3
  };

  const template = buildDynamicInterviewTemplate(project);
  const f = calculateAll(project, template.assumptions);

  assert.equal(f.revenue.effectiveUnits, Math.round(f.revenue.monthlyCapacity * f.revenue.expectedUtilizationPct / 100));
  assert.equal(f.revenue.monthlyRevenue, Math.round(f.revenue.monthlyCapacity * f.revenue.averagePrice * f.revenue.expectedUtilizationPct / 100));
  assert.equal(f.revenue.annualRevenue, f.revenue.monthlyRevenue * 12);

  assert.equal(f.cogs.wasteAdjustedUnitCOGS, Math.round(f.cogs.unitCOGS * (1 + f.cogs.wasteAllowancePct / 100)));
  assert.equal(f.cogs.monthlyCOGS, Math.round(f.revenue.effectiveUnits * f.cogs.wasteAdjustedUnitCOGS));

  assert.equal(f.capex.initialInventoryCost, 45_000_000);
  assert.equal(f.workingCapital.initialInventory, 0);

  assert.equal(f.opex.monthlyFixedOpex, sumAmounts(f.opex.lineItems));
  assert.equal(f.workingCapital.requiredWorkingCapital, Math.round(
    f.workingCapital.monthlyFixedCosts * f.workingCapital.bufferMonths
    + f.workingCapital.initialInventory
    + f.workingCapital.accountsReceivableBuffer
    - f.workingCapital.accountsPayableBuffer
    + f.workingCapital.seasonalStockBuffer
  ));

  assert.equal(f.financing.totalInvestmentNeed, f.capex.totalCapEx + f.workingCapital.requiredWorkingCapital);
  assert.equal(f.financing.availableFunding, f.financing.ownContributionUZS + f.financing.loanRequired + f.financing.leasingRequired + f.financing.grants + f.financing.otherFunding);
  assert.equal(f.financing.financingGap, Math.max(f.financing.totalInvestmentNeed - f.financing.availableFunding, 0));

  assert.equal(f.profitability.monthlyGrossProfit, f.revenue.monthlyRevenue - f.cogs.monthlyCOGS);
  assert.equal(f.profitability.monthlyEBITDA, f.profitability.monthlyGrossProfit - f.opex.monthlyFixedOpex);
  assert.equal(f.profitability.monthlyNetCashFlow, f.profitability.monthlyEBITDA - f.financing.totalMonthlyDebtService);
  if (f.financing.totalMonthlyDebtService > 0) {
    assert.equal(f.financing.dscr, Math.round((f.profitability.monthlyEBITDA / f.financing.totalMonthlyDebtService) * 100) / 100);
  }
  if (f.profitability.monthlyNetCashFlow > 0) {
    assert.equal(f.profitability.paybackMonths, Math.ceil(f.financing.totalInvestmentNeed / f.profitability.monthlyNetCashFlow));
  }
});
