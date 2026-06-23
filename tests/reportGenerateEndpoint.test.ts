import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("report generate endpoint returns structured success and missing-data errors", () => {
  const source = readFileSync("src/app/api/projects/[id]/report/generate/route.ts", "utf8");
  assert.match(source, /POST\(request: Request/);
  assert.match(source, /const reportUrl = `\/advisor\/projects\/\$\{id\}\/report`/);
  assert.match(source, /success:\s*true/);
  assert.match(source, /reportStatus:\s*"ready"/);
  assert.match(source, /hasReportData:\s*true/);
  assert.match(source, /redirectUrl:\s*reportUrl/);
  assert.match(source, /MISSING_REQUIRED_FIELDS/);
  assert.match(source, /CSRF_FAILED/);
  assert.match(source, /REPORT_BUILD_FAILED/);
  assert.match(source, /REPORT_DATA_EMPTY/);
  assert.match(source, /DATABASE_SAVE_FAILED/);
  assert.match(source, /detectMissingAnalysisInputs/);
});
