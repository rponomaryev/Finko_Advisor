import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { buildGenericBusinessTemplate } from "../src/lib/data/sectorTemplates/genericBusinessTemplate.ts";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import { calculateBankReadinessScore, calculateFeasibilityScore } from "../src/lib/scoring/scoringService.ts";
import { buildReportData } from "../src/lib/services/reportService.ts";
import type { StructuredProjectData } from "../src/lib/types/project.ts";

export function createExportProject(userLanguage: "ru" | "uz" | "en" = "ru") {
  const businessType = userLanguage === "uz" ? "Kichik qahvaxona" : "Кофейня";
  const businessIdea = userLanguage === "uz" ? "Universitet yaqinida kichik qahvaxona ochmoqchiman" : "Хочу открыть небольшую кофейню возле университета";
  const region = userLanguage === "uz" ? "Toshkent shahri" : "Ташкент город";
  const district = userLanguage === "uz" ? "Yunusobod" : "Юнусабад";
  const title = userLanguage === "uz" ? "Kichik qahvaxona - Toshkent shahri" : "Кофейня — Ташкент город";
  const template = buildGenericBusinessTemplate(businessType);
  const structuredData: StructuredProjectData = {
    userLanguage,
    businessType,
    businessIdea,
    sectorCode: template.code,
    templateCode: template.code,
    region,
    district,
    plannedStartPeriod: userLanguage === "uz" ? "2 oy ichida" : "через 2 месяца",
    productOrService: userLanguage === "uz" ? "Olib ketish uchun qahva, choy va desertlar" : "Кофе, чай и десерты навынос",
    premisesStatus: "rent",
    equipmentCondition: "new",
    monthlyCapacity: 2800,
    salesUnitLabel: "заказов/мес.",
    averagePrice: 28000,
    rawMaterialSource: "mixed",
    targetCustomers: ["walk_in", "students", "delivery"],
    certificationAwareness: "partly_aware",
    ownContributionAmount: 120000000,
    ownContributionCurrency: "UZS",
    ownContributionUZS: 120000000,
    ownContribution: 120000000,
    exchangeRateUZSPerUSD: 11970.68,
    exchangeRateSnapshot: {
      sourceCurrency: "USD",
      targetCurrency: "UZS",
      rate: 11970.68,
      requestedDate: "2026-06-08",
      rateDate: "2026-06-08",
      source: "CBU",
      sourceUrl: "https://cbu.uz/ru/arkhiv-kursov-valyut/json/USD/2026-06-08/",
      fetchedAt: "2026-06-08T05:00:00.000Z"
    },
    creditNeeded: "yes",
    requestedLoanAmount: 180000000,
    requestedLoanCurrency: "UZS",
    requestedLoanUZS: 180000000,
    loanTermMonths: 36,
    collateralAvailable: true,
    collateralEstimatedValue: 160000000,
    experienceLevel: "medium",
    employeesCount: 5,
    stableMonthlyRevenue: 78000000,
    sectionNotes: {
      businessIdea: userLanguage === "uz" ? "Talabalar va ofis xodimlari uchun universitet yonidagi qahvaxona." : "Кофейня рядом с университетом для студентов и офисных сотрудников.",
      premisesInfrastructure: userLanguage === "uz" ? "Piyoda oqimi yaxshi bo'lgan 60 m2 ijaradagi joy." : "Арендное помещение 60 м2 с хорошим пешеходным трафиком.",
      equipment: userLanguage === "uz" ? "Yangi qahva mashinasi, muzlatkich, kassa tizimi va mebel bo'yicha tijorat taklifi bor." : "Новая кофемашина, холодильник, POS и мебель с коммерческим предложением.",
      productionCapacity: userLanguage === "uz" ? "Oyiga taxminan 2800 buyurtma va besh xodimdan iborat jamoa." : "Около 2800 заказов в месяц, команда из пяти сотрудников.",
      rawMaterials: userLanguage === "uz" ? "Qahva, sut, desertlar va qadoqlash bir nechta yetkazib beruvchidan olinadi." : "Кофе, молоко, десерты и упаковка от нескольких поставщиков.",
      salesMarketing: userLanguage === "uz" ? "Savdo nuqta, yetkazib berish va mahalliy hamkorliklar orqali olib boriladi." : "Продажи через точку, доставку и локальные партнерства.",
      finance: userLanguage === "uz" ? "O'z mablag'i 120 mln so'm va kredit 180 mln so'm." : "Собственные средства 120 млн сум и кредит 180 млн сум.",
      complianceExperience: userLanguage === "uz" ? "Buxgalter bor va umumiy ovqatlanish talablari bo'yicha asosiy tushuncha mavjud." : "Есть бухгалтер и базовое понимание требований общепита."
    }
  };

  const financial = calculateAll(structuredData, template.assumptions);
  const risks = generateRiskMatrix(structuredData);
  const feasibilityScore = calculateFeasibilityScore(structuredData, financial, risks);
  const bankReadinessScore = calculateBankReadinessScore(structuredData, financial, risks);
  const reportData = buildReportData({
    project: {
      ...structuredData,
      title,
      sectorCode: template.code
    },
    financial,
    risks,
    feasibilityScore,
    bankReadinessScore
  });

  return {
    id: "project-export-test",
    title,
    sectorCode: template.code,
    status: "calculated",
    businessType: structuredData.businessType,
    userLanguage,
    structuredData,
    region: structuredData.region,
    district: structuredData.district,
    plannedStartPeriod: structuredData.plannedStartPeriod,
    financialResult: financial,
    riskResult: risks,
    feasibilityScore,
    bankReadinessScore,
    reportData
  };
}
