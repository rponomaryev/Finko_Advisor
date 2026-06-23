import { existsSync } from "node:fs";
import { join } from "node:path";
import OpenAI from "openai";
import { prisma } from "../db/prisma.ts";
import { validateAIEnvironment } from "./env.ts";

type UsageLike = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

type OpenAIResponseLike = {
  id?: string;
  model?: string;
  usage?: UsageLike;
};

export type AIUsageMeta = {
  projectId?: string;
  userId?: string;
  operation: string;
  provider?: string;
  model?: string;
  webSearchUsed?: boolean;
  webSearchCalls?: number;
  fallbackUsed?: boolean;
};

function usageFrom(result: unknown) {
  const usage = (result as OpenAIResponseLike | undefined)?.usage;
  return {
    responseId: (result as OpenAIResponseLike | undefined)?.id,
    model: (result as OpenAIResponseLike | undefined)?.model,
    inputTokens: usage?.input_tokens ?? usage?.inputTokens,
    outputTokens: usage?.output_tokens ?? usage?.outputTokens,
    totalTokens: usage?.total_tokens ?? usage?.totalTokens
  };
}

function aiUsageLogModel() {
  return (prisma as any).aIUsageLog ?? (prisma as any).aiUsageLog ?? null;
}

let missingLocalPrismaEngineWarned = false;

function shouldSkipUsageLogBecauseLocalEngineMissing() {
  if (process.env.NODE_ENV === "production" || process.platform !== "linux") return false;
  if (process.env.PRISMA_QUERY_ENGINE_BINARY) return false;
  const expectedEngines = [
    join(process.cwd(), "node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node"),
    join(process.cwd(), "node_modules/.prisma/client/query_engine-debian-openssl-3.0.x")
  ];
  return !expectedEngines.some((candidate) => existsSync(candidate));
}

export async function writeAIUsageLog(input: AIUsageMeta & {
  status: "success" | "error" | "fallback";
  responseId?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  errorMessage?: string;
  durationMs?: number;
}) {
  if (shouldSkipUsageLogBecauseLocalEngineMissing()) {
    if (!missingLocalPrismaEngineWarned) {
      console.warn("[ai-usage-log] Skipping local usage log because Prisma query engine for this platform is not generated.");
      missingLocalPrismaEngineWarned = true;
    }
    return;
  }

  const model = aiUsageLogModel();
  if (!model?.create) {
    console.warn("[ai-usage-log] Prisma model AIUsageLog is unavailable. Run prisma generate/migrate.");
    return;
  }

  try {
    await model.create({
      data: {
        projectId: input.projectId ?? null,
        userId: input.userId ?? null,
        operation: input.operation,
        provider: input.provider ?? validateAIEnvironment().provider,
        model: input.model ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        responseId: input.responseId ?? null,
        inputTokens: input.inputTokens ?? null,
        outputTokens: input.outputTokens ?? null,
        totalTokens: input.totalTokens ?? null,
        webSearchUsed: Boolean(input.webSearchUsed),
        webSearchCalls: input.webSearchCalls ?? null,
        status: input.status,
        errorMessage: input.errorMessage ? String(input.errorMessage).slice(0, 2000) : null,
        fallbackUsed: Boolean(input.fallbackUsed || input.status === "fallback"),
        durationMs: input.durationMs ?? null
      }
    });
  } catch (error) {
    console.warn("[ai-usage-log] Could not write usage log", error);
  }
}

export async function callOpenAIWithUsageLog<T>(input: AIUsageMeta & {
  request: (client: OpenAI) => Promise<T>;
}): Promise<T> {
  const started = Date.now();
  const env = validateAIEnvironment();
  const provider = input.provider ?? env.provider;
  const model = input.model ?? env.model;

  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    const error = new Error("AI_PROVIDER=openai, but OPENAI_API_KEY is missing.");
    await writeAIUsageLog({
      ...input,
      provider,
      model,
      status: "error",
      errorMessage: error.message,
      durationMs: Date.now() - started,
      fallbackUsed: true
    });
    throw error;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const result = await input.request(client);
    const usage = usageFrom(result);
    await writeAIUsageLog({
      ...input,
      provider,
      model: usage.model ?? model,
      status: "success",
      responseId: usage.responseId,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      durationMs: Date.now() - started
    });
    return result;
  } catch (error) {
    await writeAIUsageLog({
      ...input,
      provider,
      model,
      status: "error",
      errorMessage: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - started,
      fallbackUsed: input.fallbackUsed
    });
    throw error;
  }
}
