import test from "node:test";
import assert from "node:assert/strict";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import { resolveSidebarSummaryItems } from "../src/lib/summary/sidebarSummaryResolver.ts";
import { childrenClothingProfile } from "./helpers/systemicFixtures.ts";

function textFor(completedBlockIds: string[]) {
  const profile = childrenClothingProfile({ completedBlockIds });
  const template = resolveTemplateForData(profile);
  return resolveSidebarSummaryItems(profile, template, "ru").map((item) => `${item.key}:${item.displayValue}`).join("\n");
}

test("sidebar fields appear only after their source blocks are saved", () => {
  const beforeSales = textFor(["business_idea", "location", "equipment_launch"]);
  assert.doesNotMatch(beforeSales, /728 продаж\/мес|180\s*000\s*UZS|220\s*000\s*000\s*UZS/);

  const afterSales = textFor(["business_idea", "location", "equipment_launch", "sales"]);
  assert.match(afterSales, /728 продаж\/мес/);
  assert.match(afterSales, /180\s*000\s*UZS/);
  assert.doesNotMatch(afterSales, /220\s*000\s*000\s*UZS/);

  const afterFinance = textFor(["business_idea", "location", "equipment_launch", "sales", "financing"]);
  assert.match(afterFinance, /220\s*000\s*000\s*UZS/);
});
