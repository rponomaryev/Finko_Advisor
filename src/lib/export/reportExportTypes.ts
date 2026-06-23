import { getTranslations, type AppLocale } from "../i18n/index.ts";
import { translateBlock, translateOptionValue, translateQuestion } from "../i18n/interviewLabels.ts";
import { getReportLocale, reportMessages, tReport } from "../i18n/reportMessages.ts";
import { localizeProfileValue } from "../i18n/businessProfileLabels.ts";
import { getLocalizedDisclaimer } from "../report/disclaimer.ts";
import { resolveReportData, type ReportData } from "../services/reportService.ts";
import { flattenTemplateQuestions, resolveTemplateFromProject } from "../services/templateService.ts";
import type { FinancialResult, InterviewQuestion, RiskItem } from "../types/project.ts";
import { formatCurrencyFull, formatCurrencyWithOriginal } from "../utils/formatCurrency.ts";
import { getProjectProfile } from "../utils/projectClient.ts";
import { labelValue, localizeUnitLabel } from "../utils/labels.ts";
import { localizeReportData } from "../report/localizeReport.ts";
import type { AIGeneratedReport } from "../report/aiReportGenerator.ts";
import type { WebResearchResult } from "../market/webResearchService.ts";
import {
  formatCapexLabel,
  formatOpexLabel,
  formatFormulaRows,
  formatWarningMessage,
  formatWarningTitle,
  formatWarningValue,
  formatWarningValueLabel,
  formatRiskLevel,
  localizeRisks,
  reportMetric,
  reportSourceLabel,
  reportStatus
} from "../report/reportFormatters.ts";
import { getGlossaryRows, type GlossaryRow } from "../report/glossary.ts";
import { cleanInlineSourcePlaceholders, cleanSourceMetadataText, formatSourceCitation, formatSourceListItem, normalizeSourceMetadata, sourceNeedsClarificationLabel } from "../report/sourceCitationFormatter.ts";
import { buildBusinessContext, filterWebResearchSourcesForReport, hasAiAnalysisPlaceholderLeak, cleanAiAnalysisText } from "../report/evidenceEngine.ts";
import { sanitizeUserFacingObject, sanitizeUserFacingTextareaValue } from "../i18n/userFacingSanitizer.ts";
import { sourceRegistry, type DataSource } from "../data/sourceRegistry.ts";
import { formatDistrict, formatRegion } from "../location/locationNormalizer.ts";

type ExportTableRow = {
  label: string;
  value: string;
  comment?: string;
};

export type ReportInterviewRow = {
  section: string;
  field: string;
  answer: string;
  unit: string;
  required: string;
};

export type ReportFinancialRow = {
  indicator: string;
  value: string;
  unit: string;
  comment: string;
};

export type ReportRiskRow = {
  risk: string;
  level: string;
  reason: string;
  recommendation: string;
};

export type ReportMarketDataRow = {
  indicator: string;
  year: string;
  region: string;
  value: string;
  unit: string;
  currency: string;
  source: string;
  lastUpdated: string;
  matchQuality: string;
  explanation: string;
};

export type ReportImportExportRow = {
  type: string;
  hsCode: string;
  productCategory: string;
  year: string;
  country: string;
  valueUsd: string;
  volume: string;
  unit: string;
  source: string;
};

export type ReportRecommendationRow = {
  area: string;
  recommendation: string;
  priority: string;
};

export type ReportFormulaExportRow = {
  indicator: string;
  formula: string;
  substitution: string;
  result: string;
  source: string;
};

export type ReportBreakdownRow = {
  item: string;
  amount: string;
  source: string;
  comment: string;
};

export type ReportWarningRow = {
  title: string;
  message: string;
  values: string;
  severity: string;
};

export type ReportSourceRow = {
  sourceName: string;
  sourceType: string;
  url: string;
  year: string;
  lastUpdated: string;
  notes: string;
};

export type PreparedReportExport = {
  locale: AppLocale;
  fileNameBase: string;
  title: string;
  cover: ExportTableRow[];
  summary: ExportTableRow[];
  executiveSummary: string[];
  interviewRows: ReportInterviewRow[];
  businessProfileRows: ReportBreakdownRow[];
  marketEvidenceRows: ReportBreakdownRow[];
  sensitivityRows: ReportBreakdownRow[];
  documentRows: ReportBreakdownRow[];
  premisesRows: ReportBreakdownRow[];
  actionPlanRows: ReportBreakdownRow[];
  assumptionRows: ReportBreakdownRow[];
  financialRows: ReportFinancialRow[];
  risks: ReportRiskRow[];
  marketData: ReportMarketDataRow[];
  importExport: ReportImportExportRow[];
  recommendations: ReportRecommendationRow[];
  formulaRows: ReportFormulaExportRow[];
  capexRows: ReportBreakdownRow[];
  opexRows: ReportBreakdownRow[];
  financingRows: ReportBreakdownRow[];
  workingCapitalRows: ReportBreakdownRow[];
  collateralRows: ReportBreakdownRow[];
  warnings: ReportWarningRow[];
  sources: ReportSourceRow[];
  glossaryRows: GlossaryRow[];
  detailedConclusion: string[];
  financingRecommendation: string;
  disclaimer: string;
  generatedAt: string;
  aiReport?: AIGeneratedReport | null;
  webResearch?: WebResearchResult | null;
  report: ReportData;
};

type ProjectRecord = Record<string, unknown>;

function getValueByPath(target: Record<string, unknown>, path: string): unknown {
  if (!path.includes(".")) return target[path];
  const [root, child] = path.split(".");
  const rootValue = target[root];
  if (!rootValue || typeof rootValue !== "object") return undefined;
  return (rootValue as Record<string, unknown>)[child];
}

