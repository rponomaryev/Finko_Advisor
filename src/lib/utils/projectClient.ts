import type { StructuredProjectData } from "../types/project.ts";
import { normalizeLocationFields } from "../location/locationNormalizer.ts";

function parseCustomers(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.length > 0) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}

export function getProjectProfile(project: Record<string, unknown>): StructuredProjectData {
  const structured =
    project.structuredData && typeof project.structuredData === "object"
      ? (project.structuredData as StructuredProjectData)
      : {};

  return normalizeLocationFields({
    ...structured,
    userLanguage: (project.userLanguage as "ru" | "uz" | "en" | undefined) ?? structured.userLanguage ?? "ru",
    businessType: (project.businessType as string | undefined) ?? structured.businessType,
    businessIdea: (project.businessIdea as string | undefined) ?? structured.businessIdea,
    region: (project.region as string | undefined) ?? structured.region,
    district: (project.district as string | undefined) ?? structured.district,
    plannedStartPeriod: (project.plannedStartPeriod as string | undefined) ?? structured.plannedStartPeriod,
    productionType: (project.productionType as string | undefined) ?? structured.productionType,
    toyType: (project.toyType as string | undefined) ?? structured.toyType,
    premisesStatus: (project.premisesStatus as string | undefined) ?? structured.premisesStatus,
    equipmentCondition: (project.equipmentCondition as string | undefined) ?? structured.equipmentCondition,
    monthlyCapacity: structured.monthlyCapacity ?? (project.monthlyCapacity as number | undefined),
    averagePrice: structured.averagePrice ?? (project.averagePrice as number | undefined),
    targetCustomers: parseCustomers(project.targetCustomers) ?? structured.targetCustomers,
    rawMaterialSource: (project.rawMaterialSource as string | undefined) ?? structured.rawMaterialSource,
    certificationAwareness: (project.certificationAwareness as string | undefined) ?? structured.certificationAwareness,
    supplierSelected: (project.supplierSelected as boolean | undefined) ?? structured.supplierSelected,
    ownContribution: structured.ownContribution ?? (project.ownContribution as number | undefined),
    ownContributionAmount: structured.ownContributionAmount ?? (project.ownContributionAmount as number | undefined),
    ownContributionCurrency: structured.ownContributionCurrency ?? (project.ownContributionCurrency as "UZS" | "USD" | undefined),
    ownContributionUZS: structured.ownContributionUZS ?? (project.ownContributionUZS as number | undefined),
    exchangeRateUZSPerUSD: structured.exchangeRateUZSPerUSD ?? (project.exchangeRateUZSPerUSD as number | undefined),
    creditNeeded: structured.creditNeeded ?? (project.creditNeeded as "yes" | "no" | "unknown" | undefined),
    requestedLoanAmount: structured.requestedLoanAmount ?? (project.requestedLoanAmount as number | undefined),
    requestedLoanCurrency: structured.requestedLoanCurrency ?? (project.requestedLoanCurrency as "UZS" | "USD" | undefined),
    requestedLoanUZS: structured.requestedLoanUZS ?? (project.requestedLoanUZS as number | undefined),
    loanPurpose: structured.loanPurpose ?? (project.loanPurpose as string | undefined),
    loanTermMonths: structured.loanTermMonths ?? (project.loanTermMonths as number | undefined),
    requestedLeasingAmount: structured.requestedLeasingAmount ?? (project.requestedLeasingAmount as number | undefined),
    collateralAvailable: structured.collateralAvailable ?? (project.collateralAvailable as boolean | undefined),
    collateralType: structured.collateralType ?? (project.collateralType as string | undefined),
    collateralEstimatedValue: structured.collateralEstimatedValue ?? (project.collateralEstimatedValue as number | undefined),
    experienceLevel: (project.experienceLevel as string | undefined) ?? structured.experienceLevel,
    sectionNotes: project.sectionNotes && typeof project.sectionNotes === "object" ? (project.sectionNotes as never) : structured.sectionNotes
  });
}
