import test from "node:test";
import assert from "node:assert/strict";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { calculateInterviewProgress, calculateScreenProgress } from "../src/lib/interview/interviewProgress.ts";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { buildReportData } from "../src/lib/services/reportService.ts";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import type { StructuredProjectData } from "../src/lib/types/project.ts";

const bakeryBase: StructuredProjectData = {
  userLanguage: "ru",
  businessType: "Мини-пекарня",
  businessIdea: "Мини-пекарня с собственной точкой продаж в жилом районе",
  region: "Ташкент город",
  district: "Юнусабад",
  dailyCovers: 120,
  averageTicket: 35_000,
  utilizationRatePct: 65,
  foodCostPct: 35,
  workingDaysPerMonth: 26,
  ownContributionAmount: 350_000_000,
  ownContributionCurrency: "UZS",
  creditNeeded: "yes",
  requestedLoanAmount: 150_000_000,
  requestedLoanCurrency: "UZS",
  loanTermMonths: 48,
  loanAnnualRatePct: 26,
  loanPurpose: "оборудование и запуск"
};

function templateFor(data: StructuredProjectData) {
  return buildDynamicInterviewTemplate(data);
}

test("project progress separates current screen, block and whole interview", () => {
  const template = templateFor(bakeryBase);
  const salesBlock = template.interviewBlocks.find((block) => block.id === "sales");
  assert.ok(salesBlock);
  const screenQuestions = salesBlock.questions.filter((question) => ["dailyCovers", "averageTicket"].includes(question.key));
  const screen = calculateScreenProgress({ questions: screenQuestions, data: bakeryBase, requiredQuestionKeys: screenQuestions.map((question) => question.key) });
  const progress = calculateInterviewProgress({ data: { ...bakeryBase, completedBlockIds: ["business_idea", "location", "equipment_launch", "operations", "suppliers_procurement"] }, template, currentBlockId: "sales" });
  const sales = progress.blocks.find((block) => block.blockId === "sales");
  assert.equal(screen.pct, 100);
  assert.ok(sales);
  assert.ok(sales.pct < 100);
  assert.ok(progress.project.pct < 100);
});

test("locked blocks are not displayed as OK or completed", () => {
  const data: StructuredProjectData = {
    ...bakeryBase,
    completedBlockIds: ["business_idea", "location", "equipment_launch", "operations", "suppliers_procurement", "sales"],
    interviewCursorBlockId: "sales"
  };
  const progress = calculateInterviewProgress({ data, template: templateFor(data), currentBlockId: "sales" });
  const financing = progress.blocks.find((block) => block.blockId === "financing");
  const docs = progress.blocks.find((block) => block.blockId === "documents_experience");
  assert.equal(financing?.status, "locked");
  assert.equal(docs?.status, "locked");
  assert.notEqual(financing?.label, "OK");
  assert.ok(progress.project.pct < 100);
});

test("all required fields with a critical warning do not produce OK status", () => {
  const data: StructuredProjectData = { ...bakeryBase, dailyCovers: 2, completedBlockIds: ["sales"] };
  const progress = calculateInterviewProgress({ data, template: templateFor(data), currentBlockId: "sales" });
  const sales = progress.blocks.find((block) => block.blockId === "sales");
  assert.equal(sales?.status, "has_warnings");
  assert.ok((sales?.warnings ?? []).some((warning) => warning.code === "low_daily_orders"));
  assert.ok((sales?.pct ?? 100) < 100);
});

test("saved incomplete section is not reported as fully filled", () => {
  const data: StructuredProjectData = {
    userLanguage: "ru",
    businessType: "Мини-пекарня",
    businessIdea: "Мини-пекарня",
    completedBlockIds: ["sales"],
    dailyCovers: 120
  };
  const progress = calculateInterviewProgress({ data, template: templateFor(data), currentBlockId: "sales" });
  const sales = progress.blocks.find((block) => block.blockId === "sales");
  assert.notEqual(sales?.status, "filled");
  assert.ok((sales?.pct ?? 100) < 100);
});

test("bakery 120 orders per day and 35% cost model are calculated from current data", () => {
  const template = templateFor(bakeryBase);
  const financial = calculateAll(bakeryBase, template.assumptions);
  assert.equal(financial.revenue.displayVolume, 120);
  assert.equal(financial.revenue.displayVolumeMonthlyEquivalent, 3120);
  assert.equal(financial.revenue.effectiveUnits, 2028);
  assert.equal(financial.revenue.monthlyRevenue, 70_980_000);
  assert.equal(financial.cogs.calculationMode, "percent_of_revenue");
  assert.equal(financial.cogs.monthlyCOGS, 24_843_000);
  assert.ok(!financial.formulaRows.some((row) => /52\s+заказов|1\s*183\s*000/.test(`${row.substitution} ${row.result}`)));
});

test("leasing selected with missing amount is incomplete, not not-applicable", () => {
  const project: StructuredProjectData = { ...bakeryBase, needsLeasing: true, requestedLeasingAmount: undefined, leasingTermMonths: undefined, leasingItem: undefined };
  const template = templateFor(project);
  const financial = calculateAll(project, template.assumptions);
  assert.equal(financial.financing.leasingSelected, true);
  assert.equal(financial.financing.leasingTermsIncomplete, true);
  assert.ok(financial.warnings.some((warning) => warning.code === "leasing_terms_missing"));
  const risks = generateRiskMatrix(project);
  const reportData = buildReportData({ project: { ...project, title: "Мини-пекарня" }, financial, risks, feasibilityScore: 40, bankReadinessScore: 30 });
  assert.ok((reportData.keyFigures ?? []).some((row) => row[0] === "Сумма лизинга" && /Лизинг выбран/.test(row[2])));
  const exportData = prepareReportExport({ id: "leasing-missing", title: "Мини-пекарня", status: "calculated", businessType: project.businessType, userLanguage: "ru", structuredData: project, financialResult: financial, riskResult: risks, reportData }, "ru");
  const financingRow = exportData.financingRows.find((row) => row.item === "Лизинг");
  assert.ok(financingRow);
  assert.match(financingRow.comment, /Лизинг выбран, но сумма и условия не указаны/);
  assert.doesNotMatch(financingRow.comment, /не применяется/i);
});

test("structured fields override conflicting finance free text and produce warning", () => {
  const project: StructuredProjectData = {
    ...bakeryBase,
    ownContributionAmount: 350_000_000,
    requestedLoanAmount: 150_000_000,
    needsLeasing: true,
    requestedLeasingAmount: 0,
    sectionNotes: { finance: "Собственные средства 150 млн, кредит 350 млн, лизинг 150 млн" }
  };
  const financial = calculateAll(project, templateFor(project).assumptions);
  assert.ok(financial.warnings.some((warning) => warning.code === "finance_text_conflict" && warning.severity === "medium" && warning.calculationPolicy === "structured_fields_used"));
});

test("region and district mismatch is detected", () => {
  const project: StructuredProjectData = { ...bakeryBase, region: "Ташкентская область", district: "Юнусабад" };
  const financial = calculateAll(project, templateFor(project).assumptions);
  assert.ok(financial.warnings.some((warning) => warning.code === "district_region_mismatch"));
});
