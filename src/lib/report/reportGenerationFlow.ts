export type ReportGenerationSuccess = {
  ok?: boolean;
  success?: boolean;
  projectId?: string;
  reportStatus?: string;
  hasReportData?: boolean;
  reportUrl?: string;
  redirectUrl?: string;
  project?: Record<string, unknown> | null;
};

export type ReportActionReadinessInput = {
  interviewCompleteForCurrentFlow: boolean;
  hasPendingInterviewBlock: boolean;
  hasFinancialResult: boolean;
  hasUnsavedChanges: boolean;
  isCurrentBlockValid: boolean;
  canCalculate: boolean;
};

function hasObjectReportData(project: unknown): boolean {
  if (!project || typeof project !== "object") return false;
  const data = (project as Record<string, unknown>).reportData;
  return Boolean(data && typeof data === "object" && Object.keys(data as Record<string, unknown>).length > 0);
}

function hasObjectFinancialResult(project: unknown): boolean {
  if (!project || typeof project !== "object") return false;
  const data = (project as Record<string, unknown>).financialResult;
  return Boolean(data && typeof data === "object" && Object.keys(data as Record<string, unknown>).length > 0);
}

export function isReportGenerationSuccess(data: unknown): data is ReportGenerationSuccess {
  if (!data || typeof data !== "object") return false;
  const payload = data as ReportGenerationSuccess;
  const successFlag = payload.ok === true || payload.success === true;
  const readyStatus = payload.reportStatus === undefined || payload.reportStatus === "ready" || payload.reportStatus === "completed";
  const hasReportData = payload.hasReportData === true || hasObjectReportData(payload.project);
  const hasFinancialResult = hasObjectFinancialResult(payload.project);
  const hasDestination = typeof payload.redirectUrl === "string" || typeof payload.reportUrl === "string" || hasObjectReportData(payload.project);
  return successFlag && readyStatus && hasReportData && hasFinancialResult && hasDestination;
}

export function getReportDestination(data: ReportGenerationSuccess, projectId: string): string {
  if (typeof data.redirectUrl === "string" && data.redirectUrl.trim()) return data.redirectUrl;
  if (typeof data.reportUrl === "string" && data.reportUrl.trim()) return data.reportUrl;
  return `/advisor/projects/${projectId}/report`;
}

export function shouldShowGenerateReportAction(input: ReportActionReadinessInput): boolean {
  return Boolean(
    input.interviewCompleteForCurrentFlow &&
    !input.hasPendingInterviewBlock &&
    !input.hasFinancialResult &&
    !input.hasUnsavedChanges &&
    input.isCurrentBlockValid &&
    input.canCalculate
  );
}
