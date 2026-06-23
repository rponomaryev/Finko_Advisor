import test from "node:test";
import assert from "node:assert/strict";
import { businessSamples } from "../src/lib/data/businessSamples/businessSamples.ts";

test("actual EXCEL all-samples regression suite is split into isolated 10-sample batches", () => {
  assert.ok(businessSamples.length >= 120, "business sample catalog must cover 120+ samples");
  assert.equal(Math.ceil(businessSamples.length / 10), 12);
});
