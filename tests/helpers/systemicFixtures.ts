import { calculateAll } from "../../src/lib/calculator/financialCalculator.ts";
import { generateRiskMatrix } from "../../src/lib/scoring/riskEngine.ts";
import { calculateBankReadinessScore, calculateFeasibilityScore } from "../../src/lib/scoring/scoringService.ts";
import { buildReportData } from "../../src/lib/services/reportService.ts";
import { resolveTemplateForData } from "../../src/lib/services/templateService.ts";
import type { BusinessCategory } from "../../src/lib/business/businessClassifier.ts";
import type { StructuredProjectData } from "../../src/lib/types/project.ts";

export function sampleMarketData(businessType = "Тестовый проект") {
  return {
    locale: "ru",
    businessType,
    dataPoints: [{
      id: "official_test_market_volume",
      indicator: "Розничная торговля и услуги",
      value: 1_000_000_000,
      unit: "UZS",
      year: 2025,
      region: "Узбекистан",
      sourceName: "Официальная статистика",
      sourceType: "official_statistics",
      matchQuality: "exact",
      explanation: "Контрольный числовой показатель для тестовой сборки отчёта."
    }],
    messages: [],
    sources: [{ sourceName: "Официальная статистика", sourceType: "official_statistics", year: 2025 }]
  } as never;
}

export function childrenClothingProfile(overrides: Record<string, unknown> = {}): StructuredProjectData & Record<string, unknown> {
  return {
    userLanguage: "ru",
    businessType: "Магазин детской одежды",
    businessIdea: "Магазин детской одежды в жилом районе",
    region: "Ташкент город",
    district: "Чиланзар",
    premisesStatus: "rent",
    infrastructureReady: true,
    equipmentCondition: "used",
    targetCustomerSegments: ["Родители", "Семьи с детьми", "Беременные женщины", "Покупатели подарков", "Жители района", "Онлайн-покупатели"],
    targetCustomers: ["delivery", "wholesalers", "marketplaces"],
    salesChannels: ["Покупатели в магазине", "Instagram", "Telegram", "2GIS / Google / Яндекс Карты", "Рекомендации", "Повторные клиенты"],
    traffic: 80,
    conversion: 35,
    workingDaysPerMonth: 26,
    averageTicket: 180_000,
    skuCount: 250,
    initialInventoryCostUZS: 150_000_000,
    averagePurchaseCost: 99_000,
    averageMarkupPct: 82,
    inventoryTurnoverDays: 30,
    supplierSelected: true,
    supplierPaymentTerms: "prepayment",
    returnsExchangePolicy: "documented",
    certificationAwareness: "not_required",
    monthlyRent: 12_000_000,
    monthlyUtilities: 3_200_000,
    monthlyMarketing: 3_840_000,
    staffPlan: { roles: [{ role: "seller", count: 2, monthlySalaryAmount: 11_000_000, monthlySalaryCurrency: "UZS" }] },
    equipmentCapex: 85_000_000,
    ownContributionAmount: 220_000_000,
    ownContributionUZS: 220_000_000,
    ownContributionCurrency: "UZS",
    creditNeeded: "yes",
    requestedLoanAmount: 120_000_000,
    requestedLoanUZS: 120_000_000,
    requestedLoanCurrency: "UZS",
    loanPurpose: "Закупка товара и оборудование",
    loanTermMonths: 36,
    loanAnnualRatePct: 26,
    loanRepaymentType: "annuity",
    collateralAvailable: true,
    collateralType: "real_estate",
    collateralEstimatedValue: 180_000_000,
    workingCapitalBufferMonths: 3,
    completedBlockIds: ["business_idea", "location", "equipment_launch", "operations", "suppliers_procurement", "sales", "financing", "documents_experience"],
    businessProfile: { category: "retail", subcategory: "children_clothing_store", businessModel: "retail_sale", volumeField: "traffic", averageTicketField: "averageTicket", capacityUnit: "customers_per_day" } as never,
    ...overrides
  } satisfies StructuredProjectData & Record<string, unknown>;
}

