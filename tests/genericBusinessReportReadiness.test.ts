import test from "node:test";
import assert from "node:assert/strict";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { resolveReportReadiness } from "../src/lib/report/reportReadiness.ts";
import { buildReportData } from "../src/lib/services/reportService.ts";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import { resolveSidebarSummaryItems } from "../src/lib/summary/sidebarSummaryResolver.ts";
import { genericProfile, sampleMarketData } from "./helpers/systemicFixtures.ts";

const scenarios = [
  { businessType: "Магазин товаров для новорождённых в Самарканде", category: "retail", volumeKey: "traffic" },
  { businessType: "Выездной сервис ремонта кофемашин", category: "services", volumeKey: "ordersPerDay", priceKey: "servicePrice" },
  { businessType: "B2B поставка спецодежды", category: "b2b", volumeKey: "contractsPerMonth", priceKey: "contractValue" },
  { businessType: "Аренда строительных инструментов", category: "rental", volumeKey: "rentalOrdersPerMonth", priceKey: "rentalPrice" },
  { businessType: "Производство деревянных игрушек", category: "manufacturing", volumeKey: "productionUnitsPerMonth", priceKey: "pricePerUnit" },
  { businessType: "Мастерская и онлайн-продажа кастомных подарков", category: "services", volumeKey: "monthlyOrders", priceKey: "averageTicket" }
];

for (const scenario of scenarios) {
  test(`generic scenario is report-ready after visible fields are filled: ${scenario.businessType}`, () => {
    const profile = genericProfile(scenario);
    const template = resolveTemplateForData(profile);
    const readiness = resolveReportReadiness(profile, { template });
    assert.equal(readiness.ready, true, readiness.blockingIssues.map((issue) => issue.message).join("; "));
    assert.ok(readiness.requiredVisibleFields.every((field) => typeof field === "string"));
    assert.ok(template.interviewBlocks.every((block) => ["business_idea", "location", "equipment_launch", "operations", "suppliers_procurement", "sales", "financing", "documents_experience"].includes(block.id)));

    const financial = calculateAll(profile, template.assumptions);
    assert.ok(Number.isFinite(financial.revenue.monthlyRevenue));
    assert.ok(financial.revenue.monthlyRevenue > 0);
    const sidebarText = resolveSidebarSummaryItems(profile, template, "ru").map((item) => item.displayValue).join(" | ");
    assert.doesNotMatch(sidebarText, /children_clothing|bakery|car_wash|sample_/i);

    const reportData = buildReportData({ project: { ...profile, title: scenario.businessType, sectorCode: template.code }, financial, risks: [], feasibilityScore: 70, bankReadinessScore: 70, marketData: sampleMarketData(String(profile.businessType ?? "Тестовый проект")) });
    assert.ok(reportData && Object.keys(reportData).length > 0);
  });
}
