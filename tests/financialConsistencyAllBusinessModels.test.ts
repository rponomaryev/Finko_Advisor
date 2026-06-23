import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { businessSamples } from "../src/lib/data/businessSamples/businessSamples.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import { calculateBankReadinessScore, calculateFeasibilityScore } from "../src/lib/scoring/scoringService.ts";
import type { StructuredProjectData } from "../src/lib/types/project.ts";

function baseProject(businessType: string): StructuredProjectData {
  return {
    userLanguage: "ru",
    businessType,
    businessIdea: `${businessType}: запуск проекта с понятным продуктом, клиентами, продажами, расходами и подтверждением спроса.`,
    region: "Ташкент город",
    district: "Юнусабад",
    monthlyCapacity: 1200,
    averagePrice: 60000,
    salesUnitLabel: "заказов/мес.",
    utilizationRatePct: 70,
    rawMaterialCostPerUnit: 24000,
    workingDaysPerMonth: 26,
    premisesStatus: "rent",
    monthlyRent: 5000000,
    equipmentCondition: "mixed",
    equipmentCapex: 70000000,
    premisesSetupCapex: 30000000,
    ownContributionAmount: 180000000,
    ownContributionCurrency: "UZS",
    creditNeeded: "no",
    needsLeasing: false,
    certificationAwareness: "aware",
    supplierSelected: true,
    hasBuyerAgreements: true,
    experienceLevel: "medium",
    staffPlan: {
      roles: [
        { role: "Специалист", count: 2, monthlySalaryAmount: 5000000, monthlySalaryCurrency: "UZS" }
      ]
    }
  };
}

function assertFiniteFinancials(financial: ReturnType<typeof calculateAll>, label: string) {
  const values = [
    financial.revenue.monthlyCapacity,
    financial.revenue.effectiveUnits,
    financial.revenue.monthlyRevenue,
    financial.cogs.monthlyCOGS,
    financial.profitability.monthlyGrossProfit,
    financial.profitability.monthlyEBITDA,
    financial.capex.totalCapEx,
    financial.workingCapital.requiredWorkingCapital,
    financial.financing.totalInvestmentNeed,
    financial.financing.financingGap,
    financial.financing.totalMonthlyDebtService,
    financial.profitability.monthlyNetCashFlow
  ];
  for (const value of values) {
    assert.equal(Number.isFinite(value), true, `${label}: non-finite financial value ${value}`);
  }
  assert.ok(financial.revenue.monthlyRevenue > 0, `${label}: revenue must be positive`);
  assert.ok(financial.cogs.monthlyCOGS >= 0, `${label}: COGS must not be negative`);
  assert.ok(financial.financing.totalInvestmentNeed > 0, `${label}: investment need must be calculated`);
  assert.ok(financial.formulaRows.some((row) => /выручка/i.test(row.indicator) && row.substitution.includes("×")), `${label}: revenue formula row is missing`);
}

test("all 120 samples calculate a finite financial model without monthly volume double multiplication", () => {
  assert.equal(businessSamples.length, 120);
  const commonAssumptions = buildDynamicInterviewTemplate(baseProject("Типовой бизнес")).assumptions;
  for (const [index, sample] of businessSamples.entries()) {
    const project = baseProject(sample.label.ru);
    const financial = calculateAll(project, commonAssumptions);
    assertFiniteFinancials(financial, sample.id);
    assert.equal(financial.revenue.monthlyCapacity, 1200, `${sample.id}: explicit monthlyCapacity must not be multiplied by working days`);
    assert.equal(financial.revenue.monthlyRevenue, Math.round(1200 * 60000 * 0.7), `${sample.id}: monthly revenue formula mismatch`);
    if (index < 5) {
      const risks = generateRiskMatrix(project);
      const feasibility = calculateFeasibilityScore(project, financial, risks);
      const bank = calculateBankReadinessScore(project, financial, risks);
      assert.ok(feasibility >= 0 && feasibility <= 100, `${sample.id}: feasibility out of range`);
      assert.ok(bank >= 0 && bank <= 100, `${sample.id}: bank readiness out of range`);
    }
  }
});

