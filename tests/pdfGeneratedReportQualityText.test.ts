import test from "node:test";
import assert from "node:assert/strict";
import { buildCalculatedProject, childrenClothingProfile } from "./helpers/systemicFixtures.ts";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";

test("prepared PDF/export text has no manual-QA leakage", () => {
  const prepared = prepareReportExport(buildCalculatedProject(childrenClothingProfile()), "ru");
  const text = JSON.stringify({ financial: prepared.financialRows, risks: prepared.risks, docs: prepared.documentRows, sources: prepared.sources, conclusion: prepared.detailedConclusion });
  assert.doesNotMatch(text, /728 посетителей\/мес/);
  assert.doesNotMatch(text, /требуется проверка|обычных сервисных услуг|Специальная лицензия|450\.5|\|/i);
  assert.match(text, /728 продаж\/мес\./);
  assert.match(text, /Недостаточный DSCR|размерн|сезон/i);
});
