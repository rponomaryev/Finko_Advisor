import test from "node:test";
import assert from "node:assert/strict";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { localizeProfileValue } from "../src/lib/i18n/businessProfileLabels.ts";
import { buildReportData } from "../src/lib/services/reportService.ts";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import type { StructuredProjectData } from "../src/lib/types/project.ts";

test("bakery report revenue uses explicit averageTicket and not stale generic averagePrice", () => {
  const project: StructuredProjectData = {
    userLanguage: "ru",
    businessType: "мини-пекарня с кофе навынос",
    businessIdea: "Пекарня у жилого массива с кофе навынос",
    region: "Ташкент город",
    district: "Мирзо-Улугбекский район",
    dailyCovers: 120,
    averageTicket: 28000,
    // Regression guard: generic averagePrice can remain in saved project state from an
    // earlier autosave/profile mapping, but food-service averageTicket must win.
    averagePrice: 60,
    utilizationRatePct: 65,
    rawMaterialCostPerUnit: 8500,
    ownContributionAmount: 180000000,
    ownContributionCurrency: "UZS",
    creditNeeded: "yes",
    requestedLoanAmount: 160000000,
    requestedLoanCurrency: "UZS",
    loanTermMonths: 36,
    loanAnnualRatePct: 26,
    staffPlan: {
      roles: [
        { role: "Пекарь", count: 1, monthlySalaryAmount: 8000000, monthlySalaryCurrency: "UZS" },
        { role: "Помощник пекаря", count: 1, monthlySalaryAmount: 5000000, monthlySalaryCurrency: "UZS" },
        { role: "Бариста-продавец", count: 2, monthlySalaryAmount: 4500000, monthlySalaryCurrency: "UZS" }
      ]
    }
  };

  const template = buildDynamicInterviewTemplate(project);
  const financial = calculateAll(project, template.assumptions);

  assert.equal(financial.revenue.monthlyCapacity, 3120);
  assert.equal(financial.revenue.displayVolume, 120);
  assert.equal(financial.revenue.displayVolumeUnitLabel, "заказов/день");
  assert.equal(financial.revenue.displayVolumeMonthlyEquivalent, 3120);
  assert.equal(financial.revenue.averagePrice, 28000);
  assert.equal(financial.revenue.monthlyRevenue, 56784000);
  assert.equal(financial.profitability.grossMarginPct, 69.6);
  assert.notEqual(financial.revenue.monthlyRevenue, 121680);

  const risks = generateRiskMatrix(project);
  const reportData = buildReportData({ project: { ...project, title: "мини-пекарня с кофе навынос - Ташкент город" }, financial, risks, feasibilityScore: 60, bankReadinessScore: 55 });
  const exportData = prepareReportExport({
    id: "bakery-volume-display",
    title: "мини-пекарня с кофе навынос - Ташкент город",
    status: "calculated",
    businessType: project.businessType,
    userLanguage: "ru",
    structuredData: project,
    financialResult: financial,
    riskResult: risks,
    reportData
  }, "ru");
  const plannedVolumeRow = exportData.financialRows.find((row) => row.indicator === "Плановый объем");
  assert.ok(plannedVolumeRow);
  assert.equal(plannedVolumeRow.value, "120 заказов/день");
  assert.match(plannedVolumeRow.comment, /для расчёта в месяц: 3\s*120 заказов\/мес\./);
});

test("Russian business profile localization removes bakery mixed-language leaks", () => {
  assert.equal(localizeProfileValue("food_service_bakery", "ru"), "Пекарня и кофе навынос");
  assert.equal(localizeProfileValue("bakery_sale", "ru"), "Продажа выпечки");
  assert.equal(localizeProfileValue("takeaway_coffee", "ru"), "Кофе навынос");
  assert.equal(localizeProfileValue("bakery_equipment", "ru"), "Оборудование пекарни");
  assert.equal(localizeProfileValue("daily_waste", "ru"), "Ежедневные списания");
  assert.equal(localizeProfileValue("ingredient_price_volatility", "ru"), "Рост цен на сырьё");
  assert.equal(localizeProfileValue("Location поток", "ru"), "Поток в локации");
  assert.equal(localizeProfileValue("Inventory и suppliers", "ru"), "Запасы и поставщики");
});


