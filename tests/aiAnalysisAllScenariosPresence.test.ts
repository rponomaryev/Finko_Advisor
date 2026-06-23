import test from "node:test";
import assert from "node:assert/strict";
import { businessSamples } from "../src/lib/data/businessSamples/businessSamples.ts";
import { buildCalculatedProject, genericProfile } from "./helpers/systemicFixtures.ts";

function volumeForCategory(category: string) {
  if (category === "retail" || category === "ecommerce") return { volumeKey: "traffic", priceKey: "averageTicket" };
  if (category === "rental") return { volumeKey: "rentalOrdersPerMonth", priceKey: "rentalPrice" };
  if (category === "manufacturing") return { volumeKey: "productionUnitsPerMonth", priceKey: "pricePerUnit" };
  if (category === "food_service") return { volumeKey: "dailyOrders", priceKey: "averageTicket" };
  if (category === "b2b" || category === "construction") return { volumeKey: "contractsPerMonth", priceKey: "contractValue" };
  return { volumeKey: "monthlyOrders", priceKey: "averageTicket" };
}

test("AI analysis and claim-level source usage exist for all business samples", () => {
  let index = 0;
  for (const sample of businessSamples) {
    index += 1;
    if (index % 10 === 0) console.log(`checked AI analysis ${index}/${businessSamples.length}`);
    const keys = volumeForCategory(sample.category);
    const profile = genericProfile({
      businessType: sample.label.ru,
      category: sample.category,
      ...keys,
      overrides: {
        businessProfile: {
          category: sample.category,
          subcategory: sample.subcategory,
          businessModel: sample.profile?.businessModel ?? "retail_sale",
          volumeField: keys.volumeKey,
          averageTicketField: keys.priceKey,
          capacityUnit: keys.volumeKey.toLowerCase().includes("day") || keys.volumeKey === "traffic" ? "customers_per_day" : "orders_per_month"
        }
      }
    });
    const project = buildCalculatedProject(profile);
    const report = project.reportData as any;
    assert.ok(report.aiReport, `${sample.id}: aiReport missing`);
    assert.ok(report.aiReport?.executiveSummary.length, `${sample.id}: AI executive summary missing`);
    assert.ok(report.aiReport?.marketAnalysis.length, `${sample.id}: AI market analysis missing`);
    assert.ok(report.aiReport?.businessModelAssessment.length, `${sample.id}: AI business analysis missing`);
    assert.ok(report.aiReport?.financialAnalysis.length, `${sample.id}: AI financial analysis missing`);
    assert.ok(report.aiReport?.riskAssessment.length, `${sample.id}: AI risk analysis missing`);
    assert.ok(report.aiReport?.actionPlan.length, `${sample.id}: AI action plan missing`);
    const audit = report.sourceUsageAudit;
    assert.ok(audit.registrySize >= 1000, `${sample.id}: registry size missing in audit`);
    assert.ok(audit.usedSourcesCount > 0, `${sample.id}: used sources missing`);
    assert.ok(Array.isArray(audit.claims) && audit.claims.length >= 10, `${sample.id}: claim-level audit missing`);
    assert.ok(audit.bySection.aiAnalysis.length > 0, `${sample.id}: AI source ids missing`);
    assert.ok(audit.bySection.references.length > 0, `${sample.id}: reference source ids missing`);
  }
});
