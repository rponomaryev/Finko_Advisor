import test from "node:test";
import assert from "node:assert/strict";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import type { StructuredProjectData } from "../src/lib/types/project.ts";

function calculate(project: StructuredProjectData) {
  const template = buildDynamicInterviewTemplate(project);
  return calculateAll(project, template.assumptions);
}

test("bakery revenue uses 120 orders/day and 35,000 UZS ticket, not months/cost/capex", () => {
  const project: StructuredProjectData & Record<string, unknown> = {
    userLanguage: "ru",
    businessType: "Пекарня у дома",
    businessIdea: "мини-пекарня с точкой продаж",
    region: "Ташкент город",
    district: "Юнусабад",
    plannedStartMonths: 2,
    seats: 4,
    monthlyCapacity: 2,
    foodCostPct: 35,
    equipmentCapex: 220_000_000,
    dailyCovers: 120,
    averageTicket: 35_000,
    averagePrice: 220,
    utilizationRatePct: 65,
    workingDaysPerMonth: 26
  };
  const financial = calculate(project);
  assert.equal(financial.revenue.displayVolume, 120);
  assert.equal(financial.revenue.averagePrice, 35_000);
  assert.equal(financial.revenue.monthlyCapacity, 3_120);
  assert.equal(financial.revenue.effectiveUnits, 2_028);
  assert.equal(financial.revenue.monthlyRevenue, 70_980_000);
  assert.equal(financial.revenue.annualRevenue, 851_760_000);
  assert.notEqual(financial.revenue.monthlyCapacity, 2);
  assert.notEqual(financial.revenue.displayVolume, 35);
  assert.notEqual(financial.revenue.averagePrice, 220);
});

test("car wash mapping uses cars per day, not posts or lease term", () => {
  const project: StructuredProjectData & Record<string, unknown> = {
    userLanguage: "ru",
    businessType: "Автомойка",
    businessIdea: "Автомойка на 3 поста",
    posts: 3,
    carsPerDay: 35,
    averageTicket: 70_000,
    leaseTermMonths: 36,
    workingDaysPerMonth: 26,
    utilizationRatePct: 100,
    businessProfile: { category: "services", subcategory: "car_wash" } as never
  };
  const financial = calculate(project);
  assert.equal(financial.revenue.displayVolume, 35);
  assert.equal(financial.revenue.monthlyCapacity, 910);
  assert.equal(financial.revenue.averagePrice, 70_000);
  assert.notEqual(financial.revenue.displayVolume, 3);
  assert.notEqual(financial.revenue.displayVolume, 36);
});

test("retail mapping uses visitors/ticket without stock days or conversion as price", () => {
  const project: StructuredProjectData & Record<string, unknown> = {
    userLanguage: "ru",
    businessType: "Магазин детской одежды",
    visitorsPerDay: 80,
    averageTicket: 180_000,
    stockDays: 30,
    conversion: 35,
    workingDaysPerMonth: 26,
    utilizationRatePct: 100,
    businessProfile: { category: "retail", volumeField: "visitorsPerDay", averageTicketField: "averageTicket" } as never
  };
  const financial = calculate(project);
  assert.equal(financial.revenue.displayVolume, 80);
  assert.equal(financial.revenue.averagePrice, 180_000);
  assert.notEqual(financial.revenue.displayVolume, 30);
  assert.notEqual(financial.revenue.averagePrice, 35);
});

test("generic drone service uses visits/month and service price, not team or start period", () => {
  const project: StructuredProjectData & Record<string, unknown> = {
    userLanguage: "ru",
    businessType: "Сервис аренды дронов для агромониторинга полей",
    visitsPerMonth: 35,
    averageServicePrice: 900_000,
    teamSize: 2,
    plannedStartMonths: 3,
    utilizationRatePct: 100
  };
  const financial = calculate(project);
  assert.equal(financial.revenue.displayVolume, 35);
  assert.equal(financial.revenue.monthlyCapacity, 35);
  assert.equal(financial.revenue.averagePrice, 900_000);
  assert.notEqual(financial.revenue.displayVolume, 2);
  assert.notEqual(financial.revenue.displayVolume, 3);
});


test("daily user volume beats unrelated monthly candidate and is converted to monthly revenue", () => {
  const project: StructuredProjectData & Record<string, unknown> = {
    userLanguage: "ru",
    businessType: "Магазин детской одежды",
    businessIdea: "Офлайн магазин детской одежды в Чиланзаре",
    dailyOrdersCapacity: 80,
    visitsPerMonth: 900,
    averageTicket: 180_000,
    workingDaysPerMonth: 26,
    utilizationRatePct: 100,
    rawMaterialCostPerUnit: 90_000,
    businessProfile: { category: "retail", subcategory: "children_clothing_store", averageTicketField: "averageTicket" } as never
  };
  const financial = calculate(project);
  assert.equal(financial.revenue.displayVolume, 80);
  assert.equal(financial.revenue.displayVolumeUnitLabel, "заказов/день");
  assert.equal(financial.revenue.monthlyCapacity, 2080);
  assert.equal(financial.revenue.monthlyRevenue, 374_400_000);
  assert.notEqual(financial.revenue.displayVolume, 900);
});
