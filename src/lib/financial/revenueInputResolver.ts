import type { DataSourceKind, SectorAssumptions, StructuredProjectData } from "../types/project.ts";

export type RevenueVolumePeriod = "day" | "month";
export type RevenueInputSource = "user_input" | "assumption" | "text_fallback" | "sample_default";

export type ResolvedRevenueField = {
  key: string;
  value: number;
  period?: RevenueVolumePeriod;
  label: string;
  unitLabel: string;
  source: RevenueInputSource;
  confidence: "canonical" | "strict_alias" | "metadata" | "text_fallback";
};

export type ResolvedRevenueInputs = {
  volume: ResolvedRevenueField | null;
  price: ResolvedRevenueField | null;
  workingDaysPerMonth: number;
  utilizationPct: number;
  monthlyCapacity: number;
  effectiveUnits: number;
  averagePrice: number;
  calculatedMonthlyRevenue: number;
  monthlyRevenue: number;
  annualRevenue: number;
  stableMonthlyRevenue?: number;
  revenueSource: "calculated" | "stable";
  formulaKind?: "monthly_units" | "traffic_conversion" | "daily_units" | "direct_monthly_revenue" | "stable";
  volumeLabel: string;
  unitLabel: string;
  displayVolume?: number;
  displayVolumeLabel?: string;
  displayVolumeUnitLabel?: string;
  displayVolumeSource?: "user_input" | "calculated";
  displayVolumeMonthlyEquivalent?: number;
  workingDaysForDisplay?: number;
  conversionPct?: number;
  conversionSourceKey?: string;
  conversionApplied?: boolean;
  trafficPerDay?: number;
  trafficUnitLabel?: string;
  monthlySales?: number;
  monthlySalesUnitLabel?: string;
  warnings: Array<{ code: string; message: string; field?: string }>;
};

type ProfileLike = Record<string, unknown> | undefined;

type VolumeCandidate = {
  key: string;
  period: RevenueVolumePeriod;
  label: string;
  unitLabel: string;
  priority: number;
};

type PriceCandidate = {
  key: string;
  label: string;
  unitLabel: string;
  priority: number;
};

const roundMoney = (value: number) => Math.round(Number.isFinite(value) ? value : 0);
const pct = (value: number) => Math.max(0, Math.min(100, value));
const numberOr = (value: unknown, fallback = 0): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[\s_]/g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return numberOr(record.amountUZS ?? record.sourceAmount ?? record.amount, fallback);
  }
  return fallback;
};

const moneyValue = (project: StructuredProjectData, key: string, fallback = 0): number => {
  const snapshot = project.moneyValues?.[key];
  if (snapshot && Number.isFinite(Number(snapshot.amountUZS))) return Number(snapshot.amountUZS);
  return numberOr((project as Record<string, unknown>)[key], fallback);
};

const hasValue = (value: unknown): boolean => {
  const numeric = numberOr(value, 0);
  return Number.isFinite(numeric) && numeric > 0;
};

const forbiddenVolumeKeys = new Set([
  "plannedStartPeriod", "plannedStartMonths", "launchPeriod", "launchPeriodMonths", "startInMonths", "startupTimelineMonths", "launchTimelineMonths", "equipmentDeliveryMonths",
  "leaseTermMonths", "loanTermMonths", "leasingTermMonths", "workingCapitalBufferMonths", "inventoryTurnoverDays", "stockDays", "terminationNoticeDays",
  "seats", "seatingCapacity", "chairsOrWorkstations", "washBaysCount", "posts", "carsServedAtOnce", "teamSize", "teamSizePerOrder", "teamSizePerShift", "employeesCount", "staffCount", "shiftsPerDay", "workingHoursPerDay",
  "utilizationRatePct", "conversion", "conversionPct", "foodCostPct", "costPercent", "grossMarginPct", "averageMarkupPct", "markupPct", "defectRatePct", "repeatOrdersPct", "returnsPct",
  "monthlyRent", "rentAmount", "salaryAmount", "monthlyUtilities", "monthlyMarketing", "monthlyMaintenance", "monthlyTaxes", "monthlyLogistics", "monthlySoftware", "monthlyInsurance", "monthlyAccounting", "monthlyOtherOpex",
  "requestedLoanAmount", "requestedLoanUZS", "requestedLeasingAmount", "requestedLeasingUZS", "ownContribution", "ownContributionAmount", "ownContributionUZS", "equipmentCapex", "equipmentCost", "startupAssetsCost",
  "premisesSetupCapex", "furnitureFixturesCapex", "itPosWebsiteCapex", "initialInventoryCostUZS", "initialInventoryCapex", "firstMonthRawMaterialStockUZS", "averagePurchaseCost", "purchaseCost", "rawMaterialCostPerUnit", "packagingCostPerUnit", "collateralEstimatedValue"
]);

