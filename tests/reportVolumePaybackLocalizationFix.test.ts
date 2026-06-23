import test from "node:test";
import assert from "node:assert/strict";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import { buildReportData } from "../src/lib/services/reportService.ts";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";
import { toStructuredProjectData } from "../src/lib/services/projectService.ts";

const approvedLocaleLeaks = /References|Objects per month|Equipment margin|Staff и quality|User input|Business profile|AI classification/;

test("report calculation uses user-entered monthlyCapacity instead of stale or derived default volume", () => {
  const structuredData = {
    userLanguage: "ru" as const,
    businessType: "установка видеонаблюдения",
    businessIdea: "Монтаж IP-камер для магазинов, складов и частных домов",
    region: "Ташкент город",
    monthlyCapacity: 46,
    dailyServiceCapacity: 1000,
    averagePrice: 3500000,
    utilizationRatePct: 100,
    ownContributionAmount: 135000000,
    ownContributionCurrency: "UZS" as const,
    creditNeeded: "no" as const,
    staffPlan: { roles: [{ role: "Старший монтажник", count: 1, monthlySalaryAmount: 7000000, monthlySalaryCurrency: "UZS" as const }] }
  };

  const fromProject = toStructuredProjectData({ monthlyCapacity: 1000, structuredData });
  assert.equal(fromProject.monthlyCapacity, 46, "structured interview answer must override stale top-level Project.monthlyCapacity");

  const template = buildDynamicInterviewTemplate(structuredData);
  const financial = calculateAll(structuredData, template.assumptions);
  assert.equal(financial.revenue.monthlyCapacity, 46);
  assert.equal(financial.revenue.unitLabel, "проектов/мес.");

  const risks = generateRiskMatrix(structuredData);
  const reportData = buildReportData({
    project: { ...structuredData, title: "Монтаж видеонаблюдения" },
    financial,
    risks,
    feasibilityScore: 70,
    bankReadinessScore: 68
  });
  const exportData = prepareReportExport({
    id: "cctv-volume-fix",
    title: "Монтаж видеонаблюдения",
    status: "calculated",
    businessType: structuredData.businessType,
    userLanguage: "ru",
    structuredData,
    financialResult: financial,
    riskResult: risks,
    reportData
  }, "ru");

  const plannedVolume = exportData.financialRows.find((row) => row.indicator === "Плановый объем");
  assert.equal(plannedVolume?.value, "46 проектов/мес.");
});

test("report financial rows include payback only once and keep localized month suffix in value", () => {
  const project = {
    userLanguage: "ru" as const,
    businessType: "кофейня",
    businessIdea: "Кофейня навынос",
    region: "Ташкент город",
    monthlyCapacity: 800,
    averagePrice: 50000,
    utilizationRatePct: 100,
    ownContributionAmount: 150000000,
    ownContributionCurrency: "UZS" as const,
    creditNeeded: "no" as const,
    staffPlan: { roles: [{ role: "Бариста", count: 1, monthlySalaryAmount: 4000000, monthlySalaryCurrency: "UZS" as const }] }
  };
  const template = buildDynamicInterviewTemplate(project);
  const financial = calculateAll(project, template.assumptions);
  const risks = generateRiskMatrix(project);
  const reportData = buildReportData({ project: { ...project, title: "Кофейня" }, financial, risks, feasibilityScore: 70, bankReadinessScore: 65 });
  const exportData = prepareReportExport({
    id: "payback-fix",
    title: "Кофейня",
    status: "calculated",
    businessType: project.businessType,
    userLanguage: "ru",
    structuredData: project,
    financialResult: financial,
    riskResult: risks,
    reportData
  }, "ru");

  const paybackRows = exportData.financialRows.filter((row) => row.indicator === "Срок окупаемости");
  assert.equal(paybackRows.length, 1);
  if (financial.profitability.paybackMonths !== null) {
    assert.match(paybackRows[0].value, /^\d+ мес$/);
  }
});

test("Russian prepared report data for PDF download does not leak known English UI phrases", () => {
  const project = {
    userLanguage: "ru" as const,
    businessType: "установка видеонаблюдения",
    businessIdea: "Монтаж камер и сервисные договоры",
    region: "Ташкент город",
    monthlyCapacity: 46,
    averagePrice: 3500000,
    ownContributionAmount: 135000000,
    ownContributionCurrency: "UZS" as const,
    creditNeeded: "no" as const,
    staffPlan: { roles: [{ role: "Монтажник", count: 2, monthlySalaryAmount: 6000000, monthlySalaryCurrency: "UZS" as const }] }
  };
  const template = buildDynamicInterviewTemplate(project);
  const financial = calculateAll(project, template.assumptions);
  const risks = generateRiskMatrix(project);
  const reportData = buildReportData({ project: { ...project, title: "Видеонаблюдение" }, financial, risks, feasibilityScore: 72, bankReadinessScore: 66 });
  const exportData = prepareReportExport({
    id: "ru-language-fix",
    title: "Видеонаблюдение",
    status: "calculated",
    businessType: project.businessType,
    userLanguage: "ru",
    structuredData: project,
    financialResult: financial,
    riskResult: risks,
    reportData
  }, "ru");
  const visibleText = JSON.stringify({
    cover: exportData.cover,
    summary: exportData.summary,
    executiveSummary: exportData.executiveSummary,
    interviewRows: exportData.interviewRows,
    businessProfileRows: exportData.businessProfileRows,
    financialRows: exportData.financialRows,
    marketEvidenceRows: exportData.marketEvidenceRows,
    documentRows: exportData.documentRows,
    actionPlanRows: exportData.actionPlanRows,
    assumptionRows: exportData.assumptionRows,
    risks: exportData.risks,
    recommendations: exportData.recommendations,
    warnings: exportData.warnings,
    sources: exportData.sources,
    glossaryRows: exportData.glossaryRows,
    detailedConclusion: exportData.detailedConclusion,
    financingRecommendation: exportData.financingRecommendation,
    disclaimer: exportData.disclaimer
  });
  assert.doesNotMatch(visibleText, approvedLocaleLeaks);
  assert.doesNotMatch(visibleText, /Cctv installation сервис/);
  assert.match(visibleText, /Источники|Данные пользователя|Плановый объем|Сервис установки видеонаблюдения/);
});
