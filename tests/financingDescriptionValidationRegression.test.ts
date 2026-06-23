import test from "node:test";
import assert from "node:assert/strict";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { detectInterviewDataQualityWarnings } from "../src/lib/interview/dataQuality.ts";
import { resolveReportReadiness } from "../src/lib/report/reportReadiness.ts";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import type { Locale, StructuredProjectData } from "../src/lib/types/project.ts";

const detailedFinancingText = `Планируется смешанное финансирование: 50 млн сум собственных средств и 35 млн сум банковского кредита. Общий стартовый бюджет — около 85 млн сум. Основные расходы: оборудование и инвентарь — около 35 млн сум, подготовка помещения и вывеска — около 10 млн сум, стартовый запас расходников — около 5 млн сум, маркетинг запуска — около 5 млн сум, аренда, зарплаты и операционные расходы до выхода на стабильный поток заказов — около 25 млн сум, резерв — около 5 млн сум.

Оборотный капитал:
При аренде около 8 млн сум и зарплатах 8,5–10,5 млн сум в месяц резерв на 3 месяца должен быть не менее 50–60 млн сум. Часть этого резерва покрывается собственными средствами, часть — кредитом.`;

function atelierProfile(locale: Locale = "ru", overrides: Partial<StructuredProjectData> = {}): StructuredProjectData & Record<string, unknown> {
  return {
    userLanguage: locale,
    businessType: "Ателье по ремонту одежды",
    businessIdea: "Небольшое ателье по ремонту и подгонке одежды в торговом центре.",
    region: "Ташкент город",
    district: "Юнусабад",
    premisesStatus: "rent",
    infrastructureReady: true,
    equipmentCondition: "mixed",
    equipmentList: "Промышленная швейная машина, оверлок, утюг и рабочее место мастера.",
    equipmentCapex: 35_000_000,
    premisesSetupCapex: 10_000_000,
    initialInventoryCapex: 5_000_000,
    monthlyRent: 8_000_000,
    monthlyUtilities: 1_500_000,
    monthlyMarketing: 3_000_000,
    staffPlan: { roles: [
      { role: "tailor", count: 1, monthlySalaryAmount: 5_000_000, monthlySalaryCurrency: "UZS" },
      { role: "administrator", count: 1, monthlySalaryAmount: 3_500_000, monthlySalaryCurrency: "UZS" }
    ] },
    plannedVolumeMonthly: 250,
    averageServiceTicket: 85_000,
    cogsPct: 35,
    supplierSelected: true,
    ownContributionAmount: 50_000_000,
    ownContributionUZS: 50_000_000,
    ownContributionCurrency: "UZS",
    creditNeeded: "yes",
    requestedLoanAmount: 35_000_000,
    requestedLoanUZS: 35_000_000,
    requestedLoanCurrency: "UZS",
    loanTermMonths: 36,
    loanAnnualRatePct: 28,
    loanRepaymentType: "annuity",
    loanPurpose: "Запуск ателье, оборудование и оборотный капитал",
    collateralAvailable: true,
    collateralType: "real_estate",
    collateralEstimatedValue: 80_000_000,
    needsLeasing: false,
    workingCapitalBufferMonths: 3,
    sectionNotes: { finance: detailedFinancingText },
    completedBlockIds: ["business_idea", "location", "equipment_launch", "operations", "suppliers_procurement", "sales", "financing", "documents_experience"],
    businessProfile: { category: "services", subcategory: "tailoring_repair", volumeField: "plannedVolumeMonthly", averageTicketField: "averageServiceTicket", capacityUnit: "orders_per_month" } as never,
    ...overrides
  } as StructuredProjectData & Record<string, unknown>;
}

test("financing free-text amount mismatch is warning-only and structured fields stay source of truth", () => {
  const profile = atelierProfile("ru");
  const template = resolveTemplateForData(profile);
  const readiness = resolveReportReadiness(profile, { template, locale: "ru" });

  assert.equal(readiness.ready, true, readiness.blockingIssues.map((issue) => issue.message).join("; "));
  assert.equal(readiness.blockingIssues.some((issue) => issue.code === "finance_text_conflict"), false);

  const warning = readiness.nonBlockingWarnings.find((issue) => issue.code === "finance_text_conflict");
  assert.ok(warning);
  assert.equal(warning.severity, "medium");
  assert.equal(warning.calculationPolicy, "structured_fields_used");
  assert.match(warning.message, /числовые поля формы/i);

  const financial = calculateAll(profile, template.assumptions);
  assert.equal(financial.financing.ownContributionUZS, 50_000_000);
  assert.equal(financial.financing.requestedLoanUZS, 35_000_000);
  assert.ok(financial.warnings.some((item) => item.code === "finance_text_conflict" && item.severity === "medium" && item.calculationPolicy === "structured_fields_used"));
});

test("high-confidence free-text financing amount is fallback only when structured amount is missing", () => {
  const profile = atelierProfile("ru", {
    requestedLoanAmount: undefined,
    requestedLoanUZS: undefined,
    sectionNotes: { finance: "Собственные средства 50 млн сум, кредит 35 млн сум на запуск." }
  });
  const template = resolveTemplateForData(profile);
  const readiness = resolveReportReadiness(profile, { template, locale: "ru" });

  assert.equal(readiness.ready, true, readiness.blockingIssues.map((issue) => issue.message).join("; "));
  assert.equal(readiness.blockingIssues.some((issue) => issue.code === "loan_amount_missing" || issue.field === "requestedLoanAmount"), false);
  assert.ok(readiness.nonBlockingWarnings.some((issue) => issue.code === "finance_text_fallback_used" && issue.calculationPolicy === "free_text_fallback_used"));

  const financial = calculateAll(profile, template.assumptions);
  assert.equal(financial.financing.requestedLoanUZS, 35_000_000);
  assert.ok(financial.warnings.some((item) => item.code === "finance_text_fallback_used" && item.calculationPolicy === "free_text_fallback_used"));
});

test("financing description warnings are localized in RU, UZ and EN", () => {
  const expected: Record<Locale, RegExp> = {
    ru: /числовые поля формы/,
    uz: /raqamli maydonlar ishlatildi/,
    en: /structured numeric fields from the form/
  };

  for (const locale of ["ru", "uz", "en"] as const) {
    const warnings = detectInterviewDataQualityWarnings(atelierProfile(locale));
    const warning = warnings.find((item) => item.code === "finance_text_conflict");
    assert.ok(warning, locale);
    assert.equal(warning.severity, "medium");
    assert.equal(warning.calculationPolicy, "structured_fields_used");
    assert.match(warning.message, expected[locale]);
    if (locale !== "ru") assert.doesNotMatch(warning.message, /числовые поля формы|описании финансирования/i);
    if (locale !== "en") assert.doesNotMatch(warning.message, /structured numeric fields from the form/i);
  }
});
