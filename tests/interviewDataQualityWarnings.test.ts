import test from "node:test";
import assert from "node:assert/strict";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { calculateInterviewProgress, progressText } from "../src/lib/interview/interviewProgress.ts";
import type { StructuredProjectData } from "../src/lib/types/project.ts";

const project: StructuredProjectData = {
  userLanguage: "ru",
  businessType: "Пекарня у дома",
  businessIdea: "мини-пекарня",
  region: "Ташкент город",
  district: "Юнусабад",
  premisesStatus: "rent",
  kitchenEquipment: "печь",
  dailyCovers: 120,
  averageTicket: 35_000,
  ownContributionAmount: 260_000_000,
  requestedLoanAmount: 100_000_000,
  requestedLoanCurrency: "UZS",
  creditNeeded: "yes",
  loanTermMonths: 36,
  loanAnnualRatePct: 26,
  loanRepaymentType: "annuity",
  loanPurpose: "резерв",
  collateralAvailable: true,
  collateralType: "Cobalt",
  collateralEstimatedValue: 13_000,
  collateralDocumentsAvailable: true,
  needsLeasing: false,
  workingCapitalBufferMonths: 2,
  completedBlockIds: ["financing"]
};

test("required completion and data quality warnings are separate", () => {
  const template = buildDynamicInterviewTemplate(project);
  const progress = calculateInterviewProgress({ data: project, template, currentBlockId: "financing", locale: "ru" });
  const financing = progress.blocks.find((block) => block.blockId === "financing");
  assert.ok(financing);
  assert.equal(financing.missing, 0);
  assert.equal(financing.rawPct, 100);
  assert.equal(financing.status, "has_warnings");
  assert.ok(financing.warnings.some((warning) => warning.code === "suspicious_low_vehicle_collateral"));
  assert.ok(progress.project.missing >= 0);
  assert.equal(progressText("ru").dataQualityWarnings, "есть предупреждения");
});