export function genericProfile(input: { businessType: string; category?: BusinessCategory | string; volumeKey?: string; priceKey?: string; overrides?: Record<string, unknown> }): StructuredProjectData & Record<string, unknown> {
  const volumeKey = input.volumeKey ?? "monthlyOrders";
  const priceKey = input.priceKey ?? "averageTicket";
  const category = input.category ?? "services";
  const daily = /day/i.test(volumeKey) || volumeKey === "traffic";
  return {
    userLanguage: "ru",
    businessType: input.businessType,
    businessIdea: `${input.businessType} с подтвержденными вводными для финансового расчета`,
    region: "Ташкент город",
    district: "Юнусабад",
    premisesStatus: "rent",
    infrastructureReady: true,
    equipmentCondition: "used",
    [volumeKey]: daily ? 40 : 700,
    [priceKey]: 150_000,
    workingDaysPerMonth: 26,
    conversion: volumeKey === "traffic" ? 40 : undefined,
    averagePurchaseCost: category === "retail" || category === "ecommerce" ? 80_000 : undefined,
    rawMaterialCostPerUnit: category === "manufacturing" || category === "food_service" ? 60_000 : undefined,
    cogsPct: category === "services" || category === "service" || category === "rental" || category === "b2b" ? 35 : undefined,
    supplierSelected: true,
    supplierPaymentTerms: "prepayment",
    returnsExchangePolicy: "documented",
    certificationAwareness: "not_required",
    monthlyRent: 8_000_000,
    monthlyUtilities: 1_500_000,
    monthlyMarketing: 3_000_000,
    staffPlan: { roles: [{ role: "operator", count: 2, monthlySalaryAmount: 8_000_000, monthlySalaryCurrency: "UZS" }] },
    equipmentCapex: 60_000_000,
    ownContributionAmount: 160_000_000,
    ownContributionUZS: 160_000_000,
    ownContributionCurrency: "UZS",
    creditNeeded: "no",
    workingCapitalBufferMonths: 2,
    targetCustomerSegments: ["B2C-клиенты"],
    salesChannels: ["Instagram", "Рекомендации"],
    completedBlockIds: ["business_idea", "location", "equipment_launch", "operations", "suppliers_procurement", "sales", "financing", "documents_experience"],
    businessProfile: { category, subcategory: String(category), businessModel: category === "rental" ? "rental" : "retail_sale", volumeField: volumeKey, averageTicketField: priceKey, capacityUnit: daily ? "customers_per_day" : "orders_per_month" },
    ...input.overrides
  } as StructuredProjectData & Record<string, unknown>;
}

export function buildCalculatedProject(profile: StructuredProjectData & Record<string, unknown>) {
  const template = resolveTemplateForData(profile);
  const financial = calculateAll(profile, template.assumptions);
  const risks = generateRiskMatrix({ ...profile, financialResult: financial } as StructuredProjectData & Record<string, unknown>);
  const feasibilityScore = calculateFeasibilityScore(profile, financial, risks);
  const bankReadinessScore = calculateBankReadinessScore(profile, financial, risks);
  const reportData = buildReportData({
    project: { ...profile, title: String(profile.businessType ?? "Тестовый проект"), sectorCode: template.code },
    financial,
    risks,
    feasibilityScore,
    bankReadinessScore,
    marketData: sampleMarketData(String(profile.businessType ?? "Тестовый проект"))
  });
  return {
    ...profile,
    id: `test-${String(profile.businessType).replace(/\s+/g, "-")}`,
    title: profile.businessType,
    status: "calculated",
    sectorCode: template.code,
    financialResult: financial,
    riskResult: risks,
    feasibilityScore,
    bankReadinessScore,
    reportData,
    structuredData: profile
  } as Record<string, unknown>;
}
