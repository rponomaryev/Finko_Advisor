import test from "node:test";
import assert from "node:assert/strict";
import { formatSidebarResolvedValue, resolveSidebarSemanticValues } from "../src/lib/summary/sidebarSummaryResolver.ts";
import type { StructuredProjectData } from "../src/lib/types/project.ts";

function resolve(data: StructuredProjectData) {
  return resolveSidebarSemanticValues(data);
}

test("sidebar summary maps bakery numeric answers by semantic field, not first numeric value", () => {
  const data = {
    businessType: "Пекарня",
    businessIdea: "собственная точка продаж в жилом районе",
    plannedStartMonths: 2,
    seats: 4,
    monthlyCapacity: 2,
    foodCostPct: 35,
    equipmentCapex: 220000000,
    ordersPerDay: 120,
    averageTicket: 35000,
    averagePrice: 220,
    ownContributionAmount: 260000000,
    ownContributionCurrency: "UZS",
    businessProfile: {
      volumeField: "ordersPerDay",
      averageTicketField: "averageTicket"
    } as never
  } satisfies StructuredProjectData & Record<string, unknown>;

  const summary = resolve(data);
  assert.equal(summary.plannedStart?.value, 2);
  assert.equal(summary.plannedVolume?.value, 120);
  assert.equal(summary.averagePrice?.value, 35000);
  assert.equal((data as Record<string, unknown>).seats, 4);
  assert.equal(data.ownContributionAmount, 260000000);
  assert.notEqual(summary.plannedVolume?.value, 2);
  assert.notEqual(summary.plannedVolume?.value, 35);
  assert.notEqual(summary.averagePrice?.value, 4);
  assert.notEqual(summary.averagePrice?.value, 220);
  assert.notEqual(summary.averagePrice?.key, "seats");
  assert.notEqual(summary.plannedVolume?.key, "plannedStartMonths");
});

test("sidebar summary maps car wash volume and ticket without using posts, lease term or working days", () => {
  const data = {
    businessType: "Автомойка",
    posts: 3,
    carsPerDay: 35,
    averageTicket: 70000,
    leaseTermMonths: 36,
    workingDays: 26
  } satisfies StructuredProjectData & Record<string, unknown>;

  const summary = resolve(data);
  assert.equal(summary.plannedVolume?.value, 35);
  assert.equal(summary.averagePrice?.value, 70000);
  assert.notEqual(summary.plannedVolume?.value, 3);
  assert.notEqual(summary.plannedVolume?.value, 36);
  assert.notEqual(summary.averagePrice?.key, "posts");
  assert.notEqual(summary.averagePrice?.key, "workingDays");
});

test("sidebar summary maps retail visitors and ticket without stock days, conversion or own funds leakage", () => {
  const data = {
    businessType: "Магазин детской одежды",
    visitorsPerDay: 80,
    conversion: 35,
    averageTicket: 180000,
    stockDays: 30,
    ownContributionAmount: 150000000,
    ownContributionCurrency: "UZS"
  } satisfies StructuredProjectData & Record<string, unknown>;

  const summary = resolve(data);
  assert.equal(summary.plannedVolume?.value, 80);
  assert.equal(summary.averagePrice?.value, 180000);
  assert.notEqual(summary.plannedVolume?.key, "stockDays");
  assert.notEqual(summary.plannedVolume?.key, "conversion");
  assert.notEqual(summary.averagePrice?.key, "conversion");
  assert.notEqual(summary.averagePrice?.key, "ownContributionAmount");
});

test("sidebar summary supports generic unknown businesses without industry leakage", () => {
  const data = {
    businessType: "Сервис аренды дронов для агромониторинга полей",
    visitsPerMonth: 35,
    averageServicePrice: 900000,
    teamSize: 2,
    plannedStartMonths: 3
  } satisfies StructuredProjectData & Record<string, unknown>;

  const summary = resolve(data);
  assert.equal(summary.plannedVolume?.value, 35);
  assert.equal(summary.averagePrice?.value, 900000);
  assert.notEqual(summary.plannedVolume?.value, 2);
  assert.notEqual(summary.plannedVolume?.value, 3);
  assert.notEqual(summary.averagePrice?.key, "teamSize");
  assert.notEqual(summary.plannedVolume?.key, "dailyCovers");
  assert.notEqual(summary.plannedVolume?.key, "carsPerDayStable");
});


test("sidebar summary keeps user daily volume ahead of stale unrelated monthly candidate and displays unit", () => {
  const data = {
    businessType: "Магазин детской одежды",
    dailyOrdersCapacity: 80,
    visitsPerMonth: 900,
    averageTicket: 180000,
    workingDaysPerMonth: 26
  } satisfies StructuredProjectData & Record<string, unknown>;

  const summary = resolve(data);
  assert.equal(summary.plannedVolume?.key, "dailyOrdersCapacity");
  assert.equal(summary.plannedVolume?.value, 80);
  assert.equal(summary.plannedVolume?.unit, "заказов/день");
  assert.equal(formatSidebarResolvedValue(summary.plannedVolume, "ru", { monthlyEquivalent: 2080, workingDaysPerMonth: 26 }), "80 заказов/день → 2080 заказов/мес. (при 26 раб. днях)");
});
