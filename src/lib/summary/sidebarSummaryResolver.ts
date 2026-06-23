import type { AppLocale } from "../i18n/index.ts";
import type { InterviewBlock, InterviewPlanBlock, InterviewQuestion, StructuredProjectData } from "../types/project.ts";
import { resolveRevenueInputs, resolveRevenuePriceForSummary, resolveRevenueVolumeForSummary } from "../financial/revenueInputResolver.ts";
import { labelValue, localizeUnitLabel } from "../utils/labels.ts";
import { formatDistrict, formatRegion } from "../location/locationNormalizer.ts";

export type SidebarFieldKey = "plannedStartPeriod" | "monthlyCapacity" | "averagePrice" | string;

export type SidebarResolvedValue = {
  field: "planned_start" | "planned_volume" | "average_price" | "direct";
  key: string;
  value: unknown;
  confidence: "canonical" | "strict_alias" | "metadata";
  unit?: string | null;
};

type QuestionIndex = Map<string, InterviewQuestion & { blockId?: string }>;

type TemplateLike = {
  interviewBlocks?: InterviewBlock[];
};

const plannedStartKeys = [
  "plannedStartPeriod",
  "plannedStartMonths",
  "launchPeriod",
  "launchPeriodMonths",
  "startInMonths",
  "startupTimelineMonths",
  "launchTimelineMonths",
  "equipmentDeliveryMonths"
];

const strictVolumeKeys = [
  "ordersPerDay",
  "visitorsPerDay",
  "clientsPerDay",
  "dailyOrders",
  "dailyVisitors",
  "dailyClients",
  "dailyCovers",
  "dailyOrdersCapacity",
  "dailyServiceCapacity",
  "carsPerDay",
  "carsPerDayStable",
  "carsPerDayStart",
  "stableCarsPerDay",
  "firstMonthCarsPerDay",
  "visitsPerMonth",
  "groomingVisitsPerMonth",
  "servicesPerMonth",
  "unitsPerMonth",
  "objectsPerMonth",
  "projectsPerMonth",
  "contractsPerMonth",
  "salesPerMonth",
  "monthlySalesVolume",
  "monthlyOrders",
  "monthlyClients",
  "monthlyCapacity",
  "monthlyOutputCapacity",
  "productionVolume",
  "rentalOrdersPerMonth",
  "rentalSessionsPerMonth",
  "repairOrdersPerMonth",
  "laundryCyclesPerDay",
  "solarProjectsPerMonth",
  "storageUnitsCount",
  "testsPerMonth",
  "patients",
  "studentsCount",
  "traffic"
];

const preferredVolumeKeys = strictVolumeKeys.filter((key) => key !== "monthlyCapacity");

const strictAveragePriceKeys = [
  "averageTicket",
  "averageCheck",
  "averageOrderValue",
  "averageServicePrice",
  "averageUnitPrice",
  "pricePerOrder",
  "pricePerVisit",
  "pricePerService",
  "pricePerContract",
  "packagePrice",
  "averagePrice",
  "averageServiceTicket",
  "averageWashTicket",
  "averageCleaningTicket",
  "averageRentalTicket",
  "averageRepairTicket",
  "averageLaundryTicket",
  "averageGroomingTicket",
  "averageStorageTicket",
  "averageTestTicket",
  "averageSolarProjectTicket",
  "tariff"
];

const preferredAveragePriceKeys = strictAveragePriceKeys.filter((key) => key !== "averagePrice");

