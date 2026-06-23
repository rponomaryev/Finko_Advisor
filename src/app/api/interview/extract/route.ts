import { NextResponse } from "next/server";
import { extractStructuredFields } from "@/lib/ai/aiService";
import { classifyBusiness } from "@/lib/business/businessClassifier";
import { generateInterviewTransitionMessage } from "@/lib/ai/interviewTransitionGenerator";
import { prisma } from "@/lib/db/prisma";
import {
  getNextInterviewCursor,
  getPersistedInterviewPlanBlock,
  getStableQuestions,
  mapAnswerToProjectField,
  validateRequiredVisibleFields
} from "@/lib/services/interviewService";
import {
  getProjectForSession,
  mergeStructuredData,
  saveAnswer,
  toStructuredProjectData,
  updateProject
} from "@/lib/services/projectService";
import { findTemplateQuestion, resolveTemplateFromProject } from "@/lib/services/templateService";
import { isAuthResponse, requireUserSession } from "@/lib/server/auth";
import { abuseLog, assertCsrf, checkDailyAIQuota, containsPromptInjection, enforceRateLimit } from "@/lib/server/security";
import { safeProjectDetailDto } from "@/lib/server/dto";
import { answerSchema } from "@/lib/validation/projectSchemas";
import { isExchangeRateUnavailableError } from "@/lib/services/exchangeRateService";
import type { InterviewQuestion, StructuredProjectData } from "@/lib/types/project";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeExtractionPatch(aiFields: StructuredProjectData, directPatch: Partial<StructuredProjectData>): StructuredProjectData {
  const next: StructuredProjectData = { ...aiFields };
  for (const [key, value] of Object.entries(directPatch)) {
    if (value === undefined) continue;
    if (isPlainObject(value) && isPlainObject((next as Record<string, unknown>)[key])) {
      (next as Record<string, unknown>)[key] = {
        ...((next as Record<string, unknown>)[key] as Record<string, unknown>),
        ...value
      };
    } else {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}

function serializeSavedAnswer(answer: unknown) {
  if (Array.isArray(answer)) return answer.join(", ");
  if (answer && typeof answer === "object") return JSON.stringify(answer);
  return String(answer);
}

function normalizeSubmittedAnswerType(value: unknown): InterviewQuestion["type"] {
  return value === "number" || value === "select" || value === "multiselect" || value === "boolean" || value === "staffPlan" || value === "textarea"
    ? value
    : "text";
}

function fallbackSubmittedQuestion(answer: { key: string; question: string; answerType?: string }): Pick<InterviewQuestion, "key" | "type"> {
  return {
    key: answer.key,
    type: normalizeSubmittedAnswerType(answer.answerType)
  };
}


function normalizeSignaturePart(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, " ") : "";
}

function businessProfileSignature(data: StructuredProjectData) {
  const profile = classifyBusiness({
    businessType: data.businessType,
    businessIdea: data.businessIdea,
    region: data.region,
    language: data.userLanguage,
    answers: data
  });
  return [
    profile.category,
    profile.subcategory ?? "",
    profile.operationalModel ?? "",
    normalizeSignaturePart(data.businessType),
    normalizeSignaturePart(data.businessIdea)
  ].join("|");
}

function downstreamReviewStatuses(input: {
  before: StructuredProjectData;
  after: StructuredProjectData;
  blockId?: string;
  completedBlockIds: string[];
  template: ReturnType<typeof resolveTemplateFromProject>;
}) {
  if (!input.blockId) return input.after.blockReviewStatuses ?? [];
  if (businessProfileSignature(input.before) === businessProfileSignature(input.after)) return input.after.blockReviewStatuses ?? [];
  const changedIndex = input.template.interviewBlocks.findIndex((block) => block.id === input.blockId);
  if (changedIndex < 0) return input.after.blockReviewStatuses ?? [];
  const existing = new Map((input.after.blockReviewStatuses ?? []).map((item) => [item.blockId, item] as const));
  const completed = new Set(input.completedBlockIds);
  for (const block of input.template.interviewBlocks.slice(changedIndex + 1)) {
    if (!completed.has(block.id)) continue;
    existing.set(block.id, {
      blockId: block.id,
      status: "needs_review",
      reason: "Изменился профиль или формат бизнеса, часть вопросов могла стать нерелевантной."
    });
  }
  return Array.from(existing.values());
}


const sectionNoteKeyByBlock: Record<string, keyof NonNullable<StructuredProjectData["sectionNotes"]>> = {
  business_idea: "businessIdea",
  location: "premisesInfrastructure",
  equipment_launch: "equipment",
  operations: "productionCapacity",
  suppliers_procurement: "rawMaterials",
  sales: "salesMarketing",
  financing: "finance",
  documents_experience: "complianceExperience"
};

function isStructuredAnswersOnlyMessage(message: string | undefined): boolean {
  return String(message ?? "").trim() === "__structured_answers_only__";
}

function freeTextNotePatch(blockId: string | undefined, message: string | undefined): Partial<StructuredProjectData> {
  const noteKey = blockId ? sectionNoteKeyByBlock[blockId] : undefined;
  const text = typeof message === "string" ? message.trim() : "";
  if (!noteKey || !text || isStructuredAnswersOnlyMessage(message)) return {};
  return { sectionNotes: { [noteKey]: text } } as Partial<StructuredProjectData>;
}


function shouldInvalidateGeneratedArtifacts(answerData: { answers?: unknown[]; message: string }) {
  return Boolean((answerData.answers?.length ?? 0) > 0 || (answerData.message.trim().length > 0 && !isStructuredAnswersOnlyMessage(answerData.message)));
}

async function invalidateGeneratedArtifacts(projectId: string) {
  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: "draft",
      financialResult: null,
      riskResult: null,
      feasibilityScore: null,
      bankReadinessScore: null,
      reportData: null,
      aiReportData: null,
      webResearchData: null
    } as never
  });
}

