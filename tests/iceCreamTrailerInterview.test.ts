import assert from "node:assert/strict";
import test from "node:test";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";

const input = {
  businessType: "Продажа мороженного в рожках",
  businessIdea: "Хочу открыть трейлер на колесах для продажи мороженного из фризера в рожках в Ташкенте",
  region: "Ташкент город"
};

test("ice cream trailer is classified as a specific food retail model, not generic", () => {
  const profile = classifyBusiness(input);
  assert.equal(profile.category, "food_service");
  assert.equal(profile.subcategory, "ice_cream_mobile_trailer");
  assert.equal(profile.businessModel, "mobile_ice_cream_retail");
  assert.notEqual(profile.category, "generic");
});

test("ice cream trailer interview asks concrete location, equipment, unit economics and staff questions", () => {
  const template = buildDynamicInterviewTemplate(input);
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

  for (const key of [
    "trailerLocationType",
    "monthlyRent",
    "locationTraffic",
    "infrastructureReady",
    "iceCreamEquipment",
    "equipmentCapex",
    "supplierSelected",
    "rawMaterialCostPerUnit",
    "staffPlan"
  ]) {
    assert.ok(template.requiredInputs.includes(key), `${key} should be required`);
  }
});