const excludedFromVolume = new Set([
  "plannedStartPeriod",
  "plannedStartMonths",
  "launchPeriod",
  "launchPeriodMonths",
  "startInMonths",
  "startupTimelineMonths",
  "launchTimelineMonths",
  "equipmentDeliveryMonths",
  "leaseTermMonths",
  "loanTermMonths",
  "leasingTermMonths",
  "workingCapitalBufferMonths",
  "inventoryTurnoverDays",
  "stockDays",
  "terminationNoticeDays",
  "seats",
  "seatingCapacity",
  "chairsOrWorkstations",
  "washBaysCount",
  "posts",
  "carsServedAtOnce",
  "teamSize",
  "teamSizePerOrder",
  "teamSizePerShift",
  "employeesCount",
  "shiftsPerDay",
  "workingHoursPerDay",
  "utilizationRatePct",
  "conversion",
  "conversionPct",
  "foodCostPct",
  "grossMarginPct",
  "averageMarkupPct",
  "markupPct",
  "defectRatePct",
  "repeatOrdersPct",
  "returnsPct",
  "monthlyRent",
  "monthlyUtilities",
  "monthlyMarketing",
  "monthlyMaintenance",
  "monthlyTaxes",
  "monthlyLogistics",
  "monthlySoftware",
  "monthlyInsurance",
  "monthlyAccounting",
  "monthlyOtherOpex",
  "requestedLoanAmount",
  "requestedLoanUZS",
  "requestedLeasingAmount",
  "requestedLeasingUZS",
  "ownContribution",
  "ownContributionAmount",
  "ownContributionUZS",
  "equipmentCapex",
  "premisesSetupCapex",
  "furnitureFixturesCapex",
  "itPosWebsiteCapex",
  "initialInventoryCostUZS",
  "initialInventoryCapex",
  "firstMonthRawMaterialStockUZS",
  "averagePurchaseCost",
  "rawMaterialCostPerUnit",
  "packagingCostPerUnit",
  "collateralEstimatedValue"
]);

const excludedFromAveragePrice = new Set([
  "seats",
  "seatingCapacity",
  "chairsOrWorkstations",
  "washBaysCount",
  "posts",
  "carsServedAtOnce",
  "plannedStartPeriod",
  "plannedStartMonths",
  "launchPeriod",
  "launchPeriodMonths",
  "startInMonths",
  "leaseTermMonths",
  "loanTermMonths",
  "leasingTermMonths",
  "inventoryTurnoverDays",
  "stockDays",
  "terminationNoticeDays",
  "teamSize",
  "teamSizePerOrder",
  "teamSizePerShift",
  "employeesCount",
  "shiftsPerDay",
  "workingHoursPerDay",
  "utilizationRatePct",
  "conversion",
  "conversionPct",
  "foodCostPct",
  "grossMarginPct",
  "averageMarkupPct",
  "markupPct",
  "defectRatePct",
  "repeatOrdersPct",
  "returnsPct",
  "averagePurchaseCost",
  "purchaseCost",
  "rawMaterialCostPerUnit",
  "packagingCostPerUnit",
  "monthlyRent",
  "monthlyUtilities",
  "monthlyMarketing",
  "monthlyMaintenance",
  "monthlyTaxes",
  "monthlyLogistics",
  "monthlySoftware",
  "monthlyInsurance",
  "monthlyAccounting",
  "monthlyOtherOpex",
  "requestedLoanAmount",
  "requestedLoanUZS",
  "requestedLeasingAmount",
  "requestedLeasingUZS",
  "ownContribution",
  "ownContributionAmount",
  "ownContributionUZS",
  "equipmentCapex",
  "premisesSetupCapex",
  "furnitureFixturesCapex",
  "itPosWebsiteCapex",
  "initialInventoryCostUZS",
  "initialInventoryCapex",
  "firstMonthRawMaterialStockUZS",
  "collateralEstimatedValue"
]);

function isPresent(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0 && value !== "__later__";
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function valueByPath(source: Record<string, unknown>, path: string): unknown {
  if (!path.includes(".")) return source[path];
  return path.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, source);
}

function normalizeText(value: unknown): string {
  return String(value ?? "").toLowerCase().replace(/[ё]/g, "е").replace(/[‘’]/g, "'").trim();
}

function normalizeUnit(unit: unknown): string {
  return normalizeText(unit).replace(/\s+/g, "");
}

function buildQuestionIndex(profile: StructuredProjectData, template?: TemplateLike): QuestionIndex {
  const index: QuestionIndex = new Map();
  const addQuestion = (question: InterviewQuestion, blockId?: string) => {
    const existing = index.get(question.key);
    index.set(question.key, { ...existing, ...question, blockId: question.blockId ?? blockId ?? existing?.blockId });
  };

  for (const block of template?.interviewBlocks ?? []) {
    for (const question of block.questions ?? []) addQuestion(question, block.id);
  }

  const planBlocks = profile.interviewPlan?.blocks ? Object.values(profile.interviewPlan.blocks) as InterviewPlanBlock[] : [];
  for (const block of planBlocks) {
    for (const question of block.questions ?? []) addQuestion(question, block.blockId);
  }

  return index;
}

