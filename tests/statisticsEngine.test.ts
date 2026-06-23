import test from "node:test";
import assert from "node:assert/strict";
import { buildMarketEvidence } from "../src/lib/market/statisticsEngine.ts";
import { foodServiceCafe } from "./fixtures/foodServiceCafe.ts";

test("statistics engine creates source-backed market evidence without inventing numbers", () => {
  const evidence = buildMarketEvidence(foodServiceCafe, 12);
  assert.ok(evidence.length >= 5);
  assert.ok(evidence.length <= 12);
  assert.ok(evidence.every((item) => item.sourceName && item.sourceType && item.confidence && item.extractedAt));
  assert.ok(evidence.some((item) => item.value === undefined && item.limitation?.includes("ручная проверка")));
});