function formatDate(value: string, locale: AppLocale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const formatterLocale = locale === "uz" ? "uz-UZ" : locale === "en" ? "en-US" : "ru-RU";
  return new Intl.DateTimeFormat(formatterLocale, {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatStaffPlan(rawValue: unknown, locale: AppLocale) {
  const messages = getTranslations(locale).report;
  if (!rawValue || typeof rawValue !== "object") return messages.notFilled;
  const roles = (rawValue as { roles?: Array<{ role?: unknown; count?: unknown; monthlySalary?: unknown; monthlySalaryAmount?: unknown }> }).roles;
  if (!Array.isArray(roles) || roles.length === 0) return messages.notFilled;
  const visibleRoles = roles
    .map((role) => ({
      role: String(role.role ?? "").trim(),
      count: Number(role.count ?? 0),
      monthlySalary: Number(role.monthlySalaryAmount ?? role.monthlySalary ?? 0)
    }))
    .filter((role) => role.role || role.count > 0 || role.monthlySalary > 0);
  if (!visibleRoles.length) return messages.notFilled;
  const totalEmployees = visibleRoles.reduce((sum, role) => sum + (Number.isFinite(role.count) ? role.count : 0), 0);
  const payroll = visibleRoles.reduce((sum, role) => sum + (Number.isFinite(role.monthlySalary) ? role.monthlySalary : 0) * (Number.isFinite(role.count) ? role.count : 0), 0);
  const roleFallback = locale === "en" ? "Staff" : locale === "uz" ? "Xodimlar" : "Сотрудники";
  const roleMap: Record<string, Record<AppLocale, string>> = {
    seller: { ru: "Продавец-консультант", uz: "Sotuvchi-maslahatchi", en: "Sales consultant" },
    cashier: { ru: "Кассир", uz: "Kassir", en: "Cashier" },
    administrator: { ru: "Администратор", uz: "Administrator", en: "Administrator" },
    tailor: { ru: "Мастер по ремонту и подгонке одежды", uz: "Tikuvchi / kiyim ta'miri ustasi", en: "Tailor / clothing repair master" },
    seamstress: { ru: "Портной / швея", uz: "Tikuvchi", en: "Tailor / seamstress" },
    helper: { ru: "Помощник мастера", uz: "Yordamchi", en: "Assistant" },
    manager: { ru: "Управляющий", uz: "Boshqaruvchi", en: "Manager" },
    operator: { ru: "Оператор", uz: "Operator", en: "Operator" }
  };
  const cleanRole = (value: string) => {
    const key = value.trim().toLowerCase();
    const mapped = roleMap[key]?.[locale] ?? value;
    return !mapped || /требуется проверка|manual verification|not filled|undefined|null/i.test(mapped) ? roleFallback : mapped;
  };
  const roleText = visibleRoles.map((role) => `${cleanRole(role.role)} - ${role.count || 0}`).join("; ");
  const totalLabel = locale === "en" ? "Total" : locale === "uz" ? "Jami" : "Итого";
  const payrollLabel = locale === "en" ? "monthly payroll" : locale === "uz" ? "oylik ish haqi fondi" : "фонд оплаты труда в месяц";
  return `${roleText}. ${totalLabel}: ${totalEmployees}; ${payrollLabel}: ${formatCurrencyFull(payroll, "UZS", locale)}`;
}

function formatObjectAnswer(rawValue: Record<string, unknown>, locale: AppLocale) {
  const messages = getTranslations(locale).report;
  const entries = Object.entries(rawValue)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${labelValue(key, locale)}: ${labelValue(value, locale)}`);
  return entries.length ? entries.join("; ") : messages.notFilled;
}

function formatQuestionAnswer(question: InterviewQuestion, rawValue: unknown, locale: AppLocale) {
  const messages = getTranslations(locale).report;
  if (rawValue === undefined || rawValue === null || rawValue === "" || rawValue === "__later__") {
    return messages.notFilled;
  }
  if (question.type === "staffPlan") return formatStaffPlan(rawValue, locale);
  if (typeof rawValue === "number" && rawValue < 0) return messages.notFilled;
  if (typeof rawValue === "number" && question.unit === "UZS") {
    return formatCurrencyFull(rawValue, "UZS", locale);
  }
  if (typeof rawValue === "number" && question.unit === "%") {
    return `${rawValue}%`;
  }
  if (typeof rawValue === "number" && question.unit) {
    return `${rawValue.toLocaleString(locale === "ru" ? "ru-RU" : locale === "uz" ? "uz-UZ" : "en-US")} ${localizeUnitLabel(question.unit, locale)}`;
  }
  if (Array.isArray(rawValue)) {
    return rawValue.map((value) => translateOptionValue(locale, value)).join(", ");
  }
  if (typeof rawValue === "object") {
    return formatObjectAnswer(rawValue as Record<string, unknown>, locale);
  }
  const translated = translateOptionValue(locale, rawValue);
  return question.type === "textarea" ? sanitizeUserFacingTextareaValue(translated, { fieldKey: question.key, locale }) : translated;
}

function normalizeDisplayedFinanceText(answer: string, profile: ReturnType<typeof getProjectProfile>, locale: AppLocale) {
  if (profile.loanRepaymentType !== "equal_principal") return answer;
  const replacement = locale === "en" ? "differentiated method" : locale === "uz" ? "differensial usul" : "дифференцированный метод";
  return answer
    .replace(/погашени[ея]\s+равными\s+частями/gi, `погашение: ${replacement}`)
    .replace(/равными\s+частями/gi, replacement)
    .replace(/equal\s+(?:parts|installments|principal)/gi, replacement);
}

function buildInterviewRows(project: ProjectRecord, locale: AppLocale) {
  const messages = getTranslations(locale).report;
  const profile = getProjectProfile(project);
  const exportQuestions = flattenTemplateQuestions(resolveTemplateFromProject(project))
    .map(({ block, question }) => ({
      blockName: translateBlock(locale, block.id, block.name, block.description).name,
      question: translateQuestion(locale, question)
    }));

  return exportQuestions.map(({ blockName, question }) => {
    const moneyValue = profile.moneyValues?.[question.key];
    const rawAnswer = moneyValue
      ? formatCurrencyWithOriginal(moneyValue.amountUZS, moneyValue.sourceAmount, moneyValue.sourceCurrency, locale)
      : formatQuestionAnswer(question, getValueByPath(profile as Record<string, unknown>, question.key), locale);
    const answer = question.key === "sectionNotes.finance" ? normalizeDisplayedFinanceText(rawAnswer, profile, locale) : rawAnswer;
    return {
      section: blockName,
      field: question.label,
      answer,
      unit: localizeUnitLabel(question.unit, locale),
      required: question.optional ? messages.requiredNo : messages.requiredYes
    };
  });
}

function buildFinancialRows(report: ReportData, financial: FinancialResult, locale: AppLocale): ReportFinancialRow[] {
  const rows: ReportFinancialRow[] = [];

  for (const row of report.keyFigures ?? []) {
    rows.push({
      indicator: row[0],
      value: row[1],
      unit: "",
      comment: row[2]
    });
  }

  rows.push({
    indicator: reportMetric("equipment", locale),
    value: formatCurrencyFull(financial.capex.equipmentCost, "UZS", locale),
    unit: "UZS",
    comment: locale === "en" ? "CapEx" : locale === "uz" ? "Boshlangich investitsiyalar" : "Стартовые вложения"
  });
  rows.push({
    indicator: reportMetric("premisesSetup", locale),
    value: formatCurrencyFull(financial.capex.premisesSetupCost, "UZS", locale),
    unit: "UZS",
    comment: locale === "en" ? "CapEx" : locale === "uz" ? "Boshlangich investitsiyalar" : "Стартовые вложения"
  });
  rows.push({
    indicator: reportMetric("workingCapital", locale),
    value: formatCurrencyFull(financial.workingCapital.requiredWorkingCapital, "UZS", locale),
    unit: "UZS",
    comment: tReport(reportMessages.comments.workingCapitalFormula, locale).replace("{months}", String(financial.workingCapital.workingCapitalMonths))
  });
  rows.push({
    indicator: reportMetric("ownContribution", locale),
    value: formatCurrencyWithOriginal(
      financial.financing.ownContributionUZS,
      financial.financing.ownContributionAmount,
      financial.financing.ownContributionCurrency,
      locale
    ),
    unit: "",
    comment: `${financial.financing.ownContributionPct}%`
  });
  rows.push({
    indicator: reportMetric("paybackPeriod", locale),
    value: financial.profitability.paybackMonths === null
      ? reportStatus("notApplicable", locale)
      : `${financial.profitability.paybackMonths} ${locale === "ru" ? "мес" : locale === "uz" ? "oy" : "months"}`,
    unit: "",
    comment: financial.profitability.paybackMonths === null
      ? tReport(reportMessages.comments.noNegativeCashPayback, locale)
      : tReport(reportMessages.comments.investmentNetCash, locale)
  });

  const localizedRows = rows.map((row) => {
    const rawIndicator = String(row.indicator ?? "");
    let indicator = cleanLooseExportText(row.indicator, locale);
    if (locale === "en") {
      if (/revenue/i.test(rawIndicator)) indicator = rawIndicator.includes("ежегодно") ? "Annual revenue" : "Monthly revenue";
      else if (/loan\s+payment/i.test(rawIndicator)) indicator = "Monthly loan payment";
      else if (/loan\s+rate/i.test(rawIndicator)) indicator = "Annual loan rate";
      else if (/leasing\s+payment/i.test(rawIndicator)) indicator = "Monthly leasing payment";
      else if (/leasing\s+service/i.test(rawIndicator)) indicator = "Total debt and leasing service";
      else if (rawIndicator.includes("фонд оплаты труда")) indicator = "Monthly payroll";
      else if (/валовая\s+маржа|gross\s+margin/i.test(rawIndicator)) indicator = "Gross margin";
      else if (/себестоимость|cost\s+of\s+goods\s+sold/i.test(rawIndicator)) indicator = /per\s+unit/i.test(rawIndicator) ? "Cost of goods sold per unit" : "Cost of goods sold";
    }
    return {
      indicator,
      value: cleanLooseExportText(row.value, locale),
      unit: cleanLooseExportText(row.unit, locale),
      comment: cleanLooseExportText(row.comment, locale)
    };
  });

  const seen = new Set<string>();
  return localizedRows.filter((row) => {
    const key = row.indicator.toLocaleLowerCase(locale === "ru" ? "ru-RU" : locale === "uz" ? "uz-UZ" : "en-US").replace(/\s+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildRiskRows(risks: RiskItem[], locale: AppLocale): ReportRiskRow[] {
  const messages = getTranslations(locale).report;
  return localizeRisks(risks, locale).map((risk) => ({
    risk: risk.title,
    level: formatRiskLevel(risk.level, locale, risk.score),
    reason: risk.reason,
    recommendation: risk.mitigation || messages.notFilled
  }));
}

function buildRecommendations(report: ReportData, locale: AppLocale): ReportRecommendationRow[] {
  return report.nextActions.map((action, index) => ({
    area: getTranslations(locale).report.actionPlan,
    recommendation: action,
    priority: index < 2 ? reportStatus("high", locale) : reportStatus("medium", locale)
  }));
}


function sourceLabel(source: unknown, locale: AppLocale) {
  return reportSourceLabel(source, locale);
}

function cleanLooseExportText(value: unknown, locale: AppLocale): string {
  const normalizeEnglish = (input: string) => input
    .split("Ежемесячные").join("Monthly")
    .split("ежегодно").join("Annual")
    .replace(/фонд\s+оплаты\s+труда/gi, "payroll")
    .replace(/Total\s+debt\s+и\s+leasing\s+service/gi, "Total debt and leasing service")
    .replace(/валовая\s+маржа/gi, "Gross margin")
    .replace(/себестоимость\s+of\s+goods\s+sold/gi, "Cost of goods sold")
    .replace(/себестоимость\s+продаж/gi, "Cost of goods sold")
    .replace(/Average\s+ticket\s+\/\s+цена/gi, "Average ticket / price")
    .replace(/денежный\s+поток/gi, "cash flow")
    .replace(/вводные\s+данные/gi, "input data")
    .replace(/стартовые\s+вложения/gi, "startup investments")
    .replace(/Startup\s+startup\s+investments/gi, "Startup investments")
    .replace(/операционные\s+расходы/gi, "operating expenses")
    .replace(/цена/gi, "price")
    .replace(/\s+и\s+/gi, " and ");

  if (locale === "en") {
    return normalizeEnglish(localizeLooseReportText(normalizeEnglish(String(value ?? "")), locale));
  }
  return localizeLooseReportText(value, locale);
}

function localizeLooseReportText(value: unknown, locale: AppLocale): string {
  let text = String(value ?? "");
  if (!text) return text;
  const replacements: Array<[RegExp, string, string]> = [
    [/\bFood\s+manufacturing\s+production\s+volume\b/gi, "Объём производства пищевой продукции", "Oziq-ovqat mahsulotlari ishlab chiqarish hajmi"],
    [/\bMarket\s+services\s*\/\s*vehicle\s+repair(?:\s+proxy)?\b/gi, "Рыночные услуги / ремонт автомобилей", "Bozor xizmatlari / avtomobil ta'miri"],
    [/\bCurrency\s+exposure\s+for\s+imported\s+parts\b/gi, "Валютный риск по импортным запчастям", "Import ehtiyot qismlar bo'yicha valyuta riski"],
    [/\bCBU\s*\/\s*supplier\s+quotation(?:\s+proxy)?\b/gi, "Курс ЦБ / коммерческое предложение поставщика", "Markaziy bank kursi / yetkazib beruvchi tijorat taklifi"],
    [/\bProject\s+evidence\b/gi, "Подтверждения по проекту", "Loyiha bo'yicha tasdiqlar"],
    [/\bCurrency\s+snapshot\b/gi, "Снимок курса валюты", "Valyuta kursi surati"],
    [/\bMonthly\s+операционные\s+расходы\b/gi, "Ежемесячные операционные расходы", "Oylik operatsion xarajatlar"],
    [/\bMonthly\s+Op\s*Ex\b|\bMonthly\s+OpEx\b/gi, "Ежемесячные операционные расходы", "Oylik operatsion xarajatlar"],
    [/\bgapPct\b/g, "Отклонение, %", "Og'ish, %"],
    [/\b100\s+index\b/gi, "Индекс 100", "100 indeks"],
    [/\bStatUz\b/g, "Национальный комитет статистики Республики Узбекистан", "O'zbekiston Respublikasi Statistika qo'mitasi"],
    [/\bsource-backed\b/gi, "подтвержденный источником", "manba bilan tasdiqlangan"],
    [/\bproxy\b/gi, "косвенный ориентир", "bilvosita orientir"],
    [/\bServices value added\b/gi, "Добавленная стоимость сектора услуг", "Xizmatlar sektorida qo'shilgan qiymat"],
    [/Broad services-sector context; not a product-specific statistic\.?/gi, "Широкий контекст сектора услуг; не является статистикой по конкретному продукту.", "Xizmatlar sektori bo'yicha keng kontekst; aniq mahsulot statistikasi emas."],
    [/\bHow much did cafes and restaurants sell in Uzbekistan in 2025\??\b/gi, "Объем продаж кафе и ресторанов в Узбекистане в 2025 году", "2025-yilda O'zbekistonda kafe va restoranlar savdosi hajmi"],
    [/\bNumber of operating enterprises and organizations \(annually\)\b/gi, "Число действующих предприятий и организаций (годовой показатель)", "Faol korxona va tashkilotlar soni (yillik)"],
    [/\bNumber of operating business entities in the field of trade \(annually\)\b/gi, "Число действующих субъектов предпринимательства в сфере торговли (годовой показатель)", "Savdo sohasidagi faol tadbirkorlik subyektlari soni (yillik)"],
    [/\bRetail trade turnover per capita \(quarterly\)\b/gi, "Оборот розничной торговли на душу населения (квартальный показатель)", "Aholi jon boshiga chakana savdo aylanmasi (choraklik)"],
    [/\bThe volume of services rendered by small businesses\b/gi, "Объем услуг, оказанных малыми предприятиями", "Kichik biznes tomonidan ko'rsatilgan xizmatlar hajmi"],
    [/\bThe number of newly established enterprises and organizations operating in the field of accommodation and catering services \(annual\)\b/gi, "Число вновь созданных предприятий и организаций в сфере размещения и общественного питания (годовой показатель)", "Joylashtirish va umumiy ovqatlanish sohasidagi yangi korxona va tashkilotlar soni (yillik)"],
    [/\bUse as a source-backed market benchmark\b/gi, "Использовать как рыночный ориентир, подтвержденный источником", "Manba bilan tasdiqlangan bozor orientiri sifatida ishlatish"],
    [/\bcompare the plan with local demand, prices and capacity assumptions\b/gi, "сравнить план с локальным спросом, ценами и допущениями по мощности", "rejani mahalliy talab, narxlar va quvvat farazlari bilan solishtirish"],
    [/\bassumptions\b/gi, "допущения", "farazlar"],
    [/\bsource-backed statistics\b/gi, "статистика с источниками", "manbali statistika"],
    [/\bunit economics\b/gi, "экономика единицы продажи", "sotuv birligi iqtisodiyoti"],
    [/\bLow ebitda margin\b/gi, "Низкая EBITDA-маржа", "EBITDA marjasi past"],
    [/\bLow dscr bank readiness\b/gi, "Низкое покрытие долга", "DSCR bo'yicha bank tayyorligi past"]
  ];
  for (const [pattern, ru, uz] of replacements) {
    if (locale === "ru") text = text.replace(pattern, ru);
    else if (locale === "uz") text = text.replace(pattern, uz);
  }
  if (locale === "en") {
    const englishReplacements: Array<[RegExp, string]> = [
      [/Ежемесячные\s+revenue/gi, "Monthly revenue"],
      [/ежегодно\s+revenue/gi, "Annual revenue"],
      [/Ежемесячные\s+loan\s+payment/gi, "Monthly loan payment"],
      [/ежегодно\s+loan\s+rate/gi, "Annual loan rate"],
      [/Ежемесячные\s+leasing\s+payment/gi, "Monthly leasing payment"],
      [/Total\s+debt\s+и\s+leasing\s+service/gi, "Total debt and leasing service"],
      [/Startup\s+стартовые\s+вложения/gi, "Startup investments"],
      [/стартовые\s+вложения/gi, "startup investments"],
      [/операционные\s+расходы/gi, "operating expenses"],
      [/себестоимость\s+продаж/gi, "cost of goods sold"],
      [/валовая\s+маржа/gi, "gross margin"],
      [/фонд\s+оплаты\s+труда/gi, "payroll"],
      [/денежный\s+поток/gi, "cash flow"],
      [/Разрыв\s+финансирования/gi, "Financing gap"],
      [/Собственные\s+средства/gi, "Own contribution"],
      [/Месячная\s+выручка/gi, "Monthly revenue"],
      [/Подробное\s+заключение/gi, "Detailed conclusion"],
      [/Финансовая\s+модель/gi, "Financial model"],
      [/Предупреждения/gi, "Warnings"],
      [/вводные\s+данные/gi, "input data"],
      [/данные\s+пользователя/gi, "user input"],
      [/допущения/gi, "assumptions"],
      [/каналы/gi, "channels"],
      [/спрос/gi, "demand"],
      [/рынок/gi, "market"],
      [/цена/gi, "price"],
      [/поставщики/gi, "suppliers"],
      [/поставка/gi, "delivery"],
      [/импортные/gi, "imported"],
      [/валютный\s+риск/gi, "currency risk"],
      [/экономику\s+единицы\s+продажи/gi, "unit economics"],
      [/соответствие\s+требованиям/gi, "compliance"],
      [/требования/gi, "requirements"],
      [/проверка\s+рынка/gi, "market validation"],
      [/себестоимость/gi, "cost"],
      [/запчасти/gi, "spare parts"]
    ];
    for (const [pattern, replacement] of englishReplacements) text = text.replace(pattern, replacement);
  }
  return text;
}

function localizeMarketIndicatorName(value: unknown, locale: AppLocale): string {
  const text = String(value ?? "");
  const lower = text.toLowerCase();
  const exact = localizeLooseReportText(text, locale);
  if (exact !== text) return exact;
  if (locale === "ru") {
    if (/services value added|service/.test(lower)) return "Динамика сектора услуг";
    if (/cafe|restaurant|catering|food/.test(lower)) return "Рынок общественного питания";
    if (/retail trade/.test(lower)) return "Розничная торговля и потребительская активность";
    if (/enterprise|organization|business entities/.test(lower)) return "Число предприятий и деловая активность";
  }
  if (locale === "uz") {
    if (/services value added|service/.test(lower)) return "Xizmatlar sektori dinamikasi";
    if (/cafe|restaurant|catering|food/.test(lower)) return "Umumiy ovqatlanish bozori";
    if (/retail trade/.test(lower)) return "Chakana savdo va iste'mol faolligi";
    if (/enterprise|organization|business entities/.test(lower)) return "Korxonalar soni va ishbilarmonlik faolligi";
  }
  return localizeLooseReportText(text, locale);
}

function buildFormulaExportRows(financial: FinancialResult, locale: AppLocale): ReportFormulaExportRow[] {
  return formatFormulaRows(financial, locale).map((row) => {
    const rawIndicator = String(row.indicator ?? "");
    let indicator = cleanLooseExportText(row.indicator, locale);
    if (locale === "en") {
      if (/revenue/i.test(rawIndicator)) indicator = "Monthly revenue";
      else if (/валовая\s+маржа|gross\s+margin/i.test(rawIndicator)) indicator = "Gross margin";
      else if (/себестоимость|cost\s+of\s+goods\s+sold/i.test(rawIndicator)) indicator = "Cost of goods sold";
      else if (/operating/i.test(rawIndicator)) indicator = "Monthly operating expenses";
    }
    return {
      indicator,
      formula: cleanLooseExportText(row.formula, locale),
      substitution: cleanLooseExportText(row.substitution, locale),
      result: cleanLooseExportText(row.result, locale),
      source: sourceLabel(row.source, locale)
    };
  });
}

function buildCapexRows(financial: FinancialResult, locale: AppLocale): ReportBreakdownRow[] {
  return [
    ...financial.capex.lineItems.map((item) => ({
      item: formatCapexLabel(item.key, item.label, locale),
      amount: formatCurrencyFull(item.amount, "UZS", locale),
      source: sourceLabel(item.source, locale),
      comment: locale === "en" ? "CapEx" : locale === "uz" ? "Boshlangich investitsiyalar" : "Стартовые вложения"
    })),
    { item: locale === "en" ? "Total CapEx" : locale === "uz" ? "Jami boshlangich investitsiyalar" : "Итого стартовые вложения", amount: formatCurrencyFull(financial.capex.totalCapEx, "UZS", locale), source: sourceLabel("calculated", locale), comment: locale === "en" ? "Sum of CapEx items" : locale === "uz" ? "Boshlangich investitsiyalar moddalari yigindisi" : "Сумма статей стартовых вложений" }
  ];
}

function buildOpexRows(financial: FinancialResult, locale: AppLocale): ReportBreakdownRow[] {
  return [
    ...financial.opex.lineItems.map((item) => ({
      item: formatOpexLabel(item.key, item.label, locale),
      amount: formatCurrencyFull(item.amount, "UZS", locale),
      source: sourceLabel(item.source, locale),
      comment: locale === "en" ? "Monthly OpEx" : locale === "uz" ? "Oylik operatsion xarajatlar" : "Ежемесячные операционные расходы"
    })),
    { item: locale === "en" ? "Total monthly OpEx" : locale === "uz" ? "Jami oylik operatsion xarajatlar" : "Итого ежемесячные операционные расходы", amount: formatCurrencyFull(financial.opex.monthlyFixedOpex, "UZS", locale), source: sourceLabel("calculated", locale), comment: locale === "en" ? "Sum of monthly OpEx items" : locale === "uz" ? "Oylik operatsion xarajatlar yigindisi" : "Сумма ежемесячных операционных расходов" }
  ];
}

function buildWorkingCapitalRows(financial: FinancialResult, locale: AppLocale): ReportBreakdownRow[] {
  const wc = financial.workingCapital;
  const source = sourceLabel("calculated", locale);
  const fixedCostsNote = locale === "en" ? "Monthly fixed operating costs" : locale === "uz" ? "Oylik doimiy operatsion xarajatlar" : "Ежемесячные фиксированные операционные расходы";
  const bufferNote = locale === "en" ? "Months covered before stable cash inflow" : locale === "uz" ? "Barqaror pul oqimigacha qoplanadigan oylar" : "Количество месяцев запаса до стабильного денежного потока";
  const plusNote = locale === "en" ? "Adds to working capital" : locale === "uz" ? "Aylanma kapitalga qo'shiladi" : "Увеличивает оборотный капитал";
  const minusNote = locale === "en" ? "Reduces working capital need" : locale === "uz" ? "Aylanma kapital ehtiyojini kamaytiradi" : "Снижает потребность в оборотном капитале";
  const totalNote = locale === "en" ? "Fixed costs for buffer period plus stock and payment buffers" : locale === "uz" ? "Bufer davri xarajatlari, zaxira va to'lov buferlari" : "Фиксированные расходы за период буфера плюс запасы и платежные буферы";
  return [
    { item: locale === "en" ? "Monthly fixed OpEx" : locale === "uz" ? "Oylik doimiy xarajatlar" : "Ежемесячные фиксированные расходы", amount: formatCurrencyFull(wc.monthlyFixedCosts, "UZS", locale), source, comment: fixedCostsNote },
    { item: locale === "en" ? "Buffer months" : locale === "uz" ? "Bufer oylari" : "Месяцы буфера", amount: String(wc.bufferMonths), source, comment: bufferNote },
    { item: locale === "en" ? "Initial inventory" : locale === "uz" ? "Boshlang'ich zaxira" : "Первоначальный запас", amount: formatCurrencyFull(wc.initialInventory, "UZS", locale), source, comment: plusNote },
    { item: locale === "en" ? "Accounts receivable buffer" : locale === "uz" ? "Debitorlik buferi" : "Буфер дебиторки", amount: formatCurrencyFull(wc.accountsReceivableBuffer, "UZS", locale), source, comment: plusNote },
    { item: locale === "en" ? "Accounts payable buffer" : locale === "uz" ? "Kreditorlik buferi" : "Буфер кредиторки", amount: formatCurrencyFull(wc.accountsPayableBuffer, "UZS", locale), source, comment: minusNote },
    { item: locale === "en" ? "Seasonal stock buffer" : locale === "uz" ? "Mavsumiy zaxira buferi" : "Сезонный запас", amount: formatCurrencyFull(wc.seasonalStockBuffer, "UZS", locale), source, comment: plusNote },
    { item: locale === "en" ? "Total working capital" : locale === "uz" ? "Jami aylanma kapital" : "Итого оборотный капитал", amount: formatCurrencyFull(wc.requiredWorkingCapital, "UZS", locale), source, comment: totalNote }
  ];
}

function buildFinancingRows(financial: FinancialResult, locale: AppLocale): ReportBreakdownRow[] {
  const f = financial.financing;
  const source = sourceLabel("calculated", locale);
  const months = locale === "en" ? "months" : locale === "uz" ? "oy" : "мес.";
  const notSelectedCredit = locale === "en" ? "Credit not selected" : locale === "uz" ? "Kredit tanlanmagan" : "Кредит не выбран";
  const notSelectedLeasing = tReport(reportMessages.comments.leasingNotApplicable, locale);
  const incompleteLeasing = locale === "en" ? "Leasing is selected, but amount and terms are missing" : locale === "uz" ? "Lizing tanlangan, lekin summa va shartlar kiritilmagan" : "Лизинг выбран, но сумма и условия не указаны";
  const leasingAmount = f.leasingRequired > 0 ? formatCurrencyFull(f.leasingRequired, "UZS", locale) : f.leasingSelected ? getTranslations(locale).report.notFilled : getTranslations(locale).report.notApplicable;
  const leasingComment = f.leasingRequired > 0 ? `${f.leasingAnnualRatePct}% / ${f.leasingTermMonths} ${months}` : f.leasingSelected ? incompleteLeasing : notSelectedLeasing;
  const availableComment = locale === "en" ? "Own funds plus confirmed external financing" : locale === "uz" ? "O'z mablag'i va tasdiqlangan tashqi moliyalashtirish" : "Собственные средства плюс подтвержденное внешнее финансирование";
  const rows: ReportBreakdownRow[] = [
    { item: locale === "en" ? "Total investment need" : locale === "uz" ? "Jami investitsiya ehtiyoji" : "Общая потребность в инвестициях", amount: formatCurrencyFull(f.totalInvestmentNeed, "UZS", locale), source, comment: locale === "en" ? "CapEx plus working capital" : locale === "uz" ? "CapEx va aylanma kapital" : "CapEx плюс оборотный капитал" },
    { item: locale === "en" ? "Own contribution" : locale === "uz" ? "O'z mablag'i" : "Собственные средства", amount: formatCurrencyWithOriginal(f.ownContributionUZS, f.ownContributionAmount, f.ownContributionCurrency, locale), source: sourceLabel("user_input", locale), comment: `${f.ownContributionPct}%` },
    { item: locale === "en" ? "Approved/requested loan" : locale === "uz" ? "Tasdiqlangan/so'ralgan kredit" : "Кредит", amount: f.creditNeeded === "yes" ? formatCurrencyFull(f.loanRequired, "UZS", locale) : getTranslations(locale).report.notApplicable, source: f.creditNeeded === "yes" ? sourceLabel(f.loanAnnualRateSource, locale) : source, comment: f.creditNeeded === "yes" ? `${f.loanAnnualRatePct}% / ${f.loanTermMonths} ${months}` : notSelectedCredit },
    { item: locale === "en" ? "Leasing" : locale === "uz" ? "Lizing" : "Лизинг", amount: leasingAmount, source: f.leasingRequired > 0 ? sourceLabel(f.leasingAnnualRateSource, locale) : source, comment: leasingComment },
    { item: locale === "en" ? "Grants" : locale === "uz" ? "Grantlar" : "Гранты", amount: formatCurrencyFull(f.grants, "UZS", locale), source, comment: locale === "en" ? "Grant funding" : locale === "uz" ? "Grant moliyalashtirish" : "Грантовое финансирование" },
    { item: locale === "en" ? "Other funding" : locale === "uz" ? "Boshqa moliyalashtirish" : "Другое финансирование", amount: formatCurrencyFull(f.otherFunding, "UZS", locale), source, comment: locale === "en" ? "Other confirmed funding" : locale === "uz" ? "Boshqa tasdiqlangan moliyalashtirish" : "Другое подтвержденное финансирование" },
    { item: locale === "en" ? "Available funding" : locale === "uz" ? "Mavjud moliyalashtirish" : "Доступное финансирование", amount: formatCurrencyFull(f.availableFunding, "UZS", locale), source, comment: availableComment },
    { item: reportMetric("financingGap", locale), amount: formatCurrencyFull(f.financingGap, "UZS", locale), source, comment: locale === "en" ? "Uncovered investment need" : locale === "uz" ? "Qoplanmagan investitsiya ehtiyoji" : "Непокрытая потребность в инвестициях" },
    { item: locale === "en" ? "Funding surplus" : locale === "uz" ? "Ortiqcha moliyalashtirish" : "Излишек финансирования", amount: formatCurrencyFull(f.fundingSurplus, "UZS", locale), source, comment: locale === "en" ? "Funding above the investment need" : locale === "uz" ? "Investitsiya ehtiyojidan ortiq mablag'" : "Финансирование сверх потребности" }
  ];
  const hasDebtService = f.creditNeeded === "yes" || f.loanRequired > 0 || f.leasingRequired > 0;
  if (hasDebtService) {
    rows.push({ item: "DSCR", amount: f.dscrLabel, source, comment: locale === "en" ? "EBITDA divided by debt service" : locale === "uz" ? "EBITDA qarz to'lovi bo'yicha bo'lingan" : "EBITDA / платежи по долгу" });
  }
  return rows;
}

function buildCollateralRows(project: ProjectRecord, locale: AppLocale): ReportBreakdownRow[] {
  const profile = getProjectProfile(project) as Record<string, unknown>;
  const collateralAvailable = profile.collateralAvailable === true || profile.collateralAvailable === "yes";
  const notApplicable = getTranslations(locale).report.notApplicable;
  if (!collateralAvailable) {
    return [{
      item: locale === "en" ? "Collateral" : locale === "uz" ? "Garov" : "Залог",
      amount: notApplicable,
      source: sourceLabel("calculated", locale),
      comment: locale === "en" ? "Collateral not selected" : locale === "uz" ? "Garov tanlanmagan" : "Залог не выбран"
    }];
  }
  const type = typeof profile.collateralType === "string" && profile.collateralType.trim() ? profile.collateralType.trim() : notApplicable;
  const value = Number(profile.collateralEstimatedValue ?? 0);
  const moneySnapshot = (profile.moneyValues as Record<string, { sourceAmount?: number; sourceCurrency?: string; amountUZS?: number }> | undefined)?.collateralEstimatedValue;
  const amountLabel = moneySnapshot && Number.isFinite(Number(moneySnapshot.amountUZS))
    ? formatCurrencyWithOriginal(Number(moneySnapshot.amountUZS), Number(moneySnapshot.sourceAmount ?? moneySnapshot.amountUZS), moneySnapshot.sourceCurrency ?? "UZS", locale)
    : value > 0
      ? formatCurrencyFull(value, "UZS", locale)
      : (locale === "en" ? "Valuation not confirmed" : locale === "uz" ? "Baholash tasdiqlanmagan" : "Оценка не подтверждена");
  const quality = value > 0 || moneySnapshot ? "user_input" : "not_found";
  return [
    {
      item: locale === "en" ? "Collateral item" : locale === "uz" ? "Garov predmeti" : "Предмет залога",
      amount: type,
      source: sourceLabel("user_input", locale),
      comment: locale === "en" ? "Bank or leasing company must verify acceptability" : locale === "uz" ? "Bank yoki lizing kompaniyasi maqbulligini tekshirishi kerak" : "Банк или лизинговая компания должны подтвердить приемлемость"
    },
    {
      item: locale === "en" ? "Indicative collateral value" : locale === "uz" ? "Taxminiy garov qiymati" : "Ориентировочная стоимость залога",
      amount: amountLabel,
      source: sourceLabel(quality, locale),
      comment: value > 0
        ? (locale === "en" ? "User-stated indicative value; formal bank valuation is still required" : locale === "uz" ? "Foydalanuvchi kiritgan taxminiy qiymat; bank bahosi talab qilinadi" : "Оценка указана пользователем; банку потребуется собственная оценка")
        : (locale === "en" ? "Automatic valuation was not confirmed. A manual valuation or appraiser report is required." : locale === "uz" ? "Avtomatik baholash tasdiqlanmadi. Qo'lda baholash yoki baholovchi hisoboti kerak." : "Автоматическая оценка не подтверждена. Нужна ручная оценка или отчет оценщика.")
    },
    {
      item: locale === "en" ? "Supporting documents" : locale === "uz" ? "Tasdiqlovchi hujjatlar" : "Подтверждающие документы",
      amount: labelValue(profile.collateralDocumentsAvailable ?? "not_found", locale),
      source: sourceLabel("user_input", locale),
      comment: locale === "en" ? "Ownership and valuation documents must be checked" : locale === "uz" ? "Mulk huquqi va baholash hujjatlari tekshirilishi kerak" : "Подтвердить документы собственности и оценку"
    }
  ];
}

function legacyWarningTitle(code: string, locale: AppLocale) {
  const map: Record<string, Record<AppLocale, string>> = {
    financing_gap: { ru: "Разрыв финансирования", en: "Financing gap", uz: "Moliyalashtirish tafovuti" },
    loan_terms_missing: { ru: "Неполные параметры кредита", en: "Incomplete loan terms", uz: "Kredit shartlari to'liq emas" },
    loan_rate_assumption: { ru: "Ставка кредита указана как допущение", en: "Loan rate uses an assumption", uz: "Kredit stavkasi faraz sifatida ishlatilgan" },
    repayment_type_assumption: { ru: "Тип погашения требует проверки", en: "Repayment type requires review", uz: "To'lov turi tekshirilishi kerak" },
    leasing_rate_assumption: { ru: "Ставка лизинга указана как допущение", en: "Leasing rate uses an assumption", uz: "Lizing stavkasi faraz sifatida ishlatilgan" },
    collateral_valuation_missing: { ru: "Оценка залога не подтверждена", en: "Collateral valuation not confirmed", uz: "Garov bahosi tasdiqlanmagan" },
    low_own_contribution: { ru: "Низкая доля собственных средств", en: "Low own contribution", uz: "O'z mablag'i ulushi past" },
    revenue_mismatch: { ru: "Расхождение в выручке", en: "Revenue mismatch", uz: "Tushumda tafovut" }
  };
  return map[code]?.[locale] ?? labelValue(code, locale);
}

function legacyWarningValueLabel(key: string, locale: AppLocale) {
  const map: Record<string, Record<AppLocale, string>> = {
    financingGap: { ru: "Разрыв финансирования", en: "Financing gap", uz: "Moliyalashtirish tafovuti" },
    assumedAnnualRatePct: { ru: "Допущенная годовая ставка", en: "Assumed annual rate", uz: "Faraz qilingan yillik stavka" },
    loanTermMonths: { ru: "Срок кредита", en: "Loan term", uz: "Kredit muddati" },
    loanRequired: { ru: "Сумма кредита", en: "Loan amount", uz: "Kredit summasi" },
    leasingRequired: { ru: "Сумма лизинга", en: "Leasing amount", uz: "Lizing summasi" },
    collateralType: { ru: "Предмет залога", en: "Collateral item", uz: "Garov predmeti" },
    providedRatePct: { ru: "Указанная ставка", en: "Provided rate", uz: "Kiritilgan stavka" },
    preferredRevenueSource: { ru: "Основной расчет выручки", en: "Primary revenue basis", uz: "Asosiy tushum hisobi" }
  };
  return map[key]?.[locale] ?? labelValue(key, locale);
}

function legacyFormatWarningValue(key: string, value: unknown, locale: AppLocale) {
  if (typeof value === "number") {
    if (/pct|rate/i.test(key)) return `${value}%`;
    if (/amount|gap|required|funding|loan|leasing/i.test(key)) return formatCurrencyFull(value, "UZS", locale);
    if (/months/i.test(key)) return `${value} ${locale === "en" ? "months" : locale === "uz" ? "oy" : "мес."}`;
  }
  return labelValue(value, locale);
}

function buildWarningRows(financial: FinancialResult, locale: AppLocale): ReportWarningRow[] {
  return (financial.warnings ?? []).map((warning) => ({
    title: formatWarningTitle(warning.code, locale),
    message: formatWarningMessage(warning.code, warning.message, locale),
    values: warning.values ? Object.entries(warning.values).map(([key, value]) => `${formatWarningValueLabel(key, locale)} - ${formatWarningValue(key, value, locale)}`).join("; ") : "",
    severity: labelValue(warning.severity ?? "medium", locale)
  }));
}

function formatMatchQualityLabel(value: unknown, locale: AppLocale): string {
  const text = String(value ?? "").toLowerCase();
  if (text === "exact") return locale === "en" ? "Exact" : locale === "uz" ? "Aniq" : "Точный";
  if (text === "close_proxy") return locale === "en" ? "Close proxy" : locale === "uz" ? "Yaqin orientir" : "Близкий ориентир";
  if (text === "broad_proxy") return locale === "en" ? "Broad proxy" : locale === "uz" ? "Keng orientir" : "Широкий ориентир";
  if (text === "not_found") return locale === "en" ? "No data" : locale === "uz" ? "Ma'lumot topilmadi" : "Данные не найдены";
  if (text === "needs_verification" || /требуется проверка|manual/.test(text)) return sourceNeedsClarificationLabel(locale);
  return locale === "en" ? "Context" : locale === "uz" ? "Kontekst" : "Контекст";
}

function buildPlaceholderMarketRows(project: ProjectRecord, locale: AppLocale): ReportMarketDataRow[] {
  const messages = getTranslations(locale).report;
  return [{
    indicator: messages.marketData,
    year: "",
    region: typeof project.region === "string" ? project.region : "",
    value: messages.officialDataNotFound,
    unit: "",
    currency: "",
    source: "",
    lastUpdated: "",
    matchQuality: formatMatchQualityLabel("not_found", locale),
    explanation: messages.officialDataNotFound
  }];
}

function buildMarketRows(report: ReportData, project: ProjectRecord, locale: AppLocale): ReportMarketDataRow[] {
  const marketData = report.marketData;
  if (!marketData || marketData.dataPoints.length === 0) return buildPlaceholderMarketRows(project, locale);
  const seen = new Set<string>();
  const rows = marketData.dataPoints.map((point) => ({
    indicator: localizeMarketIndicatorName(point.indicator, locale),
    year: String(point.year),
    region: localizeLooseReportText(point.region ?? marketData.region ?? "", locale),
    value: point.value === null || point.value === undefined ? getTranslations(locale).report.officialDataNotFound : String(point.value),
    unit: localizeLooseReportText(point.unit ?? "", locale),
    currency: point.currency ?? "",
    source: localizeLooseReportText(point.sourceName, locale),
    lastUpdated: point.lastUpdated ? new Date(point.lastUpdated).toISOString() : "",
    matchQuality: formatMatchQualityLabel(point.matchQuality ?? "broad_proxy", locale),
    explanation: localizeLooseReportText(point.explanation ?? (locale === "en" ? "Selected as contextual market data for the business profile." : locale === "uz" ? "Biznes profili uchun kontekst bozor ma'lumoti sifatida tanlangan." : "Выбрано как справочный рыночный контекст для профиля бизнеса."), locale)
  })).filter((row) => {
    const key = normalizeSourceKey([row.indicator, row.year, row.region, row.source].join("|"));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return rows.slice(0, 8);
}

function buildPlaceholderImportExportRows(locale: AppLocale): ReportImportExportRow[] {
  const messages = getTranslations(locale).report;
  return [{
    type: "",
    hsCode: "",
    productCategory: messages.officialDataNotFound,
    year: "",
    country: "",
    valueUsd: "",
    volume: "",
    unit: "",
    source: ""
  }];
}


function buildImportExportRows(report: ReportData, locale: AppLocale): ReportImportExportRow[] {
  const marketData = report.marketData;
  if (!marketData) return buildPlaceholderImportExportRows(locale);
  const rows = marketData.dataPoints
    .filter((point) => point.tradeType || point.hsCode || point.valueUsd !== undefined || point.volume !== undefined)
    .map((point) => ({
      type: point.tradeType ? labelValue(point.tradeType, locale) : "",
      hsCode: point.hsCode ?? "",
      productCategory: localizeLooseReportText(point.productCategory ?? point.indicator, locale),
      year: String(point.year),
      country: point.country ?? "",
      valueUsd: point.valueUsd === null || point.valueUsd === undefined ? "" : String(point.valueUsd),
      volume: point.volume === null || point.volume === undefined ? "" : String(point.volume),
      unit: localizeLooseReportText(point.unit ?? "", locale),
      source: localizeLooseReportText(point.sourceName, locale)
    }));
  return rows.length ? rows : buildPlaceholderImportExportRows(locale);
}

function formatSourceTypeLabel(type: unknown, locale: AppLocale): string {
  const value = String(type ?? "").toLowerCase();
  if (value.includes("official") || value.includes("government")) return locale === "en" ? "Official" : locale === "uz" ? "Rasmiy" : "Официальный";
  if (value.includes("legal") || value.includes("law")) return locale === "en" ? "Legal" : locale === "uz" ? "Huquqiy" : "Правовой";
  if (value.includes("bank") || value.includes("central")) return locale === "en" ? "Bank" : locale === "uz" ? "Bank" : "Банк";
  if (value.includes("stat")) return locale === "en" ? "Statistics" : locale === "uz" ? "Statistika" : "Статистика";
  if (value.includes("secondary") || value.includes("advisory")) return locale === "en" ? "Secondary" : locale === "uz" ? "Ikkilamchi" : "Вторичный";
  return locale === "en" ? "Reference" : locale === "uz" ? "Ma'lumotnoma" : "Справочный";
}

function buildPlaceholderSources(locale: AppLocale): ReportSourceRow[] {
  const accessed = new Date().toISOString().slice(0, 10);
  const year = new Date().getFullYear().toString();
  const rows = locale === "ru" ? [
    ["Единый портал интерактивных государственных услуг", "Регистрация бизнеса и государственные услуги", "https://my.gov.uz", "official"],
    ["Налоговый комитет Республики Узбекистан", "Налоговый учёт, онлайн-касса и фискальные документы", "https://soliq.uz", "official"],
    ["Национальная база законодательства Республики Узбекистан", "Торговые, потребительские и правовые требования", "https://lex.uz", "legal"],
    ["Таможенный комитет Республики Узбекистан", "Импортные документы и таможенные процедуры", "https://customs.uz", "official"],
    ["Министерство занятости Республики Узбекистан", "Трудовые договоры и кадровые документы", "https://mehnat.uz", "official"],
    ["Министерство по чрезвычайным ситуациям Республики Узбекистан", "Пожарная безопасность и требования к объекту", "https://favqulodda.uz", "official"]
  ] : locale === "uz" ? [
    ["Yagona interaktiv davlat xizmatlari portali", "Biznesni ro'yxatdan o'tkazish va davlat xizmatlari", "https://my.gov.uz", "official"],
    ["O'zbekiston Respublikasi Soliq qo'mitasi", "Soliq hisobi, onlayn kassa va fiskal hujjatlar", "https://soliq.uz", "official"],
    ["O'zbekiston Respublikasi qonunchilik ma'lumotlari milliy bazasi", "Savdo, iste'molchi va huquqiy talablar", "https://lex.uz", "legal"],
    ["O'zbekiston Respublikasi Bojxona qo'mitasi", "Import hujjatlari va bojxona tartiblari", "https://customs.uz", "official"],
    ["O'zbekiston Respublikasi Bandlik vazirligi", "Mehnat shartnomalari va kadr hujjatlari", "https://mehnat.uz", "official"],
    ["O'zbekiston Respublikasi Favqulodda vaziyatlar vazirligi", "Yong'in xavfsizligi va obyekt talablari", "https://favqulodda.uz", "official"]
  ] : [
    ["Single interactive public services portal", "Business registration and public services", "https://my.gov.uz", "official"],
    ["Tax Committee of the Republic of Uzbekistan", "Tax registration, online cash register and fiscal documents", "https://soliq.uz", "official"],
    ["National database of legislation of the Republic of Uzbekistan", "Consumer, trade and legal requirements", "https://lex.uz", "legal"],
    ["Customs Committee of the Republic of Uzbekistan", "Import documents and customs procedures", "https://customs.uz", "official"],
    ["Ministry of Employment of the Republic of Uzbekistan", "Employment and labour documentation", "https://mehnat.uz", "official"],
    ["Ministry of Emergency Situations of the Republic of Uzbekistan", "Fire safety and emergency requirements", "https://favqulodda.uz", "official"]
  ];
  return rows.map(([organization, title, url, type]) => ({
    sourceName: organization,
    sourceType: formatSourceTypeLabel(type, locale),
    url,
    year,
    lastUpdated: accessed,
    notes: formatSourceListItem({ author: organization, title, url, year, accessedDate: accessed }, locale)
  }));
}


function normalizeSourceKey(value: string) {
  return value
    .toLowerCase()
    .replace(/https?:\/\/(www\.)?/g, "")
    .replace(/\?.*$/g, "")
    .replace(/[#/]+$/g, "")
    .replace(/[\s\u00a0]+/g, " ")
    .trim();
}

function dedupeSourceRows(rows: ReportSourceRow[]): ReportSourceRow[] {
  const seen = new Set<string>();
  const deduped: ReportSourceRow[] = [];
  for (const row of rows) {
    const urlKey = normalizeSourceKey(row.url);
    const titleKey = normalizeSourceKey([row.sourceName, row.sourceType, row.year].filter(Boolean).join("|"));
    const notesKey = normalizeSourceKey(row.notes).slice(0, 160);
    const key = urlKey || titleKey || notesKey;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  return deduped;
}

function cleanSourceNote(note: string, locale: AppLocale) {
  const cleaned = note
    .replace(/\s+\|\s+/g, "; ")
    .replace(/\bexact\b/g, labelValue("exact", locale))
    .replace(/\bclose_proxy\b/g, labelValue("close_proxy", locale))
    .replace(/\bbroad_proxy\b/g, labelValue("broad_proxy", locale))
    .replace(/\bnot_found\b/g, labelValue("not_found", locale));
  const withoutPlaceholders = cleanSourceMetadataText(cleaned);
  if (!withoutPlaceholders || /показатель\s+показатель|sample_|sectionNotes|__money/i.test(withoutPlaceholders)) return "";
  return withoutPlaceholders;
}

function harvardReference(organization: string, title: string, url: string, year: string, accessed: string, locale: AppLocale): string {
  return formatSourceListItem({ organization, title, url, year, accessedDate: accessed }, locale);
}

function registrySourceRow(source: DataSource, locale: AppLocale): ReportSourceRow | null {
  const record = source as DataSource & Record<string, unknown>;
  const metadata = normalizeSourceMetadata({
    title: record.title ?? record.name,
    organization: String(record.organization ?? record.name ?? "").split(":")[0]?.trim(),
    sourceName: record.name,
    url: record.url,
    year: record.year ?? new Date().getFullYear(),
    sourceType: record.reportSourceType ?? source.sourceType,
    accessedDate: new Date().toISOString().slice(0, 10)
  }, locale);
  if (!metadata.url || !metadata.title || !metadata.displayName) return null;
  if (/требуется проверка|контрольн|тестов|fake|synthetic/i.test(`${metadata.title} ${metadata.displayName}`)) return null;
  return {
    sourceName: metadata.displayName,
    sourceType: formatSourceTypeLabel(metadata.sourceType ?? source.sourceType, locale),
    url: metadata.url,
    year: metadata.publishedYear ?? "",
    lastUpdated: metadata.accessedDate ?? "",
    notes: formatSourceListItem({ author: metadata.displayName, title: metadata.title, url: metadata.url, year: metadata.publishedYear, accessedDate: metadata.accessedDate }, locale)
  };
}


function sourceRowFromMetadata(source: Record<string, unknown>, locale: AppLocale): ReportSourceRow | null {
  const metadata = normalizeSourceMetadata(source, locale);
  if (!metadata.url) return null;
  return {
    sourceName: metadata.displayName,
    sourceType: formatSourceTypeLabel(metadata.sourceType, locale),
    url: metadata.url,
    year: metadata.publishedYear ?? "",
    lastUpdated: metadata.accessedDate ?? "",
    notes: formatSourceListItem({
      author: metadata.displayName,
      title: metadata.title,
      url: metadata.url,
      year: metadata.publishedYear,
      accessedDate: metadata.accessedDate
    }, locale)
  };
}

function sourceRowsFromUsageAudit(report: ReportData, locale: AppLocale): ReportSourceRow[] {
  const audit = (report as unknown as { sourceUsageAudit?: { bySection?: Record<string, string[]> } }).sourceUsageAudit;
  const ids = Array.from(new Set(Object.values(audit?.bySection ?? {}).flat().filter(Boolean)));
  return ids
    .map((id) => sourceRegistry.find((source) => source.id === id))
    .filter((source): source is DataSource => Boolean(source))
    .map((source) => registrySourceRow(source, locale))
    .filter((row): row is ReportSourceRow => Boolean(row));
}

function buildSourceRows(report: ReportData, locale: AppLocale): ReportSourceRow[] {
  const marketData = report.marketData;
  const rows: ReportSourceRow[] = sourceRowsFromUsageAudit(report, locale);
  if (marketData?.sources?.length) {
    rows.push(...marketData.sources
      .map((source) => sourceRowFromMetadata({
        author: source.sourceName,
        publisher: source.sourceName,
        siteName: source.sourceName,
        title: cleanSourceNote(source.notes || source.sourceName || "", locale) || source.sourceName,
        url: source.sourceUrl,
        year: source.year,
        accessedDate: source.lastUpdated,
        sourceType: source.sourceType
      }, locale))
      .filter((row): row is ReportSourceRow => Boolean(row)));
  }
  const webResearch = report.webResearchData as WebResearchResult | null | undefined;
  if (webResearch?.sources?.length) {
    const project = report.projectProfile as unknown as Parameters<typeof buildBusinessContext>[0];
    const financial = report.financialModel as unknown as Parameters<typeof buildBusinessContext>[1];
    const context = buildBusinessContext(project, financial, locale);
    const relevantSources = filterWebResearchSourcesForReport(webResearch, context, 12);
    const statsBySource = new Map((webResearch.statistics ?? []).map((stat) => [stat.sourceId, stat] as const));
    rows.push(...relevantSources
      .map((source) => {
        const stat = statsBySource.get(source.id);
        return sourceRowFromMetadata({
          author: source.organization,
          publisher: source.organization,
          siteName: source.organization,
          title: source.title || stat?.indicator,
          url: source.url,
          year: source.year,
          accessedDate: source.accessedDate || webResearch.researchDate,
          sourceType: source.sourceType
        }, locale);
      })
      .filter((row): row is ReportSourceRow => Boolean(row)));
  } else if (webResearch?.statistics?.length) {
    rows.push(...webResearch.statistics
      .map((stat) => sourceRowFromMetadata({
        author: stat.source ?? stat.sourceId,
        publisher: stat.source,
        title: stat.indicator || stat.citation,
        url: stat.sourceUrl,
        year: stat.year,
        accessedDate: webResearch.researchDate,
        sourceType: locale === "en" ? "Web research" : locale === "uz" ? "Veb tadqiqot" : "AI-поиск рыночных данных"
      }, locale))
      .filter((row): row is ReportSourceRow => Boolean(row)));
  }
  const deduped = dedupeSourceRows(rows).slice(0, 20);
  if (deduped.length >= 5) return deduped.slice(0, 20);
  return dedupeSourceRows([...deduped, ...buildPlaceholderSources(locale)]).slice(0, 12);
}


function buildExportFinancingRecommendation(financial: FinancialResult, locale: AppLocale, existing?: string) {
  const f = financial.financing;
  if (f.creditNeeded === "yes") {
    const amount = formatCurrencyFull(f.loanRequired, "UZS", locale);
    const payment = formatCurrencyFull(f.estimatedMonthlyLoanPayment, "UZS", locale);
    if (locale === "en") return `A loan of ${amount} is requested. Rate used: ${f.loanAnnualRatePct}% annual (${sourceLabel(f.loanAnnualRateSource, locale)}). Estimated payment: ${payment}, DSCR: ${f.dscrLabel}. Collateral, repayment source and documents must be confirmed.`;
    if (locale === "uz") return `${amount} miqdorida kredit so'ralgan. Ishlatilgan stavka: yillik ${f.loanAnnualRatePct}% (${sourceLabel(f.loanAnnualRateSource, locale)}). Hisoblangan to'lov: ${payment}, DSCR: ${f.dscrLabel}. Garov, to'lov manbai va hujjatlarni tasdiqlash kerak.`;
    return `Кредит запрошен на сумму ${amount}. Использованная ставка: ${f.loanAnnualRatePct}% годовых (${sourceLabel(f.loanAnnualRateSource, locale)}). Расчетный платеж: ${payment}, DSCR: ${f.dscrLabel}. Нужно подтвердить залог, источник погашения и документы.`;
  }
  if (f.creditNeeded === "no") {
    const gap = f.financingGap > 0 ? formatCurrencyFull(f.financingGap, "UZS", locale) : (locale === "en" ? "not identified" : locale === "uz" ? "aniqlanmadi" : "не выявлен");
    if (locale === "en") return `The user does not plan a loan. The project can be assessed based on sufficiency of own funds and/or equipment leasing. Financing gap: ${gap}.`;
    if (locale === "uz") return `Foydalanuvchi kreditni rejalashtirmagan. Loyiha o'z mablag'i va/yoki uskunalar lizingi yetarliligi bo'yicha baholanishi mumkin. Moliyalashtirish bo'shlig'i: ${gap}.`;
    return `Пользователь не планирует кредит. Проект можно оценивать с точки зрения достаточности собственных средств и/или лизинга оборудования. Разрыв финансирования: ${gap}.`;
  }
  return existing ?? getTranslations(locale).report.notApplicable;
}

function normalizeEnglishExportString(value: unknown): string {
  return String(value ?? "")
    .split("Ежемесячные").join("Monthly")
    .split("ежегодно").join("Annual")
    .split(" и ").join(" and ")
    .replace(/фонд\s+оплаты\s+труда/gi, "payroll")
    .replace(/валовая\s+маржа/gi, "Gross margin")
    .replace(/себестоимость\s+of\s+goods\s+sold/gi, "Cost of goods sold")
    .replace(/себестоимость\s+продаж/gi, "Cost of goods sold")
    .replace(/себестоимость/gi, "cost")
    .replace(/операционные\s+расходы/gi, "operating expenses")
    .replace(/стартовые\s+вложения/gi, "startup investments")
    .replace(/Startup\s+startup\s+investments/gi, "Startup investments")
    .replace(/денежный\s+поток/gi, "cash flow")
    .replace(/вводные\s+данные/gi, "input data")
    .replace(/данные\s+пользователя/gi, "user input")
    .replace(/допущения/gi, "assumptions")
    .replace(/рынок/gi, "market")
    .replace(/спрос/gi, "demand")
    .replace(/каналы/gi, "channels")
    .replace(/цена/gi, "price")
    .replace(/поставщики/gi, "suppliers")
    .replace(/поставка/gi, "delivery")
    .replace(/импортные/gi, "imported")
    .replace(/валютный\s+риск/gi, "currency risk")
    .replace(/запчасти/gi, "spare parts");
}

function normalizeExportSectionText<T extends Record<string, unknown>>(rows: T[] | undefined, locale: AppLocale): T[] | undefined {
  if (!Array.isArray(rows)) return rows;
  return rows.map((row) => {
    const next: Record<string, unknown> = { ...row };
    for (const [key, value] of Object.entries(next)) {
      if (typeof value === "string") next[key] = locale === "en" ? normalizeEnglishExportString(value) : cleanLooseExportText(value, locale);
    }
    return next as T;
  });
}

function cleanPreparedAiReport(aiReport: AIGeneratedReport | null | undefined, locale: AppLocale): AIGeneratedReport | null | undefined {
  if (!aiReport) return aiReport;
  const clean = (value: string) => cleanAiAnalysisText(cleanInlineSourcePlaceholders(value, locale), locale);
  const fullNarrative = clean(aiReport.fullNarrative);
  return {
    ...aiReport,
    executiveSummary: clean(aiReport.executiveSummary),
    marketAnalysis: clean(aiReport.marketAnalysis),
    businessModelAssessment: clean(aiReport.businessModelAssessment),
    financialAnalysis: clean(aiReport.financialAnalysis),
    riskAssessment: clean(aiReport.riskAssessment),
    actionPlan: clean(aiReport.actionPlan),
    investmentReadiness: clean(aiReport.investmentReadiness),
    fullNarrative,
    citations: (aiReport.citations ?? []).filter((citation) => !hasAiAnalysisPlaceholderLeak(`${citation.text} ${citation.source}`)).map((citation) => {
      const sourceInput = { sourceName: citation.source, url: citation.url };
      const source = normalizeSourceMetadata(sourceInput, locale);
      const cleanedText = clean(citation.text) || formatSourceCitation(sourceInput, locale);
      return {
        ...citation,
        text: cleanedText,
        source: source.displayName,
        url: source.url ?? citation.url ?? null
      };
    })
  };
}

function normalizePreparedUserFacingText(prepared: PreparedReportExport, locale: AppLocale): PreparedReportExport {
  if (locale !== "en") return prepared;
  return {
    ...prepared,
    executiveSummary: prepared.executiveSummary.map(normalizeEnglishExportString),
    summary: normalizeExportSectionText(prepared.summary, locale) ?? prepared.summary,
    financialRows: normalizeExportSectionText(prepared.financialRows, locale) ?? prepared.financialRows,
    formulaRows: normalizeExportSectionText(prepared.formulaRows, locale) ?? prepared.formulaRows,
    risks: normalizeExportSectionText(prepared.risks, locale) ?? prepared.risks,
    recommendations: normalizeExportSectionText(prepared.recommendations, locale) ?? prepared.recommendations,
    warnings: normalizeExportSectionText(prepared.warnings, locale) ?? prepared.warnings,
    sources: normalizeExportSectionText(prepared.sources, locale) ?? prepared.sources
  };
}

function toFileNameBase(project: ProjectRecord) {
  const locale = getReportLocale(project);
  return `finko-business-report-${locale}-${String(project.id ?? "project")}`;
}

function toBusinessType(project: ProjectRecord, locale: AppLocale) {
  const profile = getProjectProfile(project);
  return profile.businessType ? labelValue(profile.businessType, locale) : getTranslations(locale).report.notFilled;
}

function ensureMarketEvidenceComment(comment: string, locale: AppLocale) {
  const safeComment = comment.trim();
  if (safeComment) return safeComment;
  return locale === "en"
    ? "Use as market context. Do not treat this alone as proof of demand or as a direct financial input."
    : locale === "uz"
      ? "Bozor konteksti sifatida foydalaning. Buni talab isboti yoki bevosita bevosita moliyaviy kiritma deb hisoblamang."
      : "Использовать как рыночный контекст. Не считать самостоятельным доказательством спроса или прямыми финансовыми вводными данными.";
}

function marketEvidenceRowsForExport(rows: Array<Array<string>>, locale: AppLocale): ReportBreakdownRow[] {
  const labels = locale === "en"
    ? { period: "Period", geography: "Geography", interpretation: "Interpretation", use: "How to use", status: "Data status" }
    : locale === "uz"
      ? { period: "Davr", geography: "Geografiya", interpretation: "Talqin", use: "Qanday ishlatish", status: "Ma'lumot holati" }
      : { period: "Период", geography: "География", interpretation: "Интерпретация", use: "Как использовать", status: "Статус данных" };
  const seen = new Set<string>();
  const exportRows = rows.map((row) => {
    if (row.length >= 8) {
      const comment = [
        row[2] ? `${labels.period}: ${row[2]}` : "",
        row[3] ? `${labels.geography}: ${row[3]}` : "",
        row[5] ? `${labels.interpretation}: ${row[5]}` : "",
        row[6] ? `${labels.use}: ${row[6]}` : "",
        row[7] ? `${labels.status}: ${row[7]}` : ""
      ].filter(Boolean).join("; ");
      return { item: row[0] ?? "", amount: row[1] ?? "", source: row[4] ?? "", comment: ensureMarketEvidenceComment(comment, locale) };
    }
    return { item: row[0] ?? "", amount: row[1] ?? "", source: row[2] ?? "", comment: ensureMarketEvidenceComment([row[3], row[4]].filter(Boolean).join("; "), locale) };
  }).filter((row) => {
    const key = normalizeSourceKey([row.item, row.amount, row.source].join("|"));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return exportRows.slice(0, 8);
}

export function prepareReportExport(project: ProjectRecord, localeOverride?: unknown): PreparedReportExport {
  const locale = getReportLocale(project, localeOverride);
  const messages = getTranslations(locale).report;
  const rawReport = resolveReportData(project);

  if (!rawReport) {
    throw new Error(messages.exportNotReady);
  }

  const report = localizeReportData(rawReport, locale);
  const profile = getProjectProfile(project);
  const financial = report.financialModel;
  const generatedAt = report.generatedAt ?? new Date().toISOString();
  const executiveSummary = Array.isArray(report.executiveSummary) ? report.executiveSummary : [report.executiveSummary];
  const detailedConclusion = report.detailedConclusion ?? [];
  const summary = [
    { label: messages.projectName, value: typeof project.title === "string" ? project.title : report.title },
    { label: messages.businessType, value: toBusinessType(project, locale) },
    { label: messages.region, value: typeof profile.region === "string" ? formatRegion(profile.region, locale) : messages.notFilled },
    { label: messages.district, value: typeof profile.district === "string" ? formatDistrict(profile.district, locale) : messages.notFilled },
    { label: messages.plannedStart, value: typeof profile.plannedStartPeriod === "string" ? profile.plannedStartPeriod : messages.notFilled },
    { label: messages.overallScore, value: `${report.feasibilityScore}/100` },
    { label: messages.readiness, value: `${report.bankReadinessScore}/100` },
    { label: messages.keyFindings, value: executiveSummary[0] ?? messages.notFilled }
  ];

  const prepared: PreparedReportExport = {
    locale,
    fileNameBase: toFileNameBase(project),
    title: report.title,
    cover: [
      { label: messages.projectName, value: typeof project.title === "string" ? project.title : report.title },
      { label: messages.businessType, value: toBusinessType(project, locale) },
      { label: messages.region, value: typeof profile.region === "string" ? formatRegion(profile.region, locale) : messages.notFilled },
      { label: messages.district, value: typeof profile.district === "string" ? formatDistrict(profile.district, locale) : messages.notFilled },
      { label: messages.generatedAt, value: formatDate(generatedAt, locale) },
      {
        label: messages.language,
        value: locale === "uz" ? messages.languageUz : locale === "en" ? messages.languageEn : messages.languageRu
      }
    ],
    summary,
    executiveSummary,
    interviewRows: buildInterviewRows(project, locale),
    businessProfileRows: ((report.businessModelRows ?? []) as Array<Array<string>>).map((row) => ({ item: row[0] ?? "", amount: localizeProfileValue(row[1] ?? "", locale), source: sourceLabel("ai_classification", locale), comment: localizeProfileValue(row[2] ?? "", locale) })),
    marketEvidenceRows: marketEvidenceRowsForExport((report.marketEvidenceRows ?? []) as Array<Array<string>>, locale),
    sensitivityRows: [
      { item: locale === "ru" ? "Базовый сценарий" : locale === "uz" ? "Bazaviy ssenariy" : "Base scenario", amount: formatCurrencyFull(financial.revenue.monthlyRevenue, "UZS", locale), source: sourceLabel("calculated", locale), comment: locale === "ru" ? "Плановая выручка по введенным данным" : locale === "uz" ? "Kiritilgan ma'lumotlar bo'yicha rejalashtirilgan tushum" : "Planned revenue based on entered data" },
      { item: locale === "ru" ? "Снижение выручки на 10%" : locale === "uz" ? "Tushum 10% kamayishi" : "Downside -10% revenue", amount: formatCurrencyFull(Math.round(financial.revenue.monthlyRevenue * 0.9), "UZS", locale), source: sourceLabel("calculated", locale), comment: locale === "ru" ? "Стресс-тест спроса" : locale === "uz" ? "Talab stress-testi" : "Demand stress test" },
      { item: locale === "ru" ? "Рост выручки на 10%" : locale === "uz" ? "Tushum 10% o'sishi" : "Upside +10% revenue", amount: formatCurrencyFull(Math.round(financial.revenue.monthlyRevenue * 1.1), "UZS", locale), source: sourceLabel("calculated", locale), comment: locale === "ru" ? "Позитивный сценарий" : locale === "uz" ? "Ijobiy ssenariy" : "Upside scenario" }
    ],
    documentRows: ((report.documentsRows ?? []) as Array<Array<string>>).map((row) => ({ item: row[0] ?? "", amount: row[1] ?? "", source: [row[2], row[3], row[4], row[5]].filter(Boolean).join("; "), comment: row[6] ?? row[4] ?? "" })),
    premisesRows: [
      { item: locale === "ru" ? "Статус помещения" : locale === "uz" ? "Joy holati" : "Premises status", amount: labelValue(profile.premisesStatus, locale), source: sourceLabel("user_input", locale), comment: labelValue(profile.operationalModel ?? profile.businessProfile?.operationalModel, locale) },
      { item: locale === "ru" ? "Инфраструктура" : locale === "uz" ? "Infratuzilma" : "Infrastructure", amount: labelValue(profile.infrastructureReady, locale), source: sourceLabel("user_input", locale), comment: labelValue(profile.includedInfrastructure, locale) }
    ],
    actionPlanRows: ((report.actionPlanRows ?? []) as Array<Array<string>>).map((row) => ({ item: row[0] ?? "", amount: row[1] ?? "", source: row[2] ?? "", comment: row[3] ?? "" })),
    assumptionRows: ((report.assumptionsRows ?? []) as Array<Array<string>>).map((row) => ({ item: row[0] ?? "", amount: localizeLooseReportText(row[1] ?? "", locale), source: localizeLooseReportText(row[2] ?? "", locale), comment: "" })),
    financialRows: buildFinancialRows(report, financial, locale),
    risks: buildRiskRows(report.riskMatrix ?? (project.riskResult as RiskItem[]), locale),
    marketData: buildMarketRows(report, project, locale),
    importExport: buildImportExportRows(report, locale),
    recommendations: buildRecommendations(report, locale),
    formulaRows: buildFormulaExportRows(financial, locale),
    capexRows: buildCapexRows(financial, locale),
    opexRows: buildOpexRows(financial, locale),
    financingRows: buildFinancingRows(financial, locale),
    workingCapitalRows: buildWorkingCapitalRows(financial, locale),
    collateralRows: buildCollateralRows(project, locale),
    warnings: buildWarningRows(financial, locale),
    sources: buildSourceRows(report, locale),
    glossaryRows: getGlossaryRows(locale),
    detailedConclusion,
    financingRecommendation: buildExportFinancingRecommendation(financial, locale, report.financingRecommendation),
    disclaimer: report.disclaimer ?? getLocalizedDisclaimer(locale),
    generatedAt: formatDate(generatedAt, locale),
    aiReport: cleanPreparedAiReport(report.aiReport ?? null, locale) ?? null,
    webResearch: report.webResearchData ?? null,
    report
  };

  const sanitizedPrepared = sanitizeUserFacingObject(prepared, locale) as PreparedReportExport;
  const userFacingPrepared = normalizePreparedUserFacingText({
    ...sanitizedPrepared,
    fileNameBase: prepared.fileNameBase,
    sources: prepared.sources,
    aiReport: cleanPreparedAiReport(prepared.aiReport ?? null, locale) ?? null,
    report: prepared.report
  } as PreparedReportExport, locale);
  return userFacingPrepared;
}
