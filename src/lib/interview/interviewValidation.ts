import type { BusinessProfile } from "../business/businessClassifier.ts";
import { compatibleAnswerAliases } from "./answerAliases.ts";
import type { InterviewBlock, InterviewQuestion, QuestionShowIfCondition, StructuredProjectData } from "../types/project.ts";

export type ValidationInvalidField = {
  field: string;
  label?: string;
  reason: "required" | "invalid";
  visible: boolean;
};

export type BlockValidationResult = {
  ok: boolean;
  errorCode?: "VALIDATION_FAILED";
  blockId: string;
  invalidFields: ValidationInvalidField[];
  hiddenRequiredFieldsIgnored: string[];
};

export const uiHiddenQuestionKeys = new Set([
  "ownContributionCurrency",
  "requestedLoanCurrency",
  "requestedLeasingCurrency"
]);

export const positiveRequiredNumberKeys = new Set([
  "requestedLoanAmount",
  "requestedLeasingAmount",
  "loanTermMonths",
  "leasingTermMonths",
  "monthlyCapacity",
  "averageTicket",
  "averagePrice",
  "averageServiceTicket",
  "dailyServiceCapacity",
  "washBaysCount",
  "carsPerDayStart",
  "carsPerDayStable",
  "averageWashTicket",
  "equipmentCapex",
  "monthlyRent",
  "rawMaterialCostPerUnit",
  "initialInventoryCostUZS",
  "averagePurchaseCost",
  "averageMarkupPct",
  "inventoryTurnoverDays",
  "traffic",
  "conversion",
  "collateralEstimatedValue"
]);

export function valueByPath(data: Record<string, unknown> | undefined, path: string): unknown {
  if (!data || !path) return undefined;
  return path.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object") return (current as Record<string, unknown>)[part];
    return undefined;
  }, data);
}

function isPlainShowIfCondition(value: unknown): value is QuestionShowIfCondition {
  return Boolean(value && typeof value === "object" && "field" in (value as Record<string, unknown>));
}

function isMissing(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "" || value === "__later__";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object" && "roles" in value) {
    const roles = (value as { roles?: Array<Record<string, unknown>> }).roles;
    return !Array.isArray(roles) || roles.length === 0 || roles.some((role) => !String(role.role ?? "").trim() || Number(role.count ?? 0) <= 0 || Number(role.monthlySalaryAmount ?? 0) <= 0);
  }
  return false;
}

export function valueByPathWithAliases(data: Record<string, unknown>, path: string): unknown {
  const direct = valueByPath(data, path);
  if (!isMissing(direct)) return direct;
  for (const alias of compatibleAnswerAliases[path] ?? []) {
    const aliasValue = valueByPath(data, alias);
    if (!isMissing(aliasValue)) return aliasValue;
  }
  return direct;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value];
}

function evaluateCondition(condition: QuestionShowIfCondition, data: Record<string, unknown>): boolean {
  const actual = valueByPath(data, condition.field);
  const expected = condition.value;
  const operator = condition.operator ?? "equals";

  if (operator === "equals") {
    return Array.isArray(expected) ? expected.includes(actual as never) : actual === expected;
  }
  if (operator === "not_equals") {
    return Array.isArray(expected) ? !expected.includes(actual as never) : actual !== expected;
  }
  if (operator === "includes") {
    if (Array.isArray(actual)) return asArray(expected).some((item) => actual.includes(item));
    if (typeof actual === "string") return asArray(expected).some((item) => actual.includes(String(item)));
    return false;
  }
  if (operator === "not_includes") {
    if (Array.isArray(actual)) return asArray(expected).every((item) => !actual.includes(item));
    if (typeof actual === "string") return asArray(expected).every((item) => !actual.includes(String(item)));
    return true;
  }
  return true;
}

export function showIfMatches(question: Pick<InterviewQuestion, "showIf">, data: Record<string, unknown>): boolean {
  if (!question.showIf) return true;
  const showIf = question.showIf;

  if (Array.isArray(showIf)) return showIf.every((condition) => evaluateCondition(condition, data));
  if (isPlainShowIfCondition(showIf)) return evaluateCondition(showIf, data);

  return Object.entries(showIf).every(([field, expected]) => {
    const actual = valueByPath(data, field);
    return Array.isArray(expected) ? expected.includes(actual) : actual === expected;
  });
}

export function buildVisibilityContext(input: {
  answers?: Record<string, unknown> | Partial<StructuredProjectData>;
  profile?: Partial<BusinessProfile>;
}): Record<string, unknown> {
  const answers = (input.answers ?? {}) as Record<string, unknown>;
  const profile = (input.profile ?? {}) as Partial<BusinessProfile> & { capabilities?: Record<string, unknown> };
  const capabilities = {
    providesServices: profile.providesServices,
    sellsGoods: profile.sellsGoods,
    hasInventory: profile.hasInventory,
    hasPhysicalLocation: profile.hasPremises || profile.usesPremises,
    locationTrafficCritical: profile.hasWalkInTraffic || profile.hasCustomerFlowDependency,
    needsEquipment: profile.hasEquipment,
    needsStaff: profile.hasStaff,
    hasRegulatedActivity: profile.hasRegulatedActivity,
    hasSanitaryRequirements: profile.hasSanitaryRequirements,
    dependsOnHostBusinessTraffic: profile.capabilities?.dependsOnHostBusinessTraffic ?? profile.operationalModel === "inside_partner_location",
    hasB2BClients: profile.hasB2BContracts,
    hasRepeatCustomers: profile.providesServices || profile.sellsGoods,
    ...(profile.capabilities ?? {})
  };

  return {
    ...answers,
    profile,
    businessProfile: {
      ...profile,
      capabilities
    },
    capabilities,
    operationalModel: answers.operationalModel ?? profile.operationalModel,
    category: profile.category,
    subcategory: profile.subcategory
  };
}

