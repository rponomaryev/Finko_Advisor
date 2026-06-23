import test from "node:test";
import assert from "node:assert/strict";
import { buildCalculatedProject, childrenClothingProfile } from "./helpers/systemicFixtures.ts";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";

test("retail clothing market data is honest and sources are not fake repeated metrics", () => {
  const prepared = prepareReportExport(buildCalculatedProject(childrenClothingProfile()), "ru");
  const text = JSON.stringify({ market: prepared.marketData, evidence: prepared.marketEvidenceRows, sources: prepared.sources });
  assert.doesNotMatch(text, /население требуется проверка|450\.5|Выручка от поставок одежды на внешние рынки.*450\.5/i);
  assert.doesNotMatch(text, /\|/);
  assert.ok(prepared.sources.length >= 3);
  for (const source of prepared.sources) {
    assert.ok(source.sourceName);
    assert.match(source.url, /^https?:\/\//);
    assert.match(source.notes, /\(20\d{2}\).+(https?:\/\/).+(дата обращения|Accessed|murojaat)/i);
  }
});
