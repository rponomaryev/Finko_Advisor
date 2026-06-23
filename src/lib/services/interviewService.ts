import { getNextCursorBlockId, getNextFallbackQuestions, valueByPath } from "../ai/fallbackInterview.ts";
import { classifyBusiness, type BusinessProfile } from "../business/businessClassifier.ts";
import { compatibleAnswerAliases } from "../interview/answerAliases.ts";
import { buildVisibilityContext, isQuestionVisible, validateVisibleRequiredQuestionsForBlock } from "../interview/interviewValidation.ts";
import { resolveReportReadiness } from "../report/reportReadiness.ts";
import { persistedInterviewPlanBlockSchema } from "../validation/projectSchemas.ts";
import { resolveTemplateForData } from "./templateService.ts";
import type { CurrencyCode, InterviewPlanBlock, InterviewQuestion, MoneyValueSnapshot, StaffPlan, StructuredProjectData } from "../types/project.ts";

export type InterviewQuestionResponse = ReturnType<typeof getNextFallbackQuestions>;

type StableQuestionSet = {
  response: InterviewQuestionResponse;
  planPatch?: Pick<StructuredProjectData, "interviewPlan">;
};

function isMissing(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "" || value === "__later__";
  return Array.isArray(value) && value.length === 0;
}

function isStaffPlanMissing(value: unknown): boolean {
  if (!value || typeof value !== "object") return true;
  const plan = value as Partial<StaffPlan>;
  return !Array.isArray(plan.roles) || plan.roles.length === 0 || plan.roles.some((role) => {
    const salary = Number((role as unknown as { monthlySalaryAmount?: unknown }).monthlySalaryAmount ?? 0);
    return !role.role?.trim() || Number(role.count ?? 0) <= 0 || salary <= 0;
  });
}

const positiveRequiredNumberKeys = new Set([
  "requestedLoanAmount",
  "requestedLeasingAmount",
  "loanTermMonths",
  "leasingTermMonths",
  "monthlyCapacity",
  "averageTicket",
  "averagePrice",
  "equipmentCapex",
  "rawMaterialCostPerUnit",
  "initialInventoryCostUZS",
  "averagePurchaseCost",
  "averageMarkupPct",
  "inventoryTurnoverDays",
  "traffic",
  "conversion",
  "collateralEstimatedValue"
]);

function valueByPathWithAliases(data: StructuredProjectData, path: string): unknown {
  const direct = valueByPath(data, path);
  if (!isMissing(direct)) return direct;
  for (const alias of compatibleAnswerAliases[path] ?? []) {
    const aliasValue = valueByPath(data, alias);
    if (!isMissing(aliasValue)) return aliasValue;
  }
  return direct;
}

function isQuestionMissing(question: Pick<InterviewQuestion, "key" | "type" | "optional">, data: StructuredProjectData) {
  if (question.optional) return false;
  const value = valueByPathWithAliases(data, question.key);
  if (question.type === "staffPlan") return isStaffPlanMissing(value);
  if (isMissing(value)) return true;
  if (positiveRequiredNumberKeys.has(question.key)) return Number(value) <= 0;
  return false;
}

const moneyCurrencyKeys: Record<string, keyof StructuredProjectData> = {
  ownContributionAmount: "ownContributionCurrency",
  requestedLoanAmount: "requestedLoanCurrency",
  requestedLeasingAmount: "requestedLeasingCurrency"
};

const moneyUzsKeys: Record<string, keyof StructuredProjectData> = {
  ownContributionAmount: "ownContributionUZS",
  requestedLoanAmount: "requestedLoanUZS",
  requestedLeasingAmount: "requestedLeasingUZS"
};

function isMoneyAnswer(value: unknown): value is MoneyValueSnapshot & { __money?: true } {
  return value !== null && typeof value === "object" && "sourceAmount" in value && "sourceCurrency" in value;
}

