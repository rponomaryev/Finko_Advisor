import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { translateBlock, translateQuestion } from "../src/lib/i18n/interviewLabels.ts";
import { labelValue } from "../src/lib/utils/labels.ts";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import { calculateBankReadinessScore, calculateFeasibilityScore } from "../src/lib/scoring/scoringService.ts";
import { buildReportData } from "../src/lib/services/reportService.ts";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";

const carWashInput = {
  businessType: "Автомойка",
  businessIdea: "Хочу открыть автомойку среднего формата в Чиланзаре: ручная мойка, комплексная мойка, поток машин с улицы и договоры с небольшими автопарками.",
  region: "Ташкент город",
  district: "Чиланзар"
};

test("car wash keeps common blocks and adapts their questions to car-wash logic", () => {
  const profile = classifyBusiness(carWashInput);
  assert.equal(profile.category, "services");
  assert.equal(profile.subcategory, "car_wash");

  const template = buildDynamicInterviewTemplate(carWashInput);
  const ids = template.interviewBlocks.map((block) => block.id);
  const keys = template.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key));

  for (const id of ["business_idea", "sales", "location", "equipment_launch", "operations", "financing", "documents_experience"]) assert.ok(ids.includes(id));
  assert.equal(ids.some((id) => id.startsWith("auto_service")), false);
  assert.equal(ids.some((id) => id.startsWith("car_wash_")), false);
  assert.equal(keys.includes("carWashFormat"), true);
  assert.equal(keys.includes("waterSource"), true);
  assert.equal(keys.includes("wastewaterHandling"), true);
  assert.equal(keys.includes("liftIncluded"), false);
  assert.equal(keys.includes("wasteOilHandling"), false);
});

test("car wash interview labels and options are localized in Russian without raw enum values", () => {
  const template = buildDynamicInterviewTemplate(carWashInput);
  const block = template.interviewBlocks.find((item) => item.id === "business_idea")!;
  const translatedBlock = translateBlock("ru", block.id, block.name, block.description);
  const translatedQuestions = block.questions.map((question) => translateQuestion("ru", question));
  const text = JSON.stringify({
    block: translatedBlock,
    questions: translatedQuestions.map((question) => ({ label: question.label, question: question.question })),
    options: block.questions.flatMap((question) => question.options ?? []).map((option) => labelValue(option, "ru"))
  });

  assert.match(text, /автомойк/i);
  assert.match(text, /Ручная мойка|Самообслуживание|B2B-договоры/);
  assert.doesNotMatch(text, /manual_wash|self_service_wash|b2b_contracts|customer_flow/);
});

test("car wash report uses Russian business model rows, documents and market evidence", () => {
  const template = buildDynamicInterviewTemplate(carWashInput);
  const structuredData: any = {
    ...carWashInput,
    userLanguage: "ru",
    sectorCode: template.code,
    templateCode: template.code,
    productOrService: "Ручная и комплексная мойка автомобилей",
    premisesStatus: "rent",
    equipmentCondition: "new",
    carWashFormat: "manual_wash",
    washServiceTypes: ["exterior_wash", "complex_wash", "interior_cleaning"],
    customerFlowModel: "mixed",
    washBaysCount: 3,
    carsPerDayStart: 20,
    carsPerDayStable: 35,
    averageWashTicket: 70000,
    monthlyCapacity: 900,
    averagePrice: 70000,
    stableMonthlyRevenue: 63000000,
    waterSource: "central_water",
    waterDrainageReady: "needs_connection",
    wastewaterHandling: "sedimentation_filter",
    carWashEquipment: ["high_pressure_washer", "vacuum_cleaner", "foam_generator"],
    washChemicals: ["car_shampoo", "interior_cleaner", "wax"],
    staffPlan: { roles: [{ role: "Мойщик", count: 4, monthlySalaryAmount: 3500000 }] },
    ownContributionAmount: 100000000,
    ownContributionCurrency: "UZS",
    creditNeeded: "yes",
    requestedLoanAmount: 150000000,
    requestedLoanCurrency: "UZS",
    loanTermMonths: 36,
    collateralAvailable: true,
    collateralEstimatedValue: 120000000,
    experienceLevel: "medium"
  };
  const financial = calculateAll(structuredData, template.assumptions);
  const risks = generateRiskMatrix(structuredData);
  const reportData = buildReportData({
    project: { ...structuredData, title: "Автомойка — Чиланзар" },
    financial,
    risks,
    feasibilityScore: calculateFeasibilityScore(structuredData, financial, risks),
    bankReadinessScore: calculateBankReadinessScore(structuredData, financial, risks)
  });
  const exportData = prepareReportExport({
    id: "car-wash-report-test",
    title: "Автомойка — Чиланзар",
    status: "calculated",
    businessType: structuredData.businessType,
    userLanguage: "ru",
    structuredData,
    financialResult: financial,
    riskResult: risks,
    reportData
  }, "ru");

  const text = JSON.stringify({
    business: exportData.businessProfileRows,
    market: exportData.marketEvidenceRows,
    docs: exportData.documentRows,
    risks: exportData.risks
  });
  assert.match(text, /автомойк/i);
  assert.match(text, /Вода, канализация и стоки автомойки|Договор аренды с правом автомойки/);
  assert.match(text, /Официальная статистика|Рыночный proxy|Официальные данные/);
  assert.doesNotMatch(text, /Business model|generic|customer_flow|average_ticket|startup_costs|Pokazatel|Registratsiya|Documents and permits/);
  assert.doesNotMatch(text, /Требует уточнения Требует уточнения|уточняемый показатель|Мойка Требует уточнения|рынок Требует уточнения/);
  assert.match(text, /Машин в день|Средний чек мойки|Вода и электроэнергия|Фильтрация и стоки/);
});

