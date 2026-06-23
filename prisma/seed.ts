import { prisma } from "../src/lib/db/prisma.ts";
import { calculateAll } from "../src/lib/calculator/financialCalculator";
import { buildGenericBusinessTemplate } from "../src/lib/data/sectorTemplates/genericBusinessTemplate";
import { getMarketData } from "../src/lib/marketData/marketDataService";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine";
import { calculateBankReadinessScore, calculateFeasibilityScore } from "../src/lib/scoring/scoringService";
import { buildReportData } from "../src/lib/services/reportService";
import type { StructuredProjectData } from "../src/lib/types/project";


async function main() {
  const template = buildGenericBusinessTemplate("Кофейня");
  await prisma.sectorTemplate.upsert({
    where: { code: template.code },
    update: {
      name: template.name,
      description: template.description,
      businessType: template.businessType,
      requiredInputs: template.requiredInputs as never,
      assumptions: template.assumptions,
      questions: template.interviewBlocks as never,
      riskRules: template.riskRules as never,
      scoringRules: template.scoringRules as never,
      isActive: true
    },
    create: {
      code: template.code,
      name: template.name,
      description: template.description,
      businessType: template.businessType,
      requiredInputs: template.requiredInputs as never,
      assumptions: template.assumptions,
      questions: template.interviewBlocks as never,
      riskRules: template.riskRules as never,
      scoringRules: template.scoringRules as never,
      isActive: true
    }
  });

  const demoUser = await prisma.user.create({ data: { name: "Demo user", email: `demo-${Date.now()}@finko.local` } });
  const projectData: StructuredProjectData = {
    userLanguage: "ru",
    businessType: "Кофейня",
    businessIdea: "Небольшая кофейня возле университета с напитками навынос и десертами.",
    sectorCode: template.code,
    templateCode: template.code,
    region: "Ташкент город",
    district: "Юнусабад",
    plannedStartPeriod: "через 2 месяца",
    productOrService: "Кофе, чай, десерты и напитки навынос",
    premisesStatus: "rent",
    infrastructureReady: true,
    premisesAreaSqm: 60,
    equipmentCondition: "new",
    supplierSelected: true,
    supplierOfferAvailable: true,
    equipmentDeliveryMonths: 1,
    monthlyCapacity: 2800,
    salesUnitLabel: "заказов/мес.",
    employeesCount: 5,
    qualityControlPlan: true,
    averagePrice: 28000,
    stableMonthlyRevenue: 78000000,
    targetCustomers: ["walk_in", "students", "office_workers", "delivery"],
    rawMaterialSource: "mixed",
    suppliersAvailable: true,
    firstMonthRawMaterialStockUZS: 22000000,
    foreignCurrencyPurchases: false,
    hasBuyerAgreements: true,
    clientPaymentTerm: "immediate",
    certificationAwareness: "partly_aware",
    hasAccountantOrConsultant: true,
    ownContributionAmount: 120000000,
    ownContributionCurrency: "UZS",
    ownContributionUZS: 120000000,
    ownContribution: 120000000,
    creditNeeded: "yes",
    requestedLoanAmount: 180000000,
    requestedLoanCurrency: "UZS",
    requestedLoanUZS: 180000000,
    loanPurpose: "Оборудование, ремонт помещения и стартовый запас продуктов.",
    loanTermMonths: 36,
    collateralAvailable: true,
    collateralType: "Автомобиль и оборудование",
    collateralEstimatedValue: 160000000,
    experienceLevel: "medium",
    sectionNotes: {
      businessIdea: "Кофейня ориентирована на студентов и офисных сотрудников рядом с университетом.",
      premisesInfrastructure: "Планируется аренда помещения 60 м2 с хорошим пешеходным трафиком.",
      equipment: "Выбран поставщик кофемашины, холодильного оборудования и POS.",
      productionCapacity: "Планируется около 2800 заказов в месяц, команда из 5 сотрудников.",
      rawMaterials: "Кофе, молоко, десерты и упаковка закупаются у нескольких поставщиков.",
      salesMarketing: "Продажи через точку, доставку и локальные партнерства с университетскими сообществами.",
      finance: "Собственные средства 120 млн сум, нужен кредит 180 млн сум.",
      complianceExperience: "Есть бухгалтер и понимание базовых требований общепита."
    }
  };

  const financial = calculateAll(projectData, template.assumptions);
  const risks = generateRiskMatrix(projectData);
  const feasibilityScore = calculateFeasibilityScore(projectData, financial, risks);
  const bankReadinessScore = calculateBankReadinessScore(projectData, financial, risks);
  const marketData = await getMarketData({ businessType: projectData.businessType ?? "Кофейня", region: projectData.region, locale: "ru" });
  const reportData = buildReportData({
    project: { ...projectData, title: "Кофейня — Ташкент город", sectorCode: template.code },
    financial,
    risks,
    feasibilityScore,
    bankReadinessScore,
    marketData
  });

  await prisma.project.create({
    data: {
      userId: demoUser.id,
      title: "Кофейня — Ташкент город",
      sectorCode: template.code,
      status: "calculated",
      businessType: projectData.businessType,
      userLanguage: "ru",
      businessIdea: projectData.businessIdea,
      region: projectData.region,
      district: projectData.district,
      plannedStartPeriod: projectData.plannedStartPeriod,
      premisesStatus: projectData.premisesStatus,
      equipmentCondition: projectData.equipmentCondition,
      monthlyCapacity: projectData.monthlyCapacity,
      averagePrice: projectData.averagePrice,
      targetCustomers: projectData.targetCustomers?.join(","),
      rawMaterialSource: projectData.rawMaterialSource,
      certificationAwareness: projectData.certificationAwareness,
      supplierSelected: projectData.supplierSelected,
      ownContribution: projectData.ownContribution,
      sectionNotes: projectData.sectionNotes as never,
      ownContributionAmount: projectData.ownContributionAmount,
      ownContributionCurrency: projectData.ownContributionCurrency,
      ownContributionUZS: projectData.ownContributionUZS,
      creditNeeded: projectData.creditNeeded,
      requestedLoanAmount: projectData.requestedLoanAmount,
      requestedLoanCurrency: projectData.requestedLoanCurrency,
      requestedLoanUZS: projectData.requestedLoanUZS,
      loanPurpose: projectData.loanPurpose,
      loanTermMonths: projectData.loanTermMonths,
      collateralAvailable: projectData.collateralAvailable,
      collateralType: projectData.collateralType,
      collateralEstimatedValue: projectData.collateralEstimatedValue,
      experienceLevel: projectData.experienceLevel,
      aiMode: "fallback",
      templateData: template as never,
      structuredData: projectData as never,
      financialResult: financial as never,
      riskResult: risks as never,
      feasibilityScore,
      bankReadinessScore,
      reportData: reportData as never,
      answers: {
        create: [
          { questionKey: "businessIdea", question: "Описание бизнес-идеи", answer: projectData.businessIdea ?? "", answerType: "textarea" },
          { questionKey: "sectionNotes.finance", question: "Описание финансов", answer: projectData.sectionNotes?.finance ?? "", answerType: "textarea" }
        ]
      }
    } as never
  });
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
