import test from "node:test";
import assert from "node:assert/strict";
import { buildCalculatedProject, childrenClothingProfile } from "./helpers/systemicFixtures.ts";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";

test("report sources use Harvard-like references without raw pipe-separated strings", () => {
  const prepared = prepareReportExport(buildCalculatedProject(childrenClothingProfile()), "ru");
  assert.ok(prepared.sources.length >= 3);
  for (const source of prepared.sources) {
    assert.match(source.notes, /^.+ \(20\d{2}\) .+\. .+(https?:\/\/).+\(.+\)$/);
    assert.doesNotMatch(source.notes, /\|/);
    assert.doesNotMatch(source.notes, /требуется проверка|450\.5/);
  }
});
