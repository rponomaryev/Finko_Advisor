import "server-only";

export function safeProjectListDto(project: Record<string, unknown>) {
  const structuredData = project.structuredData && typeof project.structuredData === "object"
    ? project.structuredData as Record<string, unknown>
    : {};
  return {
    id: project.id,
    title: project.title,
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    summary: {
      businessType: project.businessType ?? structuredData.businessType,
      region: project.region ?? structuredData.region,
      businessIdea: project.businessIdea ?? structuredData.businessIdea
    },
    progress: typeof structuredData.progress === "number" ? structuredData.progress : undefined
  };
}

export function safeProjectDetailDto(project: Record<string, unknown>) {
  const structuredData = project.structuredData && typeof project.structuredData === "object"
    ? project.structuredData as Record<string, unknown>
    : {};
  const preferStructured = (key: string) => structuredData[key] ?? project[key];
  return {
    id: project.id,
    title: project.title,
    sectorCode: project.sectorCode,
    status: project.status,
    userLanguage: preferStructured("userLanguage"),
    businessType: preferStructured("businessType"),
    region: preferStructured("region"),
    district: preferStructured("district"),
    plannedStartPeriod: preferStructured("plannedStartPeriod"),
    businessIdea: preferStructured("businessIdea"),
    productionType: preferStructured("productionType"),
    toyType: preferStructured("toyType"),
    premisesStatus: preferStructured("premisesStatus"),
    equipmentCondition: preferStructured("equipmentCondition"),
    monthlyCapacity: preferStructured("monthlyCapacity"),
    averagePrice: preferStructured("averagePrice"),
    targetCustomers: preferStructured("targetCustomers"),
    targetCustomerSegments: preferStructured("targetCustomerSegments"),
    salesChannels: preferStructured("salesChannels"),
    rawMaterialSource: preferStructured("rawMaterialSource"),
    certificationAwareness: preferStructured("certificationAwareness"),
    supplierSelected: preferStructured("supplierSelected"),
    ownContribution: preferStructured("ownContribution"),
    ownContributionAmount: preferStructured("ownContributionAmount"),
    ownContributionCurrency: preferStructured("ownContributionCurrency"),
    ownContributionUZS: preferStructured("ownContributionUZS"),
    exchangeRateUZSPerUSD: preferStructured("exchangeRateUZSPerUSD"),
    creditNeeded: preferStructured("creditNeeded"),
    requestedLoanAmount: preferStructured("requestedLoanAmount"),
    requestedLoanCurrency: preferStructured("requestedLoanCurrency"),
    requestedLoanUZS: preferStructured("requestedLoanUZS"),
    loanPurpose: preferStructured("loanPurpose"),
    loanTermMonths: preferStructured("loanTermMonths"),
    requestedLeasingAmount: preferStructured("requestedLeasingAmount"),
    collateralAvailable: preferStructured("collateralAvailable"),
    collateralType: preferStructured("collateralType"),
    collateralEstimatedValue: preferStructured("collateralEstimatedValue"),
    experienceLevel: preferStructured("experienceLevel"),
    aiMode: project.aiMode,
    structuredData: project.structuredData,
    sectionNotes: preferStructured("sectionNotes"),
    staffPlan: preferStructured("staffPlan"),
    businessProfile: preferStructured("businessProfile"),
    exchangeRateSnapshot: preferStructured("exchangeRateSnapshot"),
    financialResult: project.financialResult,
    riskResult: project.riskResult,
    feasibilityScore: project.feasibilityScore,
    bankReadinessScore: project.bankReadinessScore,
    reportData: project.reportData,
    consentGiven: project.consentGiven,
    consentTimestamp: project.consentTimestamp,
    consentVersion: project.consentVersion,
    consentLocale: project.consentLocale,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
}

export function safeReportDto(report: unknown) {
  return report && typeof report === "object" ? report : null;
}

export function safeMarketDataDto(data: unknown) {
  return data && typeof data === "object" ? data : { dataPoints: [], sources: [] };
}
