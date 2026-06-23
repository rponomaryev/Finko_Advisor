import test from "node:test";
import assert from "node:assert/strict";
import { businessSamples } from "../src/lib/data/businessSamples/businessSamples.ts";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { resolveReportReadiness } from "../src/lib/report/reportReadiness.ts";
import { buildReportData } from "../src/lib/services/reportService.ts";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import { resolveSidebarSummaryItems } from "../src/lib/summary/sidebarSummaryResolver.ts";
import { genericProfile, sampleMarketData } from "./helpers/systemicFixtures.ts";

function volumeForCategory(category: string) {
  if (category === "retail" || category === "ecommerce") return { volumeKey: "traffic", priceKey: "averageTicket" };
  if (category === "rental") return { volumeKey: "rentalOrdersPerMonth", priceKey: "rentalPrice" };
  if (category === "manufacturing") return { volumeKey: "productionUnitsPerMonth", priceKey: "pricePerUnit" };
  if (category === "food_service") return { volumeKey: "dailyOrders", priceKey: "averageTicket" };
  if (category === "b2b") return { volumeKey: "contractsPerMonth", priceKey: "contractValue" };
  return { volumeKey: "monthlyOrders", priceKey: "averageTicket" };
}

test("all business samples can build normalized inputs, financial model and report data", () => {
  assert.ok(businessSamples.length >= 120);
  for (const sample of businessSamples) {
    const keys = volumeForCategory(sample.category);
    const profile = genericProfile({
      businessType: sample.label.ru,
      category: sample.category,
      ...keys,
      overrides: {
        businessProfile: { category: sample.category, subcategory: sample.subcategory, businessModel: sample.profile?.businessModel ?? "retail_sale", volumeField: keys.volumeKey, averageTicketField: keys.priceKey, capacityUnit: keys.volumeKey.toLowerCase().includes("day") || keys.volumeKey === "traffic" ? "customers_per_day" : "orders_per_month" }
      }
    });
    const template = resolveTemplateForData(profile);
    const readiness = resolveReportReadiness(profile, { template });
    assert.equal(readiness.ready, true, `${sample.id}: ${readiness.blockingIssues.map((issue) => issue.message).join("; ")}`);
    assert.ok(readiness.calculationInputs.monthlyRevenue > 0, sample.id);

    const financial = calculateAll(profile, template.assumptions);
    assert.ok(Number.isFinite(financial.revenue.monthlyRevenue), sample.id);
    assert.ok(financial.revenue.monthlyRevenue > 0, sample.id);

    const reportData = buildReportData({ project: { ...profile, title: sample.label.ru, sectorCode: template.code }, financial, risks: [], feasibilityScore: 70, bankReadinessScore: 70, marketData: sampleMarketData(String(profile.businessType ?? "Тестовый проект")) });
    assert.ok(reportData && Object.keys(reportData).length > 0, sample.id);
    const sidebarText = resolveSidebarSummaryItems(profile, template, "ru").map((item) => item.displayValue).join(" | ");
    assert.doesNotMatch(sidebarText, /sample_|__money|sectionNotes|undefined|null|NaN|Infinity/i, sample.id);
  }
});
