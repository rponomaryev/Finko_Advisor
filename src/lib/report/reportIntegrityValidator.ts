import type { FinancialResult, RiskItem, StructuredProjectData } from "../types/project.ts";
import { manualVerificationFallback } from "../i18n/userFacingSanitizer.ts";
import type { AppLocale } from "../i18n/index.ts";
import type { ReportData } from "../services/reportService.ts";
import { safeText } from "../utils/safeText.ts";

export type ReportIntegrityValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

const roundMoney = (value: number) => Math.round(Number.isFinite(value) ? value : 0);
const numberOr = (value: unknown, fallback = 0) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const forbiddenReportPatterns = [
  /показатель\s+показатель/i,
  /показатель\s+статистика\s+показатель/i,
  /показатель\s+и\s+показатель/i,
  /sample_[A-Za-z0-9_]+/i,
  /sectionNotes\./i,
  /__money/i,
  /exchangeRateSnapshot/i,
  /staffPlan\s*:/i,
  /\{\s*"?[A-Za-z0-9_]+"?\s*:/
];

function collectStringValues(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStringValues(item, out));
    return out;
  }
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) => collectStringValues(item, out));
  }
  return out;
}

function visibleReportSlices(reportData: ReportData): Record<string, unknown> {
  const data = reportData as unknown as Record<string, unknown>;
  return {
    title: data.title,
    executiveSummary: data.executiveSummary,
    projectProfile: data.projectProfile,
    aiReport: data.aiReport,
    keyFigures: data.keyFigures,
    businessModelRows: data.businessModelRows,
    marketEvidenceRows: data.marketEvidenceRows,
    documentsRows: data.documentsRows,
    investmentBreakdown: data.investmentBreakdown,
    financingRecommendation: data.financingRecommendation,
    detailedConclusion: data.detailedConclusion,
    actionPlanRows: data.actionPlanRows,
    assumptionsRows: data.assumptionsRows,
    riskMatrix: data.riskMatrix,
    riskConclusion: data.riskConclusion,
    marketData: data.marketData,
    disclaimer: data.disclaimer
  };
}

function hasDuplicateRiskKeys(risks: RiskItem[]): boolean {
  const seen = new Set<string>();
  for (const [index, risk] of risks.entries()) {
    const key = risk.id ?? `${risk.code || "risk"}-${risk.category}-${risk.impact}-${risk.probability}-${index}`;
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

function financialIntegrityErrors(financial: FinancialResult): string[] {
  const errors: string[] = [];
  const volume = numberOr(financial.revenue.monthlyCapacity);
  const price = numberOr(financial.revenue.averagePrice);
  const utilization = numberOr(financial.revenue.expectedUtilizationPct, 100);
  const expectedMonthlyRevenue = roundMoney(volume * price * utilization / 100);
  if (volume > 0 && price > 0 && expectedMonthlyRevenue <= 0) {
    errors.push("Monthly revenue is not positive even though volume and price are provided.");
  }
  if (volume > 0 && price > 0 && Math.abs(expectedMonthlyRevenue - financial.revenue.calculatedMonthlyRevenue) > 1) {
    errors.push(`Monthly revenue mismatch: expected ${expectedMonthlyRevenue}, got ${financial.revenue.calculatedMonthlyRevenue}.`);
  }
  if (Math.abs(financial.revenue.annualRevenue - financial.revenue.monthlyRevenue * 12) > 1) {
    errors.push("Annual revenue does not equal monthly revenue x 12.");
  }
  if (!Number.isFinite(financial.profitability.monthlyEBITDA) || !Number.isFinite(financial.financing.dscr)) {
    errors.push("Financial model contains NaN or Infinity in EBITDA/DSCR.");
  }
  if (volume > 0 && price > 0 && financial.revenue.monthlyRevenue < Math.max(price, 1)) {
    errors.push("Monthly revenue is implausibly low for the provided volume and price.");
  }
  return errors;
}

function contentIntegrityErrors(reportData: ReportData, locale: AppLocale): string[] {
  const strings = collectStringValues(visibleReportSlices(reportData));
  const text = safeText(strings);
  const errors = forbiddenReportPatterns.filter((pattern) => pattern.test(text)).map((pattern) => `Forbidden user-facing report token matched: ${pattern.source}`);
  if (locale === "ru" && /Manual verification required/.test(text)) errors.push("English fallback leaked into Russian report.");
  if (!text.trim()) errors.push(manualVerificationFallback(locale));
  return errors;
}

export function validateReportIntegrity(input: {
  project: StructuredProjectData;
  financial: FinancialResult;
  risks: RiskItem[];
  reportData: ReportData;
  locale?: AppLocale;
}): ReportIntegrityValidationResult {
  const locale = input.locale ?? input.project.userLanguage ?? "ru";
  const errors: string[] = [];
  const warnings: string[] = [];

  errors.push(...financialIntegrityErrors(input.financial));
  errors.push(...contentIntegrityErrors(input.reportData, locale));

  if (hasDuplicateRiskKeys(input.risks)) errors.push("Risk list contains duplicate render keys.");
  for (const risk of input.risks) {
    if (!risk.id) errors.push(`Risk ${risk.code} has no stable id.`);
    if (!risk.title || /^\s*показатель\s*$/i.test(risk.title)) errors.push(`Risk ${risk.code} has placeholder title.`);
  }

  return { ok: errors.length === 0, errors, warnings };
}
