import { callOpenAIWithUsageLog } from "../ai/openaiClient.ts";
import {
  buildAIClassificationPrompt,
  classifierCacheKey,
  classifyBusiness,
  inferLowConfidenceProfile,
  profileFromAIResponse,
  type AIClassifierResponse,
  type BusinessProfile,
  type ClassifierInput
} from "./businessClassifier.ts";

const aiClassificationCache = new Map<string, BusinessProfile>();

export function clearAIClassificationCache() {
  aiClassificationCache.clear();
}

function aiResponseText(response: unknown): string {
  const direct = (response as { output_text?: string }).output_text;
  if (typeof direct === "string") return direct;
  const output = (response as { output?: Array<{ content?: Array<{ text?: string; type?: string }> }> }).output;
  const text = output?.flatMap((item) => item.content ?? []).map((item) => item.text).find((value) => typeof value === "string");
  return text ?? "{}";
}

function safeJsonObject(value: string): AIClassifierResponse {
  const trimmed = value.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  return JSON.parse(trimmed) as AIClassifierResponse;
}

export async function classifyBusinessWithAI(input: ClassifierInput): Promise<BusinessProfile> {
  const cacheKey = classifierCacheKey(input);
  const cached = aiClassificationCache.get(cacheKey);
  if (cached) return cached;

  const keywordProfile = classifyBusiness(input);
  if (keywordProfile.confidence >= 0.7 && keywordProfile.category !== "generic") {
    aiClassificationCache.set(cacheKey, keywordProfile);
    return keywordProfile;
  }

  const inferredProfile = inferLowConfidenceProfile(input, keywordProfile);
  if (!process.env.OPENAI_API_KEY) {
    aiClassificationCache.set(cacheKey, inferredProfile);
    return inferredProfile;
  }

  try {
    const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
    const response = await callOpenAIWithUsageLog({
      operation: "business_classification",
      model,
      request: (client) => client.responses.create({
        model,
        max_output_tokens: 900,
        input: [
          { role: "system", content: `You classify Uzbekistan businesses. Return only valid JSON. All human-readable strings must follow the requested interface language: ${input.language ?? "ru"}.` },
          { role: "user", content: buildAIClassificationPrompt(input) }
        ]
      } as never)
    });
    const aiProfile = profileFromAIResponse(safeJsonObject(aiResponseText(response)), inferredProfile, input);
    aiClassificationCache.set(cacheKey, aiProfile);
    return aiProfile;
  } catch {
    aiClassificationCache.set(cacheKey, inferredProfile);
    return inferredProfile;
  }
}
