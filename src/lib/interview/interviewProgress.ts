import { classifyBusiness, type BusinessProfile } from "../business/businessClassifier.ts";
import { resolveTemplateForData } from "../services/templateService.ts";
import type { InterviewBlock, InterviewQuestion, Locale, StructuredProjectData } from "../types/project.ts";
import type { SectorTemplate } from "../types/sector.ts";
import { buildVisibilityContext, isQuestionMissing, isQuestionRequired, isQuestionVisible, valueByPathWithAliases } from "./interviewValidation.ts";
import { detectInterviewDataQualityWarnings, type InterviewDataQualityWarning } from "./dataQuality.ts";

export type BlockProgressStatus = "locked" | "not_started" | "in_progress" | "filled" | "has_warnings" | "needs_review" | "not_applicable";

export type BlockProgressMetric = {
  blockId: string;
  name: string;
  step: number;
  totalSteps: number;
  required: number;
  answered: number;
  missing: number;
  pct: number;
  rawPct: number;
  status: BlockProgressStatus;
  label: string;
  missingRequiredFields: string[];
  warnings: InterviewDataQualityWarning[];
};

export type InterviewProgressSummary = {
  project: { required: number; answered: number; missing: number; pct: number };
  currentBlock?: BlockProgressMetric;
  blocks: BlockProgressMetric[];
  dataQualityStatus: "ok" | "has_warnings" | "needs_review";
};

const REQUIRED_WHEN_CREDIT = [
  "requestedLoanAmount",
  "requestedLoanCurrency",
  "loanTermMonths",
  "loanAnnualRatePct",
  "loanRepaymentType",
  "loanPurpose"
];

const REQUIRED_WHEN_LEASING = [
  "leasingItem",
  "leasingAssetType",
  "requestedLeasingAmount",
  "requestedLeasingCurrency",
  "leasingTermMonths",
  "leasingAnnualRatePct"
];

export function buildInterviewRequiredKeys(template: Pick<SectorTemplate, "requiredInputs">, data: StructuredProjectData): string[] {
  const conditional = [
    ...(data.creditNeeded === "yes" ? REQUIRED_WHEN_CREDIT : []),
    ...(data.needsLeasing === true ? REQUIRED_WHEN_LEASING : [])
  ];
  return Array.from(new Set([...(template.requiredInputs ?? []), ...conditional]));
}

function profileForData(data: StructuredProjectData): BusinessProfile {
  return classifyBusiness({
    businessType: data.businessType,
    businessIdea: data.businessIdea,
    region: data.region,
    language: data.userLanguage,
    answers: data
  });
}

function visibleRequiredQuestions(input: {
  block: InterviewBlock;
  data: StructuredProjectData;
  profile: BusinessProfile;
  requiredKeys: Set<string>;
}): InterviewQuestion[] {
  const context = buildVisibilityContext({ answers: input.data, profile: input.profile });
  return input.block.questions.filter((question) => isQuestionRequired(question, input.requiredKeys) && isQuestionVisible(question, context));
}

function isAnswerValueEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "" || value === "__later__";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object" && "roles" in value) {
    const roles = (value as { roles?: Array<Record<string, unknown>> }).roles;
    return !Array.isArray(roles) || roles.length === 0;
  }
  return false;
}

function hasAnyAnswer(block: InterviewBlock, data: StructuredProjectData, profile: BusinessProfile): boolean {
  const context = buildVisibilityContext({ answers: data, profile });
  return block.questions.some((question) => isQuestionVisible(question, context) && !isAnswerValueEmpty(valueByPathWithAliases(context, question.key)));
}

function statusLabel(status: BlockProgressStatus, locale: Locale = "ru") {
  const ru: Record<BlockProgressStatus, string> = {
    locked: "Заблокирован",
    not_started: "Не начат",
    in_progress: "В процессе",
    filled: "Заполнен",
    has_warnings: "Есть предупреждения",
    needs_review: "Требует проверки",
    not_applicable: "Не применимо"
  };
  const uz: Record<BlockProgressStatus, string> = {
    locked: "Bloklangan",
    not_started: "Boshlanmagan",
    in_progress: "Jarayonda",
    filled: "To‘ldirilgan",
    has_warnings: "Ogohlantirish bor",
    needs_review: "Tekshirish kerak",
    not_applicable: "Qo‘llanilmaydi"
  };
  const en: Record<BlockProgressStatus, string> = {
    locked: "Locked",
    not_started: "Not started",
    in_progress: "In progress",
    filled: "Completed",
    has_warnings: "Has warnings",
    needs_review: "Needs review",
    not_applicable: "Not applicable"
  };
  return (locale === "uz" ? uz : locale === "en" ? en : ru)[status];
}

