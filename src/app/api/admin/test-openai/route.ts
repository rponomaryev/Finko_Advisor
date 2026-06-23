import { NextResponse } from "next/server";
import { callOpenAIWithUsageLog } from "@/lib/ai/openaiClient";
import { isAuthResponse, requireAdminSession } from "@/lib/server/auth";
import { assertCsrf, enforceRateLimit } from "@/lib/server/security";

function responseText(response: unknown) {
  return (response as { output_text?: string }).output_text ?? "";
}

export async function POST(request: Request) {
  const session = requireAdminSession(request);
  if (isAuthResponse(session)) return session;

  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const limited = enforceRateLimit(request, "ai", session, "admin-test-openai");
  if (limited) return limited;

  try {
    const response = await callOpenAIWithUsageLog({
      userId: session.demoUserId,
      operation: "admin_test_openai",
      model: process.env.OPENAI_TEST_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
      request: (client) => client.responses.create({
        model: process.env.OPENAI_TEST_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
        max_output_tokens: 40,
        input: [
          { role: "system", content: "Return a short health check sentence." },
          { role: "user", content: "FINKO OpenAI billing sanity test. Reply with ok." }
        ]
      } as never)
    });

    const usage = (response as { usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number } }).usage ?? {};
    return NextResponse.json({
      ok: true,
      provider: "openai",
      model: (response as { model?: string }).model ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      responseId: (response as { id?: string }).id,
      inputTokens: usage.input_tokens ?? null,
      outputTokens: usage.output_tokens ?? null,
      totalTokens: usage.total_tokens ?? null,
      outputText: responseText(response)
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      provider: process.env.AI_PROVIDER || "fallback",
      model: process.env.OPENAI_TEST_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
