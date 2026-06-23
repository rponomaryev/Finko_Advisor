import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { validateVisibleRequiredQuestionsForBlock } from "../src/lib/interview/interviewValidation.ts";
import { getStableQuestions, validateRequiredVisibleFields } from "../src/lib/services/interviewService.ts";
test("clients/sales block save ignores hidden host-service required fields for standalone auto service", () => {
  const data = {
    businessType: "Автосервис",
    businessIdea: "Отдельный автосервис в Ташкенте",
    region: "Ташкент",
    autoServiceFormat: "standalone_service",
    targetCustomerSegments: ["private_car_owners", "taxi_drivers"],
    customerAcquisitionChannels: ["walk_in", "maps_2gis_google_yandex"],
    dailyServiceCapacity: 6,
    averageServiceTicket: 180_000
  };
  const profile = classifyBusiness({ businessType: data.businessType, businessIdea: data.businessIdea, region: data.region, answers: data });
  const template = buildDynamicInterviewTemplate(data);
  const blockId = "sales";
  const validation = validateVisibleRequiredQuestionsForBlock({
    blockId,
    blocks: template.interviewBlocks,
    answers: data,
    profile,
    requiredQuestionKeys: [...template.requiredInputs, "hostServiceTrafficAgreement", "clientPaymentFlow"]
  });

  assert.equal(validation.ok, true);
  assert.deepEqual(validation.invalidFields, []);
  assert.ok(validation.hiddenRequiredFieldsIgnored.includes("hostServiceTrafficAgreement"));
  assert.ok(validation.hiddenRequiredFieldsIgnored.includes("clientPaymentFlow"));
});

test("current block save uses pre-save persisted question set when answers change classification", () => {
  const preSaveData = {
    businessType: "Новый проект",
    businessIdea: "Хочу запустить локальный проект с клиентами",
    region: "Ташкент"
  };
  const stable = getStableQuestions(preSaveData, "business_idea");
  const templateData = { ...preSaveData, ...(stable.planPatch ?? {}) };
  const postAnswerData = {
    ...templateData,
    productOrService: "Буду производить мебель на заказ"
  };

  const validation = validateRequiredVisibleFields(postAnswerData, "business_idea", { templateData });

  assert.equal(validation.valid, true);
  assert.equal(validation.missingFields.includes("productionStages"), false);
});
