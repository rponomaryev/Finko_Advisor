import test from "node:test";
import assert from "node:assert/strict";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import { resolveSidebarSummaryItems } from "../src/lib/summary/sidebarSummaryResolver.ts";
import { childrenClothingProfile } from "./helpers/systemicFixtures.ts";

test("profile/default/assumption/sample values are not rendered as user facts", () => {
  const profile = childrenClothingProfile({
    targetCustomerSegments: ["parents"],
    salesChannels: ["instagram"],
    fieldSources: {
      targetCustomers: "sample_default",
      customerAcquisitionChannels: "profile_default",
      monthlyCapacity: "assumption"
    },
    targetCustomers: ["delivery", "wholesalers", "marketplaces"],
    customerAcquisitionChannels: ["marketplaces"],
    monthlyCapacity: 999
  });
  const sidebar = resolveSidebarSummaryItems(profile, resolveTemplateForData(profile), "ru");
  assert.ok(sidebar.every((item) => item.source === "user_answer" || item.source === "calculated"));
  assert.doesNotMatch(sidebar.map((item) => item.displayValue).join(" | "), /Доставка|Оптовики|Маркетплейсы|999/i);
});

test("targetCustomerSegments wins over stale targetCustomers and channels are separate", () => {
  const profile = childrenClothingProfile({
    targetCustomerSegments: ["parents", "families_with_children"],
    targetCustomers: ["delivery", "wholesalers", "marketplaces"],
    salesChannels: ["instagram", "telegram"]
  });
  const sidebar = resolveSidebarSummaryItems(profile, resolveTemplateForData(profile), "ru");
  const customers = sidebar.find((item) => item.key === "customerSegments")?.displayValue ?? "";
  const channels = sidebar.find((item) => item.key === "salesChannels")?.displayValue ?? "";
  assert.match(customers, /Родител|сем/i);
  assert.doesNotMatch(customers, /Доставка|Оптовики|Маркетплейсы/i);
  assert.match(channels, /Instagram|Telegram/i);
});

test("old stale keys do not override latest structuredData/source-marked answers", () => {
  const profile = childrenClothingProfile({
    fieldSources: { targetCustomers: "sample_default", targetCustomerSegments: "user_answer" },
    targetCustomers: ["delivery", "wholesalers"],
    targetCustomerSegments: ["Онлайн-покупатели"]
  });
  const sidebar = resolveSidebarSummaryItems(profile, resolveTemplateForData(profile), "ru");
  const text = sidebar.map((item) => item.displayValue).join(" | ");
  assert.doesNotMatch(text, /Доставка|Оптовики/i);
  assert.match(text, /онлайн/i);
});
