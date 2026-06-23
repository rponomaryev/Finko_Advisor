import test from "node:test";
import assert from "node:assert/strict";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import { resolveSidebarSummaryItems } from "../src/lib/summary/sidebarSummaryResolver.ts";
import { resolveRevenueInputs } from "../src/lib/financial/revenueInputResolver.ts";
import { childrenClothingProfile } from "./helpers/systemicFixtures.ts";

test("retail traffic/conversion planned volume shows calculated monthly sales, not raw traffic", () => {
  const profile = childrenClothingProfile();
  const template = resolveTemplateForData(profile);
  const revenue = resolveRevenueInputs(profile, template.assumptions, profile.businessProfile as Record<string, unknown>);
  assert.equal(revenue.monthlyCapacity, 728);
  assert.equal(revenue.monthlyRevenue, 131_040_000);
  assert.equal(revenue.formulaKind, "traffic_conversion");

  const sidebar = resolveSidebarSummaryItems(profile, template, "ru");
  const planned = sidebar.find((item) => item.key === "calculatedMonthlySales");
  const traffic = sidebar.find((item) => item.key === "dailyTraffic");
  const conversion = sidebar.find((item) => item.key === "conversion");
  assert.equal(planned?.displayValue, "728 продаж/мес.");
  assert.match(traffic?.displayValue ?? "", /80 .*день/);
  assert.equal(conversion?.displayValue, "35%");
  assert.notEqual(planned?.displayValue, "80");
});