test("PDF export financing note follows calculated credit state and not stale report text", () => {
  const project: StructuredProjectData & { title: string } = {
    title: "мини-пекарня с кофе навынос - Ташкент город",
    userLanguage: "ru",
    businessType: "мини-пекарня с кофе навынос",
    businessIdea: "Пекарня у жилого массива с кофе навынос",
    region: "Ташкент город",
    dailyCovers: 180,
    averageTicket: 35000,
    averagePrice: 60,
    utilizationRatePct: 75,
    rawMaterialCostPerUnit: 15000,
    ownContributionAmount: 180000000,
    ownContributionCurrency: "UZS",
    creditNeeded: "yes",
    requestedLoanAmount: 160000000,
    requestedLoanCurrency: "UZS",
    loanTermMonths: 36,
    loanAnnualRatePct: 26
  };
  const template = buildDynamicInterviewTemplate(project);
  const financial = calculateAll(project, template.assumptions);
  const risks = generateRiskMatrix(project);
  const reportData = buildReportData({ project, financial, risks, feasibilityScore: 60, bankReadinessScore: 55 });
  // Regression guard: even if persisted reportData contains stale copy from an earlier build,
  // export/PDF text must follow the actual calculated financing state.
  reportData.financingRecommendation = "Кредит пока не выбран. Расчет показывает проект без обязательного кредита.";

  const exportData = prepareReportExport({
    id: "bakery-credit-note",
    title: project.title,
    status: "calculated",
    businessType: project.businessType,
    userLanguage: "ru",
    structuredData: project,
    financialResult: financial,
    riskResult: risks,
    reportData
  }, "ru");

  assert.match(exportData.financingRecommendation, /Кредит запрошен на сумму 160\s+000\s+000 сум/);
  assert.doesNotMatch(exportData.financingRecommendation, /Кредит пока не выбран/);
});


test("Russian export localizes bakery warning and market-data English leftovers", () => {
  const project: StructuredProjectData & { title: string } = {
    title: "мини-пекарня с кофе навынос - Ташкент город",
    userLanguage: "ru",
    businessType: "мини-пекарня с кофе навынос",
    businessIdea: "Пекарня у жилого массива с кофе навынос",
    region: "Ташкент город",
    dailyCovers: 120,
    averageTicket: 28000,
    averagePrice: 60,
    utilizationRatePct: 65,
    rawMaterialCostPerUnit: 8500,
    ownContributionAmount: 180000000,
    ownContributionCurrency: "UZS",
    creditNeeded: "yes",
    requestedLoanAmount: 160000000,
    requestedLoanCurrency: "UZS",
    loanTermMonths: 36,
    loanAnnualRatePct: 26
  };
  const template = buildDynamicInterviewTemplate(project);
  const financial = calculateAll(project, template.assumptions);
  financial.warnings = [
    { code: "low_ebitda_margin", severity: "high", title: "Low ebitda margin", message: "EBITDA margin is below 5%", values: { ebitdaMarginPct: -10 } },
    { code: "low_dscr_bank_readiness", severity: "high", title: "Low dscr bank readiness", message: "DSCR is below 1.2", values: { dscr: 0.8 } }
  ];
  const risks = generateRiskMatrix(project);
  const marketData = {
    locale: "ru",
    businessType: project.businessType,
    region: project.region,
    mapping: {
      businessType: project.businessType,
      normalizedSector: "food_service",
      possibleHsCodes: [],
      keywords: { ru: [], uz: [], en: [] },
      confidence: "high",
      mappingSource: "static_dictionary"
    },
    dataPoints: [{
      sector: "services",
      indicator: "Services value added",
      year: 2024,
      region: "region",
      value: 123,
      unit: "USD",
      sourceName: "World Bank Open Data",
      sourceType: "multilateral_statistics",
      matchQuality: "broad_proxy",
      explanation: "Broad services-sector context; not a product-specific statistic."
    }],
    messages: [],
    sources: [{
      sourceName: "Services value added",
      sourceType: "multilateral_statistics",
      sourceUrl: "https://data.worldbank.org",
      year: 2024,
      notes: "Broad services-sector context; not a product-specific statistic."
    }]
  } as any;
  const reportData = buildReportData({ project, financial, risks, feasibilityScore: 60, bankReadinessScore: 55, marketData });
  const exportData = prepareReportExport({
    id: "bakery-ru-localization-no-leak",
    title: project.title,
    status: "calculated",
    businessType: project.businessType,
    userLanguage: "ru",
    structuredData: project,
    financialResult: financial,
    riskResult: risks,
    reportData
  }, "ru");
  const serialized = JSON.stringify({ warnings: exportData.warnings, marketData: exportData.marketData, sources: exportData.sources, assumptionRows: exportData.assumptionRows });
  assert.doesNotMatch(serialized, /Services value added|Broad services-sector context|not a product-specific statistic|Low ebitda margin|Low dscr bank readiness|assumptions/i);
  assert.match(serialized, /Динамика сектора услуг|Добавленная стоимость сектора услуг/);
  assert.match(serialized, /Низкая EBITDA-маржа/);
  assert.match(serialized, /Низкое покрытие долга/);
});