const forbiddenPriceKeys = new Set([
  "seats", "seatingCapacity", "chairsOrWorkstations", "washBaysCount", "posts", "carsServedAtOnce", "plannedStartPeriod", "plannedStartMonths", "launchPeriod", "launchPeriodMonths", "startInMonths",
  "leaseTermMonths", "loanTermMonths", "leasingTermMonths", "inventoryTurnoverDays", "stockDays", "terminationNoticeDays", "teamSize", "teamSizePerOrder", "teamSizePerShift", "employeesCount", "staffCount", "shiftsPerDay", "workingHoursPerDay",
  "utilizationRatePct", "conversion", "conversionPct", "foodCostPct", "costPercent", "grossMarginPct", "averageMarkupPct", "markupPct", "defectRatePct", "repeatOrdersPct", "returnsPct",
  "averagePurchaseCost", "purchaseCost", "purchaseCostPerUnit", "rawMaterialCostPerUnit", "packagingCostPerUnit", "monthlyRent", "rentAmount", "salaryAmount", "monthlyUtilities", "monthlyMarketing", "monthlyMaintenance", "monthlyTaxes", "monthlyLogistics", "monthlySoftware", "monthlyInsurance", "monthlyAccounting", "monthlyOtherOpex",
  "requestedLoanAmount", "requestedLoanUZS", "requestedLeasingAmount", "requestedLeasingUZS", "ownContribution", "ownContributionAmount", "ownContributionUZS", "equipmentCapex", "equipmentCost", "startupAssetsCost", "premisesSetupCapex", "furnitureFixturesCapex", "itPosWebsiteCapex", "initialInventoryCostUZS", "initialInventoryCapex", "firstMonthRawMaterialStockUZS", "collateralEstimatedValue"
]);

const dailyVolumeCandidates: VolumeCandidate[] = [
  { key: "ordersPerDay", period: "day", label: "Заказы в день", unitLabel: "заказов/день", priority: 10 },
  { key: "dailyOrders", period: "day", label: "Заказы в день", unitLabel: "заказов/день", priority: 10 },
  { key: "dailyCovers", period: "day", label: "Заказы/посадки в день", unitLabel: "заказов/день", priority: 10 },
  { key: "visitorsPerDay", period: "day", label: "Посетители в день", unitLabel: "посетителей/день", priority: 10 },
  { key: "dailyVisitors", period: "day", label: "Посетители в день", unitLabel: "посетителей/день", priority: 10 },
  { key: "traffic", period: "day", label: "Посетители в день", unitLabel: "посетителей/день", priority: 9 },
  { key: "dailyTraffic", period: "day", label: "Посетители в день", unitLabel: "посетителей/день", priority: 9 },
  { key: "footTrafficPerDay", period: "day", label: "Посетители в день", unitLabel: "посетителей/день", priority: 9 },
  { key: "walkInTrafficPerDay", period: "day", label: "Посетители в день", unitLabel: "посетителей/день", priority: 9 },
  { key: "siteVisitorsPerDay", period: "day", label: "Посетители сайта в день", unitLabel: "посетителей/день", priority: 9 },
  { key: "websiteVisitorsPerDay", period: "day", label: "Посетители сайта в день", unitLabel: "посетителей/день", priority: 9 },
  { key: "clientsPerDay", period: "day", label: "Клиенты в день", unitLabel: "клиентов/день", priority: 10 },
  { key: "dailyClients", period: "day", label: "Клиенты в день", unitLabel: "клиентов/день", priority: 10 },
  { key: "carsPerDay", period: "day", label: "Автомобили в день", unitLabel: "авто/день", priority: 10 },
  { key: "carsPerDayStable", period: "day", label: "Автомобили в день", unitLabel: "авто/день", priority: 10 },
  { key: "stableCarsPerDay", period: "day", label: "Автомобили в день", unitLabel: "авто/день", priority: 10 },
  { key: "carsPerDayStart", period: "day", label: "Автомобили в день", unitLabel: "авто/день", priority: 9 },
  { key: "firstMonthCarsPerDay", period: "day", label: "Автомобили в день", unitLabel: "авто/день", priority: 9 },
  { key: "dailyOrdersCapacity", period: "day", label: "Заказы в день", unitLabel: "заказов/день", priority: 8 },
  { key: "dailyServiceCapacity", period: "day", label: "Клиенты/услуги в день", unitLabel: "клиентов/день", priority: 8 },
  { key: "servicesPerDay", period: "day", label: "Услуги в день", unitLabel: "услуг/день", priority: 8 },
  { key: "visitsPerDay", period: "day", label: "Визиты в день", unitLabel: "визитов/день", priority: 8 },
  { key: "customersPerDay", period: "day", label: "Покупатели в день", unitLabel: "покупателей/день", priority: 9 },
  { key: "salesPerDay", period: "day", label: "Продажи в день", unitLabel: "продаж/день", priority: 9 },
  { key: "unitsPerDay", period: "day", label: "Единицы в день", unitLabel: "ед./день", priority: 9 },
  { key: "laundryCyclesPerDay", period: "day", label: "Циклы стирки в день", unitLabel: "циклов/день", priority: 8 }
];

