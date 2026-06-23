import test from "node:test";
import assert from "node:assert/strict";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import { resolveSidebarSummaryItems } from "../src/lib/summary/sidebarSummaryResolver.ts";
import { childrenClothingProfile } from "./helpers/systemicFixtures.ts";

test("sidebar does not show financial values before related blocks are completed", () => {
  const profile = childrenClothingProfile({
    completedBlockIds: ["business_idea", "location"],
    traffic: 80,
    conversion: 35,
    averageTicket: 180_000,
    equipmentCapex: 85_000_000,
    ownContributionAmount: 0,
    ownContributionUZS: 0,
    requestedLoanAmount: 120_000_000
  });
  const template = resolveTemplateForData(profile);
  const sidebar = resolveSidebarSummaryItems(profile, template, "ru");
  const text = sidebar.map((item) => `${item.label}: ${item.displayValue}`).join("\n");
  assert.doesNotMatch(text, /Плановый|Средний чек|Собственные средства|Кредит/i);
  assert.doesNotMatch(text, /5\s*ед|85\s*ед|85\s*UZS|0\s*UZS/);
});
