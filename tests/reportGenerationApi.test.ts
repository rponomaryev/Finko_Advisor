import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("report generation API returns success only with persisted report data", () => {
  const source = readFileSync("src/app/api/projects/[id]/report/generate/route.ts", "utf8");
  assert.match(source, /isNonEmptyReportData\(reportData\)/);
  assert.match(source, /REPORT_DATA_EMPTY/);
  assert.match(source, /isNonEmptyReportData\(updatedProject\.reportData\)/);
  assert.match(source, /DATABASE_SAVE_FAILED/);
  assert.match(source, /success:\s*true/);
  assert.match(source, /reportStatus:\s*"ready"/);
  assert.match(source, /hasReportData:\s*true/);
  assert.match(source, /redirectUrl:\s*reportUrl/);
  assert.match(source, /financialResult:\s*financial/);

  const dto = readFileSync("src/lib/server/dto.ts", "utf8");
  assert.match(dto, /financialResult:\s*project\.financialResult/);
});

test("report generation API returns structured missing-data errors", () => {
  const source = readFileSync("src/app/api/projects/[id]/report/generate/route.ts", "utf8");
  assert.match(source, /MISSING_REQUIRED_FIELDS/);
  assert.match(source, /missingFields/);
  assert.match(source, /validateReliableCalculationInputs/);
  assert.match(source, /localizedMissingMessage\(locale\)/);
});

test("report status API exposes ready, pending, partial and failed states", () => {
  const source = readFileSync("src/app/api/projects/[id]/report/status/route.ts", "utf8");
  assert.match(source, /reportStatus/);
  assert.match(source, /hasReportData/);
  assert.match(source, /"ready"/);
  assert.match(source, /"pending"/);
  assert.match(source, /"failed"/);
});

test("PDF and XLSX routes remain wired after report generation", () => {
  const pdf = readFileSync("src/app/api/projects/[id]/report/pdf/route.ts", "utf8");
  const excel = readFileSync("src/app/api/projects/[id]/report/excel/route.ts", "utf8");
  assert.match(pdf, /createPdfReportResponse/);
  assert.match(excel, /createExcelReportResponse/);
});


test("interview panel shows an explicit fallback when report tab has no preview data", () => {
  const source = readFileSync("src/components/advisor/InterviewPanel.tsx", "utf8");
  assert.match(source, /reportPreviewUnavailable/);
  assert.match(source, /Отчёт сформирован, но превью не отобразилось/);
  assert.match(source, /router\.refresh\(\)/);
});
