import { legacyBusinessProfile } from "../business/businessClassifier.ts";
import { classifyBusinessWithAI } from "../business/aiBusinessClassifier.ts";
import { buildDynamicInterviewTemplate } from "../interview/dynamicInterviewEngine.ts";
import type { DynamicBusinessTemplate } from "../types/sector.ts";

export async function generateBusinessTemplate(input: {
  businessType: string;
  businessIdea?: string;
  region?: string;
  language?: "ru" | "uz" | "en";
  answers?: Record<string, unknown>;
}): Promise<DynamicBusinessTemplate> {
  const profile = await classifyBusinessWithAI({
    businessType: input.businessType,
    businessIdea: input.businessIdea,
    region: input.region,
    language: input.language,
    answers: input.answers as never
  });
  return buildDynamicInterviewTemplate({
    businessType: input.businessType || input.businessIdea || "Универсальный бизнес",
    businessIdea: input.businessIdea,
    region: input.region,
    userLanguage: input.language,
    ...(input.answers ?? {}),
    businessProfile: legacyBusinessProfile(profile)
  } as Record<string, unknown>);
}