const monthlyVolumeCandidates: VolumeCandidate[] = [
  { key: "plannedVolumeMonthly", period: "month", label: "Плановый объем в месяц", unitLabel: "заказов/мес.", priority: 12 },
  { key: "plannedMonthlyVolume", period: "month", label: "Плановый объем в месяц", unitLabel: "заказов/мес.", priority: 12 },
  { key: "monthlyPlannedVolume", period: "month", label: "Плановый объем в месяц", unitLabel: "заказов/мес.", priority: 12 },
  { key: "monthlySales", period: "month", label: "Продажи в месяц", unitLabel: "продаж/мес.", priority: 8 },
  { key: "salesPerMonth", period: "month", label: "Продажи в месяц", unitLabel: "продаж/мес.", priority: 8 },
  { key: "ordersPerMonth", period: "month", label: "Заказы в месяц", unitLabel: "заказов/мес.", priority: 8 },
  { key: "checksPerMonth", period: "month", label: "Чеки в месяц", unitLabel: "чеков/мес.", priority: 8 },
  { key: "clientsPerMonth", period: "month", label: "Клиенты в месяц", unitLabel: "клиентов/мес.", priority: 8 },
  { key: "bookingsPerMonth", period: "month", label: "Бронирования в месяц", unitLabel: "броней/мес.", priority: 8 },
  { key: "productionUnitsPerMonth", period: "month", label: "Производственные единицы в месяц", unitLabel: "ед./мес.", priority: 8 },
  { key: "visitsPerMonth", period: "month", label: "Визиты в месяц", unitLabel: "визитов/мес.", priority: 8 },
  { key: "groomingVisitsPerMonth", period: "month", label: "Визиты в месяц", unitLabel: "визитов/мес.", priority: 8 },
  { key: "servicesPerMonth", period: "month", label: "Услуги в месяц", unitLabel: "услуг/мес.", priority: 8 },
  { key: "unitsPerMonth", period: "month", label: "Единицы в месяц", unitLabel: "ед./мес.", priority: 8 },
  { key: "objectsPerMonth", period: "month", label: "Объекты в месяц", unitLabel: "объектов/мес.", priority: 8 },
  { key: "projectsPerMonth", period: "month", label: "Проекты в месяц", unitLabel: "проектов/мес.", priority: 8 },
  { key: "contractsPerMonth", period: "month", label: "Договоры в месяц", unitLabel: "договоров/мес.", priority: 8 },
  { key: "salesPerMonth", period: "month", label: "Продажи в месяц", unitLabel: "продаж/мес.", priority: 8 },
  { key: "monthlyOrders", period: "month", label: "Заказы в месяц", unitLabel: "заказов/мес.", priority: 6 },
  { key: "monthlyClients", period: "month", label: "Клиенты в месяц", unitLabel: "клиентов/мес.", priority: 6 },
  { key: "monthlySalesVolume", period: "month", label: "Плановый месячный объём", unitLabel: "ед./мес.", priority: 6 },
  { key: "monthlyOutputCapacity", period: "month", label: "Производственный объём в месяц", unitLabel: "ед./мес.", priority: 6 },
  { key: "productionVolume", period: "month", label: "Производственный объём в месяц", unitLabel: "ед./мес.", priority: 6 },
  { key: "salesUnits", period: "month", label: "Единицы продаж в месяц", unitLabel: "ед./мес.", priority: 6 },
  { key: "rentalOrdersPerMonth", period: "month", label: "Аренды в месяц", unitLabel: "аренд/мес.", priority: 7 },
  { key: "rentalSessionsPerMonth", period: "month", label: "Аренды в месяц", unitLabel: "аренд/мес.", priority: 7 },
  { key: "repairOrdersPerMonth", period: "month", label: "Заказы ремонта в месяц", unitLabel: "заказов ремонта/мес.", priority: 7 },
  { key: "solarProjectsPerMonth", period: "month", label: "Проекты в месяц", unitLabel: "проектов/мес.", priority: 7 },
  { key: "storageUnitsCount", period: "month", label: "Арендованные юниты", unitLabel: "юнитов/мес.", priority: 7 },
  { key: "testsPerMonth", period: "month", label: "Тесты в месяц", unitLabel: "тестов/мес.", priority: 7 },
  { key: "studentsCount", period: "month", label: "Студенты в месяц", unitLabel: "студентов/мес.", priority: 5 },
  { key: "patients", period: "month", label: "Пациенты в месяц", unitLabel: "пациентов/мес.", priority: 5 },
  { key: "monthlyCapacity", period: "month", label: "Плановый месячный объём", unitLabel: "ед./мес.", priority: 2 }
];

