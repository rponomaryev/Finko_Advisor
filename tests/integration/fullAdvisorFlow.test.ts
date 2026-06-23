import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness } from "../../src/lib/business/businessClassifier.ts";
import { buildDynamicInterviewTemplate } from "../../src/lib/interview/dynamicInterviewEngine.ts";
import { buildMarketEvidence } from "../../src/lib/market/statisticsEngine.ts";
import { getDocumentRequirements } from "../../src/lib/compliance/documentsRegistry.ts";
import { generateRiskMatrix } from "../../src/lib/scoring/riskEngine.ts";
import { autoServiceOneBox } from "../fixtures/autoServiceOneBox.ts";

test("full advisor flow composes classification, questions, evidence, documents and risks", () => {
  const profile = classifyBusiness(autoServiceOneBox);
  const template = buildDynamicInterviewTemplate(autoServiceOneBox);
  const evidence = buildMarketEvidence(autoServiceOneBox, 10);
  const documents = getDocumentRequirements(autoServiceOneBox);
  const risks = generateRiskMatrix({ ...autoServiceOneBox, businessProfile: profile, businessType: autoServiceOneBox.businessType });
  assert.equal(profile.subcategory, "auto_service");
  assert.ok(template.interviewBlocks.some((block) => block.id === "business_idea"));
  assert.ok(template.interviewBlocks.flatMap((block) => block.questions).some((question) => question.key === "autoServiceFormat"));
  assert.ok(evidence.length >= 5);
  assert.ok(documents.some((doc) => doc.id === "auto_service_waste_oil"));
  assert.ok(risks.some((risk) => risk.code === "fx_risk"));
});
