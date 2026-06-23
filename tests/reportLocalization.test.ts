import test from "node:test";
import assert from "node:assert/strict";
import { createExportProject } from "./reportFixtures.ts";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";

function exportText(locale: "ru" | "en" | "uz") {
  const project = createExportProject(locale);
  const data = prepareReportExport(project, locale);
  return JSON.stringify({
    locale: data.locale,
    summary: data.executiveSummary,
    financialRows: data.financialRows,
    formulas: data.formulaRows,
    risks: data.risks,
    recommendations: data.recommendations,
    warnings: data.warnings,
    sources: data.sources
  });
}

test("report preview/export data is localized by saved project language", () => {
  const en = exportText("en");
  assert.match(en, /Total investment need/);
  assert.match(en, /Monthly revenue/);
  assert.doesNotMatch(en, /Разрыв финансирования|Собственные средства|Подробное заключение|Финансовая модель|Предупреждения/);

  const uz = exportText("uz");
  assert.match(uz, /Umumiy investitsiya ehtiyoji/);
  assert.match(uz, /Oylik tushum/);
  assert.doesNotMatch(uz, /Разрыв финансирования|Собственные средства|Подробное заключение|Финансовая модель|Предупреждения/);

  const ru = exportText("ru");
  assert.match(ru, /Общий объем инвестиций/);
  assert.match(ru, /Месячная выручка/);
});

test("formula rows translate key report labels and hide technical keys", () => {
  const forbidden = /monthlyFixedOpex|bufferMonths|initialInventory|accountsReceivableBuffer|accountsPayableBuffer|seasonalStockBuffer|financing_gap|Leasing not selected|Investment need \/ Net cash flow/;
  for (const locale of ["ru", "en", "uz"] as const) {
    const data = prepareReportExport(createExportProject(locale), locale);
    const formulas = JSON.stringify(data.formulaRows);
    assert.doesNotMatch(formulas, forbidden, locale);
  }
  assert.match(JSON.stringify(prepareReportExport(createExportProject("ru"), "ru").formulaRows), /Месячная выручка|Валовая маржа|Оборотный капитал|Разрыв финансирования|Точка безубыточности|Платеж по кредиту/);
  assert.match(JSON.stringify(prepareReportExport(createExportProject("en"), "en").formulaRows), /Monthly revenue|Gross margin|Working capital|Financing gap|Break-even point|Loan payment/);
  assert.match(JSON.stringify(prepareReportExport(createExportProject("uz"), "uz").formulaRows), /Oylik tushum|Yalpi marja|Aylanma kapital|Moliyalashtirish bo'shlig'i|Zararsizlik nuqtasi|Kredit to'lovi/);
});

import { resolveReportData } from "../src/lib/services/reportService.ts";

test("stored reportData is relocalized by saved project language", () => {
  const project: any = createExportProject("ru");
  project.userLanguage = "en";
  project.structuredData = { ...project.structuredData, userLanguage: "en" };
  project.reportLanguage = "en";
  const report = resolveReportData(project)!;
  const text = JSON.stringify({ summary: report.executiveSummary, keyFigures: report.keyFigures, formulas: report.formulaRows });
  assert.match(text, /Total investment need|Monthly revenue|Financing gap/);
  assert.doesNotMatch(text, /Разрыв финансирования|Собственные средства|Месячная выручка/);
});