const priceCandidates: PriceCandidate[] = [
  { key: "averageTicket", label: "Средний чек / цена", unitLabel: "сум", priority: 10 },
  { key: "averageCheck", label: "Средний чек / цена", unitLabel: "сум", priority: 10 },
  { key: "avgTicket", label: "Средний чек / цена", unitLabel: "сум", priority: 10 },
  { key: "averageOrderValue", label: "Средний чек / цена", unitLabel: "сум", priority: 10 },
  { key: "averageServicePrice", label: "Средняя цена услуги", unitLabel: "сум", priority: 10 },
  { key: "averageServiceTicket", label: "Средний чек услуги", unitLabel: "сум", priority: 10 },
  { key: "averageWashTicket", label: "Средний чек мойки", unitLabel: "сум", priority: 10 },
  { key: "averageCleaningTicket", label: "Средний чек клининга", unitLabel: "сум", priority: 10 },
  { key: "averageRentalTicket", label: "Средний чек аренды", unitLabel: "сум", priority: 10 },
  { key: "averageRepairTicket", label: "Средний чек ремонта", unitLabel: "сум", priority: 10 },
  { key: "averageLaundryTicket", label: "Средний чек стирки", unitLabel: "сум", priority: 10 },
  { key: "averageGroomingTicket", label: "Средний чек", unitLabel: "сум", priority: 10 },
  { key: "averageStorageTicket", label: "Средний чек хранения", unitLabel: "сум", priority: 10 },
  { key: "averageTestTicket", label: "Средний чек теста", unitLabel: "сум", priority: 10 },
  { key: "averageSolarProjectTicket", label: "Средний чек проекта", unitLabel: "сум", priority: 10 },
  { key: "pricePerOrder", label: "Цена заказа", unitLabel: "сум", priority: 9 },
  { key: "pricePerVisit", label: "Цена визита", unitLabel: "сум", priority: 9 },
  { key: "pricePerService", label: "Цена услуги", unitLabel: "сум", priority: 9 },
  { key: "pricePerContract", label: "Цена договора", unitLabel: "сум", priority: 9 },
  { key: "unitPrice", label: "Цена единицы", unitLabel: "сум", priority: 9 },
  { key: "servicePrice", label: "Цена услуги", unitLabel: "сум", priority: 9 },
  { key: "contractValue", label: "Стоимость договора", unitLabel: "сум", priority: 9 },
  { key: "rentalPrice", label: "Цена аренды", unitLabel: "сум", priority: 9 },
  { key: "pricePerUnit", label: "Цена единицы", unitLabel: "сум", priority: 9 },
  { key: "packagePrice", label: "Цена пакета", unitLabel: "сум", priority: 9 },
  { key: "averageUnitPrice", label: "Средняя цена единицы", unitLabel: "сум", priority: 9 },
  { key: "tariff", label: "Тариф", unitLabel: "сум", priority: 8 },
  { key: "averagePrice", label: "Средний чек / цена", unitLabel: "сум", priority: 2 }
];

