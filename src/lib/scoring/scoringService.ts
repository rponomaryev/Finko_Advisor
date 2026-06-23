import type { RiskItem, StructuredProjectData } from "../types/project";
import type { AppLocale } from "../i18n/index.ts";
import { hasTextDetails, safeText } from "../utils/safeText.ts";

type FinancialScoreInput = {
  financing: {
    creditNeeded?: string;
    ownContributionPct: number;
    dscr: number | null;
  };
  profitability: {
    ebitdaMarginPct: number;
  };
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const hasDetails = (value: unknown) => hasTextDetails(value, 40);

function riskPenalty(risks: ReadonlyArray<Pick<RiskItem, "level">>): number {
  return risks.reduce((penalty, risk) => {
    if (risk.level === "high") return penalty + 7;
    if (risk.level === "medium") return penalty + 3;
    return penalty;
  }, 0);
}

function detailedDataScore(project: StructuredProjectData): number {
  let score = 0;
  if (hasDetails(project.sectionNotes?.salesMarketing)) score += 5;
  if (hasDetails(project.sectionNotes?.equipment)) score += 5;
  if (hasDetails(project.sectionNotes?.rawMaterials)) score += 5;
  if (project.monthlyCapacity && project.averagePrice && project.employeesCount) score += 6;
  if (project.targetCustomers && project.targetCustomers.length >= 3) score += 4;
  const unknowns = [project.equipmentCondition, project.rawMaterialSource, project.creditNeeded, project.certificationAwareness].filter((v) => v === "not_selected" || v === "unknown" || v === "not_aware").length;
  score -= unknowns * 4;
  return score;
}

function hasPositive(record: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => {
    const value = record[key];
    return typeof value === "number" ? Number.isFinite(value) && value > 0 : typeof value === "string" ? Number(value.replace(/\s/g, "")) > 0 : false;
  });
}

function hasAnswered(record: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => {
    const value = record[key];
    if (Array.isArray(value)) return value.length > 0;
    return safeText(value) !== "";
  });
}

function operationalCompletenessFloor(project: StructuredProjectData, financial: FinancialScoreInput, mode: "feasibility" | "bank"): number {
  const record = project as Record<string, unknown>;
  let points = 0;
  if (hasAnswered(record, ["businessType", "businessIdea"])) points += 1;
  if (hasAnswered(record, ["region", "district"])) points += 1;
  if (hasPositive(record, ["monthlyCapacity", "monthlySales", "salesPerMonth", "visitorsPerDay", "dailyTraffic", "traffic", "customersPerDay"])) points += 1;
  if (hasPositive(record, ["averageTicket", "averageCheck", "averagePrice", "unitPrice", "pricePerOrder"])) points += 1;
  if (hasPositive(record, ["averagePurchaseCost", "purchasePrice", "unitCost", "costPerUnit"])) points += 1;
  if (hasPositive(record, ["monthlyRent", "rentAmount"]) || hasAnswered(record, ["premisesStatus"])) points += 1;
  if (hasPositive(record, ["monthlyPayroll", "payrollMonthly", "salaryAmount"]) || hasAnswered(record, ["staffPlan", "employeesCount"])) points += 1;
  if (hasPositive(record, ["equipmentCapex", "equipmentCost", "startupAssetsCost", "initialInventoryCostUZS", "firstPurchaseAmount", "firstPurchaseCost"])) points += 1;
  if (hasPositive(record, ["ownContributionUZS", "ownContributionAmount", "ownContribution"])) points += 1;
  if (project.creditNeeded === "yes" || hasPositive(record, ["requestedLoanUZS", "requestedLoanAmount"])) points += 1;
  if (project.collateralAvailable === true || hasAnswered(record, ["collateralType", "collateralEstimatedValue"])) points += 1;
  if (hasAnswered(record, ["targetCustomers", "targetCustomerSegments", "customerSegments", "salesChannels", "customerAcquisitionChannels"])) points += 1;

  const weakFinance = (financial.financing.dscr ?? 0) > 0 && (financial.financing.dscr ?? 0) < 1.2;
  if (points >= 10) return mode === "bank" ? (weakFinance ? 45 : 50) : (weakFinance ? 48 : 52);
  if (points >= 8) return mode === "bank" ? 40 : 45;
  if (points >= 6) return mode === "bank" ? 32 : 36;
  return 0;
}

