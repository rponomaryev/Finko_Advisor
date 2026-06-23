import test from "node:test";
import assert from "node:assert/strict";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";

function keysFor(data: Record<string, unknown>) {
  const template = buildDynamicInterviewTemplate(data);
  return {
    template,
    blockIds: template.interviewBlocks.map((block) => block.id),
    keys: template.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key)),
    required: template.requiredInputs
  };
}

test("sector-specific interviews keep common blocks and avoid wrong generic/foreign fields", () => {
  const scenarios = [
    {
      name: "cafe",
      data: { businessType: "Кафе", businessIdea: "Кофейня с завтраками в Ташкенте", region: "Ташкент город" },
      includes: ["format", "dailyCovers", "kitchenEquipment", "sanitaryPermits"],
      excludes: ["monthlyCapacity", "productOrService", "incoterms", "customsBroker"]
    },
    {
      name: "education",
      data: { businessType: "Учебный центр", businessIdea: "Курсы английского для детей", region: "Ташкент город" },
      includes: ["format", "studentsCount", "averageTicket", "teachers"],
      excludes: ["monthlyCapacity", "averagePrice", "menuCategories"]
    },
    {
      name: "healthcare",
      data: { businessType: "Медицинская клиника", businessIdea: "Частная клиника анализы и консультации", region: "Ташкент город" },
      includes: ["targetCustomers", "monthlyCapacity", "averagePrice", "equipmentList"],
      excludes: ["skuCount", "productionStages", "menuCategories"]
    },
    {
      name: "generic service",
      data: { businessType: "Ремонт бытовой техники", businessIdea: "Выездной ремонт стиральных машин и холодильников", region: "Ташкент город" },
      includes: ["targetCustomers", "monthlyCapacity", "averagePrice", "qualityControlPlan"],
      excludes: ["skuCount", "productionStages", "menuCategories"]
    }
  ];

  const commonBlocks = ["business_idea", "sales", "location", "equipment_launch", "operations", "financing", "documents_experience"];
  for (const scenario of scenarios) {
    const { blockIds, keys, required } = keysFor(scenario.data);
    for (const id of commonBlocks) assert.ok(blockIds.includes(id), `${scenario.name}: expected common block ${id}`);
    const searchable = new Set([...blockIds, ...keys]);
    for (const item of scenario.includes) assert.ok(searchable.has(item), `${scenario.name}: expected ${item}`);
    for (const item of scenario.excludes) {
      assert.equal(keys.includes(item), false, `${scenario.name}: repeated or wrong key ${item}`);
      assert.equal(required.includes(item), false, `${scenario.name}: hidden required input ${item}`);
    }
  }
});

test("required inputs are only fields that are actually asked in the generated interview", () => {
  const scenarios = [
    { businessType: "Кафе", businessIdea: "Кофейня", region: "Ташкент город" },
    { businessType: "Мебельное производство", businessIdea: "Производство мебели на заказ", region: "Ташкент город" },
    { businessType: "Магазин косметики", businessIdea: "Розничный магазин косметики", region: "Ташкент город" },
    { businessType: "Курьерская доставка", businessIdea: "Доставка по городу", region: "Ташкент город" },
    { businessType: "Учебный центр", businessIdea: "Курсы английского", region: "Ташкент город" },
    { businessType: "Автомойка", businessIdea: "Автомойка на 3 поста", region: "Ташкент город" }
  ];

  for (const data of scenarios) {
    const { template, keys, required } = keysFor(data);
    const keySet = new Set(keys);
    for (const key of required) {
      assert.ok(keySet.has(key), `${template.code}: required input ${key} is not present in interview questions`);
    }
  }
});
