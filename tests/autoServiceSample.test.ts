import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { autoServiceOneBox } from "./fixtures/autoServiceOneBox.ts";

test("auto-service sample is present and detailed enough for advisor samples", () => {
  const source = readFileSync("scripts/generate-sample-reports.ts", "utf8");
  assert.match(source, /auto-service-one-box-report/);
  assert.match(source, /Автосервис: 1 бокс/);
  assert.ok(existsSync("tests/fixtures/autoServiceOneBox.ts"));
});

test("auto-service one-box fixture teaches AI the exact service context", () => {
  const profile = classifyBusiness(autoServiceOneBox);
  const template = buildDynamicInterviewTemplate(autoServiceOneBox);
  const keys = new Set(template.interviewBlocks.flatMap((block) => block.questions.map((q) => q.key)));

  assert.equal(profile.category, "services");
  assert.equal(profile.subcategory, "auto_service");
  assert.equal(profile.operationalModel, "inside_partner_location");
  assert.equal(autoServiceOneBox.autoServiceFormat, "one_box_inside_larger_service");
  assert.equal(autoServiceOneBox.consumablesSource, "mixed");
  assert.equal(autoServiceOneBox.foreignCurrencyPurchases, true);
  assert.ok(keys.has("boxLeaseModel"));
  assert.ok(keys.has("clientPaymentFlow"));
  assert.ok(keys.has("customerAcquisitionChannels"));
  assert.ok(keys.has("wasteOilHandlingPlan"));
});
