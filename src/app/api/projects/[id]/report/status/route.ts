import { NextResponse } from "next/server";
import { getProjectForSession, toStructuredProjectData } from "@/lib/services/projectService";
import { resolveReportReadiness } from "@/lib/report/reportReadiness";
import { isAuthResponse, requireUserSession } from "@/lib/server/auth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

type ReportGenerationStep =
  | "validating_data"
  | "calculating_financials"
  | "fetching_exchange_rate"
  | "conducting_market_research"
  | "generating_ai_report"
  | "preparing_exports"
  | "completed"
  | "failed"
  | "partial";

function hasReportData(project: Record<string, unknown>): boolean {
  return Boolean(project.reportData && typeof project.reportData === "object" && Object.keys(project.reportData as Record<string, unknown>).length > 0);
}

function inferStep(project: Record<string, unknown>): ReportGenerationStep {
  if (project.status === "calculated" && hasReportData(project)) return "completed";
  if (project.status === "report_failed") return "failed";
  if (hasReportData(project) && !project.webResearchData) return "partial";
  if (project.financialResult && !hasReportData(project)) return "generating_ai_report";
  return "validating_data";
}

export async function GET(request: Request, context: RouteContext) {
  const session = requireUserSession(request);
  if (isAuthResponse(session)) return session;
  const { id } = await context.params;
  const project = await getProjectForSession(id, session);
  if (!project) return NextResponse.json({ success: false, errorCode: "PROJECT_NOT_FOUND", error: "Project not found" }, { status: 404 });
  const record = project as unknown as Record<string, unknown>;
  const profile = toStructuredProjectData(record);
  const readiness = resolveReportReadiness(profile);
  const step = inferStep(record);
  const ready = step === "completed" && readiness.ready;
  const partial = step === "partial";
  const failed = step === "failed";
  return NextResponse.json({
    success: ready,
    projectId: id,
    status: ready ? "ready" : !readiness.ready ? "missing_required_fields" : partial ? "partial" : failed ? "failed" : "pending",
    reportStatus: ready ? "ready" : !readiness.ready ? "missing_required_fields" : partial ? "partial" : failed ? "failed" : "pending",
    hasReportData: hasReportData(record),
    ready: readiness.ready,
    blockingIssues: readiness.blockingIssues,
    nonBlockingWarnings: readiness.nonBlockingWarnings,
    requiredVisibleFields: readiness.requiredVisibleFields,
    calculationInputs: readiness.calculationInputs,
    step,
    message: failed
      ? "Не удалось сформировать отчет. Проверьте обязательные данные или попробуйте ещё раз."
      : !readiness.ready
        ? `Не хватает данных для отчёта: ${readiness.blockingIssues.map((issue) => issue.message).join("; ")}`
      : ready
        ? "Отчет готов."
        : partial
          ? "Предварительный отчет готов, часть внешних данных может быть недоступна."
          : "Генерируем отчет..."
  });
}