test("car wash interview avoids repeated generic questions for sector-specific fields", () => {
  const template = buildDynamicInterviewTemplate(carWashInput);
  const questions = template.interviewBlocks.flatMap((block) => block.questions.map((question) => ({ blockId: block.id, key: question.key, question: question.question })));
  const countByKey = new Map<string, number>();
  for (const item of questions) countByKey.set(item.key, (countByKey.get(item.key) ?? 0) + 1);

  for (const key of ["premisesStatus", "premisesAreaSqm", "averagePrice", "monthlyCapacity", "equipmentList", "staffPlan", "qualityControlPlan"]) {
    assert.ok((countByKey.get(key) ?? 0) <= 1, `${key} should not be repeated in car wash interview`);
  }
  assert.equal(questions.some((item) => item.blockId === "equipment" && item.key === "equipmentList"), false);
  assert.equal(questions.some((item) => item.blockId === "staff" && item.key === "staffPlan"), false);
  assert.equal(questions.some((item) => item.blockId === "equipment_launch" && item.key === "carWashEquipment"), true);
});

test("car wash financial model converts stable cars per day into monthly cars", () => {
  const template = buildDynamicInterviewTemplate(carWashInput);
  const structuredData: any = {
    ...carWashInput,
    userLanguage: "ru",
    businessProfile: classifyBusiness(carWashInput),
    productOrService: "Мойка автомобилей",
    workingDaysPerMonth: 30,
    carsPerDayStable: 50,
    averageWashTicket: 70000,
    ownContributionAmount: 100000000,
    ownContributionCurrency: "UZS",
    creditNeeded: "no"
  };
  const financial = calculateAll(structuredData, template.assumptions);
  assert.equal(financial.revenue.monthlyCapacity, 1500);
  assert.equal(financial.revenue.averagePrice, 70000);
  assert.equal(financial.revenue.unitLabel, "авто/мес.");
});

test("car wash report does not expose excluded technical blocks", () => {
  const template = buildDynamicInterviewTemplate(carWashInput);
  const structuredData: any = {
    ...carWashInput,
    userLanguage: "ru",
    sectorCode: template.code,
    templateCode: template.code,
    productOrService: "Мойка автомобилей",
    carWashFormat: "manual_wash",
    washServiceTypes: ["exterior_wash", "complex_wash"],
    premisesStatus: "rent",
    locationTraffic: "У дороги и жилого массива",
    waterSource: "central_water",
    waterDrainageReady: true,
    wastewaterHandling: "Фильтрация и слив по договору",
    washBaysCount: 3,
    workingDaysPerMonth: 30,
    workingHoursPerDay: 12,
    averageServiceDurationMinutes: 35,
    carsPerDayStable: 50,
    averageWashTicket: 70000,
    carWashEquipment: ["high_pressure_washer", "vacuum_cleaner"],
    washChemicals: ["shampoo", "active_foam"],
    targetCustomers: ["private_car_owners", "repeat_clients"],
    customerAcquisitionChannels: ["road_signage", "maps_2gis_google_yandex"],
    pricingModel: "service_package",
    staffPlan: { roles: [{ role: "Мойщик", count: 5, monthlySalaryAmount: 3500000, monthlySalaryCurrency: "UZS" }] },
    teamSizePerShift: 3,
    workingSchedule: "2 смены",
    qualityControlPlan: ["checklists"],
    businessLegalForm: "individual_entrepreneur",
    requiredPermits: "Проверить воду и слив",
    chemicalSafetyRules: true,
    ownContributionAmount: 200000000,
    ownContributionCurrency: "UZS",
    creditNeeded: "no",
    certificationAwareness: "partly_aware",
    experienceLevel: "medium"
  };
  const financial = calculateAll(structuredData, template.assumptions);
  const risks = generateRiskMatrix(structuredData);
  const reportData = buildReportData({
    project: { ...structuredData, title: "Автомойка — Ташкент" },
    financial,
    risks,
    feasibilityScore: calculateFeasibilityScore(structuredData, financial, risks),
    bankReadinessScore: calculateBankReadinessScore(structuredData, financial, risks)
  });
  const text = JSON.stringify(reportData.businessModelRows);
  assert.doesNotMatch(text, /Исключенные блоки|excluded|production_process|retail_sku|food_service_menu/);
});
