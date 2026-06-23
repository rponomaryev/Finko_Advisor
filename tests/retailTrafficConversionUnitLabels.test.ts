import test from "node:test";
import assert from "node:assert/strict";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import { resolveRevenueInputs } from "../src/lib/financial/revenueInputResolver.ts";
import { buildCalculatedProject, childrenClothingProfile } from "./helpers/systemicFixtures.ts";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";

test("retail conversion keeps visitors/day separate from sales/month across report/export", () => {
  const profile = childrenClothingProfile();
  const template = resolveTemplateForData(profile);
  const revenue = resolveRevenueInputs(profile, template.assumptions, profile.businessProfile as Record<string, unknown>);
  assert.equal(revenue.formulaKind, "traffic_conversion");
  assert.equal(revenue.monthlyCapacity, 728);
  assert.equal(revenue.unitLabel, "продаж/мес.");
  assert.equal(revenue.displayVolume, 80);
  assert.equal(revenue.displayVolumeUnitLabel, "посетителей/день");

  const prepared = prepareReportExport(buildCalculatedProject(profile), "ru");
  const text = JSON.stringify(prepared);
  assert.match(text, /80 посетителей\/день/);
  assert.match(text, /728 продаж\/мес\./);
  assert.doesNotMatch(text, /728 посетителей\/мес/);
});
