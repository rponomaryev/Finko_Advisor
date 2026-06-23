import test from "node:test";
import assert from "node:assert/strict";
import { buildExcelReportBuffer } from "../src/lib/export/excelReportExporter.ts";
import { buildPdfReportBuffer } from "../src/lib/export/pdfReportExporter.ts";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";
import { formatSourceCitation, formatSourceListItem, hasSourcePlaceholderLeak } from "../src/lib/report/sourceCitationFormatter.ts";
import { extractPdfText } from "./helpers/pdfText.ts";
import { workbookText } from "./helpers/excelText.ts";
import { buildCalculatedProject, genericProfile } from "./helpers/systemicFixtures.ts";

const forbiddenExportLeakage = /Нужно проверить\s+Нужно проверить|Нужно проверить\s*\/\s*stat\.uz|\(\s*Нужно проверить\s*:|22\s+Нужно проверить\s+2026|Данные нужно подтвердить\s+Данные нужно подтвердить|\b(?:undefined|null|NaN)\b/i;

function atelierProject(locale: "ru" | "uz" | "en" = "ru") {
  const profile = genericProfile({
    businessType: locale === "en" ? "Clothing repair atelier" : locale === "uz" ? "Kiyim ta'mirlash atelyesi" : "Ателье по ремонту одежды",
    category: "services",
    volumeKey: "plannedVolumeMonthly",
    priceKey: "averageServiceTicket",
    overrides: {
      userLanguage: locale,
      businessIdea: "Хочу открыть небольшое ателье по ремонту и подгонке одежды в торговом центре.",
      region: locale === "uz" ? "Toshkent shahri" : locale === "en" ? "Tashkent city" : "Ташкент город",
      district: locale === "uz" ? "Chilonzor" : locale === "en" ? "Chilanzar" : "Чиланзар",
      plannedVolumeMonthly: 300,
      averageServiceTicket: 95_000,
      averagePurchaseCost: 12_000,
      cogsPct: undefined,
      monthlyRent: 8_000_000,
      equipmentCapex: 35_000_000,
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
      collateralAvailable: true,
      collateralType: "owner_personal_property_or_guarantee",
      collateralEstimatedValue: 80_000_000,
      workingCapitalBufferMonths: 3,
      staffPlan: { roles: [
        { role: "tailor", count: 1, monthlySalaryAmount: 5_000_000, monthlySalaryCurrency: "UZS" },
        { role: "administrator", count: 1, monthlySalaryAmount: 3_500_000, monthlySalaryCurrency: "UZS" },
        { role: "helper", count: 1, monthlySalaryAmount: 2_000_000, monthlySalaryCurrency: "UZS" }
      ] },
      sectionNotes: {
        finance: "Планируется смешанное финансирование: 50 млн сум собственных средств и 35 млн сум банковского кредита. Общий стартовый бюджет — около 85 млн сум. Резерв — около 50–60 млн сум."
      },
      businessProfile: { category: "services", subcategory: "tailoring_repair", businessModel: "service", volumeField: "plannedVolumeMonthly", averageTicketField: "averageServiceTicket", capacityUnit: "orders_per_month" }
    }
  });
  const project = buildCalculatedProject(profile);
  const reportData = project.reportData as Record<string, unknown>;
  reportData.aiReport = {
    executiveSummary: "",
    marketAnalysis: "",
    businessModelAssessment: "",
    financialAnalysis: "",
    riskAssessment: "",
    actionPlan: "",
    investmentReadiness: "",
    fullNarrative: "Локальная ниша не подтверждена отдельной статистикой (Нужно проверить / stat.uz, 2026). Нужно проверить\n\nReferences\n1. Нужно проверить / stat.uz (2026) 'Объем индивидуальных услуг (годовая)'. Нужно проверить Нужно проверить: (Нужно проверить: 22 Нужно проверить 2026).",
    citations: [{ text: "Нужно проверить: 22 Нужно проверить 2026", source: "Нужно проверить / stat.uz", url: "https://siat.stat.uz/data/1218/?lang=ru" }]
  };
  reportData.webResearchData = {
    businessType: profile.businessType,
    region: profile.region,
    researchDate: "2026-06-22",
    summary: "",
    marketContext: "",
    searchQueriesUsed: [],
    warnings: [],
    harvardReferences: [],
    statistics: [],
    sources: [
      {
        id: "src_bad_stat",
        organization: "Нужно проверить / stat.uz",
        title: "Объем индивидуальных услуг (годовая)",
        year: null,
        publishedDate: "Нужно проверить",
        accessedDate: "2026-06-22",
        url: "https://siat.stat.uz/data/1218/?lang=ru",
        geography: "Ташкент город",
        sourceType: "official_statistics",
        reliability: "high"
      },
      {
        id: "src_bad_date",
        organization: "Нужно проверить",
        title: "Нужно проверить Нужно проверить Нужно проверить",
        year: "Нужно проверить",
        publishedDate: "22 Нужно проверить 2026",
        accessedDate: "22 Нужно проверить 2026",
        url: "https://stat.uz",
        geography: "Ташкент город",
        sourceType: "official_statistics",
        reliability: "medium"
      }
    ]
  };
  return project;
}

test("safe source formatter omits missing metadata instead of rendering placeholders", () => {
  const full = formatSourceListItem({
    author: "Национальный комитет Республики Узбекистан по статистике",
    title: "Цены на швейные услуги выросли на 7,1 % в 2025 году",
    year: 2026,
    url: "https://stat.uz/example",
    accessedDate: "2026-06-22"
  }, "ru");
  assert.equal(full, "Национальный комитет Республики Узбекистан по статистике (2026) Цены на швейные услуги выросли на 7,1 % в 2025 году. Доступно по адресу: https://stat.uz/example (дата обращения: 2026-06-22)");
  assert.equal(formatSourceCitation({ author: "stat.uz", year: 2025 }, "ru"), "(stat.uz, 2025)");
  assert.doesNotMatch(full, forbiddenExportLeakage);

  const missingAuthor = formatSourceListItem({
    title: "Объем индивидуальных услуг (годовая)",
    url: "https://siat.stat.uz/data/1218/?lang=ru",
    year: 2025,
    accessedDate: "2026-06-22"
  }, "ru");
  assert.equal(missingAuthor, "stat.uz (2025) Объем индивидуальных услуг (годовая). Доступно по адресу: https://siat.stat.uz/data/1218/?lang=ru (дата обращения: 2026-06-22)");

  const missingTitle = formatSourceListItem({
    siteName: "stat.uz",
    url: "https://stat.uz",
    accessedDate: "2026-06-22"
  }, "ru");
  assert.equal(missingTitle, "stat.uz. Статистический источник. Доступно по адресу: https://stat.uz (дата обращения: 2026-06-22)");
});

test("safe source formatter removes existing placeholder metadata and malformed dates", () => {
  const cleaned = formatSourceListItem({
    author: "Нужно проверить",
    publisher: "Нужно проверить",
    title: "Объем индивидуальных услуг (годовая)",
    siteName: "stat.uz",
    url: "https://siat.stat.uz/data/1218/?lang=ru",
    accessedDate: "2026-06-22"
  }, "ru");
  assert.equal(cleaned, "stat.uz. Объем индивидуальных услуг (годовая). Доступно по адресу: https://siat.stat.uz/data/1218/?lang=ru (дата обращения: 2026-06-22)");
  assert.equal(hasSourcePlaceholderLeak(cleaned), false);

  const malformed = formatSourceListItem({
    publisher: "Нужно проверить",
    siteName: "stat.uz",
    title: "Нужно проверить",
    year: "Нужно проверить",
    accessedDate: "22 Нужно проверить 2026",
    url: "https://stat.uz"
  }, "ru");
  assert.equal(malformed, "stat.uz. Статистический источник. Доступно по адресу: https://stat.uz");
  assert.doesNotMatch(malformed, forbiddenExportLeakage);
});

test("prepared, PDF and Excel exports clean source/citation placeholders in atelier report", async () => {
  const project = atelierProject("ru");
  const prepared = prepareReportExport(project, "ru");
  const preparedText = JSON.stringify({ sources: prepared.sources, warnings: prepared.warnings, ai: prepared.aiReport });
  assert.doesNotMatch(preparedText, forbiddenExportLeakage);
  assert.match(preparedText, /stat\.uz/);
  assert.match(preparedText, /Требует уточнения|Низкая доля собственных средств/);

  const pdfText = await extractPdfText(await buildPdfReportBuffer(project, "ru"));
  const excelText = (await workbookText(await buildExcelReportBuffer(project, "ru"))).text;
  for (const text of [pdfText, excelText]) {
    assert.doesNotMatch(text, forbiddenExportLeakage);
    assert.doesNotMatch(text, /Низкий\s+Нужно проверить\s+Нужно проверить/i);
    assert.match(text, /Список источников|Источники/);
    assert.match(text, /stat\.uz/);
  }
});

test("UZ and EN source formatting does not leak Russian placeholders", async () => {
  for (const locale of ["uz", "en"] as const) {
    const prepared = prepareReportExport(atelierProject(locale), locale);
    const text = JSON.stringify({ sources: prepared.sources, ai: prepared.aiReport, warnings: prepared.warnings });
    assert.doesNotMatch(text, /Нужно проверить|Данные нужно подтвердить/);
    assert.match(text, locale === "uz" ? /Manzil|Aniqlashtirish kerak|Moliyalashtirish/ : /Available at|Needs clarification|Financing/);
  }
});
