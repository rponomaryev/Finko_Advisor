import type {
  CurrencyCode,
  DataSourceKind,
  ExchangeRateSnapshot,
  FinancialResult,
  SectorAssumptions,
  StaffPlanRole,
  StructuredProjectData
} from "../types/project";
import { formatCurrencyFull } from "../utils/formatCurrency.ts";
import { classifyBusiness } from "../business/businessClassifier.ts";
import { applyFinanceTextFallbacks, detectFinanceTextFallbackWarnings, detectInterviewDataQualityWarnings } from "../interview/dataQuality.ts";
import { resolveRevenueInputs } from "../financial/revenueInputResolver.ts";
import { safeText } from "../utils/safeText.ts";

const roundMoney = (value: number) => Math.round(Number.isFinite(value) ? value : 0);
const roundPct = (value: number) => Math.round((Number.isFinite(value) ? value : 0) * 10) / 10;
const sourceOf = (value: unknown): DataSourceKind => value === undefined || value === null || value === "" ? "assumption" : "user_input";
const numberOr = (value: unknown, fallback: number) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const pct = (value: number) => Math.max(0, Math.min(100, value));
const moneyValue = (project: StructuredProjectData, key: keyof StructuredProjectData, fallback: number) => {
  const snapshot = project.moneyValues?.[String(key)];
  if (snapshot && Number.isFinite(Number(snapshot.amountUZS))) return Number(snapshot.amountUZS);
  return numberOr(project[key], fallback);
};

function resolvedBusinessProfile(project: StructuredProjectData): Record<string, unknown> {
  if (project.businessProfile && Object.keys(project.businessProfile).length > 0) return project.businessProfile as Record<string, unknown>;
  return classifyBusiness({ businessType: project.businessType, businessIdea: project.businessIdea, region: project.region, language: project.userLanguage, answers: project }) as unknown as Record<string, unknown>;
}

