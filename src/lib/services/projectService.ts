import { prisma } from "../db/prisma.ts";
import type { DemoSession } from "../server/auth.ts";
import type { CurrencyCode, ExchangeRateSnapshot, MoneyValueSnapshot, StructuredProjectData } from "../types/project.ts";
import { generateBusinessTemplate } from "../ai/templateGenerator.ts";
import { legacyBusinessProfile } from "../business/businessClassifier.ts";
import { classifyBusinessWithAI } from "../business/aiBusinessClassifier.ts";
import { getUsdUzsExchangeRate, toUzbekistanDate } from "./exchangeRateService.ts";
import { mergeStructuredData } from "../utils/structuredDataPatch.ts";
import { sanitizeSectionNotesForStorage } from "../i18n/userFacingSanitizer.ts";
import { normalizeLocationFields } from "../location/locationNormalizer.ts";
export { applyDottedKeyPatch, mergeStructuredData, safeDeepMerge } from "../utils/structuredDataPatch.ts";

const projectDbFieldKeys: Array<keyof StructuredProjectData> = [
  // Keep this list in sync with scalar/JSON columns that actually exist in
  // prisma/schema.prisma Project. All other interview answers are still saved
  // safely inside structuredData JSON. Do not add dynamic interview-only fields
  // here unless the Prisma Project model has a matching column.
  "userLanguage",
  "businessType",
  "region",
  "district",
  "businessIdea",
  "plannedStartPeriod",
  "productionType",
  "toyType",
  "premisesStatus",
  "equipmentCondition",
  "monthlyCapacity",
  "averagePrice",
  "targetCustomers",
  "rawMaterialSource",
  "certificationAwareness",
  "supplierSelected",
  "ownContribution",
  "ownContributionAmount",
  "ownContributionCurrency",
  "ownContributionUZS",
  "exchangeRateUZSPerUSD",
  "creditNeeded",
  "requestedLoanAmount",
  "requestedLoanCurrency",
  "requestedLoanUZS",
  "loanPurpose",
  "loanTermMonths",
  "requestedLeasingAmount",
  "collateralAvailable",
  "collateralType",
  "collateralEstimatedValue",
  "experienceLevel",
  "staffPlan",
  "businessProfile",
  "exchangeRateSnapshot",
  "sectionNotes"
];

const moneyFieldKeys = [
  "averagePrice",
  "firstMonthRawMaterialStockUZS",
  "stableMonthlyRevenue",
  "rawMaterialCostPerUnit",
  "averagePurchaseCost",
  "packagingCostPerUnit",
  "directLogisticsCostPerUnit",
  "marketplaceCommissionPerUnit",
  "otherVariableCostPerUnit",
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
  "equipmentCapex",
  "premisesSetupCapex",
  "furnitureFixturesCapex",
  "itPosWebsiteCapex",
  "registrationCertificationCapex",
  "initialInventoryCapex",
  "initialInventoryCostUZS",
  "deliveryInstallationCapex",
  "trainingLaunchCapex",
  "capexReserve",
  "otherCapex",
  "accountsReceivableBufferUZS",
  "accountsPayableBufferUZS",
  "seasonalStockBufferUZS",
  "collateralEstimatedValue",
  "leasingAdvancePayment",
  "leasingMonthlyPayment",
  "grants",
  "otherFunding"
] as const;

const financingMoneyFields = {
  ownContributionAmount: {
    currencyKey: "ownContributionCurrency",
    uzsKey: "ownContributionUZS",
    aliasKey: "ownContribution"
  },
  requestedLoanAmount: {
    currencyKey: "requestedLoanCurrency",
    uzsKey: "requestedLoanUZS"
  },
  requestedLeasingAmount: {
    currencyKey: "requestedLeasingCurrency",
    uzsKey: "requestedLeasingUZS"
  }
} as const;

function stringifyCustomers(customers: unknown): string | undefined {
  if (Array.isArray(customers)) return customers.join(",");
  if (typeof customers === "string") return customers;
  return undefined;
}

function dbPatchFromStructuredData(data: Partial<StructuredProjectData>) {
  const patch: Record<string, unknown> = {};
  for (const key of projectDbFieldKeys) {
    if (data[key] === undefined) continue;
    if (key === "targetCustomers") patch[key] = stringifyCustomers(data[key]);
    else patch[key] = data[key];
  }
  return patch;
}

function isCurrency(value: unknown): value is CurrencyCode {
  return value === "UZS" || value === "USD";
}

