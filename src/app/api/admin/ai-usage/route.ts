import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAuthResponse, requireAdminSession } from "@/lib/server/auth";

function usageModel() {
  return (prisma as any).aIUsageLog ?? (prisma as any).aiUsageLog ?? null;
}

export async function GET(request: Request) {
  const session = requireAdminSession(request);
  if (isAuthResponse(session)) return session;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") || undefined;
  const model = usageModel();
  if (!model?.findMany) {
    return NextResponse.json({ projectId, calls: [], warning: "AIUsageLog Prisma model is unavailable. Run prisma migrate and prisma generate." });
  }

  const calls = await model.findMany({
    where: projectId ? { projectId } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      operation: true,
      provider: true,
      model: true,
      responseId: true,
      inputTokens: true,
      outputTokens: true,
      totalTokens: true,
      status: true,
      fallbackUsed: true,
      errorMessage: true,
      durationMs: true,
      webSearchUsed: true,
      webSearchCalls: true,
      createdAt: true
    }
  });

  return NextResponse.json({ projectId, calls });
}
