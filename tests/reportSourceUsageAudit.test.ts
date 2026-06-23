import test from "node:test";
import assert from "node:assert/strict";
import { buildCalculatedProject, childrenClothingProfile } from "./helpers/systemicFixtures.ts";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";

test("report data records source usage audit and references are built from used source ids", () => {
  const prepared = prepareReportExport(buildCalculatedProject(childrenClothingProfile()), "ru");
  const audit = (prepared.report as any).sourceUsageAudit as { usedSourcesCount: number; bySection: Record<string, string[]> };
  assert.ok(audit.usedSourcesCount > 0);
  assert.ok(audit.bySection.marketData.length > 0);
  assert.ok(audit.bySection.documents.length > 0);
  assert.ok(audit.bySection.risks.length > 0);
  assert.ok((prepared.report.riskMatrix ?? []).some((risk: any) => Array.isArray(risk.sourceIds) && risk.sourceIds.length > 0));
  assert.ok(prepared.sources.length >= 5);
  const referenceText = prepared.sources.map((row) => row.notes).join("\n");
  assert.match(referenceText, /\(202\d\).*https?:\/\//s);
  assert.doesNotMatch(referenceText, /требуется проверка|Контрольный|тестов|\|/i);
});
