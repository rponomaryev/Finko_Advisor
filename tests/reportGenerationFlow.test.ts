import test from "node:test";
import assert from "node:assert/strict";
import { getReportDestination, isReportGenerationSuccess, shouldShowGenerateReportAction } from "../src/lib/report/reportGenerationFlow.ts";

test("report generation button is shown only when report generation is actually ready", () => {
  assert.equal(shouldShowGenerateReportAction({
    interviewCompleteForCurrentFlow: true,
    hasPendingInterviewBlock: false,
    hasFinancialResult: false,
    hasUnsavedChanges: false,
    isCurrentBlockValid: true,
    canCalculate: true
  }), true);

  assert.equal(shouldShowGenerateReportAction({
    interviewCompleteForCurrentFlow: true,
    hasPendingInterviewBlock: false,
    hasFinancialResult: false,
    hasUnsavedChanges: false,
    isCurrentBlockValid: true,
    canCalculate: false
  }), false);

  assert.equal(shouldShowGenerateReportAction({
    interviewCompleteForCurrentFlow: true,
    hasPendingInterviewBlock: true,
    hasFinancialResult: false,
    hasUnsavedChanges: false,
    isCurrentBlockValid: true,
    canCalculate: true
  }), false);
});

test("successful response must contain real report data and a preview destination", () => {
  const payload = {
    ok: true,
    success: true,
    projectId: "p1",
    reportStatus: "ready",
    hasReportData: true,
    redirectUrl: "/advisor/projects/p1/report",
    project: { reportData: { executiveSummary: ["ok"] }, financialResult: { revenue: { monthlyRevenue: 1 } } }
  };

  assert.equal(isReportGenerationSuccess(payload), true);
  assert.equal(getReportDestination(payload, "p1"), "/advisor/projects/p1/report");
});

test("success without reportData or financialResult is treated as a failure to prevent silent empty UI", () => {
  assert.equal(isReportGenerationSuccess({
    ok: true,
    success: true,
    projectId: "p1",
    reportStatus: "ready",
    hasReportData: false,
    redirectUrl: "/advisor/projects/p1/report",
    project: { financialResult: { revenue: { monthlyRevenue: 1 } } }
  }), false);

  assert.equal(isReportGenerationSuccess({
    ok: true,
    projectId: "p1",
    reportUrl: "/advisor/projects/p1/report",
    project: { reportData: null, financialResult: { revenue: { monthlyRevenue: 1 } } }
  }), false);

  assert.equal(isReportGenerationSuccess({
    ok: true,
    success: true,
    projectId: "p1",
    reportStatus: "ready",
    hasReportData: true,
    redirectUrl: "/advisor/projects/p1/report",
    project: { reportData: { executiveSummary: ["ok"] } }
  }), false);
});

test("failure and thrown API errors are not accepted as success", () => {
  assert.equal(isReportGenerationSuccess({
    ok: false,
    success: false,
    errorCode: "MISSING_REQUIRED_FIELDS",
    message: "Failed to generate the report. Please check the required data or try again."
  }), false);

  assert.equal(isReportGenerationSuccess(null), false);
  assert.equal(isReportGenerationSuccess(new Error("network down")), false);
});
