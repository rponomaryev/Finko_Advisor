import test from "node:test";
import assert from "node:assert/strict";
import { resolveRevenueInputs } from "../src/lib/financial/revenueInputResolver.ts";
import { resolveSidebarSummaryItems } from "../src/lib/summary/sidebarSummaryResolver.ts";
import { buildCalculatedProject, genericProfile } from "./helpers/systemicFixtures.ts";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import { buildPdfReportBuffer } from "../src/lib/export/pdfReportExporter.ts";
import { buildExcelReportBuffer } from "../src/lib/export/excelReportExporter.ts";
import { extractPdfText } from "./helpers/pdfText.ts";
import { workbookText } from "./helpers/excelText.ts";

function profile(overrides: Record<string, unknown> = {}) {
  return genericProfile({ businessType: "Автосервис / СТО", category: "services", volumeKey: "plannedVolumeMonthly", priceKey: "averageServiceTicket", overrides: { plannedVolumeMonthly: 300, averageServiceTicket: 350_000, cogsPct: 35, ...overrides } });
}

test("canonical plannedVolumeMonthly remains monthly and is used in sidebar/report/PDF/Excel", async () => {
  const data = profile();
  const template = resolveTemplateForData(data);
  const revenue = resolveRevenueInputs(data, template.assumptions, data.businessProfile as Record<string, unknown>);
  assert.equal(revenue.monthlyCapacity, 300);
  assert.equal(revenue.volume?.key, "plannedVolumeMonthly");
  assert.equal(revenue.formulaKind, "monthly_units");

  const sidebar = resolveSidebarSummaryItems({ ...data, completedBlockIds: ["sales", "business_idea", "location", "equipment_launch", "operations", "suppliers_procurement", "financing", "documents_experience"] }, template, "ru");
  assert.ok(sidebar.some((item) => /300/.test(String(item.displayValue)) && /мес/.test(String(item.displayValue))));

  const project = buildCalculatedProject(data);
  assert.equal((project.financialResult as any).revenue.monthlyCapacity, 300);
  const pdfText = await extractPdfText(await buildPdfReportBuffer(project, "ru"));
  const excel = await workbookText(await buildExcelReportBuffer(project, "ru"));
  assert.match(pdfText, /300\s+заказов\/мес/i);
  assert.match(excel.text, /300\s+заказов\/мес/i);
});

test("legacy daily orders are converted once to monthly units", () => {
  const data = genericProfile({ businessType: "Автосервис / СТО", category: "services", volumeKey: "dailyOrders", priceKey: "averageServiceTicket", overrides: { dailyOrders: 12, workingDaysPerMonth: 26, averageServiceTicket: 350_000, cogsPct: 35 } });
  const template = resolveTemplateForData(data);
  const revenue = resolveRevenueInputs(data, template.assumptions, data.businessProfile as Record<string, unknown>);
  assert.equal(revenue.monthlyCapacity, 312);
  assert.equal(revenue.displayVolumeMonthlyEquivalent, 312);
  assert.equal(revenue.formulaKind, "daily_units");
});

test("traffic conversion produces monthly sales units, not visitors/month", () => {
  const data = genericProfile({ businessType: "Розничный магазин", category: "retail", volumeKey: "traffic", priceKey: "averageTicket", overrides: { traffic: 80, conversion: 35, workingDaysPerMonth: 26, averageTicket: 180_000 } });
  const template = resolveTemplateForData(data);
  const revenue = resolveRevenueInputs(data, template.assumptions, data.businessProfile as Record<string, unknown>);
  assert.equal(revenue.monthlyCapacity, 728);
  assert.equal(revenue.unitLabel, "продаж/мес.");
  assert.notEqual(revenue.unitLabel, "посетителей/мес.");
});
