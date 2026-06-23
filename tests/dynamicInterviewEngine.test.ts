import test from "node:test";
import assert from "node:assert/strict";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { autoServiceOneBox } from "./fixtures/autoServiceOneBox.ts";
import { foodServiceCafe } from "./fixtures/foodServiceCafe.ts";

function keysFor(data: Record<string, unknown>) {
  return buildDynamicInterviewTemplate(data).interviewBlocks.flatMap((block) => block.questions.map((question) => question.key));
}

test("dynamic interview keeps common blocks while adapting questions to auto-service", () => {
  const template = buildDynamicInterviewTemplate(autoServiceOneBox);
  const keys = keysFor(autoServiceOneBox);
  const blockIds = template.interviewBlocks.map((block) => block.id);

  for (const id of ["business_idea", "sales", "location", "equipment_launch", "operations", "financing", "documents_experience"]) {
    assert.ok(blockIds.includes(id), `missing common block ${id}`);
  }
  assert.equal(blockIds.some((id) => id.startsWith("auto_service_")), false);

  for (const requiredKey of [
    "autoServiceFormat",
    "boxLeaseModel",
    "subleaseAllowed",
    "includedInfrastructure",
    "serviceCategories",
    "dailyServiceCapacity",
    "averageServiceTicket",
    "customerAcquisitionChannels",
    "clientPaymentFlow",
    "equipmentOwnership",
    "consumablesSource",
    "supplierCurrency",
    "foreignCurrencyPurchases",
    "wasteOilHandlingPlan",
    "warrantyPolicy"
  ]) {
    assert.ok(keys.includes(requiredKey), `missing auto-service key ${requiredKey}`);
  }

  assert.equal(keys.includes("skuCount"), false);
  assert.equal(keys.includes("productionStages"), false);
  assert.equal(keys.includes("menuCategories"), false);
});

test("dynamic interview asks cafe questions and avoids import-only questions", () => {
  const keys = keysFor(foodServiceCafe);
  assert.ok(keys.includes("menuCategories"));
  assert.ok(keys.includes("dailyCovers"));
  assert.ok(keys.includes("sanitaryPermits"));
  assert.equal(keys.includes("incoterms"), false);
  assert.equal(keys.includes("customsBroker"), false);
});

test("monthly rent is conditionally asked after rent/sublease premises status across samples", () => {
  const template = buildDynamicInterviewTemplate({
    businessType: "Мебельное производство",
    businessIdea: "Цех корпусной мебели на заказ: кухни, шкафы и офисная мебель в Самарканде.",
    region: "Самаркандская область",
    userLanguage: "ru"
  });
  const location = template.interviewBlocks.find((block) => block.id === "location");
  assert.ok(location, "location block is missing");
  const statusIndex = location.questions.findIndex((question) => question.key === "premisesStatus");
  const rentIndex = location.questions.findIndex((question) => question.key === "monthlyRent");
  assert.ok(statusIndex >= 0, "premisesStatus is missing");
  assert.ok(rentIndex > statusIndex, "monthlyRent must be asked immediately after premisesStatus for rented premises");
  const rentQuestion = location.questions[rentIndex];
  assert.equal(rentQuestion.optional, false);
  assert.equal(rentQuestion.required, true);
  assert.equal(rentQuestion.isRequired, true);
  assert.deepEqual(rentQuestion.showIf, { premisesStatus: ["rent", "sublease", "street_retail_rent", "mall_point", "rented_space", "office_and_storage", "small_office", "storage_only"] });
});

test("car wash also asks monthly rent when premises are rented", () => {
  const template = buildDynamicInterviewTemplate({
    businessType: "Автомойка",
    businessIdea: "Автомойка на 3 поста рядом с дорогой и жилым массивом.",
    region: "Ташкент город",
    userLanguage: "ru"
  });
  const keys = template.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key));
  assert.ok(keys.includes("monthlyRent"), "car wash interview must include monthlyRent");
});
