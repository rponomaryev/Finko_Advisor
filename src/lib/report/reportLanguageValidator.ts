import type { AppLocale } from "../i18n/index.ts";
import { findForbiddenUserFacingTerms, findUnexpectedLatinTokens } from "../i18n/userFacingSanitizer.ts";

const allowedTerms = [
  "UZS",
  "USD",
  "EUR",
  "EBITDA",
  "DSCR",
  "FINKO",
  "Telegram",
  "Instagram",
  "Google",
  "2GIS",
  "URL",
  "PDF",
  "Excel",
  "API",
  "OpenAI",
  "ChatGPT"
];

const forbiddenEnglishLeakage = [
  "Tailoring alteration",
  "Tailoring repair service",
  "Tailoring order",
  "Mall or partner traffic",
  "Customer acquisition channels",
  "Customer acquisition",
  "Premises status",
  "Credit needed",
  "Tax cash register",
  "Sewing equipment",
  "Tailor payroll",
  "Rent dependency",
  "Business profile",
  "AI classification",
  "compliance",
  "Fulfillment",
  "fulfillment",
  "marketplace",
  "CAC",
  "food cost",
  "takeaway",
  "delivery",
  "Scope",
  "deliverables",
  "cash flow",
  "cash gap",
  "cash buffer",
  "unit economics",
  "structured fields",
  "Gross margin",
  "Retention",
  "Supervisor",
  "CapEx",
  "OpEx",
  "COGS"
];

const rawTechnicalPattern = /\b[a-z]+_[a-z0-9_]+\b/i;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripAllowedTerms(value: string): string {
  return allowedTerms.reduce((acc, term) => acc.replace(new RegExp(escapeRegex(term), "gi"), ""), value);
}

const metadataKeysToSkip = new Set([
  "id",
  "code",
  "key",
  "source",
  "sourceId",
  "sourceType",
  "sectorCode",
  "sourceQuality",
  "quality",
  "matchQuality",
  "confidence",
  "confidenceLevel",
  "verificationStatus",
  "mappingSource",
  "classification",
  "normalizedSector",
  "possibleHsCodes",
  "possibleActivityCodes",
  "tradeType",
  "notes",
  "sourceUrl",
  "url",
  "unit",
  "retrievedAt",
  "fetchedAt",
  "generatedAt",
  "projectId",
  "userId",
  "status",
  "category",
  "subcategory",
  "recommendedFor",
  "sourceCategories",
  "recommendedSourceCategories",
  "applicableCategories",
  "categoryIds",
  "riskCodes",
  "dataSource",
  "loanAnnualRateSource",
  "leasingAnnualRateSource",
  "loanRepaymentType",
  "creditAnnualRateSource",
  "creditNeeded",
  "leasingNeeded",
  "needsLeasing",
  "collateralAvailable",
  "rateSource",
  "revenueSource",
  "assumptionSource",
  "_classificationHint",
  "_requiresAIClassification"
]);

function shouldSkipBranch(_path: string[]): boolean {
  return false;
}


function collectStrings(value: unknown, output: string[] = [], parentKey = "", path: string[] = []): string[] {
  const currentPath = parentKey ? [...path, parentKey] : path;
  if (metadataKeysToSkip.has(parentKey) || shouldSkipBranch(currentPath)) return output;
  if (typeof value === "string") {
    output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, output, parentKey, path);
    return output;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) collectStrings(item, output, key, currentPath);
  }
  return output;
}

function isUrlLike(value: string): boolean {
  return /^https?:\/\//i.test(value) || /\b[a-z0-9.-]+\.[a-z]{2,}\//i.test(value);
}

const internalEnumValues = new Set([
  "assumption",
  "calculated",
  "user_input",
  "official",
  "manual",
  "profile",
  "yes",
  "no",
  "annuity",
  "equal_principal",
  "rent",
  "new",
  "mixed",
  "low",
  "medium",
  "high",
  "compliance",
  "legal",
  "operational",
  "financial",
  "currency",
  "ru",
  "uz",
  "en",
  "UZ"
]);

export function assertNoRawTechnicalLabelsInReport(input: {
  report: unknown;
  locale: AppLocale;
}): void {
  if (input.locale === "en") return;

  for (const original of collectStrings(input.report)) {
    if (!original || isUrlLike(original) || internalEnumValues.has(original)) continue;
    const explicitTerms = findForbiddenUserFacingTerms(original, input.locale);
    if (explicitTerms.length) {
      throw new Error(`English user-facing term leaked into ${input.locale} report: ${explicitTerms.join(", ")}`);
    }
    const text = stripAllowedTerms(original);
    const rawMatch = text.match(rawTechnicalPattern);
    if (rawMatch) {
      throw new Error(`Raw technical label leaked into ${input.locale} report: ${rawMatch[0]}`);
    }
    const latinTokens = findUnexpectedLatinTokens(original, input.locale);
    if (latinTokens.length) {
      throw new Error(`Unexpected Latin token leaked into ${input.locale} report: ${latinTokens.slice(0, 10).join(", ")} in text: ${original.slice(0, 160)}`);
    }
    const lower = text.toLowerCase();
    const phrase = forbiddenEnglishLeakage.find((item) => lower.includes(item.toLowerCase()));
    if (phrase) {
      throw new Error(`English business-profile label leaked into ${input.locale} report: ${phrase}`);
    }
  }
}

export function assertNoForbiddenLocaleText(input: { text: string; locale: AppLocale; artifactName?: string }): void {
  if (input.locale === "en") return;
  const terms = findForbiddenUserFacingTerms(input.text, input.locale);
  if (terms.length) {
    throw new Error(`English user-facing term leaked into ${input.artifactName ?? "localized text"}: ${terms.join(", ")}`);
  }
  const latinTokens = findUnexpectedLatinTokens(input.text, input.locale);
  if (latinTokens.length) {
    throw new Error(`Unexpected Latin token leaked into ${input.artifactName ?? "localized text"}: ${latinTokens.slice(0, 20).join(", ")}`);
  }
}
