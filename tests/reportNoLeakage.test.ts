import test from "node:test";
import assert from "node:assert/strict";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import { calculateBankReadinessScore, calculateFeasibilityScore } from "../src/lib/scoring/scoringService.ts";
import { buildReportData } from "../src/lib/services/reportService.ts";

const cleaningProject = {
  userLanguage: "ru" as const,
  businessType: "Клининговые услуги",
  businessIdea: "Клининг квартир, офисов и B2B договоры в Ташкенте",
  region: "Ташкент город",
  productOrService: "Уборка квартир, офисов и коммерческих помещений",
  cleaningServiceTypes: ["apartment_cleaning", "office_cleaning", "commercial_cleaning"],
  targetCustomers: ["apartments", "offices", "b2b_contracts", "repeat_clients"],
  premisesStatus: "storage_only",
  equipmentCondition: "new",
  cleaningChemicals: ["cleaning_agents", "gloves"],
  dailyOrdersCapacity: 4,
  averageCleaningTicket: 350000,
  ownContributionAmount: 50000000,
  ownContributionCurrency: "UZS" as const,
  creditNeeded: "yes" as const
};

test("cleaning risk matrix does not include auto-service risks", () => {
  const risks = generateRiskMatrix(cleaningProject as any);
  const codes = risks.map((risk) => risk.code);

  assert.equal(codes.some((code) => code.startsWith("auto_service_")), false);
});

test("cleaning report profile does not become auto service", () => {
  const template = buildDynamicInterviewTemplate(cleaningProject);
  const financial = calculateAll(cleaningProject as any, template.assumptions);
  const risks = generateRiskMatrix(cleaningProject as any);
  const report = buildReportData({
    project: cleaningProject as any,
    financial,
    risks,
    feasibilityScore: calculateFeasibilityScore(cleaningProject as any, financial, risks),
    bankReadinessScore: calculateBankReadinessScore(cleaningProject as any, financial, risks)
  });

  assert.equal(report.businessProfile?.subcategory, "cleaning_service");
  assert.notEqual(report.businessProfile?.subcategory, "auto_service");
  assert.equal(JSON.stringify(report.riskMatrix).includes("auto_service_"), false);
});