function applyDottedKeyPatch(target: StructuredProjectData, key: string, value: unknown) {
  if (!key.includes(".")) {
    (target as Record<string, unknown>)[key] = value;
    return target;
  }

  const [root, child] = key.split(".");
  if (root === "sectionNotes") {
    target.sectionNotes = {
      ...(target.sectionNotes ?? {}),
      [child]: value
    };
  } else if (root === "otherDetails") {
    target.otherDetails = {
      ...(target.otherDetails ?? {}),
      [child]: String(value ?? "")
    };
  }
  return target;
}

function normalizeStoredBlock(block: unknown): InterviewPlanBlock | undefined {
  const parsed = persistedInterviewPlanBlockSchema.safeParse(block);
  return parsed.success ? parsed.data as InterviewPlanBlock : undefined;
}

function normalizeSignaturePart(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, " ") : "";
}


function getResolvedBusinessProfile(data: StructuredProjectData): BusinessProfile {
  if (data.businessProfile && typeof data.businessProfile === "object" && "keyRevenueDrivers" in data.businessProfile) {
    return data.businessProfile as unknown as BusinessProfile;
  }
  return classifyBusiness({
    businessType: data.businessType,
    businessIdea: data.businessIdea,
    region: data.region,
    language: data.userLanguage,
    answers: data
  });
}

function getVisibilityContext(data: StructuredProjectData) {
  const profile = getResolvedBusinessProfile(data);
  return { profile, context: buildVisibilityContext({ answers: data, profile }) };
}

function questionIsVisibleForData(question: InterviewQuestion, data: StructuredProjectData): boolean {
  return isQuestionVisible(question, getVisibilityContext(data).context);
}

function getBusinessProfileSignature(data: StructuredProjectData) {
  const profile = getResolvedBusinessProfile(data);

  return {
    category: profile.category,
    subcategory: profile.subcategory,
    operationalModel: profile.operationalModel,
    signature: [
      profile.category,
      profile.subcategory ?? "",
      profile.operationalModel ?? "",
      normalizeSignaturePart(data.businessType),
      normalizeSignaturePart(data.businessIdea)
    ].join("|")
  };
}

function isCurrentInterviewPlan(data: StructuredProjectData) {
  const expected = getBusinessProfileSignature(data);
  const plan = data.interviewPlan;
  if (!plan?.templateSignature) return !plan?.blocks;
  return plan.templateSignature === expected.signature;
}

function getTemplateBlockQuestions(data: StructuredProjectData, blockId: string): InterviewQuestion[] {
  const template = resolveTemplateForData(data);
  return template.interviewBlocks.find((item) => item.id === blockId)?.questions ?? [];
}

function mergeQuestionsByTemplateOrder(
  data: StructuredProjectData,
  blockId: string,
  persistedQuestions: InterviewQuestion[],
  currentQuestions: InterviewQuestion[]
): InterviewQuestion[] {
  const persistedByKey = new Map(persistedQuestions.map((question) => [question.key, question] as const));
  const currentByKey = new Map(currentQuestions.map((question) => [question.key, question] as const));
  const template = resolveTemplateForData(data);
  const templateQuestions = template.interviewBlocks.find((item) => item.id === blockId)?.questions ?? [];
  const templateByKey = new Map(templateQuestions.map((question) => [question.key, question] as const));
  const templateBlockKeys = new Set(templateQuestions.map((question) => question.key));
  const otherBlockKeys = new Set(
    template.interviewBlocks
      .filter((block) => block.id !== blockId)
      .flatMap((block) => block.questions.map((question) => question.key))
  );
  const orderedKeys = [
    ...templateQuestions.map((question) => question.key),
    ...persistedQuestions.map((question) => question.key),
    ...currentQuestions.map((question) => question.key)
  ];

  return Array.from(new Set(orderedKeys))
    .filter((key) => !otherBlockKeys.has(key) || templateBlockKeys.has(key))
    .map((key) => {
      // The current template is the source of truth for question wording and domain.
      // Persisted interview plans keep navigation stable, but must not re-inject
      // stale questions from a previous business subtype when the same generic key
      // (for example damageLiability) is reused by another industry.
      if (templateBlockKeys.has(key)) return templateByKey.get(key) ?? currentByKey.get(key) ?? persistedByKey.get(key);
      return currentByKey.get(key) ?? persistedByKey.get(key) ?? templateByKey.get(key);
    })
    .filter((question): question is InterviewQuestion => Boolean(question));
}

