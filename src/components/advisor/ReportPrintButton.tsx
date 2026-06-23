"use client";

import { FileSpreadsheet, FileText, Loader2, Printer } from "lucide-react";
import { useState } from "react";
import { getTranslations, type AppLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

type ExportKind = "pdf" | "excel" | null;

function readFileName(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) return fallback;
  const match = contentDisposition.match(/filename="([^"]+)"/i);
  return match?.[1] ?? fallback;
}

async function downloadBlob(response: Response, fallbackName: string) {
  const blob = await response.blob();
  const fileName = readFileName(response.headers.get("Content-Disposition"), fallbackName);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function ReportPrintButton({
  projectId,
  locale = "ru",
  disabled = false
}: {
  projectId: string;
  locale?: AppLocale;
  disabled?: boolean;
}) {
  const messages = getTranslations(locale).report;
  const [loading, setLoading] = useState<ExportKind>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(kind: Exclude<ExportKind, null>) {
    if (disabled) {
      setError(messages.exportNotReady);
      return;
    }

    setLoading(kind);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/report/${kind}?locale=${locale}`);
      if (!response.ok) {
        setError(response.status === 409 ? messages.exportNotReady : kind === "pdf" ? messages.exportErrorPdf : messages.exportErrorExcel);
        return;
      }

      await downloadBlob(response, `finko-business-report-${locale}-${projectId}.${kind === "pdf" ? "pdf" : "xlsx"}`);
    } catch {
      setError(kind === "pdf" ? messages.exportErrorPdf : messages.exportErrorExcel);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => handleExport("pdf")} disabled={disabled || loading !== null}>
          {loading === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {messages.downloadPdf}
        </Button>
        <Button variant="outline" onClick={() => handleExport("excel")} disabled={disabled || loading !== null}>
          {loading === "excel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
          {messages.downloadExcel}
        </Button>
        <Button variant="ghost" onClick={() => window.print()} disabled={disabled || loading !== null}>
          <Printer className="h-4 w-4" />
          {messages.printReport}
        </Button>
      </div>
      {error ? <p className="text-sm text-finko-primaryDark">{error}</p> : null}
    </div>
  );
}
