import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { cleaningService } from "./fixtures/cleaningService.ts";

test("cleaning services classify as dedicated cleaning service profile", () => {
  const profile = classifyBusiness(cleaningService);
  assert.equal(profile.category, "services");
  assert.equal(profile.subcategory, "cleaning_service");
  assert.equal(profile.hasEquipment, true);
  assert.equal(profile.hasInventory, true);
  assert.equal(profile.hasPremises, false);
  assert.deepEqual(profile.relevantInterviewBlocks, [
    "business_idea",
    "location",
    "equipment_launch",
    "operations",
    "suppliers_procurement",
    "sales",
    "financing",
    "documents_experience"
  ]);
  assert.ok(profile.additionalInterviewTopics?.includes("cleaning_service_model"));
  assert.ok(profile.excludedInterviewBlocks.includes("auto_service_format"));
});

test("cleaning template contains the expected specialized question keys", () => {
  const template = buildDynamicInterviewTemplate(cleaningService as any);
  const keys = new Set(template.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key)));

  for (const required of [
    "cleaningServiceTypes",
    "cleaningBusinessModel",
    "targetCustomers",
    "customerAcquisitionChannels",
    "premisesStatus",
    "transportNeeds",
    "equipmentList",
    "cleaningChemicals",
    "chemicalStorageSafety",
    "teamSizePerOrder",
    "dailyOrdersCapacity",
    "pricingModel",
    "averageCleaningTicket",
    "clientContracts",
    "damageLiability",
    "chemicalSafetyRules",
    "requiredPermits"
  ]) assert.ok(keys.has(required), `missing ${required}`);
});
import { getNextFallbackQuestions, getNextCursorBlockId } from "../src/lib/ai/fallbackInterview.ts";

test("cleaning service alias uses sample overlay and does not stop on empty procurement block", () => {
  const profile = classifyBusiness({
    businessType: "клининговая служба",
    businessIdea: "Выездная клининговая служба в Ташкенте для квартир, офисов и B2B договоров"
  });
  assert.equal(profile.aiClassification?.sampleId, "cleaning_company");

  const template = buildDynamicInterviewTemplate({
    businessType: "клининговая служба",
    businessIdea: "Выездная клининговая служба в Ташкенте для квартир, офисов и B2B договоров",
    region: "Ташкент город"
  } as any);
  const procurementBlock = template.interviewBlocks.find((block) => block.id === "suppliers_procurement");
  assert.ok(procurementBlock, "missing suppliers_procurement block");
  assert.ok(procurementBlock.questions.length > 0, "sample-specific procurement questions must not be empty");

  const afterOperations = {
    ...cleaningService,
    businessType: "клининговая служба",
    completedBlockIds: ["business_idea", "location", "equipment_launch", "operations"]
  } as any;
  assert.equal(getNextCursorBlockId(afterOperations, "operations"), "suppliers_procurement");

  const response = getNextFallbackQuestions(afterOperations, { blockId: "suppliers_procurement", includeAnswered: true });
  assert.equal(response.blockId, "suppliers_procurement");
  assert.equal(response.nextBlockId, "sales");
  assert.equal(response.isInterviewComplete, false);
  assert.ok(response.questions.length > 0, "procurement block should render questions instead of completion panel");
});
