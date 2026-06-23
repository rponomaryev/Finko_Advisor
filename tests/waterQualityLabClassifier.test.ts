import assert from "node:assert/strict";
import test from "node:test";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { waterQualityLabFixture } from "./fixtures/waterQualityLab.ts";

function classifyWaterLab() {
  return classifyBusiness({
    businessType: waterQualityLabFixture.businessType,
    businessIdea: waterQualityLabFixture.businessIdea,
    region: waterQualityLabFixture.region
  });
}

test("water quality lab is not classified as food_service", () => {
  const result = classifyWaterLab();
  assert.notEqual(result.category, waterQualityLabFixture.forbiddenCategory);
});

test("water quality lab is classified as analytical laboratory", () => {
  const result = classifyWaterLab();
  assert.equal(result.category, waterQualityLabFixture.expectedCategory);
  assert.equal(result.subcategory, waterQualityLabFixture.expectedSubcategory);
});

test("water quality lab detects mobile service model", () => {
  const result = classifyWaterLab();
  assert.equal(result.operationalModel, "mobile_service");
});

test("water quality lab excludes food-specific interview blocks", () => {
  const result = classifyWaterLab();
  for (const block of waterQualityLabFixture.forbiddenBlocks) {
    assert.ok(result.excludedInterviewBlocks.includes(block));
  }
});

test("water quality lab interview template contains laboratory blocks and no menu questions", () => {
  const template = buildDynamicInterviewTemplate({
    businessType: waterQualityLabFixture.businessType,
    businessIdea: waterQualityLabFixture.businessIdea,
    region: waterQualityLabFixture.region
  });
  const blockIds = template.interviewBlocks.map((block) => block.id);
  assert.deepEqual(blockIds, [
    "business_idea",
    "location",
    "equipment_launch",
    "operations",
    "suppliers_procurement",
    "sales",
    "financing",
    "documents_experience"
  ]);
  assert.ok(!blockIds.includes("food_service_menu"));
  const allKeys = template.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key));
  assert.ok(!allKeys.includes("dailyCovers"));
  assert.ok(!allKeys.includes("seatingCapacity"));
});
