import test from "node:test";
import assert from "node:assert/strict";
import { buildDynamicInterviewTemplate, commonBlockShells } from "../src/lib/interview/dynamicInterviewEngine.ts";

const requiredCommonBlocks = [...commonBlockShells];

function templateFor(businessType: string, businessIdea: string) {
  return buildDynamicInterviewTemplate({ businessType, businessIdea, region: "Ташкент город" });
}

function keys(template: ReturnType<typeof buildDynamicInterviewTemplate>) {
  return template.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key));
}

test("common blocks always remain and their content adapts for pet grooming", () => {
  const template = templateFor("Мобильный груминг животных", "Выездной груминг собак и кошек, косметика только как расходник, запись через Instagram и Telegram");
  const blockIds = template.interviewBlocks.map((block) => block.id);
  for (const id of requiredCommonBlocks) assert.ok(blockIds.includes(id), `missing ${id}`);
  assert.equal(blockIds.includes("retail"), false);
  assert.equal(blockIds.includes("logistics"), false);
  const allKeys = keys(template);
  for (const key of ["petTypes", "groomingServiceTypes", "bookingChannels", "groomingVisitsPerMonth", "averageGroomingTicket", "groomingSterilizationPlan", "animalIntakeForm", "groomingLiabilityPolicy"]) {
    assert.ok(allKeys.includes(key), `missing grooming key ${key}`);
  }
  for (const wrong of ["productCategories", "skuCount", "marketplaces", "transportType", "fleet", "drivers"]) {
    assert.equal(allKeys.includes(wrong), false, `wrong key leaked: ${wrong}`);
  }
});

test("common blocks adapt to tool rental without full logistics block", () => {
  const template = templateFor("Аренда строительного инструмента", "Прокат перфораторов и бетономешалок с пунктом выдачи, залогом, договором и вспомогательной доставкой");
  const blockIds = template.interviewBlocks.map((block) => block.id);
  for (const id of requiredCommonBlocks) assert.ok(blockIds.includes(id), `missing ${id}`);
  assert.equal(blockIds.includes("logistics"), false);
  assert.equal(blockIds.some((id) => id.startsWith("tool_rental_")), false);
  const allKeys = keys(template);
  for (const key of ["rentalToolCategories", "rentalFleetSize", "rentalPricingModel", "rentalOrdersPerMonth", "averageRentalTicket", "depositPolicy", "handoverActRequired", "damageLossPolicy", "toolMaintenancePlan"]) {
    assert.ok(allKeys.includes(key), `missing rental key ${key}`);
  }
  for (const wrong of ["routes", "drivers", "tariff", "skuCount", "productionStages"]) {
    assert.equal(allKeys.includes(wrong), false, `wrong key leaked: ${wrong}`);
  }
});
