import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { translateBlock, translateQuestion } from "../src/lib/i18n/interviewLabels.ts";
import { labelValue } from "../src/lib/utils/labels.ts";

const toolRentalInput = {
  businessType: "Аренда строительного инструмента",
  businessIdea:
    "Хочу открыть сервис аренды строительного инструмента и оборудования в Ташкенте. Планирую сдавать в аренду перфораторы, шлифмашины, сварочные аппараты, бетономешалки и другое оборудование для частных мастеров, ремонтных бригад и небольших строительных компаний. Будет пункт выдачи, залог, договор аренды, доставка по городу, обслуживание и ремонт инструмента.",
  region: "Ташкент город"
};

test("tool rental is classified as tool_equipment_rental, not logistics", () => {
  const profile = classifyBusiness(toolRentalInput);
  assert.equal(profile.category, "services");
  assert.equal(profile.subcategory, "tool_equipment_rental");
  assert.notEqual(profile.category, "logistics");
});

test("tool rental keeps common blocks with adapted rental questions and no logistics/autoservice leakage", () => {
  const template = buildDynamicInterviewTemplate(toolRentalInput);
  const blockIds = template.interviewBlocks.map((block) => block.id);

  for (const id of ["business_idea", "sales", "location", "equipment_launch", "operations", "financing", "documents_experience"]) {
    assert.ok(blockIds.includes(id), `missing common block ${id}`);
  }
  assert.equal(blockIds.includes("logistics"), false);
  assert.equal(blockIds.some((id) => id.startsWith("tool_rental_")), false);
  assert.equal(blockIds.some((id) => id.startsWith("auto_service")), false);
  assert.equal(blockIds.some((id) => id.startsWith("car_wash")), false);

  const keys = template.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key));
  for (const expected of ["rentalToolCategories", "depositPolicy", "handoverActRequired", "damageLossPolicy", "toolMaintenancePlan", "deliveryModel"]) {
    assert.ok(keys.includes(expected), expected);
  }
  for (const forbidden of ["transportType", "routes", "fleet", "fuel", "drivers", "tariff"]) {
    assert.equal(keys.includes(forbidden), false, forbidden);
  }
});

test("tool rental labels are localized and do not expose raw enum values", () => {
  const template = buildDynamicInterviewTemplate(toolRentalInput);
  const rendered = template.interviewBlocks.flatMap((block) => {
    const translatedBlock = translateBlock("ru", block.id, block.name, block.description);
    return [
      translatedBlock.name,
      ...block.questions.flatMap((question) => {
        const translated = translateQuestion("ru", question);
        return [translated.label, translated.question, ...(question.options ?? []).map((option) => labelValue(option, "ru"))];
      })
    ];
  }).join("\n");

  assert.match(rendered, /аренд/i);
  assert.match(rendered, /Залог/);
  assert.match(rendered, /Акт приема-передачи/);
  assert.doesNotMatch(rendered, /\bcontracts\b|\bonline\b|power_tools|deposit_plus_rent|pickup_only|card_hold/);
  assert.doesNotMatch(rendered, /Автомойка|Автосервисный|Отработанное масло|Газовое оборудование/);
});
