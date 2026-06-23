import test from "node:test";
import assert from "node:assert/strict";
import { assertNoRawTechnicalLabelsInReport } from "../src/lib/report/reportLanguageValidator.ts";
import { localizeBusinessProfileValue } from "../src/lib/i18n/businessProfileLabels.ts";

const technicalValues = [
  "tailoring_alteration",
  "tailoring_repair_service",
  "tailoring_order",
  "mall_or_partner_traffic",
  "sewing_equipment",
  "tailor_payroll",
  "customerAcquisitionChannels",
  "premisesStatus",
  "creditNeeded",
  "rent_dependency",
  "tax_cash_register"
];

test("known technical business profile values are localized before user output", () => {
  for (const locale of ["ru", "uz", "en"] as const) {
    for (const value of technicalValues) {
      const localized = localizeBusinessProfileValue(value, locale, { failOnUnknown: true });
      if (locale !== "en") {
        assert.doesNotMatch(localized, /[a-z]+_[a-z0-9_]+/i, `${value} leaked as snake_case in ${locale}`);
        assert.doesNotMatch(localized, /Tailoring|Customer acquisition|Premises status|Credit needed|Tax cash register|Sewing equipment|Rent dependency/i);
      }
    }
  }
});

test("validator rejects raw enum values in Russian and Uzbek reports", () => {
  assert.throws(() => assertNoRawTechnicalLabelsInReport({ locale: "ru", report: { text: "orders_per_month" } }));
  assert.throws(() => assertNoRawTechnicalLabelsInReport({ locale: "uz", report: { text: "tax_cash_register" } }));
});

test("validator ignores internal metadata fields that are not rendered directly", () => {
  assert.doesNotThrow(() => assertNoRawTechnicalLabelsInReport({
    locale: "ru",
    report: {
      capexBreakdown: [
        { label: "Оборудование", amount: 1000000, source: "user_input" },
        { label: "Расходы", amount: 500000, quality: "not_found", sourceType: "official_registry" }
      ],
      marketData: {
        mapping: { mappingSource: "static_dictionary", normalizedSector: "food_service" },
        dataPoints: [{ sourceType: "official_statistics", matchQuality: "broad_proxy" }],
        sources: [{ notes: "Retail turnover (broad_proxy)." }],
        messages: ["Рыночные данные требуют ручной проверки."]
      }
    }
  }));
});


test("validator ignores raw technical provenance in non-rendered report branches", () => {
  assert.doesNotThrow(() => assertNoRawTechnicalLabelsInReport({
    locale: "ru",
    report: {
      documentsAndPermits: [
        { id: "food_sanitary", category: "food_service", confidence: "needs_verification", sourceType: "official_registry" }
      ],
      marketEvidence: [
        { indicator: "Рыночный показатель", matchQuality: "broad_proxy", confidence: "needs_verification" }
      ],
      financialModel: {
        financing: { loanAnnualRateSource: "user_input", leasingAnnualRateSource: "assumption" }
      },
      documentsRows: [["Санитарные требования", "До запуска", "Санитарный орган", "Нужно проверить"]]
    }
  }));
});

test("validator ignores internal financing product targeting keys", () => {
  assert.doesNotThrow(() => assertNoRawTechnicalLabelsInReport({
    locale: "ru",
    report: {
      recommendedProducts: [
        { name: "Кредит на оборотный капитал", recommendedFor: ["working_capital", "raw_materials"] },
        { name: "Подготовка бизнес-плана", recommendedFor: ["bank_readiness", "financial_model"] }
      ]
    }
  }));
});

