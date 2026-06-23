import { NextResponse } from "next/server";
import { extractStructuredFields } from "@/lib/ai/aiService";
import { prisma } from "@/lib/db/prisma";
import { safeProjectDetailDto, safeProjectListDto } from "@/lib/server/dto";
import { isAuthResponse, requireUserSession } from "@/lib/server/auth";
import { assertCsrf, checkDailyAIQuota, enforceRateLimit, safeJsonError } from "@/lib/server/security";
import { createProjectSchema } from "@/lib/validation/projectSchemas";
import { createProject } from "@/lib/services/projectService";

export async function GET(request: Request) {
  const session = requireUserSession(request);
  if (isAuthResponse(session)) return session;

  const projects = await prisma.project.findMany({
    where: { userId: session.demoUserId },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return NextResponse.json({ projects: projects.map((project: Record<string, unknown>) => safeProjectListDto(project as never)) });
}

export async function POST(request: Request) {
  const session = requireUserSession(request);
  if (isAuthResponse(session)) return session;

  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const limited = enforceRateLimit(request, "projectCreate", session);
  if (limited) return limited;

  const dailyQuota = checkDailyAIQuota({ request, session, projectId: "project-create" });
  if (dailyQuota) return dailyQuota;

  const body = await request.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid project data" }, { status: 400 });
  }

  try {
    const ai = await extractStructuredFields({
      message: `${parsed.data.businessType}\n${parsed.data.businessIdea}`,
      knownData: {
        businessType: parsed.data.businessType,
        region: parsed.data.region,
        district: parsed.data.district,
        plannedStartPeriod: parsed.data.plannedStartPeriod,
        businessIdea: parsed.data.businessIdea,
        userLanguage: parsed.data.userLanguage ?? "ru"
      }
    });

    const project = await createProject({
      session,
      ...parsed.data,
      consentLocale: parsed.data.consentLocale ?? parsed.data.userLanguage ?? "ru",
      aiMode: ai.mode,
      extractedFields: ai.extractedFields,
      aiExtraction: ai
    });

    return NextResponse.json({
      projectId: project.id,
      mode: ai.mode,
      advisorMessage: ai.advisorMessage,
      project: safeProjectDetailDto(project as never)
    });
  } catch (error) {
    console.error("[project-create]", error);
    const details = error instanceof Error ? error.message : String(error);
    return safeJsonError(
      process.env.NODE_ENV === "production" ? "Could not create the project" : `Could not create the project: ${details}`,
      500
    );
  }
}