function buildRequiredQuestionsFromPlan(data: StructuredProjectData, planBlock: InterviewPlanBlock, visibleQuestions?: InterviewQuestion[]): InterviewQuestion[] {
  const template = resolveTemplateForData(data);
  const requiredKeys = new Set([...template.requiredInputs, ...planBlock.requiredQuestionKeys]);
  const questions = visibleQuestions ?? mergeQuestionsByTemplateOrder(data, planBlock.blockId, planBlock.questions, []);

  return questions
    .filter((question) => requiredKeys.has(question.key))
    .filter((question) => questionIsVisibleForData(question, data));
}

function withPersistedQuestionSet(response: InterviewQuestionResponse, data: StructuredProjectData, planBlock: InterviewPlanBlock): InterviewQuestionResponse {
  const questions = mergeQuestionsByTemplateOrder(data, planBlock.blockId, planBlock.questions, response.questions);
  const visibleQuestions = questions.filter((question) => questionIsVisibleForData(question, data));
  const requiredVisibleQuestions = buildRequiredQuestionsFromPlan(data, planBlock, visibleQuestions);
  const missingRequired = requiredVisibleQuestions
    .filter((question) => isQuestionMissing(question, data))
    .map((question) => question.key);

  return {
    ...response,
    questions,
    requiredVisibleQuestions,
    canAdvance: missingRequired.length === 0,
    isManualBlock: response.isManualBlock,
    isInterviewComplete: response.missingFields.length === 0 && response.nextBlockId === null
  };
}

function buildInterviewPlanBlock(
  response: InterviewQuestionResponse,
  data: StructuredProjectData,
  generatedBy: InterviewPlanBlock["generatedBy"] = "template"
): InterviewPlanBlock {
  const template = resolveTemplateForData(data);
  const requiredKeys = new Set(template.requiredInputs);
  const fullBlockQuestions = getTemplateBlockQuestions(data, response.blockId);
  const questionsForPlan = fullBlockQuestions.length ? fullBlockQuestions : response.questions;
  const requiredVisibleQuestions = response.requiredVisibleQuestions?.length
    ? response.requiredVisibleQuestions
    : questionsForPlan.filter((question) => requiredKeys.has(question.key) && questionIsVisibleForData(question, data));

  const requiredQuestionKeys = Array.from(new Set([
    ...requiredVisibleQuestions.map((question) => question.key),
    ...questionsForPlan.filter((question) => requiredKeys.has(question.key)).map((question) => question.key)
  ]));
  const optionalQuestionKeys = questionsForPlan
    .filter((question) => !requiredKeys.has(question.key) || question.optional)
    .map((question) => question.key);

  return {
    blockId: response.blockId,
    generatedBy,
    generatedAt: new Date().toISOString(),
    questions: questionsForPlan,
    requiredQuestionKeys,
    optionalQuestionKeys
  };
}

export function getPersistedInterviewPlanBlock(data: StructuredProjectData, blockId: string): InterviewPlanBlock | undefined {
  if (!isCurrentInterviewPlan(data)) return undefined;
  return normalizeStoredBlock(data.interviewPlan?.blocks?.[blockId]);
}

export function getStableQuestions(data: StructuredProjectData, blockId?: string): StableQuestionSet {
  const response = getNextFallbackQuestions(data, blockId ? { blockId, includeAnswered: true } : {});
  const persistedBlock = getPersistedInterviewPlanBlock(data, response.blockId);
  if (persistedBlock) return { response: withPersistedQuestionSet(response, data, persistedBlock) };

  const planBlock = buildInterviewPlanBlock(response, data);
  const parsed = persistedInterviewPlanBlockSchema.safeParse(planBlock);
  if (!parsed.success) return { response };

  const parsedPlanBlock = parsed.data as InterviewPlanBlock;
  const currentPlan = isCurrentInterviewPlan(data) ? data.interviewPlan : undefined;
  const generatedAt = currentPlan?.generatedAt ?? planBlock.generatedAt;
  const previousBlocks = currentPlan?.blocks ?? {};
  const profileSignature = getBusinessProfileSignature(data);
  return {
    response: withPersistedQuestionSet(response, data, parsedPlanBlock),
    planPatch: {
      interviewPlan: {
        version: "1.0",
        generatedAt,
        templateSignature: profileSignature.signature,
        businessCategory: profileSignature.category,
        businessSubcategory: profileSignature.subcategory,
        operationalModel: profileSignature.operationalModel,
        blocks: {
          ...previousBlocks,
          [response.blockId]: parsedPlanBlock
        }
      }
    }
  };
}


