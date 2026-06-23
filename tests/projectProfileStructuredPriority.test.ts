import test from "node:test";
import assert from "node:assert/strict";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { calculateInterviewProgress } from "../src/lib/interview/interviewProgress.ts";
import { detectInterviewDataQualityWarnings } from "../src/lib/interview/dataQuality.ts";
import { toStructuredProjectData } from "../src/lib/services/projectService.ts";
import type { StructuredProjectData } from "../src/lib/types/project.ts";
import { getProjectProfile } from "../src/lib/utils/projectClient.ts";

const structuredFinance: StructuredProjectData = {
  userLanguage: "ru",
  businessType: "Магазин детской одежды",
  businessIdea: "Офлайн магазин детской одежды в Чиланзаре с Instagram и Telegram продажами",
  region: "Ташкент город",
  district: "Чиланзар",
  productCategories: ["everyday_clothing"],
  operationalModel: "hybrid_offline_online",
  targetCustomerSegments: ["parents"],
  salesChannels: ["walk_in_store", "instagram", "telegram"],
  monthlyCapacity: 900,
  averageTicket: 180_000,
  averagePrice: 180_000,
  premisesStatus: "street_retail_rent",
  equipmentCondition: "used",
  supplierSelected: true,
  certificationAwareness: "aware",
  ownContribution: 220_000_000,
  ownContributionAmount: 220_000_000,
  ownContributionCurrency: "UZS",
  ownContributionUZS: 220_000_000,
  exchangeRateUZSPerUSD: 12_600,
  creditNeeded: "yes",
  requestedLoanAmount: 300_000_000,
  requestedLoanCurrency: "UZS",
  requestedLoanUZS: 300_000_000,
  loanPurpose: "закупка товара, оборудование и оборотный капитал",
  loanTermMonths: 36,
  loanAnnualRatePct: 26,
  loanRepaymentType: "annuity",
  requestedLeasingAmount: 0,
  needsLeasing: false,
  collateralAvailable: true,
  collateralType: "недвижимость",
  collateralEstimatedValue: 500_000_000,
  experienceLevel: "medium",
  completedBlockIds: ["business_idea", "location", "equipment_launch", "operations", "suppliers_procurement", "sales", "financing", "documents_experience"],
  businessProfile: { category: "retail", subcategory: "children_clothing_store", volumeField: "monthlyCapacity", averageTicketField: "averageTicket" } as never
};

const staleScalarProject: Record<string, unknown> = {
  id: "project-with-stale-finance-scalars",
  structuredData: structuredFinance,
  businessType: structuredFinance.businessType,
  businessIdea: structuredFinance.businessIdea,
  region: structuredFinance.region,
  district: structuredFinance.district,
  ownContribution: 0,
  ownContributionAmount: 0,
  ownContributionCurrency: "USD",
  ownContributionUZS: 0,
  exchangeRateUZSPerUSD: 0,
  creditNeeded: "no",
  requestedLoanAmount: 0,
  requestedLoanCurrency: "USD",
  requestedLoanUZS: 0,
  loanPurpose: "",
  loanTermMonths: 0,
  requestedLeasingAmount: 99_000_000,
  collateralAvailable: false,
  collateralType: "",
  collateralEstimatedValue: 0,
  experienceLevel: ""
};

const expectedStructuredValues: Partial<StructuredProjectData> = {
  ownContribution: 220_000_000,
  ownContributionAmount: 220_000_000,
  ownContributionCurrency: "UZS",
  ownContributionUZS: 220_000_000,
  exchangeRateUZSPerUSD: 12_600,
  creditNeeded: "yes",
  requestedLoanAmount: 300_000_000,
  requestedLoanCurrency: "UZS",
  requestedLoanUZS: 300_000_000,
  loanPurpose: "закупка товара, оборудование и оборотный капитал",
  loanTermMonths: 36,
  loanAnnualRatePct: 26,
  loanRepaymentType: "annuity",
  requestedLeasingAmount: 0,
  collateralAvailable: true,
  collateralType: "недвижимость",
  collateralEstimatedValue: 500_000_000
};

test("client and server project profile merge prefer structured finance answers over stale scalar columns", () => {
  for (const [source, profile] of [["client", getProjectProfile(staleScalarProject)], ["server", toStructuredProjectData(staleScalarProject)]] as const) {
    for (const [key, expected] of Object.entries(expectedStructuredValues)) {
      assert.deepEqual((profile as Record<string, unknown>)[key], expected, `${source}: ${key}`);
    }
  }
});

test("completed financing block with stale zero scalar columns is filled and has no false finance warnings", () => {
  const profile = getProjectProfile(staleScalarProject);
  const warnings = detectInterviewDataQualityWarnings(profile).filter((warning) => warning.blockId === "financing");
  const template = buildDynamicInterviewTemplate(profile);
  const financing = calculateInterviewProgress({ data: profile, template, currentBlockId: "financing", locale: "ru" }).blocks.find((block) => block.blockId === "financing");
  assert.deepEqual(warnings.map((warning) => warning.code), []);
  assert.ok(financing);
  assert.equal(financing.missing, 0);
  assert.equal(financing.status, "filled");
});