function isMoneyValue(value: unknown): value is MoneyValueSnapshot {
  return value !== null && typeof value === "object" && "sourceAmount" in value && "sourceCurrency" in value;
}

function projectRateDate(project?: Record<string, unknown> | null): string {
  const updatedAt = project?.updatedAt instanceof Date ? project.updatedAt : undefined;
  const createdAt = project?.createdAt instanceof Date ? project.createdAt : undefined;
  return toUzbekistanDate(updatedAt ?? createdAt ?? new Date());
}

async function officialRateForMoney(
  data: StructuredProjectData,
  requestedDate: string,
  preferredSnapshot?: ExchangeRateSnapshot
): Promise<ExchangeRateSnapshot> {
  if (preferredSnapshot?.rate && preferredSnapshot.requestedDate === requestedDate) return preferredSnapshot;
  if (data.exchangeRateSnapshot?.rate && data.exchangeRateSnapshot.requestedDate === requestedDate) return data.exchangeRateSnapshot;
  return getUsdUzsExchangeRate(requestedDate);
}

async function normalizeMoneyValue(
  key: string,
  value: MoneyValueSnapshot,
  data: StructuredProjectData,
  requestedDate: string,
  preferredSnapshot?: ExchangeRateSnapshot
): Promise<{ amountUZS: number; snapshot?: ExchangeRateSnapshot; moneyValue: MoneyValueSnapshot }> {
  const sourceAmount = Math.max(0, Number(value.sourceAmount ?? 0));
  const sourceCurrency = isCurrency(value.sourceCurrency) ? value.sourceCurrency : "UZS";
  if (sourceAmount <= 0 || sourceCurrency === "UZS") {
    const amountUZS = sourceCurrency === "UZS" ? Math.round(sourceAmount) : 0;
    return {
      amountUZS,
      moneyValue: { sourceAmount, sourceCurrency, amountUZS }
    };
  }

  const snapshot = await officialRateForMoney(data, requestedDate, value.exchangeRateSnapshot ?? preferredSnapshot);
  const amountUZS = Math.round(sourceAmount * snapshot.rate);
  return {
    amountUZS,
    snapshot,
    moneyValue: {
      sourceAmount,
      sourceCurrency,
      amountUZS,
      exchangeRateSnapshot: snapshot
    }
  };
}

async function normalizeMoneyForStorage(data: StructuredProjectData, requestedDate: string): Promise<StructuredProjectData> {
  const moneyValues: Record<string, MoneyValueSnapshot> = { ...(data.moneyValues ?? {}) };
  let sharedSnapshot = data.exchangeRateSnapshot;
  const next: StructuredProjectData = { ...data, moneyValues };

  for (const [amountKey, config] of Object.entries(financingMoneyFields)) {
    const key = amountKey as keyof typeof financingMoneyFields;
    const existingMoneyValue = moneyValues[key];
    const rawAmount = (next as Record<string, unknown>)[key] ?? existingMoneyValue?.sourceAmount ?? 0;
    const amount = Number(rawAmount);
    const currency = ((next as Record<string, unknown>)[config.currencyKey] ?? existingMoneyValue?.sourceCurrency ?? "UZS") as CurrencyCode;
    if (!Number.isFinite(amount) || amount < 0 || !isCurrency(currency)) continue;

    // Top-level financing fields are canonical because the user can edit them after an
    // earlier autosave created a moneyValues snapshot. Do not let stale moneyValues with
    // sourceAmount = 0 overwrite a freshly typed own funds / loan / leasing amount.
    const moneyValueForNormalization: MoneyValueSnapshot = {
      ...existingMoneyValue,
      sourceAmount: amount,
      sourceCurrency: currency,
      amountUZS: currency === "UZS" ? Math.round(amount) : Number(existingMoneyValue?.amountUZS ?? 0),
      exchangeRateSnapshot: existingMoneyValue?.exchangeRateSnapshot
    };

    const normalized = await normalizeMoneyValue(
      key,
      moneyValueForNormalization,
      next,
      requestedDate,
      sharedSnapshot
    );
    sharedSnapshot = normalized.snapshot ?? sharedSnapshot;
    moneyValues[key] = normalized.moneyValue;
    (next as Record<string, unknown>)[key] = normalized.moneyValue.sourceAmount;
    (next as Record<string, unknown>)[config.currencyKey] = normalized.moneyValue.sourceCurrency;
    (next as Record<string, unknown>)[config.uzsKey] = normalized.amountUZS;
    if ("aliasKey" in config) (next as Record<string, unknown>)[config.aliasKey] = normalized.amountUZS;
  }

  for (const key of moneyFieldKeys) {
    const existingMoneyValue = moneyValues[key];
    const raw: unknown = existingMoneyValue ?? (next as Record<string, unknown>)[key];
    if (raw === undefined || raw === null || raw === "") continue;

    const moneyValue = isMoneyValue(raw)
      ? raw
      : { sourceAmount: Number(raw), sourceCurrency: "UZS" as const, amountUZS: Math.round(Number(raw)) };
    if (!Number.isFinite(Number(moneyValue.sourceAmount))) continue;

    const normalized = await normalizeMoneyValue(key, moneyValue, next, requestedDate, sharedSnapshot);
    sharedSnapshot = normalized.snapshot ?? sharedSnapshot;
    moneyValues[key] = normalized.moneyValue;
    (next as Record<string, unknown>)[key] = normalized.amountUZS;
  }

  if (sharedSnapshot) {
    next.exchangeRateSnapshot = sharedSnapshot;
    next.exchangeRateUZSPerUSD = sharedSnapshot.rate;
  }

  return next;
}