export function getBlockProgressStatusLabel(status: BlockProgressStatus, locale: Locale = "ru") {
  return statusLabel(status, locale);
}

export function progressText(locale: Locale = "ru") {
  if (locale === "en") {
    return {
      currentStep: "Current step",
      sectionCompletion: "Section completion",
      wholeProject: "Whole project",
      dataQuality: "Data quality",
      dataQualityOk: "no warnings",
      dataQualityWarnings: "has warnings",
      dataQualityMissingRequired: "required questions are still missing",
      sectionSaved: "Section saved.",
      sectionFullyCompleted: "Section fully completed.",
      savedButIncomplete: "Some required fields are missing or require review.",
      missingRequiredPrefix: "Required fields remaining",
      requiredAnsweredCount: (answered: number, required: number) => `${answered} of ${required} required questions completed`
    };
  }
  if (locale === "uz") {
    return {
      currentStep: "Joriy qadam",
      sectionCompletion: "Bo‘lim to‘ldirilishi",
      wholeProject: "Butun loyiha",
      dataQuality: "Ma’lumotlar sifati",
      dataQualityOk: "ogohlantirish yo‘q",
      dataQualityWarnings: "ogohlantirish bor",
      dataQualityMissingRequired: "majburiy savollar hali to‘ldirilmagan",
      sectionSaved: "Bo‘lim saqlandi.",
      sectionFullyCompleted: "Bo‘lim to‘liq to‘ldirilgan.",
      savedButIncomplete: "Majburiy yoki tekshirish kerak bo‘lgan maydonlar bor.",
      missingRequiredPrefix: "Qolgan majburiy maydonlar",
      requiredAnsweredCount: (answered: number, required: number) => `${required} ta majburiy savoldan ${answered} tasi to‘ldirildi`
    };
  }
  return {
    currentStep: "Текущий шаг",
    sectionCompletion: "Заполнено в блоке",
    wholeProject: "Весь проект",
    dataQuality: "Качество данных",
    dataQualityOk: "без предупреждений",
    dataQualityWarnings: "есть предупреждения",
    dataQualityMissingRequired: "есть незаполненные обязательные вопросы",
    sectionSaved: "Раздел сохранён.",
    sectionFullyCompleted: "Раздел полностью заполнен.",
    savedButIncomplete: "Есть незаполненные или требующие проверки поля.",
    missingRequiredPrefix: "Остались обязательные поля",
    requiredAnsweredCount: (answered: number, required: number) => `Заполнено ${answered} из ${required} обязательных вопросов`
  };
}

function cappedPct(rawPct: number, warnings: InterviewDataQualityWarning[]): number {
  if (rawPct >= 100 && warnings.some((warning) => warning.severity === "high")) return 85;
  if (rawPct >= 100 && warnings.length > 0) return 95;
  return rawPct;
}

function reviewStatusForBlock(data: StructuredProjectData, blockId: string): boolean {
  return (data.blockReviewStatuses ?? []).some((item) => item.blockId === blockId && item.status === "needs_review");
}

export function calculateScreenProgress(input: {
  questions: InterviewQuestion[];
  data: StructuredProjectData;
  profile?: BusinessProfile;
  requiredQuestionKeys?: string[];
}): { required: number; answered: number; missing: number; pct: number; missingRequiredFields: string[] } {
  const profile = input.profile ?? profileForData(input.data);
  const requiredKeys = input.requiredQuestionKeys ? new Set(input.requiredQuestionKeys) : undefined;
  const context = buildVisibilityContext({ answers: input.data, profile });
  const required = input.questions.filter((question) => isQuestionRequired(question, requiredKeys) && isQuestionVisible(question, context));
  const missingQuestions = required.filter((question) => isQuestionMissing(question, context));
  const answered = required.length - missingQuestions.length;
  return {
    required: required.length,
    answered,
    missing: missingQuestions.length,
    pct: required.length === 0 ? 0 : Math.round((answered / required.length) * 100),
    missingRequiredFields: missingQuestions.map((question) => question.key)
  };
}

