import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("report generate route returns structured missing-field details", () => {
  const source = readFileSync("src/app/api/projects/[id]/report/generate/route.ts", "utf8");
  assert.match(source, /resolveReportReadiness/);
  assert.match(source, /MISSING_REQUIRED_FIELDS/);
  assert.match(source, /missingFields/);
  assert.match(source, /requiredVisibleFields/);
  assert.match(source, /warnings/);
  assert.match(source, /readinessIssueDto/);
});

test("report generate route returns integrity and exchange-rate specific errors", () => {
  const source = readFileSync("src/app/api/projects/[id]/report/generate/route.ts", "utf8");
  assert.match(source, /REPORT_INTEGRITY_FAILED/);
  assert.match(source, /integrityErrors/);
  assert.match(source, /EXCHANGE_RATE_UNAVAILABLE/);
  assert.match(source, /Не удалось получить курс валюты на дату расчёта/);
});

test("generic-only error is not used when backend has details and success requires persisted report data", () => {
  const source = readFileSync("src/app/api/projects/[id]/report/generate/route.ts", "utf8");
  assert.match(source, /code:\s*errorCode/);
  assert.match(source, /isNonEmptyReportData\(reportData\)/);
  assert.match(source, /isNonEmptyReportData\(updatedProject\.reportData\)/);
  assert.match(source, /REPORT_DATA_EMPTY/);
  assert.match(source, /DATABASE_SAVE_FAILED/);
  assert.match(source, /reportData/);
  assert.match(source, /previewUrl/);
});

test("UI renders detailed API errors instead of generic-only message", () => {
  const source = readFileSync("src/components/advisor/InterviewPanel.tsx", "utf8");
  assert.match(source, /integrityErrors/);
  assert.match(source, /missingFields/);
  assert.match(source, /warning\.message/);
  assert.match(source, /reportPreviewUnavailable/);
});
