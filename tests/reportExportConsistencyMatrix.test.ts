import test from "node:test";
import assert from "node:assert/strict";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";
import { buildCalculatedProject, childrenClothingProfile, genericProfile } from "./helpers/systemicFixtures.ts";

const scenarios = [
  { name: "children clothing", profile: childrenClothingProfile() },
  { name: "bakery", profile: genericProfile({ businessType: "Пекарня", category: "food_service", volumeKey: "dailyOrders", priceKey: "averageTicket", overrides: { foodCostPct: 35 } }) },
  { name: "car wash", profile: genericProfile({ businessType: "Автомойка", category: "services", volumeKey: "carsPerDay", priceKey: "averageWashTicket", overrides: { cogsPct: 25 } }) },
  { name: "cleaning service", profile: genericProfile({ businessType: "Клининговая служба", category: "services", volumeKey: "servicesPerMonth", priceKey: "averageCleaningTicket" }) },
  { name: "ecommerce store", profile: genericProfile({ businessType: "Интернет-магазин", category: "ecommerce", volumeKey: "monthlyOrders", priceKey: "averageOrderValue", overrides: { averagePurchaseCost: 90_000 } }) },
  { name: "rental business", profile: genericProfile({ businessType: "Аренда строительных инструментов", category: "rental", volumeKey: "rentalOrdersPerMonth", priceKey: "rentalPrice" }) },
  { name: "generic service", profile: genericProfile({ businessType: "Сервис ремонта кофемашин", category: "services", volumeKey: "ordersPerDay", priceKey: "servicePrice" }) },
  { name: "generic retail", profile: genericProfile({ businessType: "Магазин товаров для новорождённых", category: "retail", volumeKey: "traffic", priceKey: "averageTicket", overrides: { averagePurchaseCost: 75_000 } }) }
];

function findRowValue(rows: Array<Record<string, unknown>>, matcher: RegExp): string {
  const row = rows.find((item) => matcher.test(String(item.label ?? item.item ?? item.indicator ?? "")));
  return String(row?.value ?? row?.amount ?? "");
}

for (const scenario of scenarios) {
  test(`web/PDF/Excel prepared export uses stored financial model: ${scenario.name}`, () => {
    const project = buildCalculatedProject(scenario.profile);
    const financial = project.financialResult as any;
    const reportData = project.reportData as any;
    const prepared = prepareReportExport(project, "ru");
    assert.equal(reportData.financialModel.revenue.monthlyRevenue, financial.revenue.monthlyRevenue);
    assert.equal(reportData.financialModel.revenue.annualRevenue, financial.revenue.annualRevenue);
    assert.equal(reportData.financialModel.revenue.monthlyCapacity, financial.revenue.monthlyCapacity);
    assert.equal(reportData.financialModel.revenue.averagePrice, financial.revenue.averagePrice);
    assert.equal(reportData.financialModel.cogs.monthlyCOGS, financial.cogs.monthlyCOGS);
    assert.equal(reportData.financialModel.profitability.grossMarginPct, financial.profitability.grossMarginPct);
    assert.equal(reportData.financialModel.profitability.monthlyEBITDA, financial.profitability.monthlyEBITDA);
    assert.equal(reportData.financialModel.financing.monthlyDebtService ?? reportData.financialModel.financing.totalMonthlyDebtService, financial.financing.monthlyDebtService ?? financial.financing.totalMonthlyDebtService);
    assert.equal(reportData.financialModel.financing.dscr, financial.financing.dscr);

    assert.equal(prepared.report.financialModel.revenue.monthlyRevenue, financial.revenue.monthlyRevenue);
    assert.match(findRowValue(prepared.financialRows, /месячная выручка/i), /сум/);
    assert.ok(prepared.formulaRows.length > 0);
    assert.ok(prepared.capexRows.length > 0);
    assert.ok(prepared.financingRows.length > 0);
  });
}
