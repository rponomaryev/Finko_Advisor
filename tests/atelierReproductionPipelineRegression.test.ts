import test from "node:test";
import assert from "node:assert/strict";
import { buildExcelReportBuffer } from "../src/lib/export/excelReportExporter.ts";
import { buildPdfReportBuffer } from "../src/lib/export/pdfReportExporter.ts";
import { resolveRevenueInputs } from "../src/lib/financial/revenueInputResolver.ts";
import { replaceForbiddenUserFacingTerms, sanitizeUserFacingTextareaValue } from "../src/lib/i18n/userFacingSanitizer.ts";
import { formatDistrict, formatLocation, normalizeLocation } from "../src/lib/location/locationNormalizer.ts";
import { localizeReportData } from "../src/lib/report/localizeReport.ts";
import { resolveSidebarSummaryItems } from "../src/lib/summary/sidebarSummaryResolver.ts";
import { labelValue } from "../src/lib/utils/labels.ts";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import { extractPdfText } from "./helpers/pdfText.ts";
import { workbookText } from "./helpers/excelText.ts";
import { buildCalculatedProject, genericProfile } from "./helpers/systemicFixtures.ts";

const forbiddenLeakage = /\bmixed\b|targetCustomers|customerAcquisitionChannels|sourceAmount|sourceCurrency|amountUZS|\{\s*"?sourceAmount"?\s*:/i;

function atelierProfile(overrides: Record<string, unknown> = {}) {
  return genericProfile({
    businessType: "Ателье по ремонту одежды",
    category: "services",
    volumeKey: "plannedVolumeMonthly",
    priceKey: "averageServiceTicket",
    overrides: {
      businessIdea: "Небольшое ателье по ремонту и подгонке одежды в торговом центре: подшив брюк, замена молний, мелкий пошив и срочные заказы.",
      region: "Ташкент",
      district: "Юнусабад",
      premisesStatus: "rent",
      premisesAreaSqm: 15,
      monthlyRent: 8_000_000,
      equipmentCondition: "mixed",
      equipmentList: "Промышленная прямострочная швейная машина — 1 шт.\nОверлок — 1 шт.\nБытовая/резервная швейная машина — 1 шт.\nПарогенератор или профессиональный утюг — 1 комплект.",
      equipmentCapex: 35_000_000,
      staffPlan: { roles: [
        { role: "tailor", count: 1, monthlySalaryAmount: 5_000_000, monthlySalaryCurrency: "UZS" },
        { role: "administrator", count: 1, monthlySalaryAmount: 3_500_000, monthlySalaryCurrency: "UZS" },
        { role: "helper", count: 1, monthlySalaryAmount: 2_000_000, monthlySalaryCurrency: "UZS" }
      ] },
      averagePurchaseCost: 12_000,
      stockCoverageDays: 30,
      plannedVolumeMonthly: 250,
      // Stale/default fields that used to override the explicit monthly answer.
      monthlyCapacity: 8,
      dailyOrdersCapacity: 20,
      averageServiceTicket: 85_000,
      averagePrice: { __money: true, sourceAmount: 85_000, sourceCurrency: "UZS", amountUZS: 85_000 },
      ownContributionAmount: 50_000_000,
      ownContributionUZS: 50_000_000,
      ownContributionCurrency: "UZS",
      creditNeeded: "yes",
      requestedLoanAmount: 35_000_000,
      requestedLoanCurrency: "UZS",
      requestedLoanUZS: 35_000_000,
      loanTermMonths: 36,
      loanAnnualRatePct: 28,
      loanRepaymentType: "annuity",
      loanPurpose: "Запуск ателье, оборудование и оборотный капитал",
      workingCapitalBufferMonths: 3,
      completedBlockIds: ["business_idea", "location", "equipment_launch", "operations", "suppliers_procurement", "sales", "financing", "documents_experience"],
      businessProfile: { category: "services", subcategory: "tailoring_repair", businessModel: "service", volumeField: "monthlyCapacity", averageTicketField: "averageServiceTicket", capacityUnit: "orders_per_month" },
      ...overrides
    }
  });
}

test("Tashkent + Yunusabad is normalized as Tashkent city in RU/UZ/EN, not Tashkent region", () => {
  const ru = normalizeLocation({ region: "Ташкент", district: "Юнусабад" });
  assert.equal(ru.regionCode, "tashkent_city");
  assert.equal(ru.regionName, "Ташкент город");
  assert.equal(ru.districtName, "Юнусабад");
  assert.equal(formatLocation(ru, "ru"), "Ташкент, Юнусабад");
  assert.equal(formatLocation({ region: "Toshkent shahri", district: "Yunusobod" }, "uz"), "Toshkent shahri, Yunusobod tumani");
  assert.equal(formatLocation({ region: "Tashkent city", district: "Yunusabad" }, "en"), "Tashkent city, Yunusabad district");
  const region = normalizeLocation({ region: "Ташкентская область", district: "Чирчик" });
  assert.equal(region.regionCode, "tashkent_region");
  assert.equal(formatDistrict("Yunusobod", "ru"), "Юнусабад");
});

test("explicit atelier monthly volume stays source of truth for sidebar, calculations, PDF and Excel", async () => {
  const profile = atelierProfile();
  const template = resolveTemplateForData(profile);
  const revenue = resolveRevenueInputs(profile, template.assumptions, profile.businessProfile as Record<string, unknown>);
  assert.equal(revenue.volume?.key, "plannedVolumeMonthly");
  assert.equal(revenue.monthlyCapacity, 250);
  assert.equal(revenue.monthlyRevenue, 21_250_000);

  const sidebar = resolveSidebarSummaryItems(profile, template, "ru");
  const sidebarText = sidebar.map((item) => `${item.label}: ${item.displayValue}`).join("\n");
  assert.match(sidebarText, /250/);
  assert.doesNotMatch(sidebarText, /\b8\s+(?:ед|заказ)/);
  assert.doesNotMatch(sidebarText, /\b20\s+(?:ед|заказ)/);

  const project = buildCalculatedProject(profile);
  const pdfText = await extractPdfText(await buildPdfReportBuffer(project, "ru"));
  const excelText = (await workbookText(await buildExcelReportBuffer(project, "ru"))).text;
  for (const text of [pdfText, excelText]) {
    assert.match(text, /21\s*250\s*000/);
    assert.match(text, /250\s+заказов\/мес/i);
    assert.doesNotMatch(text, forbiddenLeakage);
  }
});

test("answer formatter and textarea sanitizer do not expose raw enum, money JSON or internal answer summaries", () => {
  assert.equal(labelValue("mixed", "ru"), "Смешанная модель");
  assert.equal(replaceForbiddenUserFacingTerms("mixed", "ru"), "Смешанное");
  assert.equal(replaceForbiddenUserFacingTerms("mixed", "uz"), "Aralash");
  assert.equal(replaceForbiddenUserFacingTerms("mixed", "en"), "Mixed");
  assert.equal(labelValue({ sourceAmount: 85_000, sourceCurrency: "UZS", amountUZS: 85_000 }, "ru"), "85 000 сум");

  const debugDump = 'targetCustomers: delivery, wholesale, individuals; customerAcquisitionChannels: instagram, telegram; monthlyCapacity: 250; averagePrice: {"sourceAmount":85000,"sourceCurrency":"UZS","amountUZS":85000}; hasBuyerAgreements: true';
  assert.equal(sanitizeUserFacingTextareaValue(debugDump, { fieldKey: "sectionNotes.salesMarketing", locale: "ru" }), "");
  assert.equal(sanitizeUserFacingTextareaValue({ sourceAmount: 85_000 }, { fieldKey: "sectionNotes.salesMarketing", locale: "ru" }), "");
});

test("localized report validation is non-fatal outside test strict mode", () => {
  const project = buildCalculatedProject(atelierProfile());
  const mutableEnv = process.env as Record<string, string | undefined>;
  const previousNodeEnv = mutableEnv.NODE_ENV;
  const previousStrict = mutableEnv.STRICT_REPORT_LOCALE_CHECK;
  mutableEnv.NODE_ENV = "development";
  mutableEnv.STRICT_REPORT_LOCALE_CHECK = "true";
  try {
    assert.doesNotThrow(() => localizeReportData(project.reportData as any, "ru"));
    assert.doesNotThrow(() => localizeReportData(project.reportData as any, "uz"));
    assert.doesNotThrow(() => localizeReportData(project.reportData as any, "en"));
  } finally {
    if (previousNodeEnv === undefined) delete mutableEnv.NODE_ENV; else mutableEnv.NODE_ENV = previousNodeEnv;
    if (previousStrict === undefined) delete mutableEnv.STRICT_REPORT_LOCALE_CHECK; else mutableEnv.STRICT_REPORT_LOCALE_CHECK = previousStrict;
  }
});
