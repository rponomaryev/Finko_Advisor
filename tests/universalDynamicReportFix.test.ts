import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import { buildReportData } from "../src/lib/services/reportService.ts";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";

const deviceRepair = {
  userLanguage: "ru" as const,
  businessType: "Сервис ремонта смартфонов и ноутбуков",
  businessIdea: "Основная выручка — ремонт устройств. Запчасти закупаются для ремонта, но бизнес не является розничным магазином. Курьерский забор — вспомогательная услуга.",
  region: "Ташкент город",
  district: "Шайхантахурский район",
  deviceTypes: ["smartphones", "laptops"],
  repairServiceTypes: ["screen_replacement", "battery_replacement"],
  repairOrdersPerMonth: 45,
  averageRepairTicket: 260000,
  sparePartsPlan: ["screens", "batteries"],
  repairEquipment: ["soldering_station", "diagnostic_tools"],
  deviceIntakeForm: true,
  repairWarrantyPolicy: "warranty_30_days",
  dataLiabilityPolicy: "written_intake_act",
  staffPlan: { roles: [{ role: "Мастер", count: 2, monthlySalaryAmount: 6000000, monthlySalaryCurrency: "UZS" }] },
  ownContributionAmount: 200000000,
  ownContributionCurrency: "UZS",
  creditNeeded: "yes",
  requestedLoanAmount: 50000000,
  requestedLoanCurrency: "UZS",
  loanTermMonths: 24,
  loanAnnualRatePct: 25,
  collateralAvailable: true,
  collateralType: "Автомобиль Cobalt"
};

test("device repair report uses profile mapping and hides raw dynamic keys", () => {
  const profile = classifyBusiness({ businessType: deviceRepair.businessType, businessIdea: deviceRepair.businessIdea, region: deviceRepair.region, answers: deviceRepair });
  assert.equal(profile.category, "services");
  assert.equal(profile.subcategory, "device_repair");
  assert.equal(profile.volumeField, "repairOrdersPerMonth");
  assert.equal(profile.averageTicketField, "averageRepairTicket");

  const template = buildDynamicInterviewTemplate(deviceRepair);
  const financial = calculateAll(deviceRepair, template.assumptions);
  assert.equal(financial.revenue.monthlyCapacity, 45);
  assert.equal(financial.revenue.averagePrice, 260000);
  assert.equal(financial.revenue.unitLabel, "заказов ремонта/мес.");

  const risks = generateRiskMatrix(deviceRepair);
  const reportData = buildReportData({ project: { ...deviceRepair, title: "Ремонт техники" }, financial, risks, feasibilityScore: 50, bankReadinessScore: 50 });
  const exportData = prepareReportExport({
    id: "device-repair",
    title: "Ремонт техники",
    status: "calculated",
    businessType: deviceRepair.businessType,
    userLanguage: "ru",
    structuredData: deviceRepair,
    financialResult: financial,
    riskResult: risks,
    reportData
  }, "ru");
  const businessText = JSON.stringify(exportData.businessProfileRows);
  assert.doesNotMatch(businessText, /deviceTypes|repairOrdersPerMonth|averageRepairTicket|sparePartsPlan/);
  assert.match(businessText, /Типы устройств|Количество заказов ремонта в месяц|Средний чек ремонта/);
  const plannedVolume = exportData.financialRows.find((row) => row.indicator === "Плановый объем");
  assert.equal(plannedVolume?.value, "45 заказов ремонта/мес.");
  const collateralValue = exportData.collateralRows.find((row) => row.item === "Ориентировочная стоимость залога");
  assert.notEqual(collateralValue?.amount, "Не применяется");
});
