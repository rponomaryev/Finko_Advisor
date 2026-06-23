import { NextResponse } from "next/server";
import { getProjectForSession } from "@/lib/services/projectService";
import { hasCalculatedProjectReport, resolveReportData } from "@/lib/services/reportService";
import { isAuthResponse, requireUserSession } from "@/lib/server/auth";
import { safeReportDto } from "@/lib/server/dto";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = requireUserSession(request);
  if (isAuthResponse(session)) return session;

  const { id } = await context.params;
  const project = await getProjectForSession(id, session);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!hasCalculatedProjectReport(project as unknown as Record<string, unknown>)) {
    return NextResponse.json({ error: "Calculate the preliminary assessment first" }, { status: 409 });
  }

  const report = resolveReportData(project as unknown as Record<string, unknown>);
  return NextResponse.json({ report: safeReportDto(report) });
}
