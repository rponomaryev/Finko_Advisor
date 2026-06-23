import test from "node:test";
import assert from "node:assert/strict";
import { conductMarketResearch } from "../src/lib/market/webResearchService.ts";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";

test("web research fallback returns structured sources and never raw JSON keys as statistics", async () => {
  const originalProvider = process.env.AI_PROVIDER;
  const originalResearch = process.env.ENABLE_WEB_RESEARCH;
  process.env.AI_PROVIDER = "fallback";
  process.env.ENABLE_WEB_RESEARCH = "false";
  const profile = classifyBusiness({ businessType: "магазин детской одежды" });
  const result = await conductMarketResearch(profile, { businessType: "магазин детской одежды", region: "Ташкент" });
  process.env.AI_PROVIDER = originalProvider;
  process.env.ENABLE_WEB_RESEARCH = originalResearch;

  assert.ok(Array.isArray(result.sources));
  assert.ok(result.sources.length >= 5);
  assert.ok(result.harvardReferences.every((item) => /Available at:/.test(item)));
  assert.ok(result.statistics.every((item) => !/["']?(value|sourceUrl|citation|unit)["']?/.test(item.indicator)));
});