function exchangeRateErrorResponse(error: unknown) {
  if (!isExchangeRateUnavailableError(error)) return null;
  console.error("[interview] CBU USD/UZS rate unavailable", { message: error.message });
  return NextResponse.json(
    { error: "Official CBU USD/UZS exchange rate is temporarily unavailable. Please try again later." },
    { status: 503 }
  );
}

async function handlePost(request: Request) {
  const session = requireUserSession(request);
  if (isAuthResponse(session)) return session;

  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const body = await request.json().catch(() => null);
  const parsed = answerSchema.extend({ projectId: answerSchema.shape.projectId.unwrap() }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid interview answer" }, { status: 400 });
  }

  const answerData = parsed.data;

  const limited = enforceRateLimit(request, "ai", session, answerData.projectId);
  if (limited) return limited;

  const dailyQuota = checkDailyAIQuota({ request, session, projectId: answerData.projectId });
  if (dailyQuota) return dailyQuota;

  if (containsPromptInjection(answerData.message)) {
    abuseLog({ route: "/api/interview/extract", event: "prompt_injection_pattern", actor: session.demoUserId });
  }

  const project = await getProjectForSession(answerData.projectId, session);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const currentProfile = toStructuredProjectData(project as unknown as Record<string, unknown>);
  const template = resolveTemplateFromProject(project as unknown as Record<string, unknown>);
  const persistedBlock = answerData.blockId ? getPersistedInterviewPlanBlock(currentProfile, answerData.blockId) : undefined;
  const directPatch: Partial<StructuredProjectData> = {};
  const answersToSave: Array<{
    questionKey: string;
    question: string;
    answer: string;
    answerType?: string;
  }> = [];

  for (const answer of answerData.answers ?? []) {
    // The UI can render a stable persisted question set while the dynamic template
    // evolves after classification. Accept questions from both sources. If the key
    // is syntactically valid but no longer appears in the regenerated template,
    // still save it into structuredData instead of blocking the whole section.
    const question = findTemplateQuestion(template, answer.key)
      ?? persistedBlock?.questions.find((item) => item.key === answer.key)
      ?? fallbackSubmittedQuestion(answer);
    const mappedPatch = mapAnswerToProjectField(question, answer.answer) as Record<string, unknown>;
    Object.assign(directPatch, mergeStructuredData(directPatch as Record<string, unknown>, mappedPatch));
    answersToSave.push({
      questionKey: answer.key,
      question: answer.question,
      answer: serializeSavedAnswer(answer.answer),
      answerType: answer.answerType
    });
  }
  Object.assign(directPatch, mergeStructuredData(directPatch as Record<string, unknown>, freeTextNotePatch(answerData.blockId, answerData.message) as Record<string, unknown>));

  const freeText = answerData.message.trim();

  async function saveCollectedAnswers() {
    for (const answer of answersToSave) {
      await saveAnswer({
        projectId: answerData.projectId,
        ...answer
      });
    }

    if (!freeText || isStructuredAnswersOnlyMessage(freeText)) return;
    await saveAnswer({
      projectId: answerData.projectId,
      questionKey: `free_text_${Date.now()}`,
      question: "Свободный ответ предпринимателя",
      answer: freeText,
      answerType: "textarea"
    });
  }

  const knownData = mergeStructuredData(currentProfile, directPatch as Record<string, unknown>);

  if (answerData.advance !== false) {
    const validation = validateRequiredVisibleFields(knownData, answerData.blockId, { templateData: currentProfile });
    if (!validation.valid) {
      return NextResponse.json(
        {
          ok: false,
          error: "Required fields are missing",
          errorCode: validation.errorCode ?? "VALIDATION_FAILED",
          blockId: answerData.blockId,
          invalidFields: validation.invalidFields ?? validation.missingFields.map((field) => ({ field, reason: "required", visible: true })),
          hiddenRequiredFieldsIgnored: validation.hiddenRequiredFieldsIgnored ?? [],
          missingRequiredFields: validation.missingFields,
          missingFields: validation.missingFields
        },
        { status: 400 }
      );
    }
  }

  if (answerData.autoSave) {
    await saveCollectedAnswers();
    try {
      await updateProject(answerData.projectId, directPatch as Record<string, unknown>);
      if (shouldInvalidateGeneratedArtifacts(answerData)) await invalidateGeneratedArtifacts(answerData.projectId);
    } catch (error) {
      const response = exchangeRateErrorResponse(error);
      if (response) return response;
      throw error;
    }
    const updated = await getProjectForSession(answerData.projectId, session);
    return NextResponse.json({
      mode: project.aiMode ?? "fallback",
      extractedFields: directPatch,
      missingFields: [],
      nextQuestions: [],
      advisorMessage: null,
      project: updated ? safeProjectDetailDto(updated as never) : null
    });
  }

  await saveCollectedAnswers();

  const ai = await extractStructuredFields({
    message: isStructuredAnswersOnlyMessage(answerData.message) ? "" : answerData.message,
    knownData,
    projectId: answerData.projectId,
    userId: session.demoUserId,
    operation: "interview_extract"
  });
  const mergedPatch = mergeExtractionPatch(ai.extractedFields, directPatch);
  const projectedProfile = mergeStructuredData(currentProfile, mergedPatch as Record<string, unknown>);
  let nextCursor: string | undefined;

  if (answerData.advance !== false) {
    const completedBlockIds = answerData.blockId
      ? Array.from(new Set([...(projectedProfile.completedBlockIds ?? []), answerData.blockId]))
      : projectedProfile.completedBlockIds ?? [];
    const profileForCursor = { ...projectedProfile, completedBlockIds };
    nextCursor = getNextInterviewCursor(profileForCursor, answerData.blockId);
    mergedPatch.completedBlockIds = completedBlockIds;
    mergedPatch.blockReviewStatuses = downstreamReviewStatuses({
      before: currentProfile,
      after: projectedProfile,
      blockId: answerData.blockId,
      completedBlockIds,
      template
    });
    if (nextCursor) mergedPatch.interviewCursorBlockId = nextCursor;
  }

  let nextBlockState = null as ReturnType<typeof getStableQuestions>["response"] | null;
  if (answerData.advance !== false && nextCursor) {
    const profileForNextBlock = mergeStructuredData(projectedProfile, mergedPatch as Record<string, unknown>);
    const stableNextBlock = getStableQuestions(profileForNextBlock, nextCursor);
    nextBlockState = stableNextBlock.response;
    if (stableNextBlock.planPatch) {
      const mergedWithPlan = mergeStructuredData(mergedPatch, stableNextBlock.planPatch as Record<string, unknown>);
      Object.assign(mergedPatch, mergedWithPlan);
    }
  }

  try {
    await updateProject(answerData.projectId, mergedPatch);
    if (shouldInvalidateGeneratedArtifacts(answerData)) await invalidateGeneratedArtifacts(answerData.projectId);
  } catch (error) {
    const response = exchangeRateErrorResponse(error);
    if (response) return response;
    throw error;
  }

  const updated = await prisma.project.update({
    where: { id: answerData.projectId },
    data: {
      aiMode: ai.mode,
      aiExtraction: ai as never
    },
    include: { answers: { orderBy: { createdAt: "asc" } } }
  });

  const updatedProfile = toStructuredProjectData(updated as unknown as Record<string, unknown>);

  return NextResponse.json({
    mode: ai.mode,
    extractedFields: mergedPatch,
    missingFields: ai.missingFields,
    nextQuestions: ai.nextQuestions,
    currentBlockId: answerData.blockId,
    nextBlockId: nextCursor ?? null,
    nextBlockState,
    isInterviewComplete: answerData.advance !== false && !nextCursor,
    advisorMessage: generateInterviewTransitionMessage({
      locale: updatedProfile.userLanguage,
      businessType: updatedProfile.businessType,
      previousBlock: answerData.blockId,
      nextBlock: nextBlockState ? {
        id: nextBlockState.blockId,
        name: nextBlockState.block,
        description: nextBlockState.blockDescription
      } : undefined,
      structuredData: updatedProfile
    }),
    project: safeProjectDetailDto(updated as never)
  });
}

export async function POST(request: Request) {
  try {
    return await handlePost(request);
  } catch (error) {
    const exchangeRateResponse = exchangeRateErrorResponse(error);
    if (exchangeRateResponse) return exchangeRateResponse;
    console.error("[interview/extract] failed to save interview block", error);
    return NextResponse.json(
      {
        ok: false,
        errorCode: "SAVE_FAILED",
        error: "Failed to save interview block",
        details: process.env.NODE_ENV === "development"
          ? error instanceof Error ? error.message : String(error)
          : undefined
      },
      { status: 500 }
    );
  }
}
