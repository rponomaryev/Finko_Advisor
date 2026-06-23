import test from "node:test";
import assert from "node:assert/strict";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { validateReportIntegrity } from "../src/lib/report/reportIntegrityValidator.ts";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import type { StructuredProjectData } from "../src/lib/types/project.ts";

const project: StructuredProjectData = {
  userLanguage: "ru",
  businessType: "Пекарня у дома",
  businessIdea: "мини-пекарня с точкой продаж",
  region: "Ташкент город",
  district: "Юнусабад",
  dailyCovers: 120,
  averageTicket: 35_000,
  foodCostPct: 35,
  utilizationRatePct: 65,
  workingDaysPerMonth: 26,
  ownContributionAmount: 260_000_000,
  requestedLoanAmount: 100_000_000,
  creditNeeded: "yes",
  loanTermMonths: 36,
  loanAnnualRatePct: 26
};

test("report integrity accepts corrected bakery revenue and rejects placeholder leakage", () => {
  const template = buildDynamicInterviewTemplate(project);
  const financial = calculateAll(project, template.assumptions);
  const risks = generateRiskMatrix(project);
  const reportData = {
    title: "Пекарня у дома",
    executiveSummary: [`Месячная выручка ${financial.revenue.monthlyRevenue.toLocaleString("ru-RU")} сум`],
    keyFigures: [
      ["Плановый объем", "120 заказов/день", "Данные пользователя; для расчёта в месяц: 3 120 заказов/мес."],
      ["Расчётный объем продаж", "2 028 заказов/мес.", "Прозрачность расчёта выручки"],
      ["Средний чек / цена", "35 000 сум", "Прозрачность расчёта выручки"]
    ],
    riskMatrix: risks,
    assumptionsRows: [["A1", "Требуется ручная проверка", "допущение/пробел данных"]]
  } as any;
  const serialized = JSON.stringify(reportData);
  assert.equal(financial.revenue.monthlyRevenue, 70_980_000);
  assert.equal(financial.revenue.annualRevenue, 851_760_000);
  assert.doesNotMatch(serialized, /45\s*500/);
  assert.doesNotMatch(serialized, /2\s*заказов\/мес\./);
  assert.doesNotMatch(serialized, /1\s*заказов\/мес\./);
  assert.doesNotMatch(serialized, /показатель\s+показатель|sample_|sectionNotes|__money/);
  const integrity = validateReportIntegrity({ project, financial, risks, reportData, locale: "ru" });
  assert.equal(integrity.ok, true, integrity.errors.join("\n"));
});