export function calculateInterviewProgress(input: {
  data: StructuredProjectData;
  template?: SectorTemplate;
  currentBlockId?: string;
  locale?: Locale;
}): InterviewProgressSummary {
  const data = input.data;
  const template = input.template ?? resolveTemplateForData(data);
  const profile = profileForData(data);
  const locale = input.locale ?? data.userLanguage ?? "ru";
  const requiredKeys = new Set(buildInterviewRequiredKeys(template, data));
  const qualityWarnings = detectInterviewDataQualityWarnings(data);
  const completed = new Set(data.completedBlockIds ?? []);
  const currentBlockId = input.currentBlockId ?? data.interviewCursorBlockId;
  let currentIndex = template.interviewBlocks.findIndex((block) => block.id === currentBlockId);
  if (currentIndex < 0) {
    currentIndex = template.interviewBlocks.findIndex((block) => !completed.has(block.id));
  }

  let projectBlockDenominator = 0;
  let projectBlockPctTotal = 0;
  let totalRequiredQuestions = 0;
  let totalAnsweredQuestions = 0;
  let totalMissingQuestions = 0;

  const blocks = template.interviewBlocks.map((block, index) => {
    const context = buildVisibilityContext({ answers: data, profile });
    const visibleQuestions = block.questions.filter((question) => isQuestionVisible(question, context));
    const requiredQuestions = visibleRequiredQuestions({ block, data, profile, requiredKeys });
    const missingQuestions = requiredQuestions.filter((question) => isQuestionMissing(question, context));
    const answered = requiredQuestions.length - missingQuestions.length;
    const blockWarnings = qualityWarnings.filter((warning) => warning.blockId === block.id);
    const blockingBlockWarnings = blockWarnings.filter((warning) => warning.severity === "high");
    const anyAnswer = hasAnyAnswer(block, data, profile);
    const isLocked = currentIndex >= 0 && index > currentIndex && !completed.has(block.id);
    const isApplicable = visibleQuestions.length > 0;
    const rawPct = requiredQuestions.length === 0
      ? (isApplicable && anyAnswer ? 100 : 0)
      : Math.round((answered / requiredQuestions.length) * 100);

    let status: BlockProgressStatus;
    if (!isApplicable) status = "not_applicable";
    else if (isLocked) status = "locked";
    else if (blockingBlockWarnings.length > 0) status = "has_warnings";
    else if (reviewStatusForBlock(data, block.id)) status = "needs_review";
    else if (requiredQuestions.length === 0 && !anyAnswer) status = "not_started";
    else if (missingQuestions.length > 0) status = anyAnswer || completed.has(block.id) ? "in_progress" : "not_started";
    else status = "filled";

    const pct = status === "locked" || status === "not_applicable" ? 0 : cappedPct(rawPct, blockingBlockWarnings);
    if (status !== "not_applicable") {
      projectBlockDenominator += 1;
      projectBlockPctTotal += pct;
      totalRequiredQuestions += requiredQuestions.length;
      totalAnsweredQuestions += answered;
      totalMissingQuestions += missingQuestions.length;
    }
    return {
      blockId: block.id,
      name: block.name,
      step: index + 1,
      totalSteps: template.interviewBlocks.length,
      required: requiredQuestions.length,
      answered,
      missing: missingQuestions.length,
      pct,
      rawPct,
      status,
      label: statusLabel(status, locale),
      missingRequiredFields: missingQuestions.map((question) => question.key),
      warnings: blockWarnings
    } satisfies BlockProgressMetric;
  });

  const projectRequired = totalRequiredQuestions;
  const projectAnswered = totalAnsweredQuestions;
  const projectMissing = totalMissingQuestions;
  const projectPct = projectBlockDenominator === 0 ? 0 : Math.round(projectBlockPctTotal / projectBlockDenominator);
  const currentBlock = blocks.find((block) => block.blockId === currentBlockId) ?? (currentIndex >= 0 ? blocks[currentIndex] : undefined);
  const dataQualityStatus = qualityWarnings.some((warning) => warning.severity === "high")
    ? "has_warnings"
    : qualityWarnings.length > 0
      ? "needs_review"
      : "ok";

  return {
    project: { required: projectRequired, answered: projectAnswered, missing: projectMissing, pct: projectPct },
    currentBlock,
    blocks,
    dataQualityStatus
  };
}