export function getNextQuestions(data: StructuredProjectData, blockId?: string) {
  return getStableQuestions(data, blockId).response;
}

export function getCurrentBlock(data: StructuredProjectData): string {
  return getNextFallbackQuestions(data).block;
}

export function calculateCompletion(data: StructuredProjectData): number {
  return getNextFallbackQuestions(data).completionPct;
}

export function getNextInterviewCursor(data: StructuredProjectData, currentBlockId?: string): string | undefined {
  return getNextCursorBlockId(data, currentBlockId);
}

export function validateRequiredVisibleFields(
  data: StructuredProjectData,
  blockId?: string,
  options: { templateData?: StructuredProjectData } = {}
) {
  if (!blockId) {
    return { valid: true, missingFields: [] as string[], invalidFields: [], hiddenRequiredFieldsIgnored: [], errorCode: undefined as string | undefined };
  }

  // Validate the block the user actually saw. During a save, answers can change
  // classification (for example: generic service -> manufacturing), but newly
  // introduced required questions must not block the same save because they were
  // not rendered in the UI. Use the pre-save/persisted plan as the validation
  // template and the post-answer data only as answer/visibility context.
  const templateData = options.templateData ?? data;
  const template = resolveTemplateForData(templateData);
  const persistedBlock = getPersistedInterviewPlanBlock(templateData, blockId);
  const templateBlock = template.interviewBlocks.find((block) => block.id === blockId);
  const blocks = persistedBlock
    ? [{
        id: blockId,
        name: templateBlock?.name ?? blockId,
        description: templateBlock?.description ?? "",
        questions: persistedBlock.questions
      }]
    : template.interviewBlocks;
  const requiredQuestionKeys = persistedBlock?.requiredQuestionKeys?.length
    ? persistedBlock.requiredQuestionKeys
    : template.requiredInputs;
  const { profile } = getVisibilityContext(data);
  const validation = validateVisibleRequiredQuestionsForBlock({
    blockId,
    blocks,
    answers: data as Record<string, unknown>,
    profile,
    requiredQuestionKeys
  });

  return {
    valid: validation.ok,
    missingFields: validation.invalidFields.map((field) => field.field),
    invalidFields: validation.invalidFields,
    hiddenRequiredFieldsIgnored: validation.hiddenRequiredFieldsIgnored,
    errorCode: validation.errorCode
  };
}