async function normalizeStaffPlanForStorage(data: StructuredProjectData, requestedDate: string): Promise<StructuredProjectData> {
  const plan = data.staffPlan;
  if (!plan?.roles?.length) return data;

  const hasUsdSalary = plan.roles.some((role) => role.monthlySalaryCurrency === "USD" && Number(role.monthlySalaryAmount ?? 0) > 0);
  const snapshot = hasUsdSalary
    ? await officialRateForMoney(data, requestedDate, plan.exchangeRateSnapshot)
    : plan.exchangeRateSnapshot ?? data.exchangeRateSnapshot;

  const roles = plan.roles.map((role) => {
    const amount = Number(role.monthlySalaryAmount ?? 0);
    const count = Math.max(1, Math.round(Number(role.count ?? 1)));
    const monthlySalaryCurrency = role.monthlySalaryCurrency ?? "UZS";
    const monthlySalaryUZS = monthlySalaryCurrency === "USD"
      ? Math.round(amount * (snapshot?.rate ?? 0))
      : Math.round(amount);

    return {
      ...role,
      count,
      monthlySalaryCurrency,
      monthlySalaryUZS
    };
  });

  return {
    ...data,
    exchangeRateSnapshot: snapshot ?? data.exchangeRateSnapshot,
    exchangeRateUZSPerUSD: snapshot?.rate ?? data.exchangeRateUZSPerUSD,
    staffPlan: {
      ...plan,
      roles,
      exchangeRateSnapshot: snapshot
    }
  };
}

async function normalizeStructuredDataForStorage(data: StructuredProjectData, project?: Record<string, unknown> | null): Promise<StructuredProjectData> {
  const requestedDate = data.exchangeRateSnapshot?.requestedDate ?? projectRateDate(project);
  const withLocation = normalizeLocationFields(data);
  const withMoney = await normalizeMoneyForStorage(withLocation, requestedDate);
  const normalizedStaff = await normalizeStaffPlanForStorage(withMoney, requestedDate);
  const normalized: StructuredProjectData = {
    ...normalizedStaff,
    sectionNotes: sanitizeSectionNotesForStorage(normalizedStaff.sectionNotes, normalizedStaff.userLanguage ?? "ru") as StructuredProjectData["sectionNotes"]
  };
  if (!normalized.businessProfile) {
    const profile = await classifyBusinessWithAI({
      businessType: normalized.businessType,
      businessIdea: normalized.businessIdea,
      region: normalized.region,
      language: normalized.userLanguage,
      answers: normalized
    });
    return { ...normalized, businessProfile: legacyBusinessProfile(profile) };
  }
  return normalized;
}

function parseCustomers(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.length > 0) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}

