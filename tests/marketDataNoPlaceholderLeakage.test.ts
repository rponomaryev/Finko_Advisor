import test from "node:test";
import assert from "node:assert/strict";
import { buildCalculatedProject, childrenClothingProfile, genericProfile } from "./helpers/systemicFixtures.ts";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";

for (const project of [
  buildCalculatedProject(childrenClothingProfile()),
  buildCalculatedProject(genericProfile({ businessType: "Сервис ремонта кофемашин", category: "services" }))
]) {
  test(`market/export has no placeholder leakage: ${project.businessType}`, () => {
    const prepared = prepareReportExport(project, "ru");
    const text = JSON.stringify({ market: prepared.marketData, sources: prepared.sources, report: prepared.report.marketEvidenceRows });
    assert.doesNotMatch(text, /требуется проверка|profile default|sample default|fallback|undefined|null|NaN|Infinity|__money|sample_|sectionNotes/i);
  });
}