export function normalizeQuestionAnswer(question: Pick<InterviewQuestion, "key" | "type">, answer: unknown): unknown {
  if (answer === "__later__") return undefined;
  if (isMoneyAnswer(answer)) return Number(answer.amountUZS ?? answer.sourceAmount ?? 0);

  if (question.type === "staffPlan") return answer;

  if (question.type === "number") {
    const value = typeof answer === "number" ? answer : Number(String(answer).replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(value) ? value : undefined;
  }

  if (question.type === "boolean") {
    if (typeof answer === "boolean") return answer;
    return ["true", "yes", "да", "ha", "есть", "1"].includes(String(answer).toLowerCase());
  }

  if (question.type === "multiselect") {
    if (Array.isArray(answer)) return answer.map(String);
    return String(answer)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return String(answer);
}

export function mapAnswerToProjectField(
  question: Pick<InterviewQuestion, "key" | "type">,
  answer: unknown
): Partial<StructuredProjectData> {
  if (isMoneyAnswer(answer)) {
    const sourceAmount = Math.max(0, Number(answer.sourceAmount ?? 0));
    const sourceCurrency = (answer.sourceCurrency === "USD" ? "USD" : "UZS") as CurrencyCode;
    const amountUZS = Math.max(0, Number(answer.amountUZS ?? (sourceCurrency === "UZS" ? sourceAmount : 0)));
    const moneyValue: MoneyValueSnapshot = {
      sourceAmount,
      sourceCurrency,
      amountUZS,
      exchangeRateSnapshot: answer.exchangeRateSnapshot
    };
    const patch: StructuredProjectData = {
      moneyValues: {
        [question.key]: moneyValue
      }
    };

    const currencyKey = moneyCurrencyKeys[question.key];
    const uzsKey = moneyUzsKeys[question.key];
    if (currencyKey && uzsKey) {
      (patch as Record<string, unknown>)[question.key] = sourceAmount;
      (patch as Record<string, unknown>)[currencyKey] = sourceCurrency;
      (patch as Record<string, unknown>)[uzsKey] = amountUZS;
      if (question.key === "ownContributionAmount") patch.ownContribution = amountUZS;
    } else {
      (patch as Record<string, unknown>)[question.key] = amountUZS;
    }
    return patch;
  }

  const value = normalizeQuestionAnswer(question, answer);
  if (value === undefined) return {};
  const patch: StructuredProjectData = {};
  applyDottedKeyPatch(patch, question.key, value);
  return patch;
}

const CALCULATION_CREDIT_REQUIRED_KEYS = [
  "requestedLoanAmount",
  "requestedLoanCurrency",
  "loanTermMonths",
  "loanAnnualRatePct",
  "loanRepaymentType",
  "loanPurpose"
];

const CALCULATION_LEASING_REQUIRED_KEYS = [
  "requestedLeasingAmount",
  "requestedLeasingCurrency",
  "leasingTermMonths",
  "leasingAnnualRatePct",
  "leasingAdvancePayment",
  "leasingItem"
];

const REVENUE_VOLUME_KEYS = [
  "monthlyCapacity",
  "monthlyOrders",
  "monthlyOutputCapacity",
  "rentalOrdersPerMonth",
  "dailyCovers",
  "dailyOrders",
  "dailyOrdersCapacity",
  "dailyServiceCapacity",
  "carsPerDayStable",
  "carsPerDayStart",
  "traffic"
];

const REVENUE_PRICE_KEYS = [
  "averageTicket",
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
  "averageSolarProjectTicket"
];

function isCalculationFieldMissing(data: StructuredProjectData, key: string): boolean {
  const value = valueByPathWithAliases(data, key);
  if (key === "staffPlan") return isStaffPlanMissing(value);
  if (isMissing(value)) return true;
  return positiveRequiredNumberKeys.has(key) && Number(value) <= 0;
}

function hasPositiveValueForAny(data: StructuredProjectData, keys: string[]): boolean {
  return keys.some((key) => {
    const value = valueByPathWithAliases(data, key);
    if (isMissing(value)) return false;
    if (typeof value === "number") return value > 0;
    if (Array.isArray(value)) return value.length > 0;
    return Number(value) > 0 || String(value).trim().length > 0;
  });
}

function buildCalculationRequiredKeys(data: StructuredProjectData): string[] {
  const template = resolveTemplateForData(data);
  const keys = new Set(template.requiredInputs ?? []);
  if (data.creditNeeded === "yes") CALCULATION_CREDIT_REQUIRED_KEYS.forEach((key) => keys.add(key));
  if (data.needsLeasing === true) CALCULATION_LEASING_REQUIRED_KEYS.forEach((key) => keys.add(key));
  return Array.from(keys);
}

export function validateReliableCalculationInputs(data: StructuredProjectData): { ok: boolean; reason?: string; missingFields: string[] } {
  const readiness = resolveReportReadiness(data);
  const missing = new Set(readiness.blockingIssues.flatMap((issue) => issue.fields ?? [issue.field ?? issue.key ?? issue.code]));
  return {
    ok: readiness.ready,
    reason: missing.size ? "missing_required_financial_fields" : undefined,
    missingFields: Array.from(missing)
  };
}

export function hasEnoughDataForCalculation(data: StructuredProjectData): boolean {
  return validateReliableCalculationInputs(data).ok;
}
