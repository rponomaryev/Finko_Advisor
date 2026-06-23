import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import ExcelJS from "exceljs";
import { buildPdfReportBuffer } from "../src/lib/export/pdfReportExporter.ts";
import { buildExcelReportBuffer } from "../src/lib/export/excelReportExporter.ts";
import { assertNoForbiddenLocaleText } from "../src/lib/report/reportLanguageValidator.ts";
import { createExportProject } from "./reportFixtures.ts";

const forbiddenTransliteration = /Mini-pekarnya|Nazvanie proekta|Kratkoe rezyume|Tashkent gorod/i;

test("Russian PDF export keeps Cyrillic metadata and never emits known transliteration", async () => {
  const baseProject = createExportProject("ru");
  const project = { ...baseProject, title: "Мини-пекарня - Ташкент город", reportData: { ...baseProject.reportData, title: "Мини-пекарня - Ташкент город" } };
  const buffer = await buildPdfReportBuffer(project);
  const pdf = await PDFDocument.load(buffer);
  assert.equal(pdf.getTitle(), "Мини-пекарня - Ташкент город");
  assert.doesNotMatch(buffer.toString("latin1"), forbiddenTransliteration);
});

test("Russian Excel export has localized sheet names and no forbidden English terms in cell text", async () => {
  const project = createExportProject("ru");
  const buffer = await buildExcelReportBuffer(project);
  const workbook = new ExcelJS.Workbook();
  await (workbook.xlsx as unknown as { load(data: unknown): Promise<unknown> }).load(buffer);
  const names = workbook.worksheets.map((sheet) => sheet.name);
  assert.ok(names.includes("Сводка"));
  assert.ok(names.includes("Бизнес-профиль"));
  assert.ok(names.includes("Стартовые вложения"));
  assert.equal(names.some((name) => /Business Profile|CapEx|OpEx|Charts|Sources/.test(name)), false);
  const values: string[] = [];
  workbook.eachSheet((sheet) => sheet.eachRow((row) => row.eachCell((cell) => {
    const value = cell.value as unknown;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") values.push(String(value));
    else if (value && typeof value === "object" && "result" in value) values.push(String((value as { result?: unknown }).result ?? ""));
  })));
  const text = values.join("\n");
  assertNoForbiddenLocaleText({ text, locale: "ru", artifactName: "xlsx values" });
  assert.doesNotMatch(text, /AI classification|Business profile|CAC|Compliance|cash flow|delivery|food cost|unit economics|structured fields/i);
});