const profileString = (project: StructuredProjectData, key: string, profile?: Record<string, unknown>): string | undefined => {
  const value = (profile ?? resolvedBusinessProfile(project))[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const dynamicNumber = (project: StructuredProjectData, key: string | undefined, fallback = 0): number => {
  if (!key) return fallback;
  const snapshot = project.moneyValues?.[key];
  if (snapshot && Number.isFinite(Number(snapshot.amountUZS))) return Number(snapshot.amountUZS);
  return numberOr((project as Record<string, unknown>)[key], fallback);
};

const nonCanonicalAverageTicketFields = [
  "averageTicket",
  "averageServiceTicket",
  "averageWashTicket",
  "averageRentalTicket",
  "averageRepairTicket",
  "averageLaundryTicket",
  "averageGroomingTicket",
  "averageStorageTicket",
  "averageTestTicket",
  "averageSolarProjectTicket",
  "tariff"
];

const hasExplicitNonCanonicalAverageTicket = (project: StructuredProjectData) =>
  nonCanonicalAverageTicketFields.some((key) => dynamicNumber(project, key, 0) > 0);

const unitLabelByCapacityUnit: Record<string, string> = {
  orders_per_month: "заказов/мес.",
  service_orders_per_month: "заказов/мес.",
  repair_orders_per_month: "заказов ремонта/мес.",
  cycles_per_month: "циклов стирки/мес.",
  cycles_per_day: "циклов стирки/мес.",
  projects_per_month: "проектов/мес.",
  installations_per_month: "монтажей/мес.",
  visits_per_month: "визитов/мес.",
  rentals_per_month: "аренд/мес.",
  rental_orders_per_month: "аренд/мес.",
  units_per_month: "ед./мес.",
  customers_per_month: "клиентов/мес.",
  storage_units: "юнитов/мес.",
  portions_per_month: "порций/мес."
};

const volumeLabelByCapacityUnit: Record<string, string> = {
  repair_orders_per_month: "Заказы ремонта в месяц",
  cycles_per_day: "Циклы стирки в месяц",
  cycles_per_month: "Циклы стирки в месяц",
  projects_per_month: "Проекты в месяц",
  installations_per_month: "Монтажи в месяц",
  rentals_per_month: "Аренды в месяц",
  rental_orders_per_month: "Аренды в месяц",
  visits_per_month: "Визиты в месяц",
  storage_units: "Арендованные юниты в месяц",
  orders_per_month: "Заказы в месяц",
  portions_per_month: "Порции мороженого в месяц"
};

function applyProfileRevenueMapping(
  project: StructuredProjectData,
  workingDays: number,
  current: { monthlyCapacity: number; averagePrice: number; volumeLabel: string; unitLabel: string },
  profile?: Record<string, unknown>,
  options: { preserveExplicitMonthlyCapacity?: boolean; preserveExplicitAveragePrice?: boolean } = {}
) {
  const volumeField = profileString(project, "volumeField", profile);
  const averageTicketField = profileString(project, "averageTicketField", profile);
  const capacityUnit = profileString(project, "capacityUnit", profile);
  const volume = dynamicNumber(project, volumeField, 0);
  const price = dynamicNumber(project, averageTicketField, 0);
  const fieldIsCanonicalMonthlyCapacity = !volumeField || volumeField === "monthlyCapacity" || volumeField === "monthlySalesVolume" || volumeField === "monthlyOrders" || volumeField === "monthlyClients";
  const fieldLooksDaily = Boolean(volumeField && /perday|per_day|daily/i.test(volumeField));
  const capacityUnitLooksDaily = Boolean(capacityUnit && /per_day|daily/i.test(capacityUnit));
  const isDailyVolume = fieldLooksDaily || (capacityUnitLooksDaily && !fieldIsCanonicalMonthlyCapacity);
  const fieldIsCanonicalAveragePrice = !averageTicketField || averageTicketField === "averagePrice" || averageTicketField === "averageTicket";

  if (capacityUnit) {
    current.volumeLabel = volumeLabelByCapacityUnit[capacityUnit] ?? current.volumeLabel;
    if (!project.salesUnitLabel) {
      current.unitLabel = unitLabelByCapacityUnit[capacityUnit] ?? current.unitLabel;
    }
  }

  if (volumeField && volume > 0 && (!options.preserveExplicitMonthlyCapacity || fieldIsCanonicalMonthlyCapacity || current.monthlyCapacity <= 0)) {
    current.monthlyCapacity = isDailyVolume ? volume * workingDays : volume;
  }
  if (averageTicketField && price > 0 && (!options.preserveExplicitAveragePrice || !fieldIsCanonicalAveragePrice || current.averagePrice <= 0)) {
    current.averagePrice = price;
  }
  return current;
}

export function calculateMonthlyPayment(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const monthlyRate = annualRatePct / 12 / 100;
  if (monthlyRate === 0) return roundMoney(principal / months);
  const factor = Math.pow(1 + monthlyRate, months);
  return roundMoney((principal * monthlyRate * factor) / (factor - 1));
}

export type LoanRepaymentScheduleSummary = {
  method: "annuity" | "equal_principal";
  principal: number;
  annualRatePct: number;
  termMonths: number;
  gracePeriodMonths: number;
  repaymentMonths: number;
  firstPayment: number;
  lastPayment: number;
  averagePayment: number;
  maxPayment: number;
  totalInterest: number;
  totalRepayment: number;
  debtServiceForDscr: number;
};

export function calculateLoanRepaymentSchedule(
  principal: number,
  annualRatePct: number,
  termMonths: number,
  method: "annuity" | "equal_principal" = "annuity",
  gracePeriodMonths = 0
): LoanRepaymentScheduleSummary {
  const safePrincipal = roundMoney(Math.max(0, principal));
  const safeTermMonths = Math.max(1, Math.round(termMonths));
  const safeGraceMonths = Math.max(0, Math.min(safeTermMonths - 1, Math.round(gracePeriodMonths)));
  const repaymentMonths = Math.max(1, safeTermMonths - safeGraceMonths);
  const monthlyRate = Math.max(0, annualRatePct) / 12 / 100;
  const graceInterest = roundMoney(safePrincipal * monthlyRate * safeGraceMonths);

  if (safePrincipal <= 0) {
    return {
      method,
      principal: 0,
      annualRatePct,
      termMonths: safeTermMonths,
      gracePeriodMonths: safeGraceMonths,
      repaymentMonths,
      firstPayment: 0,
      lastPayment: 0,
      averagePayment: 0,
      maxPayment: 0,
      totalInterest: 0,
      totalRepayment: 0,
      debtServiceForDscr: 0
    };
  }

  if (method === "equal_principal") {
    const principalPart = safePrincipal / repaymentMonths;
    let balance = safePrincipal;
    let totalInterest = graceInterest;
    const payments: number[] = [];
    for (let month = 0; month < repaymentMonths; month += 1) {
      const interest = balance * monthlyRate;
      const payment = roundMoney(principalPart + interest);
      payments.push(payment);
      totalInterest += interest;
      balance = Math.max(0, balance - principalPart);
    }
    const firstPayment = payments[0] ?? 0;
    const lastPayment = payments[payments.length - 1] ?? 0;
    const totalRepayment = roundMoney(safePrincipal + totalInterest);
    const averagePayment = roundMoney(totalRepayment / repaymentMonths);
    const interestOnlyPayment = roundMoney(safePrincipal * monthlyRate);
    const maxPayment = Math.max(interestOnlyPayment, ...payments);
    return {
      method,
      principal: safePrincipal,
      annualRatePct,
      termMonths: safeTermMonths,
      gracePeriodMonths: safeGraceMonths,
      repaymentMonths,
      firstPayment,
      lastPayment,
      averagePayment,
      maxPayment,
      totalInterest: roundMoney(totalInterest),
      totalRepayment,
      debtServiceForDscr: maxPayment
    };
  }

  const payment = calculateMonthlyPayment(safePrincipal, annualRatePct, repaymentMonths);
  const repaymentInterest = Math.max(payment * repaymentMonths - safePrincipal, 0);
  const totalInterest = roundMoney(graceInterest + repaymentInterest);
  const totalRepayment = roundMoney(safePrincipal + totalInterest);
  const interestOnlyPayment = roundMoney(safePrincipal * monthlyRate);
  const maxPayment = Math.max(payment, interestOnlyPayment);
  return {
    method,
    principal: safePrincipal,
    annualRatePct,
    termMonths: safeTermMonths,
    gracePeriodMonths: safeGraceMonths,
    repaymentMonths,
    firstPayment: payment,
    lastPayment: payment,
    averagePayment: payment,
    maxPayment,
    totalInterest,
    totalRepayment,
    debtServiceForDscr: maxPayment
  };
}

function toUZS(amount: number | undefined, currency: CurrencyCode | undefined, exchangeRate: number): number {
  const value = Number(amount ?? 0);
  if (currency === "USD" && (!Number.isFinite(exchangeRate) || exchangeRate <= 0)) {
    throw new Error("Official CBU USD/UZS exchange-rate snapshot is required for USD conversion.");
  }
  return currency === "USD" ? roundMoney(value * exchangeRate) : roundMoney(value);
}

function normalizeStaffRole(role: StaffPlanRole, exchangeRate: number): StaffPlanRole {
  const count = Math.max(1, Math.round(Number(role.count ?? 1)));
  const monthlySalaryAmount = Number(role.monthlySalaryAmount ?? 0);
  const monthlySalaryCurrency = (role.monthlySalaryCurrency ?? "UZS") as CurrencyCode;
  const monthlySalaryUZS = toUZS(monthlySalaryAmount, monthlySalaryCurrency, exchangeRate);
  return {
    ...role,
    count,
    monthlySalaryAmount,
    monthlySalaryCurrency,
    monthlySalaryUZS
  };
}

export function calculatePayroll(project: StructuredProjectData, exchangeRateSnapshot?: ExchangeRateSnapshot): FinancialResult["payroll"] {
  const exchangeRate = exchangeRateSnapshot?.rate ?? project.exchangeRateSnapshot?.rate ?? project.exchangeRateUZSPerUSD ?? 0;
  const roles = (project.staffPlan?.roles ?? [])
    .filter((role) => role.role?.trim() && Number(role.monthlySalaryAmount ?? 0) > 0)
    .map((role) => normalizeStaffRole(role, exchangeRate));
  const totalMonthlyPayrollUZS = roles.reduce((sum, role) => sum + (role.monthlySalaryUZS ?? 0) * role.count, 0);
  return {
    roles,
    totalMonthlyPayrollUZS: roundMoney(totalMonthlyPayrollUZS),
    exchangeRateSnapshot: exchangeRateSnapshot ?? project.exchangeRateSnapshot
  };
}

function capexItem(key: string, label: string, amount: number, source: DataSourceKind) {
  return { key, label, amount: roundMoney(amount), source };
}

function isOnlineOnlyPremises(project: StructuredProjectData): boolean {
  return ["online_only", "no_office_needed"].includes(String(project.premisesStatus ?? ""));
}

function parsePurchasePricesAverage(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const numbers = value
    .replace(/,/g, ".")
    .match(/\d[\d\s.]*/g)
    ?.map((item) => Number(item.replace(/\s/g, "")))
    .filter((item) => Number.isFinite(item) && item > 0) ?? [];
  if (!numbers.length) return null;
  return roundMoney(numbers.reduce((sum, item) => sum + item, 0) / numbers.length);
}

export function calculateCapex(project: StructuredProjectData, assumptions: SectorAssumptions): FinancialResult["capex"] {
  const equipmentMultiplier = project.equipmentCondition === "used" ? 0.7 : 1;
  const premisesMultiplier = project.premisesStatus === "owned" ? 0.55 : 1;
  const equipmentCost = roundMoney(moneyValue(project, "equipmentCapex", assumptions.defaultEquipmentCostUZS * equipmentMultiplier));
  const moldCost = roundMoney(project.moldRequired ? assumptions.defaultMoldCostUZS : 0);
  const premisesSetupCost = isOnlineOnlyPremises(project) && project.premisesSetupCapex === undefined
    ? 0
    : roundMoney(moneyValue(project, "premisesSetupCapex", assumptions.defaultPremisesSetupCostUZS * premisesMultiplier));
  const furnitureFixturesCapex = roundMoney(moneyValue(project, "furnitureFixturesCapex", assumptions.defaultPackagingSetupCostUZS));
  const itPosWebsiteCapex = roundMoney(moneyValue(project, "itPosWebsiteCapex", Math.round(assumptions.defaultPackagingSetupCostUZS * 0.5)));
  const certificationCost = roundMoney(moneyValue(project, "registrationCertificationCapex", assumptions.defaultCertificationCostUZS));
  const initialInventoryCost = roundMoney(
    project.initialInventoryCostUZS !== undefined
      ? moneyValue(project, "initialInventoryCostUZS", assumptions.defaultInitialInventoryCostUZS)
      : project.initialInventoryCapex !== undefined
        ? moneyValue(project, "initialInventoryCapex", assumptions.defaultInitialInventoryCostUZS)
        : moneyValue(project, "firstMonthRawMaterialStockUZS", assumptions.defaultInitialInventoryCostUZS)
  );
  const deliveryInstallationCapex = roundMoney(moneyValue(project, "deliveryInstallationCapex", Math.round(equipmentCost * 0.04)));
  const trainingLaunchCapex = roundMoney(moneyValue(project, "trainingLaunchCapex", Math.round(assumptions.defaultPackagingSetupCostUZS * 0.5)));
  const reserveDefault = project.contingencyReserveAvailable === false ? Math.round((equipmentCost + moldCost) * 0.03) : Math.round((equipmentCost + moldCost) * 0.08);
  const reserveCost = roundMoney(moneyValue(project, "capexReserve", reserveDefault));
  const otherCapex = roundMoney(moneyValue(project, "otherCapex", 0));
  const lineItems = [
    capexItem("equipmentCapex", "Оборудование", equipmentCost, sourceOf(project.equipmentCapex)),
    capexItem("premisesSetupCapex", "Ремонт и подготовка помещения", premisesSetupCost, isOnlineOnlyPremises(project) && project.premisesSetupCapex === undefined ? "calculated" : sourceOf(project.premisesSetupCapex)),
    capexItem("furnitureFixturesCapex", "Мебель и инвентарь", furnitureFixturesCapex, sourceOf(project.furnitureFixturesCapex)),
    capexItem("itPosWebsiteCapex", "Учёт, касса, терминал и сайт", itPosWebsiteCapex, sourceOf(project.itPosWebsiteCapex)),
    capexItem("registrationCertificationCapex", "Регистрация и сертификация", certificationCost, sourceOf(project.registrationCertificationCapex)),
    capexItem("initialInventoryCostUZS", "Первоначальный запас", initialInventoryCost, sourceOf(project.initialInventoryCostUZS ?? project.initialInventoryCapex ?? project.firstMonthRawMaterialStockUZS)),
    capexItem("deliveryInstallationCapex", "Доставка и монтаж", deliveryInstallationCapex, sourceOf(project.deliveryInstallationCapex)),
    capexItem("trainingLaunchCapex", "Обучение и запуск", trainingLaunchCapex, sourceOf(project.trainingLaunchCapex)),
    capexItem("capexReserve", "Резерв стартовых вложений", reserveCost, sourceOf(project.capexReserve)),
    capexItem("otherCapex", "Прочие стартовые вложения", otherCapex, sourceOf(project.otherCapex))
  ];
  const totalCapEx = lineItems.reduce((sum, item) => sum + item.amount, 0) + moldCost;
  return {
    equipmentCost,
    moldCost,
    premisesSetupCost,
    packagingSetupCost: furnitureFixturesCapex + itPosWebsiteCapex + trainingLaunchCapex,
    certificationCost,
    initialInventoryCost,
    reserveCost,
    furnitureFixturesCapex,
    itPosWebsiteCapex,
    deliveryInstallationCapex,
    trainingLaunchCapex,
    otherCapex,
    totalCapEx,
    lineItems: moldCost > 0 ? [...lineItems, capexItem("moldCost", "Формы / оснастка", moldCost, project.moldRequired ? "assumption" : "calculated")] : lineItems
  };
}

export function calculateRevenue(project: StructuredProjectData, assumptions: SectorAssumptions): FinancialResult["revenue"] {
  const businessProfile = resolvedBusinessProfile(project);
  const resolved = resolveRevenueInputs(project, assumptions, businessProfile);

  return {
    monthlyCapacity: resolved.monthlyCapacity,
    effectiveUnits: resolved.effectiveUnits,
    volumeLabel: resolved.volumeLabel,
    unitLabel: resolved.unitLabel,
    displayVolume: resolved.displayVolume,
    displayVolumeLabel: resolved.displayVolumeLabel,
    displayVolumeUnitLabel: resolved.displayVolumeUnitLabel,
    displayVolumeSource: resolved.displayVolumeSource,
    displayVolumeMonthlyEquivalent: resolved.displayVolumeMonthlyEquivalent,
    workingDaysForDisplay: resolved.workingDaysForDisplay,
    conversionPct: resolved.conversionPct,
    conversionSourceKey: resolved.conversionSourceKey,
    conversionApplied: resolved.conversionApplied,
    trafficPerDay: resolved.trafficPerDay,
    trafficUnitLabel: resolved.trafficUnitLabel,
    monthlySales: resolved.monthlySales,
    monthlySalesUnitLabel: resolved.monthlySalesUnitLabel,
    averagePrice: resolved.averagePrice,
    expectedUtilizationPct: resolved.utilizationPct,
    calculatedMonthlyRevenue: resolved.calculatedMonthlyRevenue,
    stableMonthlyRevenue: resolved.stableMonthlyRevenue,
    revenueSource: resolved.revenueSource,
    monthlyRevenue: resolved.monthlyRevenue,
    annualRevenue: resolved.annualRevenue
  };
}

export function calculateCOGS(project: StructuredProjectData, revenue: FinancialResult["revenue"], assumptions: SectorAssumptions): FinancialResult["cogs"] {
  const businessProfile = resolvedBusinessProfile(project);
  const category = String(businessProfile.category ?? "");
  const parsedPurchasePrice = parsePurchasePricesAverage(project.purchasePricesDetail);
  const wasteAllowancePct = numberOr(project.wasteAllowancePct, 0);
  const packagingCostPerUnit = moneyValue(project, "packagingCostPerUnit", 0);
  const directLogisticsCostPerUnit = moneyValue(project, "directLogisticsCostPerUnit", 0);
  const marketplaceCommissionPerUnit = moneyValue(project, "marketplaceCommissionPerUnit", 0);
  const otherVariableCostPerUnit = moneyValue(project, "otherVariableCostPerUnit", 0);
  const foodCostPct = numberOr(project.foodCostPct, 0);
  const genericCostPct = dynamicNumber(project, "cogsPct", 0) || dynamicNumber(project, "purchaseCostPct", 0) || dynamicNumber(project, "costOfGoodsPct", 0);
  const grossMarginPctInput = dynamicNumber(project, "grossMarginPct", 0);
  const percentOfRevenueCostPct = foodCostPct || genericCostPct || (grossMarginPctInput > 0 ? 100 - pct(grossMarginPctInput) : 0);
  const costPerCheck = moneyValue(project, "costPerCheck", 0) || moneyValue(project, "costPerOrder", 0);

  if (percentOfRevenueCostPct > 0) {
    const rawMaterialCostPerUnit = roundMoney(revenue.averagePrice * (pct(percentOfRevenueCostPct) / 100));
    const unitCOGS = roundMoney(rawMaterialCostPerUnit + packagingCostPerUnit + directLogisticsCostPerUnit + marketplaceCommissionPerUnit + otherVariableCostPerUnit);
    const wasteAdjustedUnitCOGS = roundMoney(unitCOGS * (1 + wasteAllowancePct / 100));
    return {
      rawMaterialCostPerUnit,
      packagingCostPerUnit,
      directLogisticsCostPerUnit,
      marketplaceCommissionPerUnit,
      otherVariableCostPerUnit,
      wasteAllowancePct,
      unitCOGS,
      wasteAdjustedUnitCOGS,
      monthlyCOGS: roundMoney(revenue.effectiveUnits * wasteAdjustedUnitCOGS),
      source: "user_input",
      calculationMode: "percent_of_revenue",
      foodCostPct: pct(percentOfRevenueCostPct)
    };
  }

  if (category === "food_service" && costPerCheck > 0) {
    const rawMaterialCostPerUnit = costPerCheck;
    const unitCOGS = roundMoney(rawMaterialCostPerUnit + packagingCostPerUnit + directLogisticsCostPerUnit + marketplaceCommissionPerUnit + otherVariableCostPerUnit);
    const wasteAdjustedUnitCOGS = roundMoney(unitCOGS * (1 + wasteAllowancePct / 100));
    return {
      rawMaterialCostPerUnit,
      packagingCostPerUnit,
      directLogisticsCostPerUnit,
      marketplaceCommissionPerUnit,
      otherVariableCostPerUnit,
      wasteAllowancePct,
      unitCOGS,
      wasteAdjustedUnitCOGS,
      monthlyCOGS: roundMoney(revenue.effectiveUnits * wasteAdjustedUnitCOGS),
      source: "user_input",
      calculationMode: "cost_per_check"
    };
  }

  const aliasPurchaseCost = dynamicNumber(project, "averagePurchaseCost", 0)
    || dynamicNumber(project, "unitCost", 0)
    || dynamicNumber(project, "purchasePrice", 0)
    || dynamicNumber(project, "materialCostPerUnit", 0)
    || dynamicNumber(project, "purchaseCost", 0)
    || dynamicNumber(project, "purchaseCostPerUnit", 0);
  const hasUserCogs = [
    project.rawMaterialCostPerUnit,
    project.averagePurchaseCost,
    (project as Record<string, unknown>).unitCost,
    (project as Record<string, unknown>).purchasePrice,
    (project as Record<string, unknown>).materialCostPerUnit,
    parsedPurchasePrice,
    project.packagingCostPerUnit,
    project.directLogisticsCostPerUnit,
    project.marketplaceCommissionPerUnit,
    project.otherVariableCostPerUnit
  ].some((value) => value !== undefined && value !== null);
  const assumedUnitCogs = revenue.averagePrice > 0 ? roundMoney(revenue.averagePrice * (assumptions.defaultVariableCostPct / 100)) : 0;
  const rawMaterialCostPerUnit = project.averagePurchaseCost !== undefined && project.averagePurchaseCost !== null
    ? moneyValue(project, "averagePurchaseCost", 0)
    : aliasPurchaseCost > 0
      ? aliasPurchaseCost
    : parsedPurchasePrice !== null
      ? parsedPurchasePrice
      : moneyValue(project, "rawMaterialCostPerUnit", hasUserCogs ? 0 : assumedUnitCogs);
  const unitCOGS = roundMoney(rawMaterialCostPerUnit + packagingCostPerUnit + directLogisticsCostPerUnit + marketplaceCommissionPerUnit + otherVariableCostPerUnit);
  const wasteAdjustedUnitCOGS = roundMoney(unitCOGS * (1 + wasteAllowancePct / 100));
  const monthlyCOGS = roundMoney(revenue.effectiveUnits * wasteAdjustedUnitCOGS);
  return {
    rawMaterialCostPerUnit,
    packagingCostPerUnit,
    directLogisticsCostPerUnit,
    marketplaceCommissionPerUnit,
    otherVariableCostPerUnit,
    wasteAllowancePct,
    unitCOGS,
    wasteAdjustedUnitCOGS,
    monthlyCOGS,
    source: hasUserCogs ? "user_input" : "assumption",
    calculationMode: "unit_cost"
  };
}

function opexItem(key: string, label: string, amount: number, source: DataSourceKind) {
  return { key, label, amount: roundMoney(amount), source };
}

export function calculateOpex(project: StructuredProjectData, assumptions: SectorAssumptions, payroll: FinancialResult["payroll"]): FinancialResult["opex"] {
  const base = assumptions.defaultMonthlyFixedCostsUZS;
  const monthlyPayroll = payroll.totalMonthlyPayrollUZS;
  const rentRequiredStatuses = new Set(["rent", "sublease", "street_retail_rent", "mall_point", "office_and_storage", "small_office", "storage_only"]);
  const isRentCostApplicable = rentRequiredStatuses.has(String(project.premisesStatus ?? ""));
  const monthlyRent = project.monthlyRent === undefined ? 0 : roundMoney(moneyValue(project, "monthlyRent", 0));
  const monthlyUtilities = roundMoney(moneyValue(project, "monthlyUtilities", base * 0.10));
  const monthlyMarketing = roundMoney(moneyValue(project, "monthlyMarketing", base * 0.12));
  const monthlyMaintenance = roundMoney(moneyValue(project, "monthlyMaintenance", base * 0.08));
  const monthlyTaxes = roundMoney(moneyValue(project, "monthlyTaxes", base * 0.12));
  const monthlyLogistics = roundMoney(moneyValue(project, "monthlyLogistics", base * 0.10));
  const monthlySoftware = roundMoney(moneyValue(project, "monthlySoftware", base * 0.04));
  const monthlyInsurance = roundMoney(moneyValue(project, "monthlyInsurance", base * 0.04));
  const monthlyAccounting = roundMoney(moneyValue(project, "monthlyAccounting", base * 0.04));
  const monthlyOtherOpex = roundMoney(moneyValue(project, "monthlyOtherOpex", base * 0.04));
  const lineItems = [
    opexItem("monthlyPayroll", "Зарплата", monthlyPayroll, payroll.roles.length ? "user_input" : "assumption"),
    opexItem("monthlyRent", "Аренда", monthlyRent, project.monthlyRent === undefined ? (isRentCostApplicable ? "estimated" : "calculated") : sourceOf(project.monthlyRent)),
    opexItem("monthlyUtilities", "Коммунальные", monthlyUtilities, sourceOf(project.monthlyUtilities)),
    opexItem("monthlyMarketing", "Маркетинг", monthlyMarketing, sourceOf(project.monthlyMarketing)),
    opexItem("monthlyMaintenance", "Обслуживание", monthlyMaintenance, sourceOf(project.monthlyMaintenance)),
    opexItem("monthlyTaxes", "Налоги", monthlyTaxes, sourceOf(project.monthlyTaxes)),
    opexItem("monthlyLogistics", "Логистика", monthlyLogistics, sourceOf(project.monthlyLogistics)),
    opexItem("monthlySoftware", "ПО и учёт", monthlySoftware, sourceOf(project.monthlySoftware)),
    opexItem("monthlyInsurance", "Страхование", monthlyInsurance, sourceOf(project.monthlyInsurance)),
    opexItem("monthlyAccounting", "Бухгалтерия", monthlyAccounting, sourceOf(project.monthlyAccounting)),
    opexItem("monthlyOtherOpex", "Прочие расходы", monthlyOtherOpex, sourceOf(project.monthlyOtherOpex))
  ];
  const monthlyFixedOpex = lineItems.reduce((sum, item) => sum + item.amount, 0);
  return {
    monthlyPayroll,
    monthlyRent,
    monthlyUtilities,
    monthlyMarketing,
    monthlyMaintenance,
    monthlyTaxes,
    monthlyLogistics,
    monthlySoftware,
    monthlyInsurance,
    monthlyAccounting,
    monthlyOtherOpex,
    monthlyFixedOpex,
    lineItems
  };
}

export function calculateWorkingCapital(
  project: StructuredProjectData,
  assumptions: SectorAssumptions,
  opexOrPayroll: FinancialResult["opex"] | FinancialResult["payroll"]
): FinancialResult["workingCapital"] {
  const monthlyFixedCosts = "monthlyFixedOpex" in opexOrPayroll
    ? opexOrPayroll.monthlyFixedOpex
    : assumptions.defaultMonthlyFixedCostsUZS + opexOrPayroll.totalMonthlyPayrollUZS;
  const totalMonthlyPayrollUZS = "monthlyFixedOpex" in opexOrPayroll
    ? opexOrPayroll.monthlyPayroll
    : opexOrPayroll.totalMonthlyPayrollUZS;
  const baseMonthlyFixedCosts = Math.max(monthlyFixedCosts - totalMonthlyPayrollUZS, 0);
  const bufferMonths = Math.max(0, numberOr(project.workingCapitalBufferMonths, assumptions.defaultWorkingCapitalMonths));
  // Startup inventory is included in CapEx as initialInventoryCost. Do not add the same
  // first-month stock again to working capital; use this optional buffer only for extra stock
  // that must stay tied up after launch (for example, minimum reagent/safety stock).
  const initialInventory = Math.max(0, roundMoney(dynamicNumber(project, "workingCapitalInventoryBufferUZS", 0)));
  const accountsReceivableBuffer = Math.max(0, roundMoney(moneyValue(project, "accountsReceivableBufferUZS", 0)));
  const accountsPayableBuffer = Math.max(0, roundMoney(moneyValue(project, "accountsPayableBufferUZS", 0)));
  const hasSeasonalStockBuffer = project.seasonalStockBufferUZS !== undefined || Boolean(project.moneyValues?.seasonalStockBufferUZS);
  const seasonalStockBuffer = Math.max(0, roundMoney(hasSeasonalStockBuffer ? moneyValue(project, "seasonalStockBufferUZS", 0) : 0));
  const requiredWorkingCapital = roundMoney(monthlyFixedCosts * bufferMonths + initialInventory + accountsReceivableBuffer - accountsPayableBuffer + seasonalStockBuffer);
  return {
    monthlyFixedCosts,
    baseMonthlyFixedCosts,
    totalMonthlyPayrollUZS,
    workingCapitalMonths: bufferMonths,
    bufferMonths,
    initialInventory,
    accountsReceivableBuffer,
    accountsPayableBuffer,
    seasonalStockBuffer,
    requiredWorkingCapital,
    formula: "monthlyFixedOpex × bufferMonths + initialInventory + accountsReceivableBuffer - accountsPayableBuffer + seasonalStockBuffer"
  };
}

export function calculateProfitability(
  revenue: FinancialResult["revenue"],
  cogs: FinancialResult["cogs"],
  opex: FinancialResult["opex"],
  totalInvestmentNeed = 0,
  monthlyDebtService = 0
): FinancialResult["profitability"] {
  const monthlyGrossProfit = roundMoney(revenue.monthlyRevenue - cogs.monthlyCOGS);
  const grossMarginPct = revenue.monthlyRevenue > 0 ? roundPct((monthlyGrossProfit / revenue.monthlyRevenue) * 100) : 0;
  const monthlyEBITDA = roundMoney(monthlyGrossProfit - opex.monthlyFixedOpex);
  const ebitdaMarginPct = revenue.monthlyRevenue > 0 ? roundPct((monthlyEBITDA / revenue.monthlyRevenue) * 100) : 0;
  const contributionMarginPerUnit = roundMoney(revenue.averagePrice - cogs.wasteAdjustedUnitCOGS);
  const breakEvenUnits = contributionMarginPerUnit > 0 ? Math.ceil(opex.monthlyFixedOpex / contributionMarginPerUnit) : null;
  const breakEvenRevenue = breakEvenUnits === null ? null : roundMoney(breakEvenUnits * revenue.averagePrice);
  const monthlyNetCashFlow = roundMoney(monthlyEBITDA - monthlyDebtService);
  const paybackMonths = monthlyNetCashFlow > 0 && totalInvestmentNeed > 0 ? Math.ceil(totalInvestmentNeed / monthlyNetCashFlow) : null;
  return { grossMarginPct, monthlyGrossProfit, monthlyEBITDA, ebitdaMarginPct, contributionMarginPerUnit, breakEvenUnits, breakEvenRevenue, monthlyNetCashFlow, paybackMonths };
}

export function calculateFinancing(
  project: StructuredProjectData,
  capex: FinancialResult["capex"],
  workingCapital: FinancialResult["workingCapital"],
  profitabilityBase: Pick<FinancialResult["profitability"], "monthlyEBITDA">,
  assumptions: SectorAssumptions
): FinancialResult["financing"] {
  const exchangeRateUZSPerUSD = Number(project.exchangeRateSnapshot?.rate ?? project.exchangeRateUZSPerUSD ?? 0);
  const ownContributionCurrency = (project.ownContributionCurrency ?? "UZS") as CurrencyCode;
  const ownContributionAmount = Number(project.ownContributionAmount ?? project.ownContribution ?? 0);
  const ownContributionUZS = project.ownContributionUZS ?? toUZS(ownContributionAmount, ownContributionCurrency, exchangeRateUZSPerUSD);
  const creditNeeded = project.creditNeeded ?? (project.requestedLoanAmount ? "yes" : "unknown");
  const loanCurrency = (project.approvedLoanCurrency ?? project.requestedLoanCurrency ?? "UZS") as CurrencyCode;
  const loanAmount = Number(project.approvedLoanAmount ?? project.requestedLoanAmount ?? 0);
  const requestedLoanUZS = creditNeeded === "yes" ? (project.requestedLoanUZS ?? toUZS(loanAmount, loanCurrency, exchangeRateUZSPerUSD)) : 0;
  const loanTermMonths = Math.max(1, Number(project.loanTermMonths ?? assumptions.defaultLoanTermMonths));
  const loanAnnualRatePct = Math.max(0, numberOr(project.loanAnnualRatePct, assumptions.defaultLoanAnnualRatePct));
  const loanAnnualRateSource = sourceOf(project.loanAnnualRatePct);
  const loanGracePeriodMonths = Math.max(0, Math.min(loanTermMonths - 1, Math.round(Number(project.loanGracePeriodMonths ?? 0))));
  const loanRepaymentType = (project.loanRepaymentType ?? "annuity") as "annuity" | "equal_principal";
  const leasingCurrency = (project.approvedLeasingCurrency ?? project.requestedLeasingCurrency ?? "UZS") as CurrencyCode;
  const leasingInput = Number(project.approvedLeasingAmount ?? project.requestedLeasingAmount ?? 0);
  const leasingSelected = project.needsLeasing === true;
  const leasingRequired = leasingSelected ? toUZS(leasingInput, leasingCurrency, exchangeRateUZSPerUSD) : 0;
  const leasingTermRaw = Number(project.leasingTermMonths ?? 0);
  const leasingTermMonths = Math.max(1, Number(project.leasingTermMonths ?? assumptions.defaultLeasingTermMonths));
  const leasingAnnualRatePct = Math.max(0, numberOr(project.leasingAnnualRatePct, assumptions.defaultLeasingAnnualRatePct));
  const leasingAnnualRateSource = sourceOf(project.leasingAnnualRatePct);
  const leasingAdvancePayment = roundMoney(moneyValue(project, "leasingAdvancePayment", 0));
  const leasingPaymentSource = sourceOf(project.leasingMonthlyPayment);
  const leasingTermsIncomplete = leasingSelected && (leasingRequired <= 0 || leasingTermRaw <= 0 || !safeText(project.leasingItem));
  const totalInvestmentNeed = capex.totalCapEx + workingCapital.requiredWorkingCapital;
  const ownContributionPct = totalInvestmentNeed > 0 ? roundPct((ownContributionUZS / totalInvestmentNeed) * 100) : 0;
  const loanSchedule = calculateLoanRepaymentSchedule(requestedLoanUZS, loanAnnualRatePct, loanTermMonths, loanRepaymentType, loanGracePeriodMonths);
  const estimatedMonthlyLoanPayment = creditNeeded === "yes" ? loanSchedule.debtServiceForDscr : 0;
  const totalLoanInterest = creditNeeded === "yes" ? loanSchedule.totalInterest : 0;
  const calculatedMonthlyLeasingPayment = leasingRequired > 0 ? calculateMonthlyPayment(Math.max(leasingRequired - leasingAdvancePayment, 0), leasingAnnualRatePct, leasingTermMonths) : 0;
  const estimatedMonthlyLeasingPayment = leasingRequired > 0 && moneyValue(project, "leasingMonthlyPayment", 0) > 0 ? roundMoney(moneyValue(project, "leasingMonthlyPayment", 0)) : calculatedMonthlyLeasingPayment;
  const totalMonthlyDebtService = estimatedMonthlyLoanPayment + estimatedMonthlyLeasingPayment;
  const grants = Math.max(0, roundMoney(moneyValue(project, "grants", 0)));
  const otherFunding = Math.max(0, roundMoney(moneyValue(project, "otherFunding", 0)));
  const availableFunding = roundMoney(ownContributionUZS + requestedLoanUZS + leasingRequired + grants + otherFunding);
  const financingGap = Math.max(totalInvestmentNeed - availableFunding, 0);
  const fundingSurplus = Math.max(availableFunding - totalInvestmentNeed, 0);
  const dscr = totalMonthlyDebtService > 0 ? Math.round((profitabilityBase.monthlyEBITDA / totalMonthlyDebtService) * 100) / 100 : null;

  return {
    creditNeeded,
    ownContributionAmount,
    ownContributionCurrency,
    ownContributionUZS,
    ownContribution: ownContributionUZS,
    ownContributionPct,
    exchangeRateUZSPerUSD,
    exchangeRateSnapshot: project.exchangeRateSnapshot,
    requestedLoanUZS,
    loanRequired: requestedLoanUZS,
    loanCurrency,
    loanPurpose: project.loanPurpose,
    loanTermMonths,
    loanAnnualRatePct,
    loanAnnualRateSource,
    loanGracePeriodMonths,
    loanRepaymentType,
    loanFirstPayment: creditNeeded === "yes" ? loanSchedule.firstPayment : 0,
    loanLastPayment: creditNeeded === "yes" ? loanSchedule.lastPayment : 0,
    loanAveragePayment: creditNeeded === "yes" ? loanSchedule.averagePayment : 0,
    loanMaxPayment: creditNeeded === "yes" ? loanSchedule.maxPayment : 0,
    debtServiceForDscr: creditNeeded === "yes" ? loanSchedule.debtServiceForDscr : 0,
    totalLoanInterest,
    leasingRequired,
    leasingSelected,
    leasingTermsIncomplete,
    leasingCurrency,
    leasingTermMonths,
    leasingAnnualRatePct,
    leasingAnnualRateSource,
    leasingAdvancePayment,
    leasingPaymentSource,
    estimatedMonthlyLoanPayment,
    estimatedMonthlyLeasingPayment,
    totalMonthlyDebtService,
    totalInvestmentNeed,
    availableFunding,
    financingGap,
    fundingSurplus,
    grants,
    otherFunding,
    dscr,
    dscrLabel: dscr === null ? "Не применяется" : String(dscr)
  };
}

function buildWarnings(project: StructuredProjectData, f: Omit<FinancialResult, "warnings" | "formulaRows">): FinancialResult["warnings"] {
  const warnings: FinancialResult["warnings"] = [];
  const profile = resolvedBusinessProfile(project);
  const category = String(profile.category ?? "");
  const hasAnyRevenueVolume = [
    project.plannedVolumeMonthly, project.plannedMonthlyVolume, project.monthlyPlannedVolume, project.monthlyCapacity, project.monthlySalesVolume, project.monthlyOrders, project.monthlyClients,
    project.dailyOrders, project.ordersPerDay, project.salesPerDay, project.dailyCovers, project.dailyOrdersCapacity, project.dailyServiceCapacity, project.carsPerDayStable,
    project.carsPerDayStart, project.rentalOrdersPerMonth, project.monthlyOutputCapacity, project.traffic
  ].some((value) => Number(value ?? 0) > 0);
  const hasAnyRevenuePrice = [project.averagePrice, project.averageTicket, project.averageServicePrice, project.averageServiceTicket, project.averageWashTicket, project.averageRentalTicket, project.averageCleaningTicket, project.tariff].some((value) => Number(value ?? 0) > 0);

  if ((category === "generic" || Boolean((project.businessProfile as Record<string, unknown> | undefined)?._requiresAIClassification)) && (!hasAnyRevenueVolume || !hasAnyRevenuePrice)) {
    warnings.push({
      code: "generic_revenue_units_missing",
      severity: "high",
      title: "Нужно уточнить единицу продаж",
      message: "Нужно уточнить единицу продаж и период расчёта: день, месяц, проект, контракт, час или аренда. До этого финансовый расчёт и scoring нельзя считать уверенными."
    });
  }
  if (f.revenue.monthlyRevenue < 0 || f.cogs.monthlyCOGS < 0) {
    warnings.push({ code: "negative_financial_value", severity: "high", title: "Некорректное отрицательное значение", message: "Выручка или себестоимость получились отрицательными. Проверьте объём, цену, себестоимость и единицы расчёта." });
  }
  if (f.revenue.monthlyCapacity > 50000 && !["manufacturing", "agriculture", "ecommerce"].includes(category)) {
    warnings.push({ code: "absurd_monthly_volume", severity: "high", title: "Аномально высокий объём", message: "Плановый месячный объём выглядит аномально высоким для выбранного типа бизнеса. Проверьте, не было ли месячное значение повторно умножено на рабочие дни.", values: { monthlyCapacity: f.revenue.monthlyCapacity } });
  }
  if (f.financing.dscr !== null && f.financing.dscr > 10) {
    warnings.push({ code: "dscr_high_anomaly", severity: "medium", title: "Аномально высокий DSCR", message: "Коэффициент покрытия долга выше 10. Это возможно при очень малой долговой нагрузке, но требует пояснения и проверки выручки, EBITDA и платежей по долгу.", values: { dscr: f.financing.dscr } });
  }
  if (f.revenue.monthlyRevenue === 0 && hasAnyRevenueVolume && hasAnyRevenuePrice) {
    warnings.push({ code: "zero_revenue_with_inputs", severity: "high", title: "Выручка не рассчиталась", message: "Объём и цена заполнены, но месячная выручка равна нулю. Проверьте загрузку, период объёма и единицу продаж." });
  }
  if (f.revenue.stableMonthlyRevenue && f.revenue.calculatedMonthlyRevenue > 0) {
    const deltaPct = Math.abs(f.revenue.stableMonthlyRevenue - f.revenue.calculatedMonthlyRevenue) / f.revenue.calculatedMonthlyRevenue * 100;
    if (deltaPct > 7) {
      warnings.push({
        code: "revenue_conflict",
        message: "Указанная стабильная выручка отличается от расчета по объему, цене и загрузке. По умолчанию используется расчетная выручка; можно выбрать stable revenue явно.",
        values: {
          calculatedMonthlyRevenue: f.revenue.calculatedMonthlyRevenue,
          stableMonthlyRevenue: f.revenue.stableMonthlyRevenue,
          differencePct: roundPct(deltaPct)
        }
      });
    }
  }
  if (f.cogs.source === "assumption") {
    warnings.push({ code: "cogs_assumption", message: "Себестоимость за единицу не указана, себестоимость продаж и маржа рассчитаны по допущению.", values: { assumedUnitCOGS: f.cogs.unitCOGS } });
  }
  if (f.profitability.contributionMarginPerUnit <= 0) {
    warnings.push({ code: "negative_contribution_margin", message: "Себестоимость равна или выше цены продажи; точка безубыточности не рассчитывается корректно." });
  }
  if (project.creditNeeded === "no" && Number(project.requestedLoanAmount ?? 0) > 0) {
    warnings.push({ code: "loan_conflict", message: "Выбран вариант без кредита, но указана сумма кредита.", values: { requestedLoanAmount: Number(project.requestedLoanAmount) } });
  }
  if (project.needsLeasing === false && Number(project.requestedLeasingAmount ?? 0) > 0) {
    warnings.push({ code: "leasing_conflict", message: "Выбран вариант без лизинга, но указана сумма лизинга.", values: { requestedLeasingAmount: Number(project.requestedLeasingAmount) } });
  }
  if (project.needsLeasing === true && (f.financing.leasingRequired <= 0 || Number(project.leasingTermMonths ?? 0) <= 0 || !safeText(project.leasingItem))) {
    warnings.push({ code: "leasing_terms_missing", severity: "high", title: "Неполные условия лизинга", message: "Лизинг выбран, но сумма, срок и/или объект лизинга не заполнены полностью." });
  }
  if (["rent", "sublease", "street_retail_rent", "mall_point", "office_and_storage", "small_office", "storage_only"].includes(String(project.premisesStatus ?? "")) && project.monthlyRent === undefined) {
    warnings.push({ code: "rent_missing", message: "Помещение отмечено как аренда/субаренда, но ежемесячная аренда не указана; в расчетах аренда не подставлялась как факт. Для надежной EBITDA нужно ввести стоимость аренды." });
  }
  if (project.creditNeeded === "yes" && (Number(project.requestedLoanAmount ?? 0) <= 0 || Number(project.loanTermMonths ?? 0) <= 0 || !project.loanPurpose)) {
    warnings.push({ code: "loan_terms_missing", severity: "medium", title: "Неполные условия кредита", message: "Кредит указан, но сумма, срок и/или цель кредита не заполнены полностью." });
  }
  if (project.creditNeeded === "yes" && project.loanAnnualRatePct === undefined) {
    warnings.push({ code: "loan_rate_assumption", severity: "medium", title: "Ставка кредита не указана", message: "Процентная ставка кредита не указана. Расчет платежа и DSCR выполнен по допущению.", values: { assumedAnnualRatePct: f.financing.loanAnnualRatePct } });
  }
  if (project.needsLeasing === true && project.leasingAnnualRatePct === undefined && f.financing.leasingRequired > 0) {
    warnings.push({ code: "leasing_rate_assumption", severity: "medium", title: "Ставка лизинга не указана", message: "Ставка/удорожание лизинга не указаны. Расчет платежа выполнен по допущению.", values: { assumedLeasingAnnualRatePct: f.financing.leasingAnnualRatePct } });
  }
  if (project.collateralAvailable === true && !project.collateralEstimatedValue) {
    warnings.push({ code: "collateral_valuation_missing", severity: "medium", title: "Оценка залога требует проверки", message: "Залог указан текстом, но надежная рыночная оценка не найдена или не введена. Требуется ручная оценка и проверка банком." });
  }
  if (project.rawMaterialSource === "import" && project.foreignCurrencyPurchases === undefined) {
    warnings.push({ code: "fx_buffer_missing", message: "Указаны импортные поставки, но валютный буфер/валюта закупок не уточнены." });
  }
  if (project.seasonalDemand && project.seasonalStockBufferUZS === undefined) {
    warnings.push({ code: "seasonality_buffer_missing", message: "Продажи сезонные, но сезонный запас/буфер не задан; в расчете оборотного капитала сезонный запас принят как 0 до уточнения пользователем." });
  }
  if (isOnlineOnlyPremises(project) && project.premisesSetupCapex === undefined) {
    warnings.push({ code: "online_no_premises_capex", severity: "low", title: "Онлайн-формат без ремонта помещения", message: "Бизнес отмечен как online only; ремонт помещения не включен в стартовые вложения, пока пользователь не указал его отдельно." });
  }
  if (f.profitability.ebitdaMarginPct < 5) {
    warnings.push({ code: "low_ebitda_margin", severity: "high", title: "Низкая EBITDA-маржа", message: "EBITDA-маржа ниже 5%. Бизнес уязвим к снижению продаж, росту аренды, логистики или закупочной цены.", values: { ebitdaMarginPct: f.profitability.ebitdaMarginPct } });
  }
  if (project.creditNeeded === "yes" && f.financing.dscr !== null && f.financing.dscr < 1.2) {
    warnings.push({ code: "low_dscr_bank_readiness", severity: "high", title: "Недостаточное покрытие долга", message: "DSCR (коэффициент покрытия долга) ниже 1,2. Для банка источник погашения выглядит слабым без увеличения маржи, выручки или собственных средств.", values: { dscr: f.financing.dscr } });
  }
  const ownContributionPct = f.financing.totalInvestmentNeed > 0 ? roundPct((f.financing.ownContributionUZS / f.financing.totalInvestmentNeed) * 100) : 0;
  if (f.financing.totalInvestmentNeed > 0 && ownContributionPct < 20) {
    warnings.push({ code: "low_own_contribution", severity: "medium", title: "Низкая доля собственных средств", message: "Доля собственных средств ниже 20%. Для финансирования стоит увеличить собственное участие или снизить стартовые вложения.", values: { ownContributionPct } });
  }
  if (f.financing.financingGap > 0) {
    const gapPct = f.financing.totalInvestmentNeed > 0 ? roundPct((f.financing.financingGap / f.financing.totalInvestmentNeed) * 100) : 0;
    warnings.push({ code: "financing_gap", severity: gapPct > 30 ? "high" : "medium", title: "Разрыв финансирования", message: "Есть разрыв финансирования. Нужно увеличить собственные средства, подтвердить кредит/лизинг или сократить стартовые вложения.", values: { financingGap: f.financing.financingGap, gapPct } });
  }
  for (const warning of detectInterviewDataQualityWarnings(project)) {
    if (warnings.some((item) => item.code === warning.code)) continue;
    warnings.push({ code: warning.code, severity: warning.severity, message: warning.message, calculationPolicy: warning.calculationPolicy, values: warning.values });
  }
  return warnings;
}

function buildFormulaRows(f: Omit<FinancialResult, "warnings" | "formulaRows">): FinancialResult["formulaRows"] {
  const money = (value: number | null) => value === null ? "Не применяется" : formatCurrencyFull(value);
  const revenueSubstitution = f.revenue.displayVolumeSource === "user_input" && f.revenue.displayVolumeMonthlyEquivalent !== undefined
    ? f.revenue.conversionApplied && f.revenue.conversionPct !== undefined
      ? `${(f.revenue.displayVolume ?? 0).toLocaleString("ru-RU")} ${f.revenue.displayVolumeUnitLabel ?? "ед./день"} × ${(f.revenue.workingDaysForDisplay ?? 0).toLocaleString("ru-RU")} дней × ${f.revenue.conversionPct}% конверсия × ${f.revenue.expectedUtilizationPct}% × ${f.revenue.averagePrice.toLocaleString("ru-RU")}`
      : `${(f.revenue.displayVolume ?? 0).toLocaleString("ru-RU")} ${f.revenue.displayVolumeUnitLabel ?? "ед./день"} × ${(f.revenue.workingDaysForDisplay ?? (f.revenue.displayVolumeMonthlyEquivalent / Math.max(f.revenue.displayVolume ?? 1, 1))).toLocaleString("ru-RU")} дней × ${f.revenue.expectedUtilizationPct}% × ${f.revenue.averagePrice.toLocaleString("ru-RU")}`
    : `${f.revenue.monthlyCapacity.toLocaleString("ru-RU")} ${f.revenue.unitLabel ?? "ед./мес."} × ${f.revenue.expectedUtilizationPct}% × ${f.revenue.averagePrice.toLocaleString("ru-RU")}`;
  const cogsFormula = f.cogs.calculationMode === "percent_of_revenue"
    ? "Выручка × процент себестоимости"
    : f.cogs.calculationMode === "cost_per_check"
      ? "Заказы × себестоимость среднего чека × (1 + списания%)"
      : "Единицы × себестоимость единицы × (1 + списания%)";
  const cogsSubstitution = f.cogs.calculationMode === "percent_of_revenue"
    ? `${f.revenue.monthlyRevenue.toLocaleString("ru-RU")} × ${f.cogs.foodCostPct ?? 0}% × ${1 + f.cogs.wasteAllowancePct / 100}`
    : `${f.revenue.effectiveUnits.toLocaleString("ru-RU")} × ${f.cogs.unitCOGS.toLocaleString("ru-RU")} × ${1 + f.cogs.wasteAllowancePct / 100}`;
  return [
    {
      indicator: "Месячная выручка",
      formula: "Дневной объем × рабочие дни × загрузка × средний чек",
      substitution: revenueSubstitution,
      result: money(f.revenue.monthlyRevenue),
      source: f.revenue.revenueSource === "stable" ? "user_input" : "calculated"
    },
    {
      indicator: "Себестоимость продаж",
      formula: cogsFormula,
      substitution: cogsSubstitution,
      result: money(f.cogs.monthlyCOGS),
      source: f.cogs.source
    },
    {
      indicator: "Валовая маржа",
      formula: "Валовая прибыль / выручка",
      substitution: `${f.profitability.monthlyGrossProfit.toLocaleString("ru-RU")} / ${f.revenue.monthlyRevenue.toLocaleString("ru-RU")}`,
      result: `${f.profitability.grossMarginPct}%`,
      source: "calculated"
    },
    {
      indicator: "Ежемесячные операционные расходы",
      formula: "ФОТ + аренда + коммунальные + маркетинг + обслуживание + налоги + логистика + ПО + страхование + бухгалтерия + прочее",
      substitution: f.opex.lineItems.map((item) => item.amount.toLocaleString("ru-RU")).join(" + "),
      result: money(f.opex.monthlyFixedOpex),
      source: "calculated"
    },
    {
      indicator: "Оборотный капитал",
      formula: "Операционные расходы × месяцы буфера + запасы и платежные буферы",
      substitution: `${f.workingCapital.monthlyFixedCosts.toLocaleString("ru-RU")} × ${f.workingCapital.bufferMonths} + ${f.workingCapital.initialInventory.toLocaleString("ru-RU")} + ${f.workingCapital.accountsReceivableBuffer.toLocaleString("ru-RU")} - ${f.workingCapital.accountsPayableBuffer.toLocaleString("ru-RU")} + ${f.workingCapital.seasonalStockBuffer.toLocaleString("ru-RU")}`,
      result: money(f.workingCapital.requiredWorkingCapital),
      source: "calculated"
    },
    {
      indicator: "Разрыв финансирования",
      formula: "Потребность в инвестициях - доступное финансирование",
      substitution: `${f.financing.totalInvestmentNeed.toLocaleString("ru-RU")} - ${f.financing.availableFunding.toLocaleString("ru-RU")}`,
      result: money(f.financing.financingGap),
      source: "calculated"
    },
    {
      indicator: "Точка безубыточности",
      formula: "Постоянные расходы / маржинальный доход на единицу",
      substitution: `${f.opex.monthlyFixedOpex.toLocaleString("ru-RU")} / ${f.profitability.contributionMarginPerUnit.toLocaleString("ru-RU")}`,
      result: f.profitability.breakEvenUnits === null ? "Не рассчитывается" : `${f.profitability.breakEvenUnits.toLocaleString("ru-RU")} ${f.revenue.unitLabel ?? "ед."}`,
      source: "calculated"
    },
    {
      indicator: "Платежи по долгу / коэффициент покрытия долга",
      formula: "Платеж по кредиту/лизингу; коэффициент покрытия долга = EBITDA / платежи по долгу",
      substitution: f.financing.totalMonthlyDebtService > 0
        ? `${f.financing.loanRepaymentType === "equal_principal" ? "Дифференцированный метод" : "Аннуитетный метод"}; ${f.financing.loanAnnualRatePct}% / 12, ${f.financing.loanTermMonths} мес., ${f.financing.loanRequired.toLocaleString("ru-RU")}; ${f.profitability.monthlyEBITDA.toLocaleString("ru-RU")} / ${f.financing.totalMonthlyDebtService.toLocaleString("ru-RU")}`
        : "Коэффициент покрытия долга не рассчитывается, так как долговая нагрузка равна 0.",
      result: f.financing.totalMonthlyDebtService > 0 ? `${money(f.financing.totalMonthlyDebtService)}; коэффициент ${f.financing.dscrLabel}` : "Не применяется",
      source: f.financing.loanAnnualRateSource === "assumption" || f.financing.leasingAnnualRateSource === "assumption" ? "assumption" : "calculated"
    }
  ];
}

export function calculateAll(
  project: StructuredProjectData,
  assumptions: SectorAssumptions,
  exchangeRateSnapshot?: ExchangeRateSnapshot
): FinancialResult {
  const calculationProject = applyFinanceTextFallbacks(project);
  const payroll = calculatePayroll(calculationProject, exchangeRateSnapshot);
  const capex = calculateCapex(calculationProject, assumptions);
  const revenue = calculateRevenue(calculationProject, assumptions);
  const cogs = calculateCOGS(calculationProject, revenue, assumptions);
  const opex = calculateOpex(calculationProject, assumptions, payroll);
  const workingCapital = calculateWorkingCapital(calculationProject, assumptions, opex);
  const profitabilityBeforeDebt = calculateProfitability(revenue, cogs, opex, capex.totalCapEx + workingCapital.requiredWorkingCapital, 0);
  const financing = calculateFinancing(calculationProject, capex, workingCapital, profitabilityBeforeDebt, assumptions);
  const profitability = calculateProfitability(revenue, cogs, opex, financing.totalInvestmentNeed, financing.totalMonthlyDebtService);
  const resultWithoutMeta = { capex, workingCapital, revenue, cogs, opex, profitability, payroll, financing };
  const warnings = buildWarnings(calculationProject, resultWithoutMeta);
  for (const warning of detectFinanceTextFallbackWarnings(project)) {
    if (warnings.some((item) => item.code === warning.code)) continue;
    warnings.push({ code: warning.code, severity: warning.severity, message: warning.message, calculationPolicy: warning.calculationPolicy, values: warning.values });
  }
  const formulaRows = buildFormulaRows(resultWithoutMeta);
  return { ...resultWithoutMeta, warnings, formulaRows };
}