export function calculateFeasibilityScore(
  project: StructuredProjectData,
  financial: FinancialScoreInput,
  risks: ReadonlyArray<Pick<RiskItem, "level">>
): number {
  let score = 58;
  score += financial.profitability.ebitdaMarginPct >= 15 ? 12 : financial.profitability.ebitdaMarginPct >= 8 ? 6 : -8;
  if (financial.financing.dscr === null) score += 2;
  else score += financial.financing.dscr >= 1.3 ? 12 : financial.financing.dscr >= 1 ? 4 : -10;
  score += financial.financing.ownContributionPct >= 30 ? 10 : financial.financing.ownContributionPct >= 20 ? 5 : -8;
  score += project.experienceLevel === "high" ? 8 : project.experienceLevel === "medium" ? 4 : -6;
  score += project.certificationAwareness === "aware" ? 6 : project.certificationAwareness === "partly_aware" ? 2 : -8;
  score += detailedDataScore(project);
  score -= riskPenalty(risks);
  return clamp(Math.max(score, operationalCompletenessFloor(project, financial, "feasibility")));
}

export function calculateBankReadinessScore(
  project: StructuredProjectData,
  financial: FinancialScoreInput,
  risks: ReadonlyArray<Pick<RiskItem, "level">>
): number {
  let score = project.creditNeeded === "no" ? 56 : 50;
  if (project.creditNeeded === "no") {
    score += financial.financing.ownContributionPct >= 45 ? 16 : financial.financing.ownContributionPct >= 30 ? 10 : 0;
  } else {
    score += project.collateralAvailable ? 14 : -10;
    const dscr = financial.financing.dscr ?? 0;
    score += dscr >= 10 ? 20 : dscr >= 5 ? 16 : dscr >= 2 ? 12 : dscr >= 1.25 ? 8 : dscr >= 1 ? 4 : -12;
  }
  score += financial.financing.ownContributionPct >= 30 ? 14 : financial.financing.ownContributionPct >= 20 ? 7 : -8;
  score += project.hasBuyerAgreements ? 8 : -5;
  score += project.supplierSelected ? 5 : -3;
  score += project.certificationAwareness === "aware" ? 7 : project.certificationAwareness === "partly_aware" ? 3 : -6;
  score += hasDetails(project.sectionNotes?.finance) ? 5 : 0;
  score += hasDetails(project.sectionNotes?.salesMarketing) ? 5 : 0;
  const relevantRisks = project.creditNeeded === "no" ? risks.filter((risk) => "code" in risk ? (risk as RiskItem).code !== "collateral_risk" : true) : risks;
  score -= Math.round(riskPenalty(relevantRisks) * 0.8);
  return clamp(Math.max(score, operationalCompletenessFloor(project, financial, "bank")));
}

export function getScoreLabel(score: number, locale: AppLocale = "ru"): string {
  if (score >= 80) return locale === "en" ? "High readiness" : locale === "uz" ? "Yuqori tayyorgarlik" : "Высокая готовность";
  if (score >= 65) return locale === "en" ? "Preliminarily feasible" : locale === "uz" ? "Dastlabki bahoda amalga oshadi" : "Предварительно реализуемо";
  if (score >= 45) return locale === "en" ? "Requires improvement" : locale === "uz" ? "Takomillashtirish kerak" : "Требует доработки";
  return locale === "en" ? "High risk" : locale === "uz" ? "Yuqori risk" : "Высокий риск";
}

export function getScoreColorVariant(score: number): "green" | "amber" | "red" {
  if (score >= 70) return "green";
  if (score >= 45) return "amber";
  return "red";
}
