import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";
import { autoServiceOneBox } from "./fixtures/autoServiceOneBox.ts";
import { importEquipment } from "./fixtures/importEquipment.ts";

 test("business classifier detects auto service one-box scenario", () => {
  const profile = classifyBusiness(autoServiceOneBox);
  assert.equal(profile.category, "services");
  assert.equal(profile.subcategory, "auto_service");
  assert.equal(profile.operationalModel, "inside_partner_location");
  assert.equal(profile.hasEquipment, true);
  assert.equal(profile.hasPremises, true);
  assert.equal(profile.hasEnvironmentalRisk, true);
  assert.equal(profile.hasCustomerFlowDependency, true);
  assert.ok(profile.excludedInterviewBlocks.includes("production_process"));
});

 test("business classifier marks import equipment as high currency exposure candidate", () => {
  const profile = classifyBusiness(importEquipment);
  assert.equal(profile.category, "import_export");
  assert.equal(profile.importsGoodsOrInputs, true);
  assert.equal(profile.hasCurrencyExposure, true);
  assert.ok(profile.requiredDataForAnalysis.includes("incoterms"));
});

 test("business classifier treats clothing alteration atelier as service, not manufacturing", () => {
  const profile = classifyBusiness({
    businessType: "Ателье",
    businessIdea: "Мини-ателье по ремонту и подгонке одежды внутри торгового центра: подшив брюк, ремонт молний и мелкий пошив"
  });
  assert.equal(profile.category, "services");
  assert.equal(profile.subcategory, "tailoring_alteration");
  assert.equal(profile.operationalModel, "inside_partner_location");
  assert.equal(profile.producesGoods, false);
  assert.ok(profile.excludedInterviewBlocks.includes("production_process"));
  assert.equal(profile.capabilities.dependsOnHostBusinessTraffic, true);
});
