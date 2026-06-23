import test from "node:test";
import assert from "node:assert/strict";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import { calculateBankReadinessScore, calculateFeasibilityScore } from "../src/lib/scoring/scoringService.ts";
import { buildReportData } from "../src/lib/services/reportService.ts";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";

const technicalPattern = /templateSignature|businessProfileSignature|sourceCategoryIds|excludedInterviewBlocks|AI debug|raw profile|raw enum|production_process|retail_sku|food_service_menu/;

test("report preview export is localized and hides technical fields for RU/EN/UZ", () => {
  const base: any = {
    businessType: "Мобильный груминг животных",
    businessIdea: "Выездной груминг собак и кошек, запись через Telegram и Instagram",
    region: "Ташкент город",
    petTypes: ["dogs", "cats"],
    groomingServiceTypes: ["bath_and_dry", "haircut", "nail_trimming"],
    groomingOperatingFormat: "mobile_home_visit",
    groomingTargetCustomers: ["pet_owners", "repeat_clients"],
    bookingChannels: ["telegram", "instagram"],
    groomingVisitsPerMonth: 120,
    averageGroomingTicket: 150000,
    animalsPerGroomerPerDay: 5,
    staffPlan: { roles: [{ role: "Грумер", count: 1, monthlySalaryAmount: 5000000 }] },
    ownContributionAmount: 50000000,
    ownContributionCurrency: "UZS",
    creditNeeded: "no",
    certificationAwareness: "partly_aware"
  };
  const template = buildDynamicInterviewTemplate(base);
  const financial = calculateAll(base, template.assumptions);
  const risks = generateRiskMatrix(base);
  const reportData = buildReportData({
    project: { ...base, title: "Мобильный груминг" },
    financial,
    risks,
    feasibilityScore: calculateFeasibilityScore(base, financial, risks),
    bankReadinessScore: calculateBankReadinessScore(base, financial, risks)
  });

  for (const locale of ["ru", "en", "uz"] as const) {
    const exportData = prepareReportExport({
      id: `grooming-${locale}`,
      title: "Мобильный груминг",
      status: "calculated",
      businessType: base.businessType,
      userLanguage: locale,
      structuredData: { ...base, userLanguage: locale },
      financialResult: financial,
      riskResult: risks,
      reportData
    }, locale);
    const text = JSON.stringify({
      business: exportData.businessProfileRows,
      market: exportData.marketEvidenceRows,
      docs: exportData.documentRows,
      risks: exportData.risks,
      glossary: exportData.glossaryRows
    });
    assert.doesNotMatch(text, technicalPattern);
    if (locale === "ru") assert.match(text, /Бизнес-модель|Единица продажи|Главные риски/);
    if (locale === "en") assert.doesNotMatch(text, /Бизнес-модель|Главные риски|Документы до запуска/);
    if (locale === "uz") assert.doesNotMatch(text, /Бизнес-модель|Главные риски|Документы до запуска/);
  }
});
