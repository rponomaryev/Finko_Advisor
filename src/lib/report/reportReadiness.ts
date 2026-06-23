import { classifyBusiness, type BusinessProfile } from "../business/businessClassifier.ts";
import { FINANCE_TEXT_CONFLICT_CODE, detectInterviewDataQualityWarnings, moneyNumber, resolveFinanceTextFallbacks, type CalculationPolicy, type DataQualitySeverity, type FinanceTextFallbacks } from "../interview/dataQuality.ts";
import { buildInterviewRequiredKeys } from "../interview/interviewProgress.ts";
import { buildVisibilityContext, isQuestionMissing, isQuestionRequired, isQuestionVisible, valueByPathWithAliases } from "../interview/interviewValidation.ts";
import { directMonthlyRevenueAliases, resolveRevenueInputs, revenueConversionAliases, revenueDailyUnitAliases, revenueMonthlyVolumeAliases, revenuePriceAliases, type ResolvedRevenueInputs } from "../financial/revenueInputResolver.ts";
import { resolveTemplateForData } from "../services/templateService.ts";
import type { InterviewQuestion, Locale, StructuredProjectData } from "../types/project.ts";
import type { SectorTemplate } from "../types/sector.ts";

export type ReportIssueSeverity = "critical" | "medium" | "low";

export type ReportReadinessIssue = {
  code: string;
  message: string;
  field?: string;
  key?: string;
  fields?: string[];
  label?: string;
  block?: string;
  blockId?: string;
  severity: ReportIssueSeverity;
  calculationPolicy?: CalculationPolicy;
};

export type NormalizedFinancialInputs = {
  revenue: ResolvedRevenueInputs;
  monthlyUnits: number;
  monthlySales: number;
  averageTicket: number;
  monthlyRevenue: number;
  annualRevenue: number;
  formulaKind: NonNullable<ResolvedRevenueInputs["formulaKind"]>;
  source: "user_answer" | "calculated" | "assumption";
};

export type ReportReadinessResult = {
  ready: boolean;
  blockingIssues: ReportReadinessIssue[];
  nonBlockingWarnings: ReportReadinessIssue[];
  requiredVisibleFields: string[];
  calculationInputs: NormalizedFinancialInputs;
};

const blockLabelById: Record<string, string> = {
  business_idea: "Бизнес-идея",
  location: "Локация",
  equipment_launch: "Оборудование и запуск",
  operations: "Операции",
  suppliers_procurement: "Поставщики и закупки",
  sales: "Продажи",
  financing: "Финансирование",
  documents_experience: "Документы и опыт"
};

