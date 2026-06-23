import { getMissingFields, fallbackToDeterministicFlow, getNextFallbackQuestions } from "./fallbackInterview";
import { buildInterviewPrompt, systemPrompt } from "./prompts";
import {
  aiExtractionStructuredOutputSchema,
  aiExtractionZodSchema,
  removeNullFields,
  type RawAiExtraction
} from "./schemas";
import type { AiExtractionResult, StructuredProjectData } from "../types/project";
import { classifyBusiness } from "../business/businessClassifier.ts";
import { callOpenAIWithUsageLog, writeAIUsageLog } from "./openaiClient.ts";
import { resolveTemplateForData } from "../services/templateService.ts";

const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const OPENAI_MAX_OUTPUT_TOKENS = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS ?? 4000);

const unsafeOutputPattern = /\b(system prompt|developer prompt|api key|environment variables|previous clients|ignore previous instructions|guaranteed profit|guaranteed approval)\b/i;

function hasUnsafeOutput(raw: RawAiExtraction): boolean {
  const text = [
    raw.advisorMessage,
    ...raw.nextQuestions.map((question) => question.question),
    JSON.stringify(raw.extractedFields ?? {})
  ].join("\n");
  return unsafeOutputPattern.test(text);
}

function safeAiLog(event: string, metadata?: Record<string, string | number | boolean | undefined>) {
  console.warn("[ai-safe-log]", {
    event,
    route: "aiService",
    timestamp: new Date().toISOString(),
    ...metadata
  });
}

export function detectMode(): "openai" | "fallback" {
  if (process.env.AI_PROVIDER === "openai" && process.env.OPENAI_API_KEY) {
    return "openai";
  }
  if (!process.env.AI_PROVIDER && process.env.OPENAI_API_KEY) {
    return "openai";
  }
  return "fallback";
}

export function validateAIOutput(raw: unknown): RawAiExtraction | null {
  const parsed = aiExtractionZodSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function callOpenAI(input: {
  message: string;
  knownData?: StructuredProjectData;
  projectId?: string;
  userId?: string;
  operation?: string;
}): Promise<RawAiExtraction> {
  const fallbackQuestions = getNextFallbackQuestions(input.knownData ?? {});

  const businessProfile = classifyBusiness({
    businessType: input.knownData?.businessType,
    businessIdea: input.knownData?.businessIdea,
    region: input.knownData?.region,
    language: input.knownData?.userLanguage,
    answers: input.knownData
  });

  const response = await callOpenAIWithUsageLog({
    projectId: input.projectId,
    userId: input.userId,
    operation: input.operation ?? "interview_extract",
    model: DEFAULT_OPENAI_MODEL,
    request: (client) => client.responses.create({
    model: DEFAULT_OPENAI_MODEL,
    max_output_tokens: OPENAI_MAX_OUTPUT_TOKENS,
    input: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: buildInterviewPrompt({
          blockName: fallbackQuestions.block,
          knownData: input.knownData ?? {},
          missingFields: getMissingFields(input.knownData ?? {}),
          questions: fallbackQuestions.questions,
          message: input.message,
          locale: input.knownData?.userLanguage ?? "ru",
          businessProfile
        })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "finko_ai_extraction",
        description: "Structured extraction for FINKO Business Advisor interview.",
        strict: true,
        schema: aiExtractionStructuredOutputSchema
      }
    }
  } as never)
  });

  const outputText = (response as { output_text?: string }).output_text;
  if (!outputText) {
    throw new Error("OpenAI response did not include output_text.");
  }

  const parsedJson = JSON.parse(outputText);
  const validated = validateAIOutput(parsedJson);
  if (!validated) {
    throw new Error("OpenAI structured output failed local validation.");
  }
  if (hasUnsafeOutput(validated)) {
    safeAiLog("unsafe_output_filtered", { model: DEFAULT_OPENAI_MODEL });
    throw new Error("OpenAI structured output failed safety validation.");
  }
  return validated;
}

export async function extractStructuredFields(input: {
  message: string;
  knownData?: StructuredProjectData;
  projectId?: string;
  userId?: string;
  operation?: string;
}): Promise<AiExtractionResult> {
  if (detectMode() === "openai") {
    try {
      const raw = await callOpenAI(input);
      const extractedFields = removeNullFields(raw.extractedFields) as StructuredProjectData;
      const projected = { ...(input.knownData ?? {}), ...extractedFields };
      const template = resolveTemplateForData(projected);
      const missingFields = getMissingFields(projected, template);

      return {
        mode: "openai",
        detectedSector: raw.detectedSector || template.code,
        confidence: raw.confidence,
        extractedFields,
        missingFields,
        nextQuestions: raw.nextQuestions.slice(0, 3).map((question: { key: string; question: string; type: string; unit?: string | null; options?: string[] | null }) => ({
          ...question,
          type: question.type as AiExtractionResult["nextQuestions"][number]["type"]
        })),
        advisorMessage: raw.advisorMessage
      };
    } catch (error) {
      safeAiLog("openai_fallback", { model: DEFAULT_OPENAI_MODEL });
      await writeAIUsageLog({
        projectId: input.projectId,
        userId: input.userId,
        operation: input.operation ?? "interview_extract",
        provider: "openai",
        model: DEFAULT_OPENAI_MODEL,
        status: "fallback",
        errorMessage: error instanceof Error ? error.message : String(error),
        fallbackUsed: true
      });
    }
  }

  return fallbackToDeterministicFlow(input);
}

export function generateAdvisorMessage(input: {
  mode: "openai" | "fallback";
  missingFields: string[];
  score?: number;
  locale?: "ru" | "uz" | "en";
}): string {
  const locale = input.locale ?? "ru";
  if (input.score !== undefined) {
    if (locale === "uz") return `Dastlabki baho tayyor: ${input.score}/100. Bu moliyalashtirish kafolati emas, tayyorgarlik uchun yo'nalishdir.`;
    if (locale === "en") return `Preliminary assessment is ready: ${input.score}/100. This is not a financing guarantee, only a preparation guide.`;
    return `Предварительная оценка готова: ${input.score}/100. Это не гарантия финансирования, а рабочий ориентир для подготовки.`;
  }

  if (input.missingFields.length === 0) {
    if (locale === "uz") return "Asosiy ma'lumotlar yig'ildi. Dastlabki moliyaviy model va risklarni hisoblash mumkin.";
    if (locale === "en") return "Key data has been collected. You can calculate the preliminary financial model and risks.";
    return "Ключевые данные собраны. Можно рассчитать предварительную финансовую модель и риски.";
  }

  if (locale === "uz") return "Ma'lumotlar saqlandi. Loyihani aniqlashtirishda davom etamiz.";
  if (locale === "en") return "Data saved. We will continue clarifying the project.";
  return "Данные сохранены. Продолжим уточнение проекта.";
}

export function fallbackInterview(input: {
  message: string;
  knownData?: StructuredProjectData;
}): AiExtractionResult {
  return fallbackToDeterministicFlow(input);
}