test("monthlyCapacity is not multiplied by working days when capacity unit is stale daily label", () => {
  const project = {
    userLanguage: "ru",
    businessType: "мини-пекарня с кофе навынос",
    businessIdea: "Пекарня у жилого массива с кофе навынос",
    region: "Ташкент город",
    monthlyCapacity: 5000,
    capacityUnit: "bakery_sales_per_day",
    averageTicket: 35000,
    averagePrice: 35000,
    utilizationRatePct: 65,
    foodCostPct: 35,
    businessProfile: {
      category: "food_service",
      subcategory: "bakery",
      operationalModel: "stationary_point",
      businessModel: "food_service_bakery",
      unitEconomicsModel: "average_ticket",
      revenueModel: "daily_orders_average_ticket",
      revenueUnitLabel: "заказов/мес.",
      volumeField: "monthlyCapacity",
      priceField: "averageTicket",
      capacityUnit: "bakery_sales_per_day",
      defaultWorkingDaysPerMonth: 26,
      defaultUtilizationPct: 65,
      keyRevenueDrivers: [],
      keyCostDrivers: [],
      criticalInputs: [],
      suggestedDocuments: [],
      riskHints: []
    } as any
  } as StructuredProjectData & { capacityUnit: string };

  const template = buildDynamicInterviewTemplate(project);
  const financial = calculateAll(project, template.assumptions);

  assert.equal(financial.revenue.monthlyCapacity, 5000);
  assert.equal(financial.revenue.effectiveUnits, 3250);
  assert.equal(financial.revenue.monthlyRevenue, 113750000);
  assert.notEqual(financial.revenue.monthlyCapacity, 130000);
  assert.notEqual(financial.revenue.monthlyRevenue, 2145000000);
});

test("sample bakery daily orders stay in realistic monthly range", () => {
  const project: StructuredProjectData = {
    userLanguage: "ru",
    businessType: "Мини-пекарня",
    businessIdea: "Районная мини-пекарня с хлебом, самсой, булочками, кофе и корпоративными заказами.",
    region: "Ташкент город",
    dailyCovers: 120,
    workingDaysPerMonth: 26,
    utilizationRatePct: 65,
    averageTicket: 35000,
    foodCostPct: 35,
    ownContributionAmount: 350000000,
    requestedLoanAmount: 149999999,
    loanTermMonths: 48,
    loanAnnualRatePct: 26
  };

  const template = buildDynamicInterviewTemplate(project);
  const financial = calculateAll(project, template.assumptions);

  assert.equal(financial.revenue.monthlyCapacity, 3120);
  assert.equal(financial.revenue.effectiveUnits, 2028);
  assert.equal(financial.revenue.monthlyRevenue, 70980000);
  assert.ok(financial.revenue.effectiveUnits <= 10000);
  assert.notEqual(Number(financial.financing.dscr?.toFixed?.(2) ?? financial.financing.dscr), 1171.54);
});