function numberOr(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[\s_]/g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeCriticality(severity: DataQualitySeverity): ReportIssueSeverity {
  return severity === "high" ? "critical" : severity === "medium" ? "medium" : "low";
}

function isNonFatalFinanceNarrativeIssue(code: string): boolean {
  return code === FINANCE_TEXT_CONFLICT_CODE;
}

function financingFallbackSatisfied(key: string, fallbacks: FinanceTextFallbacks): boolean {
  if (/^(ownContribution|ownContributionAmount|ownContributionUZS)$/i.test(key)) return Boolean(fallbacks.ownContributionAmount);
  if (/^(requestedLoanAmount|requestedLoanUZS)$/i.test(key)) return Boolean(fallbacks.requestedLoanAmount);
  if (/^(requestedLeasingAmount|requestedLeasingUZS)$/i.test(key)) return Boolean(fallbacks.requestedLeasingAmount);
  return false;
}

function visibleRequiredQuestions(template: SectorTemplate, data: StructuredProjectData, profile: BusinessProfile): InterviewQuestion[] {
  const requiredKeys = new Set(buildInterviewRequiredKeys(template, data));
  const context = buildVisibilityContext({ answers: data, profile });
  const result: InterviewQuestion[] = [];
  for (const block of template.interviewBlocks) {
    for (const question of block.questions) {
      if (isQuestionRequired(question, requiredKeys) && isQuestionVisible(question, context)) result.push(question);
    }
  }
  return result;
}

function blockForField(template: SectorTemplate, field: string): { blockId: string; block: string; label?: string } {
  for (const block of template.interviewBlocks) {
    const question = block.questions.find((item) => item.key === field);
    if (question) return { blockId: block.id, block: blockLabelById[block.id] ?? block.name, label: question.label };
  }
  const fallbackBlock = field.toLowerCase().includes("loan") || field.toLowerCase().includes("credit") || field.toLowerCase().includes("leasing") || field.toLowerCase().includes("contribution") ? "financing" : "sales";
  return { blockId: fallbackBlock, block: blockLabelById[fallbackBlock] ?? fallbackBlock };
}

function issue(input: Omit<ReportReadinessIssue, "severity"> & { severity?: ReportIssueSeverity }, template: SectorTemplate): ReportReadinessIssue {
  const firstField = input.field ?? input.key ?? input.fields?.[0];
  const block = firstField ? blockForField(template, firstField) : undefined;
  return {
    ...input,
    key: input.key ?? input.field,
    field: input.field ?? input.key,
    fields: input.fields ?? (firstField ? [firstField] : undefined),
    label: input.label ?? block?.label ?? firstField,
    block: input.block ?? block?.block,
    blockId: input.blockId ?? block?.blockId,
    severity: input.severity ?? "critical"
  };
}

function questionMissing(question: InterviewQuestion, data: StructuredProjectData, profile: BusinessProfile): boolean {
  const context = buildVisibilityContext({ answers: data, profile });
  return isQuestionMissing(question, context);
}

function semanticInputSatisfied(key: string, revenue: ResolvedRevenueInputs): boolean {
  const normalized = key.trim();
  const hasDirectRevenue = revenue.formulaKind === "direct_monthly_revenue" || revenue.formulaKind === "stable" || directMonthlyRevenueAliases.includes(normalized);
  if (["monthlyCapacity", "monthlySales", "monthlyOrders", "revenue_volume"].includes(normalized) || revenueMonthlyVolumeAliases.includes(normalized) || revenueDailyUnitAliases.includes(normalized)) return Boolean(revenue.volume) || hasDirectRevenue;
  if (["averageTicket", "averagePrice", "revenue_price"].includes(normalized) || revenuePriceAliases.includes(normalized)) return Boolean(revenue.price) || hasDirectRevenue;
  if (["conversion", "conversionPct"].includes(normalized) || revenueConversionAliases.includes(normalized)) return revenue.conversionApplied || revenue.volume?.period !== "day";
  return false;
}

export function resolveReportReadiness(
  data: StructuredProjectData,
  options: { template?: SectorTemplate; locale?: Locale } = {}
): ReportReadinessResult {
  const template = options.template ?? resolveTemplateForData(data);
  const profile = classifyBusiness({ businessType: data.businessType, businessIdea: data.businessIdea, region: data.region, language: data.userLanguage, answers: data });
  const revenue = resolveRevenueInputs(data, template.assumptions, data.businessProfile ?? profile);
  const requiredQuestions = visibleRequiredQuestions(template, data, profile);
  const requiredVisibleFields = Array.from(new Set(requiredQuestions.map((question) => question.key)));
  const blockingIssues: ReportReadinessIssue[] = [];
  const nonBlockingWarnings: ReportReadinessIssue[] = [];
  const financeFallbacks = resolveFinanceTextFallbacks(data);

  for (const question of requiredQuestions) {
    if (!questionMissing(question, data, profile)) continue;
    const key = question.key;
    const financialCritical = /^(requestedLoanAmount|loanTermMonths|requestedLeasingAmount|leasingTermMonths|averageTicket|averagePrice|monthlyCapacity|traffic|conversion|ordersPerDay|salesPerDay|monthlyOrders|salesPerMonth|ordersPerMonth|equipmentCapex|ownContributionAmount|staffPlan)$/i.test(key);
    if (financialCritical && (semanticInputSatisfied(key, revenue) || financingFallbackSatisfied(key, financeFallbacks))) continue;
    if (financialCritical) {
      blockingIssues.push(issue({ code: "visible_required_field_missing", field: key, label: question.label, message: `Не заполнено обязательное поле: ${question.label ?? key}` }, template));
    }
  }

  const hasDirectRevenue = revenue.formulaKind === "direct_monthly_revenue" || revenue.formulaKind === "stable";
  if (!revenue.volume && !hasDirectRevenue) {
    blockingIssues.push(issue({ code: "missing_revenue_volume", field: "monthlyCapacity", label: "Плановый объём", message: "Не найден пользовательский объём продаж для расчёта выручки." }, template));
  }
  if (!revenue.price && !hasDirectRevenue) {
    blockingIssues.push(issue({ code: "missing_average_ticket", field: "averageTicket", label: "Средний чек", message: "Не найден средний чек или цена для расчёта выручки." }, template));
  }
  if (revenue.volume?.period === "day" && revenue.volume.key && /traffic|visitors|customers|clients|foot/i.test(revenue.volume.key) && !revenue.conversionApplied) {
    blockingIssues.push(issue({ code: "missing_conversion", field: "conversion", label: "Конверсия", message: "Для дневного потока покупателей нужна конверсия в продажи." }, template));
  }

  if (revenue.workingDaysPerMonth === 26 && valueByPathWithAliases(data as Record<string, unknown>, "workingDaysPerMonth") === undefined && revenue.volume?.period === "day") {
    nonBlockingWarnings.push(issue({ code: "working_days_assumption", field: "workingDaysPerMonth", label: "Рабочие дни", message: "Рабочие дни не были указаны; используется допущение 26 дней/мес.", severity: "medium" }, template));
  }

  const visibleFieldSet = new Set(requiredVisibleFields);
  const hasPositiveValue = (key: string) => numberOr(valueByPathWithAliases(data as Record<string, unknown>, key), 0) > 0;
  if (visibleFieldSet.has("initialInventoryCostUZS") && !hasPositiveValue("initialInventoryCostUZS") && !hasPositiveValue("initialInventoryCapex") && !hasPositiveValue("firstMonthRawMaterialStockUZS")) {
    blockingIssues.push(issue({ code: "initial_inventory_missing", field: "initialInventoryCostUZS", label: "Первая закупка товара", message: "Для розничного сценария нужно указать первую закупку товара или стартовый запас." }, template));
  }
  const costQuestionVisible = ["averagePurchaseCost", "rawMaterialCostPerUnit", "unitCost", "purchasePrice", "cogsPct", "grossMarginPct"].some((key) => visibleFieldSet.has(key));
  const costInputPresent = ["averagePurchaseCost", "rawMaterialCostPerUnit", "unitCost", "purchasePrice", "materialCostPerUnit", "purchaseCost", "cogsPct", "foodCostPct", "purchaseCostPct", "costOfGoodsPct", "grossMarginPct"].some(hasPositiveValue);
  if (costQuestionVisible && !costInputPresent) {
    blockingIssues.push(issue({ code: "sales_cost_missing", field: "averagePurchaseCost_or_grossMarginPct", label: "Себестоимость или валовая маржа", message: "Не хватает данных для расчёта себестоимости: укажите закупочную цену, себестоимость или валовую маржу." }, template));
  }

  if (data.creditNeeded === "yes") {
    const loanAmount = moneyNumber(data, "requestedLoanAmount") || moneyNumber(data, "requestedLoanUZS") || financeFallbacks.requestedLoanAmount?.amountUZS || 0;
    if (loanAmount <= 0) blockingIssues.push(issue({ code: "loan_amount_missing", field: "requestedLoanAmount", label: "Сумма кредита", message: "Кредит выбран, но сумма кредита не заполнена." }, template));
    if (numberOr(data.loanTermMonths, 0) <= 0) blockingIssues.push(issue({ code: "loan_term_missing", field: "loanTermMonths", label: "Срок кредита", message: "Кредит выбран, но срок кредита не заполнен." }, template));
    if (!hasText(data.loanPurpose)) nonBlockingWarnings.push(issue({ code: "loan_purpose_missing", field: "loanPurpose", label: "Цель кредита", message: "Цель кредита не заполнена; это предупреждение не блокирует финансовый расчёт.", severity: "medium" }, template));
    if (numberOr((data as Record<string, unknown>).loanAnnualRatePct, 0) <= 0) nonBlockingWarnings.push(issue({ code: "loan_rate_assumption", field: "loanAnnualRatePct", label: "Ставка кредита", message: "Ставка кредита не указана; будет использовано допущение шаблона.", severity: "medium" }, template));
  }

  if (data.needsLeasing === true) {
    const leasingAmount = moneyNumber(data, "requestedLeasingAmount") || moneyNumber(data, "requestedLeasingUZS") || financeFallbacks.requestedLeasingAmount?.amountUZS || 0;
    if (leasingAmount <= 0) blockingIssues.push(issue({ code: "leasing_amount_missing", field: "requestedLeasingAmount", label: "Сумма лизинга", message: "Лизинг выбран, но сумма лизинга не заполнена." }, template));
    if (numberOr(data.leasingTermMonths, 0) <= 0) blockingIssues.push(issue({ code: "leasing_term_missing", field: "leasingTermMonths", label: "Срок лизинга", message: "Лизинг выбран, но срок лизинга не заполнен." }, template));
  }

  for (const warning of detectInterviewDataQualityWarnings(data)) {
    const severity = isNonFatalFinanceNarrativeIssue(warning.code) ? "medium" : normalizeCriticality(warning.severity);
    const mapped = issue({ code: warning.code, field: warning.values ? Object.keys(warning.values)[0] : undefined, blockId: warning.blockId, block: blockLabelById[warning.blockId] ?? warning.blockId, message: warning.message, severity, calculationPolicy: warning.calculationPolicy }, template);
    if (severity === "critical" && !isNonFatalFinanceNarrativeIssue(warning.code)) blockingIssues.push(mapped);
    else nonBlockingWarnings.push(mapped);
  }

  const uniqueBlocking = dedupeIssues(blockingIssues);
  const uniqueWarnings = dedupeIssues(nonBlockingWarnings.filter((warning) => !uniqueBlocking.some((item) => item.code === warning.code && item.field === warning.field)));
  const formulaKind = revenue.formulaKind ?? (revenue.conversionApplied ? "traffic_conversion" : revenue.volume?.period === "day" ? "daily_units" : "monthly_units");

  return {
    ready: uniqueBlocking.length === 0,
    blockingIssues: uniqueBlocking,
    nonBlockingWarnings: uniqueWarnings,
    requiredVisibleFields,
    calculationInputs: {
      revenue,
      monthlyUnits: revenue.monthlyCapacity,
      monthlySales: revenue.monthlyCapacity,
      averageTicket: revenue.averagePrice,
      monthlyRevenue: revenue.monthlyRevenue,
      annualRevenue: revenue.annualRevenue,
      formulaKind,
      source: revenue.monthlyRevenue > 0 ? "calculated" : "assumption"
    }
  };
}

function dedupeIssues<T extends ReportReadinessIssue>(issues: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of issues) {
    const key = `${item.code}:${item.field ?? ""}:${item.blockId ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}