function numberValue(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (typeof value === "object") {
    const maybeDecimal = value as { toNumber?: () => number; toString?: () => string };
    if (typeof maybeDecimal.toNumber === "function") {
      const parsed = maybeDecimal.toNumber();
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    if (typeof maybeDecimal.toString === "function") {
      const parsed = Number(maybeDecimal.toString());
      return Number.isFinite(parsed) ? parsed : undefined;
    }
  }
  return undefined;
}

export function toStructuredProjectData(project: Record<string, unknown>): StructuredProjectData {
  const structured =
    project.structuredData && typeof project.structuredData === "object"
      ? (project.structuredData as StructuredProjectData)
      : {};

  const merged = normalizeLocationFields({
    ...structured,
    userLanguage: (project.userLanguage as "ru" | "uz" | "en" | undefined) ?? structured.userLanguage ?? "ru",
    businessType: (project.businessType as string | undefined) ?? structured.businessType,
    businessIdea: (project.businessIdea as string | undefined) ?? structured.businessIdea,
    region: (project.region as string | undefined) ?? structured.region,
    district: (project.district as string | undefined) ?? structured.district,
    plannedStartPeriod: (project.plannedStartPeriod as string | undefined) ?? structured.plannedStartPeriod,
    productionType: (project.productionType as string | undefined) ?? structured.productionType,
    toyType: (project.toyType as string | undefined) ?? structured.toyType,
    premisesStatus: (project.premisesStatus as string | undefined) ?? structured.premisesStatus,
    equipmentCondition: (project.equipmentCondition as string | undefined) ?? structured.equipmentCondition,
    monthlyCapacity: structured.monthlyCapacity ?? numberValue(project.monthlyCapacity),
    averagePrice: structured.averagePrice ?? numberValue(project.averagePrice),
    targetCustomers: parseCustomers(project.targetCustomers) ?? structured.targetCustomers,
    rawMaterialSource: (project.rawMaterialSource as string | undefined) ?? structured.rawMaterialSource,
    certificationAwareness: (project.certificationAwareness as string | undefined) ?? structured.certificationAwareness,
    supplierSelected: (project.supplierSelected as boolean | undefined) ?? structured.supplierSelected,
    ownContribution: structured.ownContribution ?? numberValue(project.ownContribution),
    ownContributionAmount: structured.ownContributionAmount ?? numberValue(project.ownContributionAmount),
    ownContributionCurrency: structured.ownContributionCurrency ?? (project.ownContributionCurrency as "UZS" | "USD" | undefined),
    ownContributionUZS: structured.ownContributionUZS ?? numberValue(project.ownContributionUZS),
    exchangeRateUZSPerUSD: structured.exchangeRateUZSPerUSD ?? numberValue(project.exchangeRateUZSPerUSD),
    creditNeeded: structured.creditNeeded ?? (project.creditNeeded as "yes" | "no" | "unknown" | undefined),
    requestedLoanAmount: structured.requestedLoanAmount ?? numberValue(project.requestedLoanAmount),
    requestedLoanCurrency: structured.requestedLoanCurrency ?? (project.requestedLoanCurrency as "UZS" | "USD" | undefined),
    requestedLoanUZS: structured.requestedLoanUZS ?? numberValue(project.requestedLoanUZS),
    loanPurpose: structured.loanPurpose ?? (project.loanPurpose as string | undefined),
    loanTermMonths: structured.loanTermMonths ?? numberValue(project.loanTermMonths),
    requestedLeasingAmount: structured.needsLeasing === false
      ? 0
      : structured.requestedLeasingAmount ?? numberValue(project.requestedLeasingAmount),
    staffPlan: structured.staffPlan ?? (project.staffPlan && typeof project.staffPlan === "object" ? (project.staffPlan as never) : undefined),
    businessProfile: structured.businessProfile ?? (project.businessProfile && typeof project.businessProfile === "object" ? (project.businessProfile as never) : undefined),
    exchangeRateSnapshot: structured.exchangeRateSnapshot ?? (project.exchangeRateSnapshot && typeof project.exchangeRateSnapshot === "object" ? (project.exchangeRateSnapshot as never) : undefined),
    moneyValues: structured.moneyValues,
    collateralAvailable: structured.collateralAvailable ?? (project.collateralAvailable as boolean | undefined),
    collateralType: structured.collateralType ?? (project.collateralType as string | undefined),
    collateralEstimatedValue: structured.collateralEstimatedValue ?? numberValue(project.collateralEstimatedValue),
    experienceLevel: (project.experienceLevel as string | undefined) ?? structured.experienceLevel,
    sectionNotes:
      project.sectionNotes && typeof project.sectionNotes === "object"
        ? (project.sectionNotes as never)
        : structured.sectionNotes
  });
  return merged;
}

export async function ensureDemoUser(session: DemoSession) {
  return prisma.user.upsert({
    where: { id: session.demoUserId },
    update: {},
    create: {
      id: session.demoUserId,
      name: session.role === "admin" ? "FINKO demo admin" : "FINKO demo user"
    }
  });
}

export async function createProject(input: {
  session: DemoSession;
  businessType: string;
  businessIdea: string;
  region: string;
  district?: string;
  plannedStartPeriod?: string;
  userLanguage?: "ru" | "uz" | "en";
  consentGiven: true;
  consentLocale?: "ru" | "uz" | "en";
  consentVersion?: string;
  aiMode?: string;
  extractedFields?: StructuredProjectData;
  aiExtraction?: unknown;
}) {
  await ensureDemoUser(input.session);
  const template = await generateBusinessTemplate({
    businessType: input.businessType,
    businessIdea: input.businessIdea,
    region: input.region,
    language: input.userLanguage ?? "ru"
  });
  const title = `${input.businessType.trim()} - ${input.region.trim()}`;
  const {
    businessType: _extractedBusinessType,
    businessIdea: _extractedBusinessIdea,
    region: _extractedRegion,
    district: _extractedDistrict,
    plannedStartPeriod: _extractedPlannedStartPeriod,
    userLanguage: _extractedUserLanguage,
    businessProfile: _extractedBusinessProfile,
    ...safeExtractedFields
  } = input.extractedFields ?? {};

  const structuredData: StructuredProjectData = {
    ...safeExtractedFields,
    userLanguage: input.userLanguage ?? "ru",
    businessType: input.businessType,
    businessIdea: input.businessIdea,
    region: input.region,
    district: input.district,
    plannedStartPeriod: input.plannedStartPeriod,
    sectorCode: template.code,
    templateCode: template.code
  };

  const normalizedStructuredData = await normalizeStructuredDataForStorage(structuredData);

  return prisma.project.create({
    data: {
      userId: input.session.demoUserId,
      title,
      sectorCode: template.code,
      userLanguage: normalizedStructuredData.userLanguage,
      businessType: normalizedStructuredData.businessType,
      businessIdea: input.businessIdea,
      region: normalizedStructuredData.region,
      district: normalizedStructuredData.district,
      plannedStartPeriod: normalizedStructuredData.plannedStartPeriod,
      aiMode: input.aiMode ?? "fallback",
      aiExtraction: input.aiExtraction as never,
      templateData: template as never,
      structuredData: normalizedStructuredData as never,
      sectionNotes: normalizedStructuredData.sectionNotes as never,
      consentGiven: input.consentGiven,
      consentTimestamp: new Date(),
      consentVersion: input.consentVersion ?? "1.0",
      consentLocale: input.consentLocale ?? input.userLanguage ?? "ru",
      ...dbPatchFromStructuredData(normalizedStructuredData)
    } as never,
    include: { answers: true }
  });
}

export async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: { answers: { orderBy: { createdAt: "asc" } } }
  });
}

