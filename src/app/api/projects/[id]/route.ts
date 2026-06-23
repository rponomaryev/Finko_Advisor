import { NextResponse } from "next/server";
import { deleteProjectForSession, getProjectForSession, updateProjectForSession } from "@/lib/services/projectService";
import { safeProjectDetailDto } from "@/lib/server/dto";
import { isAuthResponse, requireUserSession } from "@/lib/server/auth";
import { assertCsrf, abuseLog } from "@/lib/server/security";
import { updateProjectSchema } from "@/lib/validation/projectSchemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function notFoundResponse() {
  return NextResponse.json({ error: "Project not found" }, { status: 404 });
}

export async function GET(request: Request, context: RouteContext) {
  const session = requireUserSession(request);
  if (isAuthResponse(session)) return session;

  const { id } = await context.params;
  const project = await getProjectForSession(id, session);

  if (!project) {
    abuseLog({ route: `/api/projects/${id}`, event: "project_access_denied", actor: session.demoUserId });
    return notFoundResponse();
  }

  return NextResponse.json({ project: safeProjectDetailDto(project as never) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = requireUserSession(request);
  if (isAuthResponse(session)) return session;

  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const { id } = await context.params;
  const existing = await getProjectForSession(id, session);
  if (!existing) return notFoundResponse();

  const body = await request.json().catch(() => null);
  const parsed = updateProjectSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid project data" }, { status: 400 });
  }

  const project = await updateProjectForSession(id, session, parsed.data);
  if (!project) return notFoundResponse();
  return NextResponse.json({ project: safeProjectDetailDto(project as never) });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = requireUserSession(request);
  if (isAuthResponse(session)) return session;

  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const { id } = await context.params;
  const deleted = await deleteProjectForSession(id, session);
  if (!deleted) return notFoundResponse();

  return NextResponse.json({ deleted: true, id });
}
