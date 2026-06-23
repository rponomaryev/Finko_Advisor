import test from "node:test";
import assert from "node:assert/strict";
import { hasEnoughDataForCalculation } from "../src/lib/services/interviewService.ts";

test("calculation is blocked until dynamic required fields are complete", () => {
  assert.equal(hasEnoughDataForCalculation({
    businessType: "Кофейня",
    businessIdea: "Кофейня у университета",
    region: "Ташкент город",
    monthlyCapacity: 2800,
    averagePrice: 28000,
    ownContributionAmount: 120000000,
    ownContributionCurrency: "UZS",
    creditNeeded: "no"
  }), false);

  assert.equal(hasEnoughDataForCalculation({
    businessType: "Кофейня",
    businessIdea: "Кофейня у университета",
    region: "Ташкент город",
    productOrService: "Кофе и десерты",
    format: "coffee_shop",
    menuCategories: ["coffee", "desserts"],
    seatingCapacity: 12,
    kitchenEquipment: "Кофемашина, холодильник, POS",
    dailyCovers: 110,
    equipmentList: "Кофемашина, кофемолка, холодильник",
    sanitaryRequirementsKnown: true,
    premisesStatus: "rent",
    equipmentCondition: "new",
    monthlyCapacity: 2800,
    averagePrice: 28000,
    targetCustomers: ["walk_in", "students"],
    rawMaterialSource: "mixed",
    staffPlan: {
      roles: [
        { role: "Бариста", count: 2, monthlySalaryAmount: 3500000, monthlySalaryCurrency: "UZS" }
      ]
    },
    ownContributionAmount: 120000000,
    ownContributionCurrency: "UZS",
    creditNeeded: "no",
    needsLeasing: false,
    certificationAwareness: "partly_aware",
    experienceLevel: "medium",
    sectionNotes: {
      businessIdea: "Кофейня у университета",
      premisesInfrastructure: "Аренда с трафиком",
      equipment: "Кофемашина и мебель",
      productionCapacity: "2800 заказов",
      rawMaterials: "Кофе и молоко",
      salesMarketing: "Студенты и офисы",
      finance: "Собственные средства",
      complianceExperience: "Есть бухгалтер"
    }
  }), true);
});
