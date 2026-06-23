import { classifyBusiness } from "../business/businessClassifier.ts";
import type { Locale, StructuredProjectData } from "../types/project.ts";
import { sanitizeUserFacingTextareaValue } from "../i18n/userFacingSanitizer.ts";

export type DataQualitySeverity = "low" | "medium" | "high";

export type CalculationPolicy = "structured_fields_used" | "free_text_fallback_used" | "assumption_used";

export type InterviewDataQualityWarning = {
  code: string;
  blockId: string;
  severity: DataQualitySeverity;
  message: string;
  calculationPolicy?: CalculationPolicy;
  values?: Record<string, string | number>;
};

export const FINANCE_TEXT_CONFLICT_CODE = "finance_text_conflict";
export const FINANCE_TEXT_FALLBACK_CODE = "finance_text_fallback_used";

const financingTextAmountWarningMessages: Record<Locale, string> = {
  ru: "В текстовом описании финансирования есть ориентировочные суммы. Для расчётов использованы числовые поля формы.",
  uz: "Moliyalashtirish tavsifida taxminiy summalar ko‘rsatilgan. Hisob-kitoblar uchun shakldagi raqamli maydonlar ishlatildi.",
  en: "The financing description contains approximate amounts. The calculation used the structured numeric fields from the form."
};

function normalizeLocale(locale: unknown): Locale {
  return locale === "uz" || locale === "en" ? locale : "ru";
}

function financingTextAmountWarningMessage(locale: unknown): string {
  return financingTextAmountWarningMessages[normalizeLocale(locale)];
}

const financingTextFallbackMessages: Record<Locale, string> = {
  ru: "Часть числовых полей финансирования не была заполнена. Для предварительного расчёта использована явно указанная сумма из текстового описания.",
  uz: "Moliyalashtirish bo‘yicha ayrim raqamli maydonlar to‘ldirilmagan. Dastlabki hisob-kitob uchun matnli tavsifdagi aniq summa ishlatildi.",
  en: "Some structured financing fields were not filled in. The preliminary calculation used a clearly stated amount from the financing description."
};

function financingTextFallbackMessage(locale: unknown): string {
  return financingTextFallbackMessages[normalizeLocale(locale)];
}

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const normalized = value.replace(/\s+/g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export function moneyNumber(data: StructuredProjectData, key: keyof StructuredProjectData | string): number {
  const snapshot = data.moneyValues?.[String(key)];
  if (snapshot && Number.isFinite(Number(snapshot.amountUZS))) return Number(snapshot.amountUZS);
  return toNumber((data as Record<string, unknown>)[String(key)]);
}


function toBooleanFlag(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return ["yes", "true", "1", "да", "ha", "xa", "бор", "есть"].includes(normalized);
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isFoodService(data: StructuredProjectData): boolean {
  const profile = data.businessProfile && Object.keys(data.businessProfile).length > 0
    ? data.businessProfile
    : classifyBusiness({ businessType: data.businessType, businessIdea: data.businessIdea, region: data.region, language: data.userLanguage, answers: data });
  return String((profile as Record<string, unknown>).category ?? "") === "food_service";
}

function normalizedText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function financeText(data: StructuredProjectData): string {
  const raw = [
    normalizedText(data.sectionNotes?.finance),
    normalizedText(data.otherDetails?.financing),
    normalizedText(data.otherDetails?.finance),
    normalizedText(data.calculatedExpenses)
  ].filter(Boolean).join("\n");
  return sanitizeUserFacingTextareaValue(raw, { fieldKey: "sectionNotes.finance", locale: data.userLanguage ?? "ru" });
}

const moneyPattern = "(\\d[\\d\\s.,]*(?:\\s*(?:млрд|миллиард(?:ов|а)?|млн|миллион(?:ов|а)?|тыс|uzs|сум|usd|долл(?:аров)?))?)";

function parseMoneyValue(raw: string): number | undefined {
  const unitMatch = raw.match(/(млрд|миллиард(?:ов|а)?|млн|миллион(?:ов|а)?|тыс|usd|долл(?:аров)?|uzs|сум)/i);
  const numberMatch = raw.match(/\d[\d\s.,]*/);
  if (!numberMatch) return undefined;
  const numericText = numberMatch[0].replace(/\s+/g, "").replace(",", ".");
  const amount = Number(numericText);
  if (!Number.isFinite(amount)) return undefined;
  const unit = unitMatch?.[1]?.toLowerCase() ?? "";
  if (/млрд|миллиард/.test(unit)) return Math.round(amount * 1_000_000_000);
  if (/млн|миллион/.test(unit)) return Math.round(amount * 1_000_000);
  if (/тыс/.test(unit)) return Math.round(amount * 1_000);
  return Math.round(amount);
}

function sentenceList(text: string): string[] {
  return text
    .split(/[.;\n]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) => !/__money|requestedLoanAmount|ownContributionAmount|collateralEstimatedValue|exchangeRateSnapshot|sample_|sectionNotes\./i.test(sentence));
}

function moneyValuesIn(sentence: string): number[] {
  const regex = new RegExp(moneyPattern, "gi");
  const values: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sentence)) !== null) {
    const value = parseMoneyValue(match[1] ?? "");
    if (value && value > 0) values.push(value);
  }
  return values;
}