export async function getProjectForSession(id: string, session: DemoSession) {
  return prisma.project.findFirst({
    where: { id, userId: session.demoUserId },
    include: { answers: { orderBy: { createdAt: "asc" } } }
  });
}

export async function deleteProjectForSession(id: string, session: DemoSession) {
  const project = await prisma.project.findFirst({
    where: { id, userId: session.demoUserId },
    select: { id: true }
  });
  if (!project) return null;
  await prisma.project.delete({ where: { id } });
  return { id };
}

export async function updateProject(id: string, data: Partial<StructuredProjectData> & Record<string, unknown>) {
  const current = await getProject(id);
  const currentStructured = current ? toStructuredProjectData(current as unknown as Record<string, unknown>) : {};
  const nextStructured = await normalizeStructuredDataForStorage(
    mergeStructuredData(currentStructured, data),
    current as unknown as Record<string, unknown> | null
  );

  return prisma.project.update({
    where: { id },
    data: {
      structuredData: nextStructured as never,
      sectionNotes: nextStructured.sectionNotes as never,
      ...dbPatchFromStructuredData(nextStructured)
    } as never,
    include: { answers: true }
  });
}


export async function updateProjectForSession(id: string, session: DemoSession, data: Partial<StructuredProjectData> & Record<string, unknown>) {
  const existing = await getProjectForSession(id, session);
  if (!existing) return null;
  return updateProject(id, data);
}

export async function saveAnswer(input: {
  projectId: string;
  questionKey: string;
  question: string;
  answer: string;
  answerType?: string;
}) {
  return prisma.projectAnswer.upsert({
    where: {
      projectId_questionKey: {
        projectId: input.projectId,
        questionKey: input.questionKey
      }
    },
    update: {
      question: input.question,
      answer: input.answer,
      answerType: input.answerType
    },
    create: input
  });
}

export async function updateStructuredData(id: string, data: Partial<StructuredProjectData>) {
  return updateProject(id, data);
}

export async function markInterviewCompleted(id: string) {
  return prisma.project.update({
    where: { id },
    data: { status: "interview_completed" },
    include: { answers: true }
  });
}
