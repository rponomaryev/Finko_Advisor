import { approvedInterviewBlocks, classifyBusiness, type BusinessProfile } from "../business/businessClassifier.ts";
import { generateAIAdditionalInterviewQuestions } from "../interview/aiAdditionalQuestions.ts";
import { getPersistedInterviewPlanBlock, getStableQuestions } from "./interviewService.ts";
import type { InterviewPlanBlock, InterviewQuestion, StructuredProjectData } from "../types/project.ts";

type StableQuestionSet = ReturnType<typeof getStableQuestions>;
type ApprovedBlockId = typeof approvedInterviewBlocks[number];

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

function isUnknownBusinessFallback(profile: BusinessProfile) {
  const withAudit = profile as BusinessProfile & { classificationAudit?: { fallbackUsed?: unknown } };
  const audit = withAudit.classificationAudit;
  const aiClassification = profile.aiClassification as { fallbackUsed?: unknown; sampleId?: unknown } | undefined;
  return (audit?.fallbackUsed === true || aiClassification?.fallbackUsed === true || profile._requiresAIClassification === true) && !aiClassification?.sampleId;
}

function hasGeneratedUnknownFallbackQuestions(data: StructuredProjectData) {
  if (!isCurrentInterviewPlan(data)) return false;
  return Object.values(data.interviewPlan?.blocks ?? {}).some((block) =>
    block.questions?.some((question) =>
      question.source === "fallback_ai" ||
      question.source === "fallback_template" ||
      question.capabilityTags?.some((tag) => tag === "unknown_business_ai_fallback" || tag === "unknown_business_fallback_template")
    )
  );
}

function isApprovedBlockId(value: unknown): value is ApprovedBlockId {
  return typeof value === "string" && (approvedInterviewBlocks as readonly string[]).includes(value);
}

function dedupeQuestions(questions: InterviewQuestion[]) {
  const seen = new Set<string>();
  const result: InterviewQuestion[] = [];
  for (const question of questions) {
    if (seen.has(question.key)) continue;
    seen.add(question.key);
    result.push(question);
  }
  return result;
}

function groupQuestionsByApprovedBlock(questions: InterviewQuestion[]) {
  const grouped = new Map<ApprovedBlockId, InterviewQuestion[]>();
  for (const question of questions) {
    if (!isApprovedBlockId(question.blockId)) continue;
    const blockId = question.blockId;
    grouped.set(blockId, [...(grouped.get(blockId) ?? []), { ...question, blockId }]);
  }
  return grouped;
}

function buildAIPlanBlock(
  data: StructuredProjectData,
  blockId: ApprovedBlockId,
  questions: InterviewQuestion[],
  generatedAt: string
): InterviewPlanBlock {
  const existingBlock = getPersistedInterviewPlanBlock(data, blockId);
  const mergedQuestions = dedupeQuestions([...(existingBlock?.questions ?? []), ...questions]);
  const existingRequired = existingBlock?.requiredQuestionKeys ?? [];
  const existingOptional = existingBlock?.optionalQuestionKeys ?? [];
  const optionalQuestionKeys = Array.from(new Set([
    ...existingOptional,
    ...questions.filter((question) => question.optional !== false && question.required !== true).map((question) => question.key)
  ]));
  const requiredQuestionKeys = Array.from(new Set([
    ...existingRequired,
    ...questions.filter((question) => question.required === true || question.optional === false).map((question) => question.key)
  ]));

  return {
    blockId,
    generatedBy: "ai",
    generatedAt: existingBlock?.generatedAt ?? generatedAt,
    questions: mergedQuestions,
    requiredQuestionKeys,
    optionalQuestionKeys
  };
}

function mergeUnknownFallbackQuestionsIntoStable(
  stable: StableQuestionSet,
  data: StructuredProjectData,
  aiQuestions: InterviewQuestion[]
): StableQuestionSet {
  const grouped = groupQuestionsByApprovedBlock(aiQuestions);
  if (grouped.size === 0) return stable;

  const currentBlockId = stable.response.blockId;
  const currentAdditions = isApprovedBlockId(currentBlockId) ? grouped.get(currentBlockId) ?? [] : [];
  const mergedCurrentQuestions = currentAdditions.length
    ? dedupeQuestions([...stable.response.questions, ...currentAdditions])
    : stable.response.questions;

  const stablePlan = stable.planPatch?.interviewPlan;
  const currentPlan = isCurrentInterviewPlan(data) ? data.interviewPlan : undefined;
  const previousBlocks = currentPlan?.blocks ?? stablePlan?.blocks ?? {};
  const profileSignature = getBusinessProfileSignature(data);
  const generatedAt = currentPlan?.generatedAt ?? stablePlan?.generatedAt ?? new Date().toISOString();
  const patchedBlocks: Record<string, InterviewPlanBlock> = { ...previousBlocks };

  for (const [blockId, questions] of grouped.entries()) {
    patchedBlocks[blockId] = buildAIPlanBlock(data, blockId, questions, generatedAt);
  }

  return {
    response: {
      ...stable.response,
      questions: mergedCurrentQuestions,
      isInterviewComplete: stable.response.missingFields.length === 0 && stable.response.nextBlockId === null
    },
    planPatch: {
      interviewPlan: {
        version: "1.0",
        generatedAt,
        templateSignature: profileSignature.signature,
        businessCategory: profileSignature.category,
        businessSubcategory: profileSignature.subcategory,
        operationalModel: profileSignature.operationalModel,
        blocks: patchedBlocks
      }
    }
  };
}

export async function getStableQuestionsWithAI(
  data: StructuredProjectData,
  blockId?: string
): Promise<StableQuestionSet> {
  const stable = getStableQuestions(data, blockId);
  const profile = getResolvedBusinessProfile(data);
  if (!isUnknownBusinessFallback(profile)) return stable;
  if (hasGeneratedUnknownFallbackQuestions(data)) return stable;

  const aiQuestions = await generateAIAdditionalInterviewQuestions({
    businessType: data.businessType ?? "Универсальный бизнес",
    businessIdea: data.businessIdea,
    locale: data.userLanguage ?? "ru",
    profile
  });
  if (!aiQuestions.length) return stable;

  return mergeUnknownFallbackQuestionsIntoStable(stable, data, aiQuestions);
}
