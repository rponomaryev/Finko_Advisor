import { NextResponse } from "next/server";
import { getStableQuestionsWithAI } from "@/lib/services/interviewAIService";
import { getProjectForSession, mergeStructuredData, toStructuredProjectData, updateProject } from "@/lib/services/projectService";
import { isAuthResponse, requireUserSession } from "@/lib/server/auth";
import { assertCsrf, enforceRateLimit } from "@/lib/server/security";

export async function POST(request: Request) {
  const session = requireUserSession(request);
  if (isAuthResponse(session)) return session;

  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const body = await request.json().catch(() => null);
  const projectId = typeof body?.projectId === "string" ? body.projectId : "";
  if (!projectId) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const limited = enforceRateLimit(request, "ai", session, projectId);
  if (limited) return limited;

  const project = await getProjectForSession(projectId, session);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const baseProfile = toStructuredProjectData(project as unknown as Record<string, unknown>);
  const currentAnswers = body.currentAnswers && typeof body.currentAnswers === "object" && !Array.isArray(body.currentAnswers)
    ? body.currentAnswers as Record<string, unknown>
    : {};
  const profile = mergeStructuredData(baseProfile, currentAnswers);
  const requestedBlockId = typeof body.blockId === "string" ? body.blockId : undefined;
  const stable = await getStableQuestionsWithAI(profile, requestedBlockId);

  if (stable.planPatch) {
    await updateProject(projectId, stable.planPatch as Record<string, unknown>);
  }

  return NextResponse.json(stable.response);
}
