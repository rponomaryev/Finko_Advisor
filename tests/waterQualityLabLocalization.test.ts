import assert from "node:assert/strict";
import test from "node:test";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { translateOptionValue } from "../src/lib/i18n/interviewLabels.ts";
import { localizeProfileValue } from "../src/lib/i18n/businessProfileLabels.ts";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import { buildReportData } from "../src/lib/services/reportService.ts";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";
import { waterQualityLabFixture } from "./fixtures/waterQualityLab.ts";

const rawEnumPattern = /analytical_laboratory|b2b_b2c_analytical_services|test_service|tests_per_month|average_test_ticket|reagents_consumables|equipment_amortization|accreditation_loss|reagent_supply|equipment_downtime|staff_qualification/;

test("water lab interview option values are localized for the user", () => {
  assert.equal(translateOptionValue("ru", "water_quality_express"), "Экспресс-тест качества воды");
  assert.equal(translateOptionValue("uz", "water_bacteria_analysis"), "Suvning bakteriologik tahlili");
  assert.equal(translateOptionValue("en", "per_visit_package"), "Per Visit / Package");
  assert.equal(localizeProfileValue("customer_flow, average_ticket, utilization", "ru"), "Поток клиентов, Средний чек, Загрузка мощности");
  assert.equal(localizeProfileValue("data_quality, market_demand, execution, working_capital", "ru"), "Качество данных, Рыночный спрос, Реализация проекта, Оборотный капитал");

  const template = buildDynamicInterviewTemplate({
    businessType: waterQualityLabFixture.businessType,
    businessIdea: waterQualityLabFixture.businessIdea,
    region: waterQualityLabFixture.region,
    userLanguage: "ru"
  });
  const testTypes = template.interviewBlocks
    .flatMap((block) => block.questions)
    .find((question) => question.key === "testServiceTypes");
  assert.ok(testTypes?.options?.includes("water_quality_express"));
  assert.notEqual(translateOptionValue("ru", testTypes?.options?.[0]), testTypes?.options?.[0]);
});

test("water lab business profile rows are localized in report export", () => {
  const project: any = {
    businessType: waterQualityLabFixture.businessType,
    businessIdea: waterQualityLabFixture.businessIdea,
    region: "Ташкентская область",
    district: "Юнусабад",
    userLanguage: "ru",
    testsPerMonth: 75,
    averageTestTicket: 35_000_000,
    utilizationRatePct: 60,
    staffPlan: { roles: [{ role: "Лаборант", count: 2, monthlySalaryAmount: 6_000_000 }] },
    ownContributionAmount: 650_000_000,
    ownContributionCurrency: "UZS",
    creditNeeded: "yes",
    requestedLoanAmount: 100_000_000,
    requestedLoanCurrency: "UZS",
    loanTermMonths: 46,
    loanAnnualRatePct: 26,
    loanPurpose: "Оборудование и запуск"
  };
  const template = buildDynamicInterviewTemplate(project);
  const financial = calculateAll(project, template.assumptions);
  const risks = generateRiskMatrix(project);
  const reportData = buildReportData({
    project: { ...project, title: "Лаборатория воды" },
    financial,
    risks,
    feasibilityScore: 45,
    bankReadinessScore: 55
  });
  const exportData = prepareReportExport({
    id: "water-lab-localization",
    title: "Лаборатория воды",
    status: "calculated",
    businessType: project.businessType,
    userLanguage: "ru",
    structuredData: project,
    financialResult: financial,
    riskResult: risks,
    reportData
  }, "ru");
  const rows = JSON.stringify(exportData.businessProfileRows);
  assert.match(rows, /Аналитическая лаборатория/);
  assert.match(rows, /корпоративные и розничные клиенты аналитические услуги/);
  assert.match(rows, /Реагенты и расходники/);
  assert.match(rows, /Потеря аккредитации/);
  assert.doesNotMatch(rows, rawEnumPattern);
});
