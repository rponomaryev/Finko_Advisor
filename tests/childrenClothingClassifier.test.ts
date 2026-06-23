import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";

test("children clothing store is classified as retail with inventory and no sanitary requirements", () => {
  const profile = classifyBusiness({
    businessType: "Магазин детской одежды",
    businessIdea: "Офлайн магазин детской одежды в Чиланзаре с Instagram и Telegram продажами"
  });

  assert.equal(profile.category, "retail");
  assert.equal(profile.subcategory, "children_clothing_store");
  assert.equal(profile.businessModel, "retail_goods_store");
  assert.equal(profile.hasInventory, true);
  assert.equal(profile.hasSanitaryRequirements, false);
  assert.ok(profile.relevantInterviewBlocks.includes("suppliers_procurement"));
});
