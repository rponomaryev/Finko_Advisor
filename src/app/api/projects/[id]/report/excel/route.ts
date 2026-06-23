import { NextResponse } from "next/server";
import { createExcelReportResponse } from "@/lib/export/reportExportRouteHandlers";
import { getProjectForSession } from "@/lib/services/projectService";
import { isAuthResponse, requireUserSession } from "@/lib/server/auth";
import { enforceRateLimit } from "@/lib/server/security";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = requireUserSession(request);
  if (isAuthResponse(session)) return session;

  const { id } = await context.params;
  const limited = enforceRateLimit(request, "export", session, id);
  if (limited) return limited;

  const project = await getProjectForSession(id, session);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const locale = new URL(request.url).searchParams.get("locale");
  const response = await createExcelReportResponse(id, project as unknown as Record<string, unknown>, locale);
  if (response.kind === "json") {
    return NextResponse.json(response.body, { status: response.status });
  }
  return new NextResponse(response.body, { status: response.status, headers: response.headers });
}
