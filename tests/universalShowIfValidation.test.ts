import test from "node:test";
import assert from "node:assert/strict";
import { validateVisibleRequiredQuestionsForBlock, calculateBlockProgress } from "../src/lib/interview/interviewValidation.ts";
import type { BusinessProfile } from "../src/lib/business/businessClassifier.ts";
import type { InterviewBlock } from "../src/lib/types/project.ts";

const profile: BusinessProfile = {
  category: "food_service",
  subcategory: "coffee_point",
  businessModel: "coffee_point",
  operationalModel: "inside_partner_location",
  confidence: 0.9,
  primaryRevenueModel: "sales",
  sellsGoods: true,
  providesServices: true,
  producesGoods: false,
  rentsAssets: false,
  importsGoodsOrInputs: false,
  importsGoods: false,
  exportsGoodsOrServices: false,
  usesDelivery: false,
  usesPremises: true,
  usesMobileService: false,
  hasInventory: true,
  hasEquipment: true,
  hasPremises: true,
  hasStaff: true,
  hasLicensingOrPermits: true,
  hasSanitaryRequirements: true,
  hasEnvironmentalRisk: false,
  hasSafetyRisk: true,
  hasSeasonality: false,
  hasHighWorkingCapitalNeed: false,
  hasCustomerFlowDependency: true,
  hasB2BContracts: false,
  hasWalkInTraffic: true,
  hasRegulatedActivity: false,
  hasCurrencyExposure: false,
  hasCreditOrLeasingNeed: false,
  capabilities: { dependsOnHostBusinessTraffic: true, providesServices: true, sellsGoods: true },
  revenueUnit: "order",
  capacityUnit: "orders_per_day",
  averageTicketField: "averageTicket",
  volumeField: "ordersPerDay",
  relevantInterviewBlocks: [],
  excludedInterviewBlocks: [],
  requiredDataForAnalysis: [],
  keyCostDrivers: [],
  keyRevenueDrivers: [],
  keyRisks: [],
  documentCategories: [],
  sourceCategories: [],
  recommendedSourceCategories: []
};

const blocks: InterviewBlock[] = [{
  id: "clients_sales",
  name: "Клиенты",
  description: "showIf validation",
  questions: [
    { key: "averageTicket", label: "Средний чек", question: "Средний чек?", type: "number" },
    { key: "hostTrafficAgreement", label: "Договоренность с хостом", question: "Есть договоренность?", type: "boolean", showIf: { field: "capabilities.dependsOnHostBusinessTraffic", operator: "equals", value: true } },
    { key: "warehouseArea", label: "Склад", question: "Площадь склада?", type: "number", showIf: { field: "capabilities.hasInventory", operator: "equals", value: false } }
  ]
}];

test("universal showIf controls validation and progress outside auto service", () => {
  const answers = { averageTicket: 25_000, hostTrafficAgreement: true };
  const validation = validateVisibleRequiredQuestionsForBlock({ blockId: "clients_sales", blocks, answers, profile, requiredQuestionKeys: ["averageTicket", "hostTrafficAgreement", "warehouseArea"] });
  assert.equal(validation.ok, true);
  assert.deepEqual(validation.invalidFields, []);
  assert.deepEqual(validation.hiddenRequiredFieldsIgnored, ["warehouseArea"]);

  const progress = calculateBlockProgress({ block: blocks[0], answers, profile, requiredQuestionKeys: ["averageTicket", "hostTrafficAgreement", "warehouseArea"] });
  assert.equal(progress.required, 2);
  assert.equal(progress.pct, 100);
});

test("visible required showIf field is validated", () => {
  const validation = validateVisibleRequiredQuestionsForBlock({ blockId: "clients_sales", blocks, answers: { averageTicket: 25_000 }, profile, requiredQuestionKeys: ["averageTicket", "hostTrafficAgreement", "warehouseArea"] });
  assert.equal(validation.ok, false);
  assert.deepEqual(validation.invalidFields.map((item) => item.field), ["hostTrafficAgreement"]);
});
