import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";

const forbiddenAutoKeys = [
  "autoServiceFormat",
  "boxLeaseModel",
  "boxLeaseTerms",
  "subleaseAllowed",
  "parentAutoServiceName",
  "liftIncluded",
  "compressorIncluded",
  "carsServedAtOnce",
  "wasteOilHandling",
  "wasteOilHandlingPlan",
  "gasEquipmentInstallation",
  "paintingOrBodywork",
  "vehicleModificationServices"
];

function blockIdsFor(data: Record<string, unknown>) {
  return buildDynamicInterviewTemplate(data).interviewBlocks.map((block) => block.id);
}

function questionKeysFor(data: Record<string, unknown>) {
  return buildDynamicInterviewTemplate(data).interviewBlocks.flatMap((block) => block.questions.map((question) => question.key));
}

test("cleaning classifies as cleaning service and ignores poisoned persisted interview plan", () => {
  const profile = classifyBusiness({
    businessType: "Клининговые услуги",
    businessIdea: "Уборка квартир и офисов",
    region: "Ташкент город",
    answers: {
      interviewPlan: {
        blocks: {
          auto_service_format: {
            blockId: "auto_service_format",
            generatedBy: "template",
            generatedAt: "2026-01-01T00:00:00.000Z",
            questions: [{ key: "autoServiceFormat", label: "Автосервис", question: "Автосервис?", type: "select" }],
            requiredQuestionKeys: ["autoServiceFormat"],
            optionalQuestionKeys: []
          }
        }
      }
    } as any
  });

  assert.equal(profile.category, "services");
  assert.equal(profile.subcategory, "cleaning_service");
});

test("cleaning template includes cleaning blocks and no auto-service blocks or fields", () => {
  const data = {
    businessType: "Клининговые услуги",
    businessIdea: "Хочу открыть клининг для квартир, офисов и B2B клиентов в Ташкенте",
    region: "Ташкент город"
  };

  const blockIds = blockIdsFor(data);
  const keys = questionKeysFor(data);

  assert.equal(blockIds.some((id) => id.startsWith("auto_service")), false);
  for (const id of ["business_idea", "sales", "location", "equipment_launch", "operations", "financing", "documents_experience"]) {
    assert.ok(blockIds.includes(id), `missing common block ${id}`);
  }

  for (const key of forbiddenAutoKeys) {
    assert.equal(keys.includes(key), false, `cleaning leaked auto-service field ${key}`);
  }
});

test("generic service businesses do not receive auto-service blocks", () => {
  for (const businessType of ["ремонт бытовой техники", "юридические услуги", "маркетинговое агентство", "клининг", "курьерская служба"]) {
    const blockIds = blockIdsFor({
      businessType,
      businessIdea: `${businessType} в Ташкенте`,
      region: "Ташкент город"
    });

    assert.equal(blockIds.some((id) => id.startsWith("auto_service")), false, businessType);
  }
});

test("auto service still receives auto-service questions inside common blocks", () => {
  const blockIds = blockIdsFor({
    businessType: "Автосервис",
    businessIdea: "Один бокс внутри большого автосервиса для диагностики и замены масла",
    region: "Ташкент город"
  });

  for (const id of ["business_idea", "sales", "location", "equipment_launch", "operations", "financing", "documents_experience"]) {
    assert.ok(blockIds.includes(id), `missing common block ${id}`);
  }
  assert.equal(blockIds.some((id) => id.startsWith("auto_service_")), false);
  const keys = questionKeysFor({
    businessType: "Автосервис",
    businessIdea: "Один бокс внутри большого автосервиса для диагностики и замены масла",
    region: "Ташкент город"
  });
  assert.ok(keys.includes("autoServiceFormat"));
  assert.ok(keys.includes("boxLeaseModel"));
});
