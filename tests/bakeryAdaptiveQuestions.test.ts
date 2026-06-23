import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";

const bakeryProject = {
  businessType: "Мини-пекарня с кофе навынос",
  businessIdea: "Небольшая пекарня у жилого массива, продает свежую выпечку, самсу, круассаны, хлеб, кофе и чай навынос. Основные клиенты — жители района, офисные сотрудники и студенты.",
  region: "Ташкент"
};

test("bakery with office-worker customers is classified as food_service bakery", () => {
  const result = classifyBusiness({
    businessType: bakeryProject.businessType,
    businessIdea: bakeryProject.businessIdea,
    region: bakeryProject.region,
    answers: bakeryProject
  });

  assert.equal(result.category, "food_service");
  assert.equal(result.subcategory, "bakery");
  assert.equal(result.sellsGoods, true);
  assert.equal(result.producesGoods, true);
});

test("bakery adaptive pack asks bakery-specific missing-data questions", () => {
  const template = buildDynamicInterviewTemplate({ ...bakeryProject, userLanguage: "ru" });
  const keys = template.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key));

  assert.ok(keys.includes("bakeryProductionSchedule"));
  assert.ok(keys.includes("ingredientSupplyPlan"));
  assert.ok(keys.includes("dailyWastePct"));
  assert.ok(keys.includes("sanitaryProductionFlow"));
  assert.ok(keys.includes("kitchenEquipmentMaintenance"));
  assert.ok(!keys.includes("serviceTerms"));
  assert.ok(!keys.includes("repeatCustomersPlan"));
});

test("bakery adaptive pack disappears when clarification data already exists", () => {
  const template = buildDynamicInterviewTemplate({
    ...bakeryProject,
    userLanguage: "ru",
    bakeryProductionSchedule: "Утром хлеб и самса, днем круассаны и десерты.",
    ingredientSupplyPlan: "Мука и масло у локального поставщика, кофе у отдельного поставщика, есть запасной поставщик.",
    dailyWastePct: 5,
    sanitaryProductionFlow: "Сырье, выпечка, хранение и продажа разделены; санитарный журнал ведет администратор.",
    kitchenEquipmentMaintenance: "Сервис поставщика печи и кофемашины, запасные контакты есть."
  });

  assert.equal(template.interviewBlocks.some((block) => block.id === "adaptive_question_pack"), false);
});

test("report generation opens the inline report tab without redirecting away from the form", () => {
  const source = readFileSync("src/components/advisor/InterviewPanel.tsx", "utf8");
  assert.match(source, /\/api\/projects\/\$\{projectId\}\/report\/generate/);
  assert.match(source, /setActiveTabIndex\(5\)/);
  assert.match(source, /setProject\(data\.project\)/);
  assert.doesNotMatch(source, /router\.replace\(reportUrl\)/);
  assert.doesNotMatch(source, /window\.location\.assign\(reportUrl\)/);
});
