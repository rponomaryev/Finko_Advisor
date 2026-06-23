import test from "node:test";
import assert from "node:assert/strict";
import { fallbackToDeterministicFlow, getMissingFields, getNextFallbackQuestions } from "../src/lib/ai/fallbackInterview.ts";

test("fallback extraction detects a coffee shop without using toy sector defaults", () => {
  const result = fallbackToDeterministicFlow({
    message: "Хочу открыть кофейню в Ташкенте. Помещение в аренду, новое оборудование, своих денег 120 млн сум."
  });

  assert.equal(result.detectedSector, "food_service_small_coffee_shop");
  assert.equal(result.extractedFields.businessType, "Кофейня");
  assert.equal(result.extractedFields.region, "Ташкент город");
  assert.equal(result.extractedFields.premisesStatus, "rent");
  assert.equal(result.extractedFields.equipmentCondition, "new");
  assert.equal(result.extractedFields.ownContributionUZS, 120000000);
  assert.equal(result.extractedFields.toyType, undefined);
  assert.ok(result.nextQuestions.length > 0);
});

test("fallback question flow asks dynamic generic questions and hides toy keys", () => {
  const response = getNextFallbackQuestions({
    businessType: "Швейный цех",
    businessIdea: "Пошив школьной формы",
    region: "Ферганская область",
    productOrService: "Школьная форма"
  });

  assert.equal(response.templateCode, "manufacturing_sewing_workshop");
  assert.ok(response.step >= 1);
  assert.ok(response.questions.length >= 1 && response.questions.length <= 3);
  assert.ok(response.questions.every((question) => !["toyType", "productionType"].includes(question.key)));
});


const completeCoffeeProfile = {
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
  staffPlan: { roles: [{ role: "Бариста", count: 2, monthlySalaryAmount: 3500000, monthlySalaryCurrency: "UZS" }] },
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
};

test("zero is accepted for non-critical funding fields but not for requested loan amount", () => {
  const noExternalFundingMissing = getMissingFields({ ...completeCoffeeProfile, grants: 0, otherFunding: 0 });
  assert.equal(noExternalFundingMissing.includes("grants"), false);
  assert.equal(noExternalFundingMissing.includes("otherFunding"), false);

  const missingLoanAmount = getMissingFields({
    ...completeCoffeeProfile,
    creditNeeded: "yes",
    requestedLoanAmount: 0,
    requestedLoanCurrency: "UZS",
    loanTermMonths: 48,
    loanAnnualRatePct: 26,
    loanRepaymentType: "equal_principal",
    loanPurpose: "Стартовые расходы",
    collateralAvailable: true,
    collateralType: "Автомобиль",
    collateralEstimatedValue: 100000000
  });
  assert.equal(missingLoanAmount.includes("requestedLoanAmount"), true);
});