function amountForIntent(text: string, intentLabels: RegExp[]): number | undefined {
  for (const sentence of sentenceList(text)) {
    for (const labelPattern of intentLabels) {
      const labelSource = labelPattern.source.replace(/^\^|\$$/g, "");
      const after = new RegExp(`(?:${labelSource})[^\\d]{0,60}${moneyPattern}`, "i");
      const afterMatch = sentence.match(after);
      if (afterMatch?.[1]) return parseMoneyValue(afterMatch[1]);
      const before = new RegExp(`${moneyPattern}[^,.;\n]{0,60}(?:${labelSource})`, "i");
      const beforeMatch = sentence.match(before);
      if (beforeMatch?.[1]) return parseMoneyValue(beforeMatch[1]);
    }
  }
  return undefined;
}

type MoneyMention = { amount: number; start: number; end: number };

function moneyMentions(sentence: string): MoneyMention[] {
  const regex = new RegExp(moneyPattern, "gi");
  const mentions: MoneyMention[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sentence)) !== null) {
    const value = parseMoneyValue(match[1] ?? "");
    if (value && value > 0) mentions.push({ amount: value, start: match.index, end: regex.lastIndex });
  }
  return mentions;
}

function amountForIntentHighConfidence(text: string, intentLabels: RegExp[]): number | undefined {
  for (const sentence of sentenceList(text)) {
    const mentions = moneyMentions(sentence);
    if (!mentions.length) continue;

    let best: { amount: number; distance: number } | undefined;
    for (const labelPattern of intentLabels) {
      const flags = labelPattern.flags.includes("g") ? labelPattern.flags : `${labelPattern.flags}g`;
      const labelRegex = new RegExp(labelPattern.source, flags);
      let labelMatch: RegExpExecArray | null;
      while ((labelMatch = labelRegex.exec(sentence)) !== null) {
        const labelStart = labelMatch.index;
        const labelEnd = labelRegex.lastIndex;
        for (const mention of mentions) {
          const beforeDistance = labelStart - mention.end;
          const afterDistance = mention.start - labelEnd;
          const distance = beforeDistance >= 0 ? beforeDistance : afterDistance >= 0 ? afterDistance : 0;
          if (distance < 0 || distance > 80) continue;
          if (!best || distance < best.distance) best = { amount: mention.amount, distance };
        }
      }
    }
    if (best) return best.amount;
  }
  return undefined;
}

export type FinanceTextFallbackField = "ownContributionAmount" | "requestedLoanAmount" | "requestedLeasingAmount";

export type FinanceTextFallback = {
  field: FinanceTextFallbackField;
  amountUZS: number;
  confidence: "high";
};

export type FinanceTextFallbacks = Partial<Record<FinanceTextFallbackField, FinanceTextFallback>>;

