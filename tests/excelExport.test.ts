import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { buildExcelReportBuffer } from "../src/lib/export/excelReportExporter.ts";
import { createExportProject } from "./reportFixtures.ts";

test("excel exporter creates localized required worksheets", async () => {
  const project = createExportProject();
  const buffer = await buildExcelReportBuffer(project);
  const workbook = new ExcelJS.Workbook();
  await (workbook.xlsx as unknown as { load(data: unknown): Promise<unknown> }).load(buffer);

  assert.deepEqual(
    workbook.worksheets.map((sheet) => sheet.name),
    ["Сводка", "ИИ Анализ и рекомендации", "Бизнес-профиль", "Рыночные данные", "Финансовая модель", "Чувствительность", "Матрица рисков", "Реестр рисков", "Документы", "Помещение", "Финансирование", "План действий", "Источники", "Допущения", "Формулы", "Стартовые вложения", "Опер. расходы", "Структура средств", "Глоссарий", "Данные для графиков", "Импорт и экспорт", "Предупреждения"]
  );
});

test("excel export has FormulaSheet, formulas and no technical placeholders", async () => {
  const project = createExportProject();
  const buffer = await buildExcelReportBuffer(project);
  const workbook = new ExcelJS.Workbook();
  await (workbook.xlsx as unknown as { load(data: unknown): Promise<unknown> }).load(buffer);

  const businessProfileSheet = workbook.getWorksheet("Бизнес-профиль");
  const marketSheet = workbook.getWorksheet("Рыночные данные");
  const formulaSheet = workbook.getWorksheet("Формулы");
  const capexSheet = workbook.getWorksheet("Стартовые вложения");
  const opexSheet = workbook.getWorksheet("Опер. расходы");
  const chartsSheet = workbook.getWorksheet("Данные для графиков");
  const glossarySheet = workbook.getWorksheet("Глоссарий");
  assert.ok(businessProfileSheet);
  assert.ok(marketSheet);
  assert.ok(formulaSheet);
  assert.ok(capexSheet);
  assert.ok(opexSheet);
  assert.ok(chartsSheet);
  assert.ok(glossarySheet);

  const allValues = workbook.worksheets.flatMap((sheet) => {
    const values: string[] = [];
    sheet.eachRow((row) => row.eachCell((cell) => {
      const value = cell.value as unknown;
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") values.push(String(value));
      else if (value && typeof value === "object" && "result" in value) values.push(String((value as { result?: unknown }).result ?? ""));
    }));
    return values;
  });
  for (const bad of ["[object Object]", "undefined", "null", "NaN", "Infinity", "-1 сум", "financing_gap", "financingGap"]) {
    assert.equal(allValues.some((value) => value.includes(bad)), false, `${bad} must not be exposed`);
  }
  assert.equal(allValues.some((value) => value.includes("toyType") || value.includes("productionType")), false);
  assert.equal(allValues.some((value) => value === "calculated" || value === "stable"), false, "raw revenue enums must not be exposed");
  assert.equal(allValues.some((value) => value.includes("Официальная статистика") || value.includes("Источник") || value.includes("Проверенный контекстный источник")), true);

  assert.equal(marketSheet!.getCell("A1").value, "Статья");
  assert.ok(String(marketSheet!.getCell("A2").value ?? "").length > 0);

  const formulaCells = ["I2", "I3", "I6"];
  assert.ok(formulaCells.some((cell) => typeof formulaSheet!.getCell(cell).value === "object" && formulaSheet!.getCell(cell).value && "formula" in (formulaSheet!.getCell(cell).value as object)));
  assert.ok(workbook.model.media?.length ?? 0, "logo image must be embedded");
});