const categoryScenarios: Array<{ name: string; project: StructuredProjectData; expectedRevenue: number; expectedCapacity?: number; expectedMode?: string }> = [
  {
    name: "food service daily orders",
    project: { ...baseProject("Мини-пекарня"), monthlyCapacity: undefined, dailyCovers: 120, averageTicket: 35000, foodCostPct: 35, utilizationRatePct: 65 },
    expectedRevenue: 70980000,
    expectedCapacity: 3120,
    expectedMode: "percent_of_revenue"
  },
  {
    name: "retail daily traffic conversion",
    project: { ...baseProject("Магазин детской одежды"), monthlyCapacity: undefined, traffic: 80, conversion: 45, averageTicket: 120000, utilizationRatePct: 100, rawMaterialCostPerUnit: 70000 },
    expectedRevenue: 80 * 26 * 45 / 100 * 120000,
    expectedCapacity: 936
  },
  {
    name: "ecommerce monthly orders",
    project: { ...baseProject("Интернет-магазин одежды"), monthlyCapacity: undefined, monthlyOrders: 900, averageTicket: 110000, utilizationRatePct: 100, marketplaceCommissionPerUnit: 6000, directLogisticsCostPerUnit: 9000, rawMaterialCostPerUnit: 55000 },
    expectedRevenue: 99000000,
    expectedCapacity: 900
  },
  {
    name: "auto service daily capacity",
    project: { ...baseProject("СТО для легковых авто"), monthlyCapacity: undefined, dailyServiceCapacity: 5, averageServiceTicket: 350000, utilizationRatePct: 58, rawMaterialCostPerUnit: 160000 },
    expectedRevenue: Math.round(5 * 26 * 350000 * 0.58),
    expectedCapacity: 130
  },
  {
    name: "beauty salon daily specialists capacity",
    project: { ...baseProject("Салон красоты"), monthlyCapacity: undefined, dailyServiceCapacity: 18, averageServiceTicket: 90000, utilizationRatePct: 70, rawMaterialCostPerUnit: 18000 },
    expectedRevenue: Math.round(18 * 26 * 90000 * 0.7),
    expectedCapacity: 468
  },
  {
    name: "cleaning service daily orders",
    project: { ...baseProject("Клининговая компания"), monthlyCapacity: undefined, dailyOrdersCapacity: 4, averageCleaningTicket: 450000, utilizationRatePct: 75, rawMaterialCostPerUnit: 90000 },
    expectedRevenue: Math.round(4 * 26 * 450000 * 0.75),
    expectedCapacity: 104
  },
  {
    name: "manufacturing monthly output",
    project: { ...baseProject("Мебельная мастерская"), monthlyCapacity: undefined, monthlyOutputCapacity: 55, averagePrice: 2400000, utilizationRatePct: 80, rawMaterialCostPerUnit: 1250000 },
    expectedRevenue: Math.round(55 * 2400000 * 0.8),
    expectedCapacity: 55
  },
  {
    name: "equipment import monthly units",
    project: { ...baseProject("импорт оборудования для малого бизнеса"), monthlyCapacity: 24, averagePrice: 9000000, utilizationRatePct: 80, rawMaterialCostPerUnit: 6200000, rawMaterialSource: "import", foreignCurrencyPurchases: true },
    expectedRevenue: Math.round(24 * 9000000 * 0.8),
    expectedCapacity: 24
  },
  {
    name: "equipment rental monthly contracts",
    project: { ...baseProject("прокат строительного инструмента"), monthlyCapacity: undefined, rentalOrdersPerMonth: 160, averageRentalTicket: 180000, utilizationRatePct: 75, rawMaterialCostPerUnit: 25000 },
    expectedRevenue: Math.round(160 * 180000 * 0.75),
    expectedCapacity: 160
  },
  {
    name: "education monthly students",
    project: { ...baseProject("Учебный центр английского языка"), monthlyCapacity: 180, averagePrice: 550000, utilizationRatePct: 85, rawMaterialCostPerUnit: 80000 },
    expectedRevenue: Math.round(180 * 550000 * 0.85),
    expectedCapacity: 180
  },
  {
    name: "healthcare monthly visits",
    project: { ...baseProject("медицинский кабинет анализов"), monthlyCapacity: 650, averagePrice: 120000, utilizationRatePct: 75, rawMaterialCostPerUnit: 45000, certificationAwareness: "aware" },
    expectedRevenue: Math.round(650 * 120000 * 0.75),
    expectedCapacity: 650
  }
];

test("category regression scenarios keep revenue, cost, debt and warning formulas consistent", () => {
  for (const scenario of categoryScenarios) {
    const template = buildDynamicInterviewTemplate(scenario.project);
    const financial = calculateAll(scenario.project, template.assumptions);
    assertFiniteFinancials(financial, scenario.name);
    if (scenario.expectedCapacity !== undefined) assert.equal(financial.revenue.monthlyCapacity, scenario.expectedCapacity, scenario.name);
    assert.equal(financial.revenue.monthlyRevenue, scenario.expectedRevenue, scenario.name);
    if (scenario.expectedMode) assert.equal(financial.cogs.calculationMode, scenario.expectedMode, scenario.name);
    assert.equal(financial.revenue.effectiveUnits, Math.round(financial.revenue.monthlyCapacity * financial.revenue.expectedUtilizationPct / 100), scenario.name);
    assert.equal(financial.profitability.monthlyGrossProfit, Math.round(financial.revenue.monthlyRevenue - financial.cogs.monthlyCOGS), scenario.name);
    assert.equal(financial.financing.dscr, null, `${scenario.name}: no debt should produce unavailable DSCR`);
    assert.ok(financial.warnings.every((warning) => !/NaN|Infinity/.test(JSON.stringify(warning))), scenario.name);
  }
});

test("monthly capacity and daily capacity are treated as distinct units", () => {
  const monthlyProject: StructuredProjectData = {
    ...baseProject("Мини-пекарня"),
    businessProfile: { category: "food_service", subcategory: "neighborhood_bakery", confidence: 0.9, volumeField: "monthlyCapacity", capacityUnit: "bakery_sales_per_day" } as any,
    monthlyCapacity: 5000,
    averageTicket: 35000,
    utilizationRatePct: 65
  };
  const monthly = calculateAll(monthlyProject, buildDynamicInterviewTemplate(monthlyProject).assumptions);
  assert.equal(monthly.revenue.monthlyCapacity, 5000);
  assert.equal(monthly.revenue.monthlyRevenue, 113750000);
  assert.notEqual(monthly.revenue.monthlyCapacity, 130000);

  const dailyProject: StructuredProjectData = { ...baseProject("Мини-пекарня"), monthlyCapacity: undefined, dailyCovers: 120, averageTicket: 35000, utilizationRatePct: 65 };
  const daily = calculateAll(dailyProject, buildDynamicInterviewTemplate(dailyProject).assumptions);
  assert.equal(daily.revenue.monthlyCapacity, 3120);
  assert.equal(daily.revenue.monthlyRevenue, 70980000);
});