export function resolveFinanceTextFallbacks(data: StructuredProjectData): FinanceTextFallbacks {
  const text = financeText(data);
  if (!text.trim()) return {};
  const fallbacks: FinanceTextFallbacks = {};
  const ownStructured = moneyNumber(data, "ownContributionAmount") || moneyNumber(data, "ownContribution") || moneyNumber(data, "ownContributionUZS");
  const loanStructured = moneyNumber(data, "requestedLoanAmount") || moneyNumber(data, "requestedLoanUZS");
  const leasingStructured = moneyNumber(data, "requestedLeasingAmount") || moneyNumber(data, "requestedLeasingUZS");
  if (ownStructured <= 0) {
    const ownText = amountForIntentHighConfidence(text, [/собственн\w*\s+средств\w*/i, /собственн\w*\s+вклад/i, /own\s+(?:funds|contribution)/i, /o['‘’`]?z\s+mablag/i]);
    if (ownText && ownText > 0) fallbacks.ownContributionAmount = { field: "ownContributionAmount", amountUZS: ownText, confidence: "high" };
  }
  if (data.creditNeeded === "yes" && loanStructured <= 0) {
    const loanText = amountForIntentHighConfidence(text, [/кредит(?:\D|$)/i, /займ/i, /loan/i, /kredit/i, /qarz/i]);
    if (loanText && loanText > 0) fallbacks.requestedLoanAmount = { field: "requestedLoanAmount", amountUZS: loanText, confidence: "high" };
  }
  if (data.needsLeasing === true && leasingStructured <= 0) {
    const leasingText = amountForIntentHighConfidence(text, [/лизинг/i, /leasing/i, /lizing/i]);
    if (leasingText && leasingText > 0) fallbacks.requestedLeasingAmount = { field: "requestedLeasingAmount", amountUZS: leasingText, confidence: "high" };
  }
  return fallbacks;
}

export function applyFinanceTextFallbacks(data: StructuredProjectData): StructuredProjectData {
  const fallbacks = resolveFinanceTextFallbacks(data);
  if (!Object.keys(fallbacks).length) return data;
  const next: StructuredProjectData = { ...data };
  if (fallbacks.ownContributionAmount && (moneyNumber(next, "ownContributionAmount") || moneyNumber(next, "ownContribution") || moneyNumber(next, "ownContributionUZS")) <= 0) {
    next.ownContributionAmount = fallbacks.ownContributionAmount.amountUZS;
    next.ownContribution = fallbacks.ownContributionAmount.amountUZS;
    next.ownContributionUZS = fallbacks.ownContributionAmount.amountUZS;
    next.ownContributionCurrency = next.ownContributionCurrency ?? "UZS";
  }
  if (fallbacks.requestedLoanAmount && (moneyNumber(next, "requestedLoanAmount") || moneyNumber(next, "requestedLoanUZS")) <= 0) {
    next.requestedLoanAmount = fallbacks.requestedLoanAmount.amountUZS;
    next.requestedLoanUZS = fallbacks.requestedLoanAmount.amountUZS;
    next.requestedLoanCurrency = next.requestedLoanCurrency ?? "UZS";
  }
  if (fallbacks.requestedLeasingAmount && (moneyNumber(next, "requestedLeasingAmount") || moneyNumber(next, "requestedLeasingUZS")) <= 0) {
    next.requestedLeasingAmount = fallbacks.requestedLeasingAmount.amountUZS;
    next.requestedLeasingUZS = fallbacks.requestedLeasingAmount.amountUZS;
    next.requestedLeasingCurrency = next.requestedLeasingCurrency ?? "UZS";
  }
  return next;
}

export function detectFinanceTextFallbackWarnings(data: StructuredProjectData): InterviewDataQualityWarning[] {
  const fallbacks = resolveFinanceTextFallbacks(data);
  const fields = Object.values(fallbacks).map((fallback) => fallback.field);
  if (!fields.length) return [];
  return [{
    code: FINANCE_TEXT_FALLBACK_CODE,
    blockId: "financing",
    severity: "medium",
    message: financingTextFallbackMessage(data.userLanguage),
    calculationPolicy: "free_text_fallback_used",
    values: {
      fields: fields.join(", "),
      calculationPolicy: "free_text_fallback_used"
    }
  }];
}


function differsMaterially(a: number, b: number): boolean {
  if (a <= 0 || b <= 0) return false;
  const delta = Math.abs(a - b);
  const base = Math.max(a, b);
  return delta >= 5_000_000 && delta / base >= 0.1;
}

export function detectFinanceTextConflicts(data: StructuredProjectData): InterviewDataQualityWarning[] {
  const text = financeText(data);
  if (!text.trim()) return [];
  const ownText = amountForIntent(text, [/собственн\w*\s+средств\w*/i, /собственн\w*\s+вклад/i, /own\s+contribution/i]);
  const loanText = amountForIntent(text, [/кредит(?:\D|$)/i, /займ/i, /loan/i]);
  const leasingText = amountForIntent(text, [/лизинг/i, /leasing/i, /lizing/i]);
  const ownStructured = moneyNumber(data, "ownContributionAmount") || moneyNumber(data, "ownContribution") || moneyNumber(data, "ownContributionUZS");
  const loanStructured = moneyNumber(data, "requestedLoanAmount") || moneyNumber(data, "requestedLoanUZS");
  const leasingStructured = moneyNumber(data, "requestedLeasingAmount") || moneyNumber(data, "requestedLeasingUZS");
  const conflicts: string[] = [];
  if (ownText && differsMaterially(ownText, ownStructured)) conflicts.push(`собственные средства: текст ${ownText}, поля ${ownStructured}`);
  if (loanText && differsMaterially(loanText, loanStructured)) conflicts.push(`кредит: текст ${loanText}, поля ${loanStructured}`);
  if (leasingText && differsMaterially(leasingText, leasingStructured)) conflicts.push(`лизинг: текст ${leasingText}, поля ${leasingStructured}`);
  if (!conflicts.length) return [];
  return [{
    code: FINANCE_TEXT_CONFLICT_CODE,
    blockId: "financing",
    severity: "medium",
    message: financingTextAmountWarningMessage(data.userLanguage),
    calculationPolicy: "structured_fields_used",
    values: { conflicts: conflicts.join("; "), calculationPolicy: "structured_fields_used" }
  }];
}

export function detectInterviewDataQualityWarnings(data: StructuredProjectData): InterviewDataQualityWarning[] {
  const warnings: InterviewDataQualityWarning[] = [];
  const financeFallbacks = resolveFinanceTextFallbacks(data);
  if (isFoodService(data)) {
    const dailyOrders = toNumber(data.dailyCovers ?? data.dailyOrdersCapacity ?? data.firstMonthOrdersPerDay ?? data.stableOrdersPerDay);
    if (dailyOrders > 0 && dailyOrders <= 2) {
      warnings.push({
        code: "low_daily_orders",
        blockId: "sales",
        severity: "high",
        message: "Значение 1–2 заказа/день выглядит слишком низким для мини-пекарни или точки общепита. Обычно для небольшой точки проверяют ориентир 80–200 заказов/день.",
        values: { dailyOrders }
      });
    } else if (dailyOrders > 0 && dailyOrders < 20) {
      warnings.push({
        code: "suspicious_low_orders",
        blockId: "sales",
        severity: "medium",
        message: "План продаж выглядит низким для стационарной точки общепита. Проверьте, не введено ли месячное значение вместо дневного.",
        values: { dailyOrders }
      });
    }
    const averageTicket = moneyNumber(data, "averageTicket");
    const rawUnitCost = moneyNumber(data, "rawMaterialCostPerUnit");
    const foodCostPct = toNumber(data.foodCostPct);
    const costPerCheck = moneyNumber(data, "costPerCheck") || moneyNumber(data, "costPerOrder");
    if (averageTicket > 0 && rawUnitCost > 0 && foodCostPct <= 0 && costPerCheck <= 0 && rawUnitCost / averageTicket < 0.2) {
      warnings.push({
        code: "average_ticket_unit_cost_conflict",
        blockId: "sales",
        severity: "medium",
        message: "Средний чек и себестоимость похожи на разные единицы расчета: чек указан целиком, а себестоимость — за одну позицию. Для пекарни лучше указать себестоимость среднего чека или процент себестоимости от выручки.",
        values: { averageTicket, rawMaterialCostPerUnit: rawUnitCost }
      });
    }
  }

  if (/ташкентская\s+область|tashkent\s+region|toshkent\s+viloyati/i.test(String(data.region ?? "")) && /юну?сабад|yunus[oa]bod|yunusabad/i.test(String(data.district ?? ""))) {
    warnings.push({
      code: "district_region_mismatch",
      blockId: "location",
      severity: "high",
      message: "Юнусабад относится к городу Ташкенту, а не к Ташкентской области. Проверьте регион и район.",
      values: { region: String(data.region), district: String(data.district) }
    });
  }

  const effectiveLoanAmount = moneyNumber(data, "requestedLoanAmount") || moneyNumber(data, "requestedLoanUZS") || financeFallbacks.requestedLoanAmount?.amountUZS || 0;
  if (data.creditNeeded === "yes" && (effectiveLoanAmount <= 0 || toNumber(data.loanTermMonths) <= 0 || !hasText(data.loanPurpose))) {
    warnings.push({
      code: "loan_terms_missing",
      blockId: "financing",
      severity: effectiveLoanAmount <= 0 || toNumber(data.loanTermMonths) <= 0 ? "high" : "medium",
      message: "Кредит выбран, но сумма, срок и/или цель кредита не заполнены полностью."
    });
  }

  const effectiveLeasingAmount = moneyNumber(data, "requestedLeasingAmount") || moneyNumber(data, "requestedLeasingUZS") || financeFallbacks.requestedLeasingAmount?.amountUZS || 0;
  if (data.needsLeasing === true && (effectiveLeasingAmount <= 0 || toNumber(data.leasingTermMonths) <= 0 || !hasText(data.leasingItem))) {
    warnings.push({
      code: "leasing_terms_missing",
      blockId: "financing",
      severity: effectiveLeasingAmount <= 0 || toNumber(data.leasingTermMonths) <= 0 ? "high" : "medium",
      message: "Лизинг выбран, но сумма, срок и объект лизинга не заполнены полностью."
    });
  }

  const ownContribution = moneyNumber(data, "ownContributionAmount") || moneyNumber(data, "ownContribution") || moneyNumber(data, "ownContributionUZS") || financeFallbacks.ownContributionAmount?.amountUZS || 0;
  if (ownContribution <= 0 && (data.creditNeeded === "yes" || data.needsLeasing === true)) {
    warnings.push({
      code: "zero_own_contribution",
      blockId: "financing",
      severity: "medium",
      message: "Собственные средства равны нулю при выбранном внешнем финансировании. Это снижает готовность к кредиту или лизингу."
    });
  }

  const collateralValue = moneyNumber(data, "collateralEstimatedValue");
  const collateralType = String(data.collateralType ?? "");
  const vehicleCollateral = /cobalt|chevrolet|nexia|lacetti|gentra|spark|damas|malibu|авто|машин|car|vehicle/i.test(collateralType);
  const collateralAvailable = toBooleanFlag(data.collateralAvailable);
  if (collateralAvailable && vehicleCollateral && collateralValue > 0 && collateralValue < 5_000_000) {
    warnings.push({
      code: "suspicious_low_vehicle_collateral",
      blockId: "financing",
      severity: "high",
      message: "Стоимость залога выглядит слишком низкой для автомобиля. Проверьте валюту или количество нулей.",
      values: { collateralType, collateralEstimatedValue: collateralValue }
    });
  }
  if (collateralAvailable && (!hasText(data.collateralType) || collateralValue <= 0)) {
    warnings.push({
      code: "collateral_details_missing",
      blockId: "financing",
      severity: "medium",
      message: "Залог отмечен как доступный, но тип или оценка залога не заполнены. Это предупреждение не блокирует расчет, но требует проверки перед подачей в банк."
    });
  }

  for (const role of data.staffPlan?.roles ?? []) {
    if (toNumber(role.monthlySalaryAmount) <= 0 || toNumber(role.monthlySalaryUZS) <= 0 && role.monthlySalaryAmount === undefined) {
      warnings.push({
        code: "zero_payroll",
        blockId: "operations",
        severity: "high",
        message: "В плане персонала есть должность с нулевой или неуказанной зарплатой. ФОТ и EBITDA нужно проверить."
      });
      break;
    }
  }

  warnings.push(...detectFinanceTextConflicts(data));
  warnings.push(...detectFinanceTextFallbackWarnings(data));
  return warnings;
}