export function isQuestionVisible(question: InterviewQuestion, data: Record<string, unknown>): boolean {
  if (question.visible === false) return false;
  if (uiHiddenQuestionKeys.has(question.key)) return false;
  return showIfMatches(question, data);
}

export function isQuestionRequired(question: InterviewQuestion, requiredKeys?: Set<string>): boolean {
  if (question.isRequired === true || question.required === true) return true;
  if (question.optional === true) return false;
  if (requiredKeys?.has(question.key)) return true;
  // In the interview UI an omitted optional flag means the question is mandatory.
  // This prevents new/current blocks from being treated as 100% complete just
  // because their keys were not listed in template.requiredInputs.
  return true;
}

export function isQuestionMissing(question: Pick<InterviewQuestion, "key" | "type" | "optional">, data: Record<string, unknown>): boolean {
  if (question.optional) return false;
  const value = valueByPathWithAliases(data, question.key);
  if (isMissing(value)) return true;
  if (positiveRequiredNumberKeys.has(question.key)) {
    const numeric = Number(value);
    return !Number.isFinite(numeric) || numeric <= 0;
  }
  return false;
}

export function getVisibleRequiredQuestionsForBlock(input: {
  blockId: string;
  blocks: InterviewBlock[];
  answers: Record<string, unknown>;
  profile: BusinessProfile;
  requiredQuestionKeys?: string[];
}): InterviewQuestion[] {
  const block = input.blocks.find((item) => item.id === input.blockId);
  if (!block) return [];
  const requiredKeys = input.requiredQuestionKeys ? new Set(input.requiredQuestionKeys) : undefined;
  const context = buildVisibilityContext({ answers: input.answers, profile: input.profile });
  return block.questions.filter((question) => isQuestionRequired(question, requiredKeys) && isQuestionVisible(question, context));
}

export function getHiddenRequiredQuestionsIgnoredForBlock(input: {
  blockId: string;
  blocks: InterviewBlock[];
  answers: Record<string, unknown>;
  profile: BusinessProfile;
  requiredQuestionKeys?: string[];
}): InterviewQuestion[] {
  const block = input.blocks.find((item) => item.id === input.blockId);
  if (!block) return [];
  const requiredKeys = input.requiredQuestionKeys ? new Set(input.requiredQuestionKeys) : undefined;
  const context = buildVisibilityContext({ answers: input.answers, profile: input.profile });
  return block.questions.filter((question) => isQuestionRequired(question, requiredKeys) && !isQuestionVisible(question, context));
}

export function validateVisibleRequiredQuestionsForBlock(input: {
  blockId: string;
  blocks: InterviewBlock[];
  answers: Record<string, unknown>;
  profile: BusinessProfile;
  requiredQuestionKeys?: string[];
}): BlockValidationResult {
  const context = buildVisibilityContext({ answers: input.answers, profile: input.profile });
  const visibleRequired = getVisibleRequiredQuestionsForBlock(input);
  const invalidFields = visibleRequired
    .filter((question) => isQuestionMissing(question, context))
    .map((question) => ({ field: question.key, label: question.label, reason: "required" as const, visible: true }));
  const hiddenRequiredFieldsIgnored = getHiddenRequiredQuestionsIgnoredForBlock(input).map((question) => question.key);

  return {
    ok: invalidFields.length === 0,
    errorCode: invalidFields.length === 0 ? undefined : "VALIDATION_FAILED",
    blockId: input.blockId,
    invalidFields,
    hiddenRequiredFieldsIgnored
  };
}

export function calculateBlockProgress(input: {
  block: InterviewBlock;
  answers: Record<string, unknown>;
  profile: BusinessProfile;
  requiredQuestionKeys?: string[];
}): { required: number; missing: number; answered: number; pct: number; optionalOnly: boolean } {
  const required = getVisibleRequiredQuestionsForBlock({
    blockId: input.block.id,
    blocks: [input.block],
    answers: input.answers,
    profile: input.profile,
    requiredQuestionKeys: input.requiredQuestionKeys
  });
  const context = buildVisibilityContext({ answers: input.answers, profile: input.profile });
  const missing = required.filter((question) => isQuestionMissing(question, context));
  const answered = required.length - missing.length;
  return {
    required: required.length,
    missing: missing.length,
    answered,
    pct: required.length === 0 ? 0 : Math.round((answered / required.length) * 100),
    optionalOnly: required.length === 0
  };
}
