import test from "node:test";
import assert from "node:assert/strict";
import { generateFallbackReport } from "../src/lib/report/aiReportGenerator.ts";
import { buildCalculatedProject, genericProfile } from "./helpers/systemicFixtures.ts";

const forbidden = /Требует уточнения\s+Нужно проверить|Нужно проверить|проверить=|2024-Нужно проверить|2026c|2026d|\b(?:undefined|null|NaN)\b/i;

function reportFor(profile: ReturnType<typeof genericProfile>) {
  const project = buildCalculatedProject(profile);
  return generateFallbackReport({
    project: profile,
    financial: project.financialResult as never,
    risks: project.riskResult as never,
    feasibilityScore: project.feasibilityScore as number,
    bankReadinessScore: project.bankReadinessScore as number,
    locale: "ru"
  });
}

test("universal AI fallback analysis is business-aware across service, retail and manufacturing", () => {
  const cases = [
    {
      name: "service atelier",
      profile: genericProfile({ businessType: "Ателье по ремонту одежды", category: "services", volumeKey: "plannedVolumeMonthly", priceKey: "averageServiceTicket", overrides: { businessIdea: "ремонт, подгонка, подшив, замена молний, примерки", businessProfile: { category: "services", subcategory: "tailoring_repair", businessModel: "service", volumeField: "plannedVolumeMonthly", averageTicketField: "averageServiceTicket" } } }),
      must: /сервисн|услуг|мастер|повторн|заявк|заказ/i,
      mustNot: /розничная модель|ассортимент|оборачиваемость запасов/i
    },
    {
      name: "retail shop",
      profile: genericProfile({ businessType: "Магазин одежды", category: "retail", volumeKey: "traffic", priceKey: "averageTicket", overrides: { businessIdea: "продажа одежды, склад, ассортимент, размерный ряд", averagePurchaseCost: 80_000, businessProfile: { category: "retail", subcategory: "clothing_store", businessModel: "retail_sale", volumeField: "traffic", averageTicketField: "averageTicket" } } }),
      must: /розничная модель|ассортимент|товарн|запас|поставщик/i,
      mustNot: /сервис ремонта и подгонки|мастер.*подгон/i
    },
    {
      name: "manufacturing",
      profile: genericProfile({ businessType: "Пекарня", category: "manufacturing", volumeKey: "productionUnitsPerMonth", priceKey: "pricePerUnit", overrides: { businessIdea: "производство выпечки, сырье, печи, каналы сбыта", rawMaterialCostPerUnit: 60_000, businessProfile: { category: "manufacturing", subcategory: "bakery_production", businessModel: "production", volumeField: "productionUnitsPerMonth", averageTicketField: "pricePerUnit" } } }),
      must: /производствен|загрузк.*оборуд|материал|качество|канал.*сбыт/i,
      mustNot: /ателье|подгонк/i
    }
  ];

  for (const item of cases) {
    const report = reportFor(item.profile);
    const text = JSON.stringify(report);
    assert.match(text, item.must, item.name);
    assert.doesNotMatch(text, item.mustNot, item.name);
    assert.doesNotMatch(text, forbidden, item.name);
    assert.match(text, /месячная выручка|monthly revenue|oylik tushum/i, item.name);
    assert.match(text, /DSCR/i, item.name);
  }
});
