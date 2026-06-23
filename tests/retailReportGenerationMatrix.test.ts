import test from "node:test";
import assert from "node:assert/strict";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { resolveReportReadiness } from "../src/lib/report/reportReadiness.ts";
import { buildReportData } from "../src/lib/services/reportService.ts";
import { hasEnoughDataForCalculation, validateReliableCalculationInputs } from "../src/lib/services/interviewService.ts";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import { resolveSidebarSummaryItems } from "../src/lib/summary/sidebarSummaryResolver.ts";
import { childrenClothingProfile, sampleMarketData } from "./helpers/systemicFixtures.ts";

const scenarios = [
  "Магазин детской одежды",
  "Магазин одежды",
  "Магазин обуви",
  "Магазин косметики",
  "Продуктовый магазин",
  "Интернет-магазин",
  "Сувенирный магазин",
  "Generic unknown retail business"
];

for (const businessType of scenarios) {
  test(`retail/ecommerce readiness and report generation matrix: ${businessType}`, () => {
    const profile = childrenClothingProfile({ businessType, businessIdea: `${businessType} в жилом районе` });
    const template = resolveTemplateForData(profile);
    const readiness = resolveReportReadiness(profile, { template });
    const validation = validateReliableCalculationInputs(profile);
    assert.equal(validation.ok, true, validation.missingFields.join(", "));
    assert.equal(hasEnoughDataForCalculation(profile), true);
    assert.equal(readiness.ready, true, readiness.blockingIssues.map((issue) => issue.message).join("; "));
    assert.equal(readiness.calculationInputs.formulaKind, "traffic_conversion");
    assert.equal(readiness.calculationInputs.monthlyRevenue, 131_040_000);

    const financial = calculateAll(profile, template.assumptions);
    assert.equal(financial.revenue.monthlyCapacity, 728);
    assert.equal(financial.revenue.monthlyRevenue, 131_040_000);
    assert.ok(Number.isFinite(financial.profitability.monthlyEBITDA));

    const sidebar = resolveSidebarSummaryItems(profile, template, "ru");
    assert.ok(sidebar.every((item) => item.source === "user_answer" || item.source === "calculated"));
    assert.equal(sidebar.find((item) => item.key === "calculatedMonthlySales")?.displayValue, "728 продаж/мес.");
    assert.doesNotMatch(sidebar.map((item) => item.displayValue).join(" | "), /Доставка|Оптовики|Маркетплейсы/i);

    const reportData = buildReportData({ project: { ...profile, title: businessType, sectorCode: template.code }, financial, risks: [], feasibilityScore: 70, bankReadinessScore: 70, marketData: sampleMarketData(String(profile.businessType ?? "Тестовый проект")) });
    assert.ok(reportData && Object.keys(reportData).length > 0);
  });
}