export const revenueMonthlyVolumeAliases = monthlyVolumeCandidates.map((candidate) => candidate.key);
export const revenueDailyTrafficAliases = ["traffic", "dailyTraffic", "visitorsPerDay", "footTrafficPerDay", "customersPerDay", "clientsPerDay"];
export const revenueDailyUnitAliases = dailyVolumeCandidates.map((candidate) => candidate.key);
export const revenueConversionAliases = ["conversion", "conversionPct", "conversionRate", "visitorConversionPct", "leadConversionPct", "salesConversionPct"];
export const revenueWorkingDaysAliases = ["workingDaysPerMonth", "workingDays", "daysPerMonth", "operatingDaysPerMonth"];
export const revenuePriceAliases = priceCandidates.map((candidate) => candidate.key);
export const revenueCostAliases = ["cogsPct", "foodCostPct", "purchaseCostPct", "costOfGoodsPct", "grossMarginPct", "averagePurchaseCost", "unitCost", "purchasePrice", "materialCostPerUnit"];
export const directMonthlyRevenueAliases = ["monthlyRevenue", "revenuePerMonth", "monthlyTurnover", "monthlySalesRevenue"];


const unitLabelByCapacityUnit: Record<string, string> = {
  orders_per_month: "заказов/мес.",
  service_orders_per_month: "заказов/мес.",
  repair_orders_per_month: "заказов ремонта/мес.",
  cycles_per_month: "циклов стирки/мес.",
  cycles_per_day: "циклов стирки/день",
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
  cycles_per_day: "Циклы стирки в день",
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

const profileString = (profile: ProfileLike, key: string): string | undefined => {
  const raw = profile?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
};

const normalizeCapacityUnit = (unit: unknown): string => String(unit ?? "").toLowerCase().replace(/[\s-]+/g, "_");

function candidateFromProfileVolume(project: StructuredProjectData, profile: ProfileLike): VolumeCandidate | null {
  const key = profileString(profile, "volumeField");
  if (!key || forbiddenVolumeKeys.has(key)) return null;
  const capacityUnit = normalizeCapacityUnit(profileString(profile, "capacityUnit"));
  const keyLooksDaily = /perday|per_day|daily/i.test(key);
  const unitLooksDaily = /per_day|daily|kuniga|день/.test(capacityUnit);
  const period: RevenueVolumePeriod = keyLooksDaily || unitLooksDaily ? "day" : "month";
  if (!hasValue((project as Record<string, unknown>)[key])) return null;
  const known = [...dailyVolumeCandidates, ...monthlyVolumeCandidates].find((item) => item.key === key);
  const capacityLabel = volumeLabelByCapacityUnit[capacityUnit];
  const capacityUnitLabel = unitLabelByCapacityUnit[capacityUnit];
  return known ? { ...known, label: capacityLabel ?? known.label, unitLabel: capacityUnitLabel ?? known.unitLabel, priority: 11 } : {
    key,
    period,
    label: capacityLabel ?? (period === "day" ? "Плановый объём в день" : "Плановый месячный объём"),
    unitLabel: capacityUnitLabel ?? (period === "day" ? "ед./день" : "ед./мес."),
    priority: 7
  };
}

function candidateFromProfilePrice(project: StructuredProjectData, profile: ProfileLike): PriceCandidate | null {
  const key = profileString(profile, "averageTicketField");
  if (!key || forbiddenPriceKeys.has(key)) return null;
  if (!hasValue(moneyValue(project, key, 0))) return null;
  const known = priceCandidates.find((item) => item.key === key);
  return known ? { ...known, priority: 11 } : { key, label: "Средний чек / цена", unitLabel: "сум", priority: 7 };
}

function findBestVolume(project: StructuredProjectData, profile: ProfileLike): ResolvedRevenueField | null {
  const profileCandidate = candidateFromProfileVolume(project, profile);
  const candidates = [...(profileCandidate ? [profileCandidate] : []), ...dailyVolumeCandidates, ...monthlyVolumeCandidates]
    .filter((candidate, index, all) => all.findIndex((item) => item.key === candidate.key) === index)
    .filter((candidate) => !forbiddenVolumeKeys.has(candidate.key))
    .filter((candidate) => hasValue((project as Record<string, unknown>)[candidate.key]))
    .sort((a, b) => b.priority - a.priority);

  const explicitMonthly = candidates.find((candidate) => candidate.period === "month" && candidate.key !== "monthlyCapacity" && candidate.key !== "visitsPerMonth" && candidate.priority >= 8);
  const highConfidenceDaily = candidates.find((candidate) => candidate.period === "day" && candidate.priority >= 9);
  const strongestDaily = candidates.find((candidate) => candidate.period === "day" && candidate.priority >= 8);
  const strongestMonthly = candidates.find((candidate) => candidate.period === "month" && candidate.key !== "monthlyCapacity");
  const profileMonthlyCapacity = profileCandidate?.key === "monthlyCapacity" && profileCandidate.period === "month" ? profileCandidate : undefined;
  const staleGenericMonthly = candidates.find((candidate) => candidate.key === "monthlyCapacity");

  // Explicit monthly user answers are the source of truth. Do not let a canonical
  // profile field such as stale monthlyCapacity=8/20 override plannedVolumeMonthly,
  // monthlySales, ordersPerMonth, etc. Traffic/conversion still wins when no
  // explicit monthly answer is present, because it carries higher semantic intent
  // than a generic monthlyCapacity fallback.
  const selected = explicitMonthly ?? highConfidenceDaily ?? profileCandidate ?? strongestDaily ?? strongestMonthly ?? profileMonthlyCapacity ?? staleGenericMonthly ?? null;
  if (!selected) return extractVolumeFromText(project);

  return {
    key: selected.key,
    value: numberOr((project as Record<string, unknown>)[selected.key], 0),
    period: selected.period,
    label: selected.label,
    unitLabel: selected.unitLabel,
    source: "user_input",
    confidence: selected.key === profileString(profile, "volumeField") ? "canonical" : "strict_alias"
  };
}

function findBestPrice(project: StructuredProjectData, profile: ProfileLike): ResolvedRevenueField | null {
  const profileCandidate = candidateFromProfilePrice(project, profile);
  const candidates = [...(profileCandidate ? [profileCandidate] : []), ...priceCandidates]
    .filter((candidate, index, all) => all.findIndex((item) => item.key === candidate.key) === index)
    .filter((candidate) => !forbiddenPriceKeys.has(candidate.key))
    .filter((candidate) => moneyValue(project, candidate.key, 0) > 0)
    .sort((a, b) => b.priority - a.priority);
  const specificUserPrice = candidates.find((candidate) => candidate.key !== "averagePrice" && candidate.priority >= 8);
  const selected = specificUserPrice ?? candidates[0] ?? null;
  if (!selected) return extractPriceFromText(project);

  return {
    key: selected.key,
    value: moneyValue(project, selected.key, 0),
    label: selected.label,
    unitLabel: selected.unitLabel,
    source: "user_input",
    confidence: selected.key === profileString(profile, "averageTicketField") ? "canonical" : "strict_alias"
  };
}

function naturalTextSources(project: StructuredProjectData): string[] {
  const notes = project.sectionNotes ?? {};
  return [
    notes.productionCapacity,
    notes.salesMarketing,
    notes.finance,
    (project as Record<string, unknown>).productionCapacity,
    (project as Record<string, unknown>).salesDescription,
    project.businessIdea
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function extractVolumeFromText(project: StructuredProjectData): ResolvedRevenueField | null {
  const text = naturalTextSources(project).join("\n");
  const daily = text.match(/(\d[\d\s.,]*)\s*(?:заказ(?:ов|а)?|посетител(?:ей|я)?|клиент(?:ов|а)?|визит(?:ов|а)?|машин(?:ы)?|авто|услуг(?:и)?|orders?|visitors?|clients?|visits?|cars?|services?)\s*(?:в|\/|per)?\s*(?:день|day|kun)/i);
  if (daily) {
    return { key: "text:dailyVolume", value: numberOr(daily[1], 0), period: "day", label: "Плановый объём в день", unitLabel: "ед./день", source: "text_fallback", confidence: "text_fallback" };
  }
  const monthly = text.match(/(\d[\d\s.,]*)\s*(?:заказ(?:ов|а)?|посетител(?:ей|я)?|клиент(?:ов|а)?|визит(?:ов|а)?|единиц|ед\.?|услуг(?:и)?|договор(?:ов|а)?|orders?|visitors?|clients?|visits?|units?|services?|contracts?)\s*(?:в|\/|per)?\s*(?:месяц|мес|month|oy)/i);
  if (monthly) {
    return { key: "text:monthlyVolume", value: numberOr(monthly[1], 0), period: "month", label: "Плановый месячный объём", unitLabel: "ед./мес.", source: "text_fallback", confidence: "text_fallback" };
  }
  return null;
}

function extractPriceFromText(project: StructuredProjectData): ResolvedRevenueField | null {
  const text = naturalTextSources(project).join("\n");
  const patterns = [
    /(?:средн(?:ий|яя)\s+(?:чек|цена)|average\s+(?:ticket|price|check))\D{0,30}(\d[\d\s.,]*)\s*(?:uzs|сум|so'?m|som)?/i,
    /(\d[\d\s.,]*)\s*(?:uzs|сум|so'?m|som)\D{0,30}(?:средн(?:ий|яя)\s+(?:чек|цена)|average\s+(?:ticket|price|check))/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = numberOr(match[1], 0);
      if (value > 0) return { key: "text:averageTicket", value, label: "Средний чек / цена", unitLabel: "сум", source: "text_fallback", confidence: "text_fallback" };
    }
  }
  return null;
}


const trafficVolumeKeys = new Set(["traffic", "dailyTraffic", "footTrafficPerDay", "walkInTrafficPerDay", "visitorsPerDay", "dailyVisitors", "siteVisitorsPerDay", "websiteVisitorsPerDay", "customersPerDay", "clientsPerDay"]);

function normalizedPctValue(value: unknown): number | undefined {
  const raw = numberOr(value, 0);
  if (!Number.isFinite(raw) || raw <= 0) return undefined;
  return pct(raw <= 1 ? raw * 100 : raw);
}

function resolveTrafficConversionPct(project: StructuredProjectData, volume: ResolvedRevenueField | null): { applied: boolean; pct: number; key?: string } {
  if (!volume || volume.period !== "day" || !trafficVolumeKeys.has(volume.key)) return { applied: false, pct: 100 };
  const record = project as Record<string, unknown>;
  const candidates = revenueConversionAliases.map((key) => ({ key, value: record[key] }));
  const selected = candidates
    .map((candidate) => ({ key: candidate.key, pct: normalizedPctValue(candidate.value) }))
    .find((candidate): candidate is { key: string; pct: number } => candidate.pct !== undefined && candidate.pct > 0);
  if (!selected) return { applied: false, pct: 100 };
  return { applied: true, pct: selected.pct, key: selected.key };
}

function resolveWorkingDaysPerMonth(project: StructuredProjectData): number {
  const record = project as Record<string, unknown>;
  for (const key of revenueWorkingDaysAliases) {
    const value = numberOr(record[key], 0);
    if (value > 0) return Math.max(1, Math.round(value));
  }
  return 26;
}

function resolveDirectMonthlyRevenue(project: StructuredProjectData): number | undefined {
  const record = project as Record<string, unknown>;
  for (const key of directMonthlyRevenueAliases) {
    const value = moneyValue(project, key, 0);
    if (value > 0 && record[key] !== undefined && record[key] !== null) return roundMoney(value);
  }
  return undefined;
}

function sourceOfVolume(volume: ResolvedRevenueField | null): DataSourceKind {
  if (!volume) return "assumption";
  return volume.source === "user_input" ? "user_input" : "assumption";
}

export function resolveRevenueInputs(project: StructuredProjectData, assumptions: SectorAssumptions, profile?: ProfileLike): ResolvedRevenueInputs {
  const workingDaysPerMonth = resolveWorkingDaysPerMonth(project);
  const volume = findBestVolume(project, profile);
  const price = findBestPrice(project, profile);
  const rawMonthlyCapacity = volume ? roundMoney(volume.period === "day" ? volume.value * workingDaysPerMonth : volume.value) : 0;
  const conversion = resolveTrafficConversionPct(project, volume);
  const explicitUtilization = numberOr(project.utilizationRatePct, 0);
  // A user-entered planned monthly/daily volume is already the sales/order volume
  // to use in revenue. Do not silently discount it by a generic sector
  // utilization default (for example 250 orders/month must stay 250, not
  // 250 * 65%). Apply utilization only when the user explicitly provided it,
  // or when there is no volume and the calculator falls back to assumptions.
  const utilizationPct = pct(explicitUtilization > 0 ? explicitUtilization : volume ? 100 : assumptions.defaultExpectedUtilizationPct);
  const monthlyCapacity = roundMoney(rawMonthlyCapacity * (conversion.applied ? conversion.pct / 100 : 1));
  const effectiveUnits = roundMoney(monthlyCapacity * utilizationPct / 100);
  const averagePrice = price?.value ?? 0;
  const calculatedMonthlyRevenue = roundMoney(monthlyCapacity * averagePrice * utilizationPct / 100);
  const stableMonthlyRevenueValue = moneyValue(project, "stableMonthlyRevenue", 0);
  const stableMonthlyRevenue = stableMonthlyRevenueValue > 0 ? roundMoney(stableMonthlyRevenueValue) : undefined;
  const directMonthlyRevenue = resolveDirectMonthlyRevenue(project);
  const usesDirectMonthlyRevenue = calculatedMonthlyRevenue <= 0 && !stableMonthlyRevenue && directMonthlyRevenue !== undefined;
  const revenueSource = project.preferredRevenueSource === "stable" && stableMonthlyRevenue ? "stable" : "calculated";
  const monthlyRevenue = revenueSource === "stable" && stableMonthlyRevenue ? stableMonthlyRevenue : usesDirectMonthlyRevenue ? directMonthlyRevenue : calculatedMonthlyRevenue;
  const formulaKind = revenueSource === "stable" && stableMonthlyRevenue
    ? "stable"
    : usesDirectMonthlyRevenue
      ? "direct_monthly_revenue"
      : conversion.applied
        ? "traffic_conversion"
        : volume?.period === "day"
          ? "daily_units"
          : "monthly_units";
  const convertedSalesUnitLabel = "продаж/мес.";
  const volumeLabel = conversion.applied
    ? "Расчётный объём продаж"
    : volume?.period === "day"
      ? "Расчётный объём продаж"
      : volume?.label ?? "Плановый месячный объём";
  const unitLabel = conversion.applied
    ? convertedSalesUnitLabel
    : volume?.period === "day"
      ? (volume.unitLabel.replace("/день", "/мес.").replace("ед./день", "ед./мес."))
      : project.salesUnitLabel ?? volume?.unitLabel ?? "ед./мес.";
  const warnings: ResolvedRevenueInputs["warnings"] = [];
  if (!volume) warnings.push({ code: "missing_revenue_volume", field: "plannedVolume", message: "Не найден надежный структурный источник объема продаж." });
  if (!price) warnings.push({ code: "missing_average_price", field: "averageTicket", message: "Не найден надежный структурный источник среднего чека или цены." });
  if (volume && forbiddenVolumeKeys.has(volume.key)) warnings.push({ code: "forbidden_volume_source", field: volume.key, message: "Поле не может использоваться как объем продаж." });
  if (price && forbiddenPriceKeys.has(price.key)) warnings.push({ code: "forbidden_price_source", field: price.key, message: "Поле не может использоваться как средняя цена." });

  return {
    volume,
    price,
    workingDaysPerMonth,
    utilizationPct,
    monthlyCapacity,
    effectiveUnits,
    averagePrice,
    calculatedMonthlyRevenue,
    stableMonthlyRevenue,
    revenueSource,
    formulaKind,
    monthlyRevenue,
    annualRevenue: monthlyRevenue * 12,
    volumeLabel,
    unitLabel,
    displayVolume: volume?.value,
    displayVolumeLabel: volume?.label,
    displayVolumeUnitLabel: volume?.unitLabel,
    displayVolumeSource: sourceOfVolume(volume) === "user_input" ? "user_input" : "calculated",
    displayVolumeMonthlyEquivalent: volume?.period === "day" ? monthlyCapacity : undefined,
    workingDaysForDisplay: volume?.period === "day" ? workingDaysPerMonth : undefined,
    conversionPct: conversion.applied ? conversion.pct : undefined,
    conversionSourceKey: conversion.applied ? conversion.key : undefined,
    conversionApplied: conversion.applied,
    trafficPerDay: conversion.applied && volume?.period === "day" ? volume.value : undefined,
    trafficUnitLabel: conversion.applied && volume?.period === "day" ? volume.unitLabel : undefined,
    monthlySales: conversion.applied ? monthlyCapacity : undefined,
    monthlySalesUnitLabel: conversion.applied ? convertedSalesUnitLabel : undefined,
    warnings
  };
}

export function resolveRevenueVolumeForSummary(project: StructuredProjectData, profile?: ProfileLike): ResolvedRevenueField | null {
  return findBestVolume(project, profile);
}

export function resolveRevenuePriceForSummary(project: StructuredProjectData, profile?: ProfileLike): ResolvedRevenueField | null {
  return findBestPrice(project, profile);
}
