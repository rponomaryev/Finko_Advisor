import test from "node:test";
import assert from "node:assert/strict";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import type { SectorAssumptions } from "../src/lib/types/project.ts";

const assumptions: SectorAssumptions = {
  minViableInvestmentUZS: 0,
  recommendedOwnContributionMinPct: 20,
  recommendedOwnContributionMaxPct: 35,
  typicalGrossMarginMinPct: 10,
  typicalGrossMarginMaxPct: 30,
  defaultGrossMarginPct: 25,
  defaultMonthlyFixedCostsUZS: 1_000_000,
  defaultVariableCostPct: 70,
  defaultLoanAnnualRatePct: 26,
  defaultLeasingAnnualRatePct: 24,
  defaultLoanTermMonths: 24,
  defaultLeasingTermMonths: 24,
  defaultWorkingCapitalMonths: 2,
  defaultCertificationCostUZS: 0,
  defaultMoldCostUZS: 0,
  defaultEquipmentCostUZS: 0,
  defaultPremisesSetupCostUZS: 10_000_000,
  defaultPackagingSetupCostUZS: 0,
  defaultInitialInventoryCostUZS: 0,
  defaultExpectedUtilizationPct: 100
};

test("ecommerce interview separates customers from channels and has no duplicate question keys", () => {
  const template = buildDynamicInterviewTemplate({
    businessType: "онлайн-магазин косметики",
    businessIdea: "Онлайн-магазин косметики через Instagram, Telegram и Uzum без физического магазина",
    region: "Ташкент"
  });
  const allQuestions = template.interviewBlocks.flatMap((block) => block.questions);
  const keys = allQuestions.map((question) => question.key);
  assert.equal(new Set(keys).size, keys.length);
  const market = template.interviewBlocks.find((block) => block.id === "sales");
  assert.ok(market);
  const target = market.questions.find((question) => question.key === "targetCustomers");
  const channels = market.questions.find((question) => question.key === "customerAcquisitionChannels");
  assert.ok(target);
  assert.ok(channels);
  assert.ok(!target.options?.includes("instagram"));
  assert.ok(channels.options?.includes("instagram"));
});

test("ecommerce interview asks purchase cost, packaging, delivery and returns", () => {
  const template = buildDynamicInterviewTemplate({ businessType: "онлайн-магазин косметики", businessIdea: "продажи онлайн", region: "Ташкент" });
  const keys = new Set(template.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key)));
  for (const key of ["averagePurchaseCost", "purchasePricesDetail", "packagingCostPerUnit", "directLogisticsCostPerUnit", "returnsPct", "cac"]) {
    assert.ok(keys.has(key), `missing ${key}`);
  }
});

test("online only project does not use default premises repair capex", () => {
  const financial = calculateAll({
    businessType: "онлайн-магазин косметики",
    businessIdea: "онлайн продажи без офлайн помещения",
    region: "Ташкент",
    premisesStatus: "online_only",
    monthlyOrders: 10,
    averageTicket: 100_000,
    averagePurchaseCost: 40_000,
    packagingCostPerUnit: 5_000,
    directLogisticsCostPerUnit: 10_000,
    creditNeeded: "no",
    ownContributionAmount: 1_000_000,
    ownContributionCurrency: "UZS"
  }, assumptions);
  assert.equal(financial.capex.lineItems.find((item) => item.key === "premisesSetupCapex")?.amount, 0);
  assert.equal(financial.cogs.source, "user_input");
  assert.equal(financial.cogs.unitCOGS, 55_000);
});

test("online only ecommerce does not generate premises infrastructure risk", () => {
  const risks = generateRiskMatrix({
    businessType: "онлайн-магазин косметики",
    businessIdea: "онлайн продажи без физического магазина",
    region: "Ташкент",
    premisesStatus: "online_only",
    businessProfile: { category: "ecommerce", subcategory: "cosmetics_ecommerce", operationalModel: "online_only" } as any
  });
  assert.ok(!risks.some((risk) => risk.code === "infrastructure_risk"));
  assert.ok(risks.some((risk) => risk.title === "Склад и фулфилмент"));
});