function unitIsExcludedForVolume(unit: unknown): boolean {
  const normalized = normalizeUnit(unit);
  if (!normalized) return false;
  if (/^(uzs|usd|сум|so'm|som)$/.test(normalized)) return true;
  if (/%|percent|процент|foiz/.test(normalized)) return true;
  if (/^(мес\.?|месяц|месяцев|month|months|oy)$/.test(normalized)) return true;
  if (/^(дн\.?|день|дней|day|days|kun)$/.test(normalized)) return true;
  if (/seat|мест|o'rin|сотруд|employee|xodim|смен|shift|м²|sqm|кв/.test(normalized)) return true;
  return false;
}

function unitConfirmsVolume(unit: unknown): boolean {
  const normalized = normalizeUnit(unit);
  if (!normalized || unitIsExcludedForVolume(unit)) return false;
  return /\/день|\/мес|\/oy|\/kun|perday|permonth|daily|monthly|заказ|посет|клиент|визит|услуг|ед\.|единиц|unit|units|order|orders|visitor|visitors|client|clients|visit|visits|service|services|cars|авто|машин|порци|cover|covers|договор|contract|contracts|пакет|package|объект|object|objects|шт|dona|oyiga|kuniga|tests|тест|цик|cycle|students|учен/.test(normalized);
}

function unitIsExcludedForAveragePrice(unit: unknown): boolean {
  const normalized = normalizeUnit(unit);
  if (!normalized) return false;
  if (/%|percent|процент|foiz/.test(normalized)) return true;
  if (/^(мес\.?|месяц|месяцев|month|months|oy)$/.test(normalized)) return true;
  if (/^(дн\.?|день|дней|day|days|kun)$/.test(normalized)) return true;
  if (/seat|мест|o'rin|сотруд|employee|xodim|смен|shift|м²|sqm|кв/.test(normalized)) return true;
  return false;
}

function unitConfirmsAveragePrice(unit: unknown): boolean {
  const normalized = normalizeUnit(unit);
  if (!normalized || unitIsExcludedForAveragePrice(unit)) return false;
  return /uzs|usd|сум|so'm|som|₽|\$/.test(normalized);
}

function questionText(question?: InterviewQuestion): string {
  if (!question) return "";
  const localized = Object.values(question.localizedCopy ?? {})
    .flatMap((copy) => [copy?.label, copy?.question, copy?.unit])
    .filter(Boolean)
    .join(" ");
  return normalizeText([question.key, question.label, question.question, question.unit, question.semanticGroup, localized].join(" "));
}

function questionConfirmsVolume(question?: InterviewQuestion): boolean {
  if (!question) return false;
  if (question.semanticGroup && /monthly_volume|volume|capacity|production_capacity|customer_flow/.test(normalizeText(question.semanticGroup))) return true;
  if (unitConfirmsVolume(question.unit)) return true;
  const text = questionText(question);
  return /планов.*объем|объем.*продаж|заказ.*день|посетител.*день|клиент.*день|визит.*месяц|услуг.*месяц|производствен.*мощност|количество.*договор|сколько.*заказ|сколько.*посет|planned.*volume|orders.*day|visitors.*day|visits.*month|services.*month|production.*capacity|rejadagi.*hajm|buyurtma|mijoz|kuniga|oyiga/.test(text);
}

function questionConfirmsAveragePrice(question?: InterviewQuestion): boolean {
  if (!question) return false;
  if (question.semanticGroup && /average_ticket|average_price|unit_price|price/.test(normalizeText(question.semanticGroup))) return true;
  if (unitConfirmsAveragePrice(question.unit)) {
    const text = questionText(question);
    if (/себестоим|закуп|аренд|зарплат|кредит|лизинг|залог|оборуд|capex|cogs|rent|salary|loan|leasing|collateral|purchase|cost|xarid|ijara|kredit/.test(text)) return false;
    return true;
  }
  const text = questionText(question);
  return /средн.*чек|средн.*цен|цен.*продаж|стоимост.*услуг|цена.*заказ|цена.*визит|цена.*договор|average.*ticket|average.*price|average.*order|service.*price|unit.*price|package.*price|o'rtacha.*chek|o'rtacha.*narx/.test(text);
}

function valueIsUsableNumber(value: unknown): boolean {
  if (!isPresent(value)) return false;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(parsed) && parsed > 0;
  }
  return false;
}

function sourceValue(profile: StructuredProjectData, key: string): unknown {
  return valueByPath(profile as Record<string, unknown>, key);
}

function profileString(profile: StructuredProjectData, key: string): string | undefined {
  const fromBusinessProfile = profile.businessProfile && typeof profile.businessProfile === "object"
    ? (profile.businessProfile as Record<string, unknown>)[key]
    : undefined;
  const raw = fromBusinessProfile ?? (profile as Record<string, unknown>)[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

function dedupe(keys: Array<string | undefined>): string[] {
  return Array.from(new Set(keys.filter((key): key is string => Boolean(key && key.trim()))));
}

function resolveCandidate(input: {
  profile: StructuredProjectData;
  key: string;
  index: QuestionIndex;
  kind: "volume" | "averagePrice" | "plannedStart";
  confidence: SidebarResolvedValue["confidence"];
}): SidebarResolvedValue | null {
  const question = input.index.get(input.key);
  const value = sourceValue(input.profile, input.key);
  if (!isPresent(value)) return null;

  if (input.kind === "plannedStart") {
    return { field: "planned_start", key: input.key, value, confidence: input.confidence, unit: question?.unit };
  }

  if (!valueIsUsableNumber(value)) return null;

  if (input.kind === "volume") {
    if (excludedFromVolume.has(input.key)) return null;
    if (unitIsExcludedForVolume(question?.unit)) return null;
    const isStrict = strictVolumeKeys.includes(input.key);
    const confirmed = isStrict || questionConfirmsVolume(question);
    if (!confirmed) return null;
    return { field: "planned_volume", key: input.key, value, confidence: isStrict ? input.confidence : "metadata", unit: question?.unit };
  }

  if (excludedFromAveragePrice.has(input.key)) return null;
  if (unitIsExcludedForAveragePrice(question?.unit)) return null;
  const isStrict = strictAveragePriceKeys.includes(input.key);
  const confirmed = isStrict || questionConfirmsAveragePrice(question);
  if (!confirmed) return null;
  return { field: "average_price", key: input.key, value, confidence: isStrict ? input.confidence : "metadata", unit: question?.unit };
}

function metadataKeys(index: QuestionIndex, profile: StructuredProjectData, kind: "volume" | "averagePrice"): string[] {
  const fromQuestions = Array.from(index.values())
    .filter((question) => question.type === "number")
    .filter((question) => kind === "volume" ? questionConfirmsVolume(question) : questionConfirmsAveragePrice(question))
    .map((question) => question.key);
  const fromData = Object.keys(profile as Record<string, unknown>).filter((key) => {
    if (kind === "volume") {
      if (excludedFromVolume.has(key) || strictVolumeKeys.includes(key)) return false;
      return /(orders?|visitors?|clients?|visits?|services?|units?|objects?|projects?|contracts?|sales|capacity|volume)(perday|permonth|daily|monthly)?$/i.test(key)
        || /(perDay|PerDay|perMonth|PerMonth)$/.test(key);
    }
    if (excludedFromAveragePrice.has(key) || strictAveragePriceKeys.includes(key)) return false;
    return /(average|avg).*(ticket|check|price|value)|pricePer|packagePrice/i.test(key);
  });
  return dedupe([...fromQuestions, ...fromData]);
}

export function resolvePlannedVolume(profile: StructuredProjectData, template?: TemplateLike): SidebarResolvedValue | null {
  const resolved = resolveRevenueVolumeForSummary(profile, profile.businessProfile as Record<string, unknown> | undefined);
  if (resolved) {
    return {
      field: "planned_volume",
      key: resolved.key,
      value: resolved.value,
      confidence: resolved.confidence === "text_fallback" ? "metadata" : resolved.confidence,
      unit: resolved.unitLabel
    };
  }

  const index = buildQuestionIndex(profile, template);
  const profileVolumeField = profileString(profile, "volumeField");
  const keys = dedupe([
    profileVolumeField,
    ...preferredVolumeKeys,
    "monthlyCapacity",
    ...metadataKeys(index, profile, "volume")
  ]);

  for (const key of keys) {
    const confidence: SidebarResolvedValue["confidence"] = key === profileVolumeField ? "canonical" : strictVolumeKeys.includes(key) ? "strict_alias" : "metadata";
    const fallback = resolveCandidate({ profile, key, index, kind: "volume", confidence });
    if (fallback) return fallback;
  }
  return null;
}

export function resolveAveragePrice(profile: StructuredProjectData, template?: TemplateLike): SidebarResolvedValue | null {
  const resolved = resolveRevenuePriceForSummary(profile, profile.businessProfile as Record<string, unknown> | undefined);
  if (resolved) {
    return {
      field: "average_price",
      key: resolved.key,
      value: resolved.value,
      confidence: resolved.confidence === "text_fallback" ? "metadata" : resolved.confidence,
      unit: resolved.unitLabel
    };
  }

  const index = buildQuestionIndex(profile, template);
  const profileAverageField = profileString(profile, "averageTicketField");
  const keys = dedupe([
    profileAverageField,
    ...preferredAveragePriceKeys,
    "averagePrice",
    ...metadataKeys(index, profile, "averagePrice")
  ]);

  for (const key of keys) {
    const confidence: SidebarResolvedValue["confidence"] = key === profileAverageField ? "canonical" : strictAveragePriceKeys.includes(key) ? "strict_alias" : "metadata";
    const fallback = resolveCandidate({ profile, key, index, kind: "averagePrice", confidence });
    if (fallback) return fallback;
  }
  return null;
}

export function resolvePlannedStart(profile: StructuredProjectData, template?: TemplateLike): SidebarResolvedValue | null {
  const index = buildQuestionIndex(profile, template);
  for (const key of plannedStartKeys) {
    const resolved = resolveCandidate({ profile, key, index, kind: "plannedStart", confidence: key === "plannedStartPeriod" ? "canonical" : "strict_alias" });
    if (resolved) return resolved;
  }
  return null;
}

export function resolveSidebarFieldValue(profile: StructuredProjectData, key: SidebarFieldKey, template?: TemplateLike): unknown {
  if (key === "monthlyCapacity") return resolvePlannedVolume(profile, template)?.value;
  if (key === "averagePrice") return resolveAveragePrice(profile, template)?.value;
  if (key === "plannedStartPeriod") return resolvePlannedStart(profile, template)?.value;
  return valueByPath(profile as Record<string, unknown>, String(key));
}

export function resolveSidebarSemanticValues(profile: StructuredProjectData, template?: TemplateLike) {
  return {
    plannedStart: resolvePlannedStart(profile, template),
    plannedVolume: resolvePlannedVolume(profile, template),
    averagePrice: resolveAveragePrice(profile, template)
  };
}

function isDailyUnit(unit: unknown): boolean {
  return /\/день|\/day|per day|kun|день/i.test(String(unit ?? ""));
}

function monthlyUnitFromDailyUnit(unit: unknown): string {
  const text = String(unit ?? "");
  if (!text) return "ед./мес.";
  return text
    .replace(/\/день/gi, "/мес.")
    .replace(/\/day/gi, "/month")
    .replace(/per day/gi, "per month")
    .replace(/kuniga|kun/gi, "oyiga")
    .replace(/день/gi, "мес.");
}

function workingDaysCaption(locale: AppLocale, days: number): string {
  if (locale === "en") return `at ${days} working days`;
  if (locale === "uz") return `${days} ish kuni bilan`;
  return `при ${days} раб. днях`;
}

export function formatSidebarResolvedValue(
  resolved: SidebarResolvedValue | null | undefined,
  locale: AppLocale = "ru",
  options?: { monthlyEquivalent?: number; workingDaysPerMonth?: number; conversionApplied?: boolean }
): string | null {
  if (!resolved) return null;
  const baseValue = labelValue(resolved.value, locale);
  const unit = localizeUnitLabel(resolved.unit, locale);
  const withUnit = unit ? `${baseValue} ${unit}` : baseValue;
  const monthlyEquivalent = options?.monthlyEquivalent;
  if (
    resolved.field === "planned_volume" &&
    !options?.conversionApplied &&
    typeof monthlyEquivalent === "number" &&
    Number.isFinite(monthlyEquivalent) &&
    monthlyEquivalent > 0 &&
    isDailyUnit(resolved.unit)
  ) {
    const monthlyUnit = localizeUnitLabel(monthlyUnitFromDailyUnit(resolved.unit), locale) || localizeUnitLabel("ед./мес.", locale);
    const days = options?.workingDaysPerMonth;
    const daysText = typeof days === "number" && Number.isFinite(days) && days > 0 ? ` (${workingDaysCaption(locale, Math.round(days))})` : "";
    return `${withUnit} → ${labelValue(monthlyEquivalent, locale)} ${monthlyUnit}${daysText}`;
  }
  return withUnit;
}

export type SidebarSummarySource = "user_answer" | "calculated" | "profile_default" | "assumption" | "sample_default" | "fallback";

export type SidebarSummaryItem = {
  key: string;
  label: string;
  value: unknown;
  displayValue: string;
  source: SidebarSummarySource;
  rawKey?: string;
};

function normalizeSidebarSource(value: unknown): SidebarSummarySource | undefined {
  const source = String(value ?? "").trim().toLowerCase();
  if (!source) return undefined;
  if (["user_answer", "user_input", "answer", "user"].includes(source)) return "user_answer";
  if (["calculated", "calculation", "derived"].includes(source)) return "calculated";
  if (["profile_default", "business_profile", "ai_classification"].includes(source)) return "profile_default";
  if (["assumption", "assumed", "default_assumption"].includes(source)) return "assumption";
  if (["sample_default", "sample", "seed"].includes(source)) return "sample_default";
  if (["fallback", "text_fallback"].includes(source)) return "fallback";
  return undefined;
}

function fieldSource(profile: StructuredProjectData, key: string): SidebarSummarySource {
  const record = profile as Record<string, unknown>;
  const maps = [record.fieldSources, record.dataSources, record.sourceMap, record.structuredDataSources, record.provenance, record.__sources];
  for (const map of maps) {
    if (map && typeof map === "object") {
      const source = normalizeSidebarSource((map as Record<string, unknown>)[key]);
      if (source) return source;
    }
  }
  const direct = normalizeSidebarSource(record[`${key}Source`] ?? record[`${key}Provenance`]);
  return direct ?? "user_answer";
}

function isAllowedUserFacingSource(source: SidebarSummarySource): boolean {
  return source === "user_answer" || source === "calculated";
}

function hasOwnDirectValue(profile: StructuredProjectData, key: string | undefined | null): boolean {
  if (!key) return false;
  const record = profile as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(record, key)) return false;
  if (!isPresent(record[key])) return false;
  return isAllowedUserFacingSource(fieldSource(profile, key));
}

function hasCompletionMarkers(profile: StructuredProjectData): boolean {
  const record = profile as Record<string, unknown>;
  return [
    record.completedBlockIds,
    record.savedBlockIds,
    record.completedBlocks,
    record.savedBlocks,
    record.approvedBlocks,
    (record.interviewProgress as Record<string, unknown> | undefined)?.completedBlockIds,
    (record.interviewProgress as Record<string, unknown> | undefined)?.completedBlocks,
    (record.progress as Record<string, unknown> | undefined)?.completedBlockIds
  ].some((value) => value !== undefined && value !== null);
}

function collectCompletedBlockIds(profile: StructuredProjectData): Set<string> {
  const record = profile as Record<string, unknown>;
  const values = [
    record.completedBlockIds,
    record.savedBlockIds,
    record.completedBlocks,
    record.savedBlocks,
    record.approvedBlocks,
    (record.interviewProgress as Record<string, unknown> | undefined)?.completedBlockIds,
    (record.interviewProgress as Record<string, unknown> | undefined)?.completedBlocks,
    (record.progress as Record<string, unknown> | undefined)?.completedBlockIds
  ];
  const ids = new Set<string>();
  const add = (value: unknown) => {
    if (!value) return;
    if (typeof value === "string") {
      if (value.trim()) ids.add(value.trim());
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") ids.add(item);
        else if (item && typeof item === "object") {
          const itemRecord = item as Record<string, unknown>;
          add(itemRecord.blockId ?? itemRecord.id ?? itemRecord.key);
        }
      }
      return;
    }
    if (value instanceof Set) {
      for (const item of value) add(item);
      return;
    }
    if (typeof value === "object") {
      for (const [key, enabled] of Object.entries(value as Record<string, unknown>)) {
        if (enabled === true || enabled === "true" || enabled === "filled" || enabled === "completed" || enabled === "saved") ids.add(key);
      }
    }
  };
  values.forEach(add);
  return ids;
}

const blockAliasMap: Record<"sales" | "financing", string[]> = {
  sales: ["sales", "sales_marketing", "salesAndMarketing", "revenue", "market_sales", "operations_sales"],
  financing: ["financing", "finance", "funding", "credit", "loan"]
};

function isSummaryBlockCompleted(profile: StructuredProjectData, block: keyof typeof blockAliasMap): boolean {
  if (!hasCompletionMarkers(profile)) return true;
  const completed = collectCompletedBlockIds(profile);
  return blockAliasMap[block].some((alias) => completed.has(alias));
}

function formatMoney(value: unknown, locale: AppLocale): string {
  const numeric = typeof value === "number" ? value : Number(String(value ?? "").replace(/[\s_]/g, ""));
  if (!Number.isFinite(numeric)) return labelValue(value, locale);
  return `${numeric.toLocaleString(locale === "uz" ? "uz-UZ" : locale === "en" ? "en-US" : "ru-RU")} UZS`;
}

const customerSegmentKeys = ["targetCustomerSegments", "customerSegments", "mainCustomerSegments", "buyerSegments", "selectedCustomerSegments", "targetCustomers"];
const salesChannelKeys = ["salesChannels", "customerAcquisitionChannels", "acquisitionChannels", "marketingChannels"];
const channelLikeValue = /delivery|доставк|оптов|wholesale|marketplace|маркетплейс|instagram|telegram|2gis|google|yandex|maps|канал|channel/i;

function asDisplayList(value: unknown, locale: AppLocale): string[] {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,;]+/) : [value];
  return values.map((item) => labelValue(item, locale)).map((item) => item.trim()).filter(Boolean);
}

function resolveFirstAllowedList(profile: StructuredProjectData, keys: string[], locale: AppLocale, options?: { excludeChannelLike?: boolean }): { key: string; values: string[] } | null {
  for (const key of keys) {
    if (!hasOwnDirectValue(profile, key)) continue;
    let values = asDisplayList((profile as Record<string, unknown>)[key], locale);
    if (options?.excludeChannelLike) values = values.filter((item) => !channelLikeValue.test(item));
    if (values.length) return { key, values };
  }
  return null;
}

export function resolveSidebarSummaryItems(profile: StructuredProjectData, template?: TemplateLike, locale: AppLocale = "ru"): SidebarSummaryItem[] {
  const items: SidebarSummaryItem[] = [];
  const revenue = resolveRevenueInputs(profile, template && "assumptions" in template ? (template as any).assumptions : { defaultExpectedUtilizationPct: 100 } as never, profile.businessProfile as Record<string, unknown> | undefined);
  const salesBlockCompleted = isSummaryBlockCompleted(profile, "sales");
  const financingBlockCompleted = isSummaryBlockCompleted(profile, "financing");
  const add = (item: SidebarSummaryItem | null | undefined) => {
    if (!item || !isAllowedUserFacingSource(item.source)) return;
    if (item.displayValue === "" || /undefined|null|NaN|Infinity/i.test(item.displayValue)) return;
    items.push(item);
  };

  if (hasOwnDirectValue(profile, "businessType")) add({ key: "businessType", label: "Тип бизнеса", value: profile.businessType, displayValue: labelValue(profile.businessType, locale), source: "user_answer", rawKey: "businessType" });
  if (hasOwnDirectValue(profile, "region")) add({ key: "region", label: "Регион", value: profile.region, displayValue: formatRegion(profile.region, locale), source: "user_answer", rawKey: "region" });
  if (hasOwnDirectValue(profile, "district")) add({ key: "district", label: "Район", value: profile.district, displayValue: formatDistrict(profile.district, locale), source: "user_answer", rawKey: "district" });

  if (salesBlockCompleted) {
    const hasUserTraffic = hasOwnDirectValue(profile, revenue.volume?.key);
    const hasUserConversion = hasOwnDirectValue(profile, revenue.conversionSourceKey);
    if (revenue.conversionApplied && hasUserTraffic && hasUserConversion && revenue.displayVolumeMonthlyEquivalent && revenue.displayVolumeMonthlyEquivalent > 0) {
      add({ key: "calculatedMonthlySales", label: "Плановый объём продаж", value: revenue.displayVolumeMonthlyEquivalent, displayValue: `${labelValue(revenue.displayVolumeMonthlyEquivalent, locale)} продаж/мес.`, source: "calculated", rawKey: revenue.volume?.key });
      if (revenue.displayVolume !== undefined) {
        const trafficUnit = locale === "ru" ? "чел./день" : (localizeUnitLabel(revenue.displayVolumeUnitLabel, locale) || "чел./день");
        add({ key: "dailyTraffic", label: "Поток покупателей", value: revenue.displayVolume, displayValue: `${labelValue(revenue.displayVolume, locale)} ${trafficUnit}`, source: "user_answer", rawKey: revenue.volume?.key });
      }
      if (revenue.conversionPct !== undefined) add({ key: "conversion", label: "Конверсия", value: revenue.conversionPct, displayValue: `${labelValue(revenue.conversionPct, locale)}%`, source: "user_answer", rawKey: revenue.conversionSourceKey });
    } else {
      const planned = resolvePlannedVolume(profile, template);
      const plannedDisplay = formatSidebarResolvedValue(planned, locale, { monthlyEquivalent: revenue.displayVolumeMonthlyEquivalent, workingDaysPerMonth: revenue.workingDaysForDisplay, conversionApplied: revenue.conversionApplied });
      if (planned && plannedDisplay && hasOwnDirectValue(profile, planned.key)) add({ key: "plannedVolume", label: "Плановый объём", value: planned.value, displayValue: plannedDisplay, source: "user_answer", rawKey: planned.key });
    }

    const price = resolveAveragePrice(profile, template);
    if (price && hasOwnDirectValue(profile, price.key)) add({ key: "averageTicket", label: "Средний чек", value: price.value, displayValue: formatMoney(price.value, locale), source: "user_answer", rawKey: price.key });

    const customers = resolveFirstAllowedList(profile, customerSegmentKeys, locale, { excludeChannelLike: true });
    if (customers) add({ key: "customerSegments", label: "Основные покупатели", value: customers.values, displayValue: customers.values.join(", "), source: "user_answer", rawKey: customers.key });
    const channels = resolveFirstAllowedList(profile, salesChannelKeys, locale);
    if (channels) add({ key: "salesChannels", label: "Каналы продаж", value: channels.values, displayValue: channels.values.join(", "), source: "user_answer", rawKey: channels.key });
  }

  if (financingBlockCompleted && hasOwnDirectValue(profile, "creditNeeded")) add({ key: "creditNeeded", label: "Кредит", value: profile.creditNeeded, displayValue: labelValue(profile.creditNeeded, locale), source: "user_answer", rawKey: "creditNeeded" });
  const ownContribution = profile.ownContributionUZS ?? profile.ownContributionAmount ?? profile.ownContribution;
  if (financingBlockCompleted && (hasOwnDirectValue(profile, "ownContributionAmount") || hasOwnDirectValue(profile, "ownContributionUZS") || hasOwnDirectValue(profile, "ownContribution")) && isPresent(ownContribution)) {
    add({ key: "ownContributionAmount", label: "Собственные средства", value: ownContribution, displayValue: formatMoney(ownContribution, locale), source: "user_answer", rawKey: "ownContributionAmount" });
  }
  return items;
}
