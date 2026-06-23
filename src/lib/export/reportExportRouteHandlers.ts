import { getTranslations } from "../i18n/index.ts";
import { getReportLocale } from "../i18n/reportMessages.ts";
import { buildExcelReportBuffer } from "./excelReportExporter.ts";
import { buildPdfReportBuffer } from "./pdfReportExporter.ts";
import { hasCalculatedProjectReport } from "../services/reportService.ts";

function fileBase(projectId: string, project: Record<string, unknown>, localeOverride?: unknown) {
  const locale = getReportLocale(project, localeOverride);
  return `finko-business-report-${locale}-${projectId}`;
}

function notReadyError(project: Record<string, unknown>, localeOverride?: unknown) {
  const locale = getReportLocale(project, localeOverride);
  return getTranslations(locale).report.exportNotReady;
}

export async function createPdfReportResponse(projectId: string, project: Record<string, unknown>, localeOverride?: unknown) {
  if (!hasCalculatedProjectReport(project)) {
    return {
      kind: "json" as const,
      status: 409,
      body: { error: notReadyError(project, localeOverride) },
      headers: { "Content-Type": "application/json" }
    };
  }

  const locale = getReportLocale(project, localeOverride);
  try {
    const buffer = await buildPdfReportBuffer(project, locale);
    return {
      kind: "file" as const,
      status: 200,
      body: buffer,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileBase(projectId, project, locale)}.pdf"`
      }
    };
  } catch (error) {
    console.error("PDF report generation failed", {
      projectId,
      reason: error instanceof Error ? error.message : String(error)
    });
    return {
      kind: "json" as const,
      status: 500,
      body: { error: getTranslations(getReportLocale(project, locale)).report.exportErrorPdf },
      headers: { "Content-Type": "application/json" }
    };
  }
}

export async function createExcelReportResponse(projectId: string, project: Record<string, unknown>, localeOverride?: unknown) {
  if (!hasCalculatedProjectReport(project)) {
    return {
      kind: "json" as const,
      status: 409,
      body: { error: notReadyError(project, localeOverride) },
      headers: { "Content-Type": "application/json" }
    };
  }

  const locale = getReportLocale(project, localeOverride);
  const buffer = await buildExcelReportBuffer(project, locale);
  return {
    kind: "file" as const,
    status: 200,
    body: buffer,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileBase(projectId, project, locale)}.xlsx"`
    }
  };
}
