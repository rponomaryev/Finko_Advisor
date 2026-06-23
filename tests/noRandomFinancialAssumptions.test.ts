import test from "node:test";
import assert from "node:assert/strict";
import { validateReliableCalculationInputs } from "../src/lib/services/interviewService.ts";

test("retail children clothing calculation is gated until purchase cost and inventory are confirmed", () => {
  const result = validateReliableCalculationInputs({
    businessType: "Магазин детской одежды",
    businessIdea: "Офлайн магазин",
    region: "Ташкент",
    targetCustomerSegments: ["parents"],
    salesChannels: ["walk_in_store"],
    monthlyCapacity: 300,
    averageTicket: 250000,
    ownContributionAmount: 50000000,
    ownContributionCurrency: "UZS",
    creditNeeded: "no"
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "missing_required_financial_fields");
  assert.ok(result.missingFields.includes("initialInventoryCostUZS"));
  assert.ok(result.missingFields.includes("averagePurchaseCost_or_grossMarginPct"));
});
