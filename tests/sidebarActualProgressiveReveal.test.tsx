import test from "node:test";
import assert from "node:assert/strict";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import { resolveSidebarSummaryItems } from "../src/lib/summary/sidebarSummaryResolver.ts";
import { childrenClothingProfile } from "./helpers/systemicFixtures.ts";

function sidebarText(completedBlockIds: string[]) {
  const profile = childrenClothingProfile({ completedBlockIds });
  const template = resolveTemplateForData(profile);
  return resolveSidebarSummaryItems(profile, template, "ru").map((item) => `${item.label}: ${item.displayValue}`).join("\n");
}

test("actual sidebar progressive reveal gates sales and financing values by completed block", () => {
  const beforeSales = sidebarText(["business_idea", "location", "equipment_launch", "operations"]);
  assert.doesNotMatch(beforeSales, /Плановый|Средний чек|Собственные средства|Кредит|728\s+продаж|80\s+чел|35%|180\s*000\s*UZS|220\s*000\s*000\s*UZS|120\s*000\s*000\s*UZS/);
  assert.doesNotMatch(beforeSales, /5\s*ед|85\s*ед|85\s*UZS|0\s*UZS/);

  const afterSales = sidebarText(["business_idea", "location", "equipment_launch", "operations", "sales"]);
  assert.match(afterSales, /728\s+продаж\/мес\./);
  assert.match(afterSales, /80\s+чел\.\/день|80\s+посетителей\/день/);
  assert.match(afterSales, /35%/);
  assert.match(afterSales, /180\s*000\s*UZS/);
  assert.doesNotMatch(afterSales, /220\s*000\s*000\s*UZS|120\s*000\s*000\s*UZS/);

  const afterFinance = sidebarText(["business_idea", "location", "equipment_launch", "operations", "sales", "financing"]);
  assert.match(afterFinance, /220\s*000\s*000\s*UZS/);
  assert.match(afterFinance, /120\s*000\s*000\s*UZS|Кредит/);
});
