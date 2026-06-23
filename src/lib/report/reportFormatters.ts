import { reportMessages, tReport, type ReportLocale } from "../i18n/reportMessages.ts";
import type { DataSourceKind, FinancialResult, RiskItem } from "../types/project.ts";
import { formatCurrencyFull, formatCurrencyWithOriginal } from "../utils/formatCurrency.ts";
import { labelValue, localizeUnitLabel } from "../utils/labels.ts";
import { normalizeRiskLevel, formatRiskLevel } from "../risk/riskScoring.ts";

const numberLocale = (locale: ReportLocale) => locale === "en" ? "en-US" : locale === "uz" ? "uz-UZ" : "ru-RU";
const n = (value: number, locale: ReportLocale) => value.toLocaleString(numberLocale(locale));
const fill = (template: string, params: Record<string, string | number>) => Object.entries(params).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template);

export function reportSourceLabel(source: unknown, locale: ReportLocale): string {
  const key = String(source ?? "") as keyof typeof reportMessages.source;
  return key in reportMessages.source ? tReport(reportMessages.source[key], locale) : labelValue(source, locale);
}

export function reportStatus(key: keyof typeof reportMessages.statuses, locale: ReportLocale): string {
  return tReport(reportMessages.statuses[key], locale);
}

export function reportMetric(key: keyof typeof reportMessages.metrics, locale: ReportLocale): string {
  return tReport(reportMessages.metrics[key], locale);
}

export { normalizeRiskLevel, formatRiskLevel };

export function formatCapexLabel(key: string, fallback: string, locale: ReportLocale): string {
  const map = reportMessages.capex as Record<string, Record<ReportLocale, string>>;
  return map[key]?.[locale] ?? fallback;
}

export function formatOpexLabel(key: string, fallback: string, locale: ReportLocale): string {
  const map = reportMessages.opex as Record<string, Record<ReportLocale, string>>;
  return map[key]?.[locale] ?? fallback;
}

export function formatFormulaRows(financial: FinancialResult, locale: ReportLocale): FinancialResult["formulaRows"] {
  const f = financial;
  const money = (value: number | null) => value === null ? reportStatus("notApplicable", locale) : formatCurrencyFull(value, "UZS", locale);
  const daysLabel = locale === "en" ? "days" : locale === "uz" ? "kun" : "дней";
  const conversionLabel = locale === "en" ? "conversion" : locale === "uz" ? "konversiya" : "конверсия";
  const revenueSubstitution = f.revenue.displayVolumeSource === "user_input" && f.revenue.displayVolumeMonthlyEquivalent !== undefined
    ? f.revenue.conversionApplied && f.revenue.conversionPct !== undefined
      ? `${n(f.revenue.displayVolume ?? 0, locale)} ${localizeUnitLabel(f.revenue.displayVolumeUnitLabel ?? "ед./день", locale)} × ${n(f.revenue.workingDaysForDisplay ?? 0, locale)} ${daysLabel} × ${f.revenue.conversionPct}% ${conversionLabel} × ${f.revenue.expectedUtilizationPct}% × ${n(f.revenue.averagePrice, locale)}`
      : `${n(f.revenue.displayVolume ?? 0, locale)} ${localizeUnitLabel(f.revenue.displayVolumeUnitLabel ?? "ед./день", locale)} × ${n((f.revenue.workingDaysForDisplay ?? (f.revenue.displayVolumeMonthlyEquivalent / Math.max(f.revenue.displayVolume ?? 1, 1))), locale)} ${daysLabel} × ${f.revenue.expectedUtilizationPct}% × ${n(f.revenue.averagePrice, locale)}`
    : `${n(f.revenue.monthlyCapacity, locale)} ${localizeUnitLabel(f.revenue.unitLabel ?? "ед./мес.", locale)} × ${f.revenue.expectedUtilizationPct}% × ${n(f.revenue.averagePrice, locale)}`;
  const cogsFormula = f.cogs.calculationMode === "percent_of_revenue"
    ? (locale === "en" ? "Revenue × cost percentage" : locale === "uz" ? "Tushum × tannarx foizi" : "Выручка × процент себестоимости")
    : f.cogs.calculationMode === "cost_per_check"
      ? (locale === "en" ? "Orders × cost per average check × waste factor" : locale === "uz" ? "Buyurtmalar × o'rtacha chek tannarxi × chiqindi koeffitsiyenti" : "Заказы × себестоимость среднего чека × (1 + списания%)")
      : (locale === "en" ? "Units × unit cost × waste factor" : locale === "uz" ? "Birliklar × birlik tannarxi × chiqindi koeffitsiyenti" : "Единицы × себестоимость единицы × (1 + списания%)");
  const cogsSubstitution = f.cogs.calculationMode === "percent_of_revenue"
    ? `${n(f.revenue.monthlyRevenue, locale)} × ${f.cogs.foodCostPct ?? 0}% × ${1 + f.cogs.wasteAllowancePct / 100}`
    : `${n(f.revenue.effectiveUnits, locale)} × ${n(f.cogs.unitCOGS, locale)} × ${1 + f.cogs.wasteAllowancePct / 100}`;
  return [
    {
      indicator: locale === "en" ? "Monthly revenue" : locale === "uz" ? "Oylik tushum" : "Месячная выручка",
      formula: locale === "en" ? "Daily volume × working days × utilization × average check" : locale === "uz" ? "Kunlik hajm × ish kunlari × yuklama × o'rtacha chek" : "Дневной объем × рабочие дни × загрузка × средний чек",
      substitution: revenueSubstitution,
      result: money(f.revenue.monthlyRevenue),
      source: f.revenue.revenueSource === "stable" ? "user_input" : "calculated"
    },
    {
      indicator: tReport(reportMessages.formulas.cogs.indicator, locale),
      formula: cogsFormula,
      substitution: cogsSubstitution,
      result: money(f.cogs.monthlyCOGS),
      source: f.cogs.source
    },
    {
      indicator: tReport(reportMessages.formulas.grossMargin.indicator, locale),
      formula: tReport(reportMessages.formulas.grossMargin.formula, locale),
      substitution: `${n(f.profitability.monthlyGrossProfit, locale)} / ${n(f.revenue.monthlyRevenue, locale)}`,
      result: `${f.profitability.grossMarginPct}%`,
      source: "calculated"
    },
    {
      indicator: locale === "en" ? "Monthly operating expenses" : locale === "uz" ? "Oylik operatsion xarajatlar" : "Ежемесячные операционные расходы",
      formula: locale === "en" ? "Payroll + rent + utilities + marketing + maintenance + taxes + logistics + software + insurance + accounting + other" : locale === "uz" ? "Ish haqi + ijara + kommunal + marketing + servis + soliqlar + logistika + dasturiy ta'minot + sug'urta + buxgalteriya + boshqa" : "ФОТ + аренда + коммунальные + маркетинг + обслуживание + налоги + логистика + ПО + страхование + бухгалтерия + прочее",
      substitution: f.opex.lineItems.map((item) => n(item.amount, locale)).join(" + "),
      result: money(f.opex.monthlyFixedOpex),
      source: "calculated"
    },
    {
      indicator: tReport(reportMessages.formulas.workingCapital.indicator, locale),
      formula: tReport(reportMessages.formulas.workingCapital.formula, locale),
      substitution: `${n(f.workingCapital.monthlyFixedCosts, locale)} × ${f.workingCapital.bufferMonths} + ${n(f.workingCapital.initialInventory, locale)} + ${n(f.workingCapital.accountsReceivableBuffer, locale)} - ${n(f.workingCapital.accountsPayableBuffer, locale)} + ${n(f.workingCapital.seasonalStockBuffer, locale)}`,
      result: money(f.workingCapital.requiredWorkingCapital),
      source: "calculated"
    },
    {
      indicator: tReport(reportMessages.formulas.financingGap.indicator, locale),
      formula: locale === "en" ? "Investment need - available funding" : locale === "uz" ? "Investitsiya ehtiyoji - mavjud moliyalashtirish" : "Потребность в инвестициях - доступное финансирование",
      substitution: `${n(f.financing.totalInvestmentNeed, locale)} - ${n(f.financing.availableFunding, locale)}`,
      result: money(f.financing.financingGap),
      source: "calculated"
    },
    {
      indicator: tReport(reportMessages.formulas.breakEven.indicator, locale),
      formula: tReport(reportMessages.formulas.breakEven.formula, locale),
      substitution: `${n(f.opex.monthlyFixedOpex, locale)} / ${n(f.profitability.contributionMarginPerUnit, locale)}`,
      result: f.profitability.breakEvenUnits === null ? reportStatus("notCalculated", locale) : `${n(f.profitability.breakEvenUnits, locale)} ${localizeUnitLabel(f.revenue.unitLabel ?? (locale === "en" ? "units" : locale === "uz" ? "birlik" : "ед."), locale)}`,
      source: "calculated"
    },
    {
      indicator: locale === "en" ? "Debt payments / debt coverage ratio" : locale === "uz" ? "Qarz to'lovlari / qoplash koeffitsiyenti" : "Платежи по долгу / коэффициент покрытия долга",
      formula: locale === "en" ? "Loan/leasing payment; debt coverage ratio = EBITDA / debt service" : locale === "uz" ? "Kredit/lizing to'lovi; qoplash koeffitsiyenti = EBITDA / qarz to'lovlari" : "Платеж по кредиту/лизингу; коэффициент покрытия долга = EBITDA / платежи по долгу",
      substitution: f.financing.totalMonthlyDebtService > 0
        ? `${labelValue(f.financing.loanRepaymentType, locale)}; ${f.financing.loanAnnualRatePct}% / 12, ${f.financing.loanTermMonths} ${locale === "en" ? "months" : locale === "uz" ? "oy" : "мес."}, ${n(f.financing.loanRequired, locale)}; ${n(f.profitability.monthlyEBITDA, locale)} / ${n(f.financing.totalMonthlyDebtService, locale)}`
        : (locale === "en" ? "Debt coverage ratio is not calculated because debt service is 0." : locale === "uz" ? "Qarz to'lovi 0 bo'lgani uchun qoplash koeffitsiyenti hisoblanmaydi." : "Коэффициент покрытия долга не рассчитывается, так как долговая нагрузка равна 0."),
      result: f.financing.totalMonthlyDebtService > 0 ? `${money(f.financing.totalMonthlyDebtService)}; ${locale === "en" ? "ratio" : locale === "uz" ? "koeffitsiyent" : "коэффициент"} ${f.financing.dscrLabel}` : reportStatus("notApplicable", locale),
      source: f.financing.loanAnnualRateSource === "assumption" || f.financing.leasingAnnualRateSource === "assumption" ? "assumption" : "calculated"
    }
  ];
}

function employeeCountFromFinancial(financial: FinancialResult): number {
  return financial.payroll?.roles?.reduce((sum, role) => sum + Math.max(0, Number(role.count ?? 0)), 0) ?? 0;
}

function staffRoleFallback(locale: ReportLocale): string {
  if (locale === "en") return "Staff";
  if (locale === "uz") return "Xodimlar";
  return "Сотрудники";
}

function cleanStaffRoleName(value: unknown, locale: ReportLocale): string {
  const text = String(value ?? "").trim();
  const key = text.toLowerCase();
  const roleMap: Record<string, Record<ReportLocale, string>> = {
    seller: { ru: "Продавец-консультант", uz: "Sotuvchi-maslahatchi", en: "Sales consultant" },
    cashier: { ru: "Кассир", uz: "Kassir", en: "Cashier" },
    administrator: { ru: "Администратор", uz: "Administrator", en: "Administrator" },
    tailor: { ru: "Мастер по ремонту и подгонке одежды", uz: "Tikuvchi / kiyim ta'miri ustasi", en: "Tailor / clothing repair master" },
    seamstress: { ru: "Портной / швея", uz: "Tikuvchi", en: "Tailor / seamstress" },
    helper: { ru: "Помощник мастера", uz: "Yordamchi", en: "Assistant" },
    manager: { ru: "Управляющий", uz: "Boshqaruvchi", en: "Manager" },
    operator: { ru: "Оператор", uz: "Operator", en: "Operator" }
  };
  const localized = roleMap[key]?.[locale] ?? text;
  if (!localized || /требуется проверка|manual verification|not filled|undefined|null/i.test(localized)) return staffRoleFallback(locale);
  return localized;
}

export function payrollBreakdown(financial: FinancialResult, locale: ReportLocale): string {
  return financial.payroll?.roles?.length
    ? financial.payroll.roles.map((role) => `${cleanStaffRoleName(role.role, locale)} - ${role.count}`).join("; ")
    : tReport(reportMessages.comments.userData, locale);
}

export function buildLocalizedKeyFigures(financial: FinancialResult, project: { employeesCount?: number | null }, locale: ReportLocale): Array<[string, string, string]> {
  const f = financial;
  const m = (key: keyof typeof reportMessages.metrics) => reportMetric(key, locale);
  const c = (key: keyof typeof reportMessages.comments) => tReport(reportMessages.comments[key], locale);
  const totalInvestment = f.financing?.totalInvestmentNeed ?? (f.capex.totalCapEx + f.workingCapital.requiredWorkingCapital);
  const payrollTotal = f.payroll?.totalMonthlyPayrollUZS ?? 0;
  const employeeCount = Number(project.employeesCount ?? 0) > 0 ? Number(project.employeesCount) : employeeCountFromFinancial(f);
  const exchangeRateSnapshot = f.payroll?.exchangeRateSnapshot ?? f.financing.exchangeRateSnapshot;
  const positiveUsdAmount = (currency: unknown, amount: unknown) => currency === "USD" && Number(amount ?? 0) > 0;
  const usesUsd = positiveUsdAmount(f.financing.ownContributionCurrency, f.financing.ownContributionAmount)
    || positiveUsdAmount(f.financing.loanCurrency, f.financing.loanRequired)
    || positiveUsdAmount(f.financing.leasingCurrency, f.financing.leasingRequired)
    || f.payroll.roles.some((role) => positiveUsdAmount(role.monthlySalaryCurrency, role.monthlySalaryAmount));
  const exchangeRate = usesUsd ? (exchangeRateSnapshot?.rate ?? (f.financing.exchangeRateUZSPerUSD > 0 ? f.financing.exchangeRateUZSPerUSD : undefined)) : undefined;
  const notApplicable = reportStatus("notApplicable", locale);
  const leasingIncompleteComment = locale === "en" ? "Leasing is selected, but amount and terms are missing." : locale === "uz" ? "Lizing tanlangan, lekin summa va shartlar kiritilmagan." : "Лизинг выбран, но сумма и условия не указаны.";
  const leasingComment = f.financing.leasingRequired ? `${f.financing.leasingAnnualRatePct}% / ${f.financing.leasingTermMonths} ${locale === "en" ? "months" : locale === "uz" ? "oy" : "мес."}` : f.financing.leasingSelected ? leasingIncompleteComment : c("leasingNotApplicable");
  const leasingValue = f.financing.leasingRequired ? formatCurrencyFull(f.financing.leasingRequired, "UZS", locale) : f.financing.leasingSelected ? reportStatus("notFilled", locale) : notApplicable;
  const rows: Array<[string, string, string]> = [
    [m("totalInvestmentNeed"), formatCurrencyFull(totalInvestment, "UZS", locale), c("capexPlusWorkingCapital")],
    [m("ownContribution"), formatCurrencyWithOriginal(f.financing.ownContributionUZS, f.financing.ownContributionAmount, f.financing.ownContributionCurrency, locale), c("ownContributionEquivalent")],
    [m("ownContributionShare"), `${f.financing.ownContributionPct}%`, c("ownContributionOfNeed")],
    [m("financingGap"), f.financing.financingGap > 0 ? formatCurrencyFull(f.financing.financingGap, "UZS", locale) : notApplicable, f.financing.financingGap > 0 ? c("gapToClose") : c("needCovered")],
    [m("loanAmount"), f.financing.creditNeeded === "yes" ? formatCurrencyFull(f.financing.loanRequired, "UZS", locale) : notApplicable, f.financing.creditNeeded === "no" ? c("creditNotSelected") : c("creditNeedsClarification")],
    [m("annualLoanRate"), f.financing.creditNeeded === "yes" ? `${f.financing.loanAnnualRatePct}%` : notApplicable, f.financing.creditNeeded === "yes" ? reportSourceLabel(f.financing.loanAnnualRateSource, locale) : c("creditNotApplicable")],
    [m("monthlyLoanPayment"), f.financing.creditNeeded === "yes" ? formatCurrencyFull(f.financing.estimatedMonthlyLoanPayment, "UZS", locale) : notApplicable, f.financing.creditNeeded === "yes" ? fill(c("annualMonths"), { rate: f.financing.loanAnnualRatePct, months: f.financing.loanTermMonths }) : c("creditNotApplicable")],
    [m("leasingAmount"), leasingValue, leasingComment],
    [locale === "en" ? "Monthly leasing payment" : locale === "uz" ? "Oylik lizing to'lovi" : "Ежемесячный платеж по лизингу", f.financing.leasingSelected ? (f.financing.estimatedMonthlyLeasingPayment > 0 ? formatCurrencyFull(f.financing.estimatedMonthlyLeasingPayment, "UZS", locale) : reportStatus("notFilled", locale)) : notApplicable, f.financing.leasingSelected ? (f.financing.leasingPaymentSource === "user_input" ? c("userData") : (locale === "en" ? "Preliminary calculation; confirm with the leasing company" : locale === "uz" ? "Dastlabki hisob; lizing kompaniyasida tasdiqlash kerak" : "Предварительный расчет; подтвердить у лизинговой компании")) : c("leasingNotApplicable")],
    [locale === "en" ? "Total debt and leasing service" : locale === "uz" ? "Jami kredit va lizing yuklamasi" : "Общая долговая/лизинговая нагрузка", f.financing.totalMonthlyDebtService > 0 ? formatCurrencyFull(f.financing.totalMonthlyDebtService, "UZS", locale) : notApplicable, f.financing.totalMonthlyDebtService > 0 ? (locale === "en" ? "Loan payment + leasing payment" : locale === "uz" ? "Kredit to'lovi + lizing to'lovi" : "Кредитный платеж + лизинговый платеж") : c("noDebtService")],
    [m("startupCapex"), formatCurrencyFull(f.capex.totalCapEx, "UZS", locale), c("capexVisibleItems")],
    [m("workingCapital"), formatCurrencyFull(f.workingCapital.requiredWorkingCapital, "UZS", locale), fill(c("workingCapitalFormula"), { months: f.workingCapital.bufferMonths })],
    [m("monthlyPayroll"), formatCurrencyFull(payrollTotal, "UZS", locale), c("payrollByRoles")],
    [m("monthlyRevenue"), formatCurrencyFull(f.revenue.monthlyRevenue, "UZS", locale), c("monthlyRevenueFormula")],
    [m("annualRevenue"), formatCurrencyFull(f.revenue.annualRevenue, "UZS", locale), c("annualRevenueFormula")],
    [m("cogs"), formatCurrencyFull(f.cogs.monthlyCOGS, "UZS", locale), f.cogs.source === "assumption" ? c("cogsAssumption") : c("userData")],
    [m("cogsPerUnit"), formatCurrencyFull(f.cogs.wasteAdjustedUnitCOGS, "UZS", locale), c("wasteAdjusted")],
    [m("grossMargin"), `${f.profitability.grossMarginPct}%`, c("grossProfitRevenue")],
    [m("ebitda"), formatCurrencyFull(f.profitability.monthlyEBITDA, "UZS", locale), c("grossProfitOpex")],
    [m("breakEven"), f.profitability.breakEvenRevenue === null ? notApplicable : formatCurrencyFull(f.profitability.breakEvenRevenue, "UZS", locale), c("fixedContribution")],
    [m("dscr"), f.financing.dscrLabel, f.financing.totalMonthlyDebtService > 0 ? c("debtService") : c("noDebtService")],
    [m("paybackPeriod"), f.profitability.paybackMonths === null ? notApplicable : `${f.profitability.paybackMonths} ${locale === "en" ? "months" : locale === "uz" ? "oy" : "мес"}`, f.profitability.paybackMonths === null ? c("noNegativeCashPayback") : c("investmentNetCash")],
    [m("employeeCount"), employeeCount > 0 ? `${employeeCount}` : reportStatus("notFilled", locale), employeeCount > 0 ? payrollBreakdown(f, locale) : c("userData")]
  ];
  if (exchangeRate) {
    rows.push(
      [m("exchangeRate"), exchangeRate.toLocaleString(numberLocale(locale)), exchangeRateSnapshot?.source === "CBU" ? c("exchangeRateCbu") : c("exchangeRateAssumption")],
      [m("exchangeRateDate"), exchangeRateSnapshot?.rateDate ?? exchangeRateSnapshot?.date ?? reportStatus("notFilled", locale), exchangeRateSnapshot?.sourceUrl ?? c("exchangeRateAssumption")]
    );
  }
  const displayVolume = Number(f.revenue.displayVolume ?? f.revenue.monthlyCapacity);
  const displayUnit = f.revenue.displayVolumeUnitLabel ?? f.revenue.unitLabel ?? (locale === "en" ? "units/month" : locale === "uz" ? "birlik/oy" : "ед./мес.");
  const monthlyEquivalent = f.revenue.displayVolumeMonthlyEquivalent;
  const convertedUnit = localizeUnitLabel(f.revenue.monthlySalesUnitLabel ?? f.revenue.unitLabel ?? (locale === "en" ? "sales/month" : locale === "uz" ? "savdo/oy" : "продаж/мес."), locale);
  const monthlySalesValue = Number(f.revenue.monthlySales ?? monthlyEquivalent ?? f.revenue.effectiveUnits ?? f.revenue.monthlyCapacity);
  const plannedVolumeLabel = f.revenue.conversionApplied
    ? (locale === "en" ? "Planned sales volume" : locale === "uz" ? "Rejadagi savdo hajmi" : "Плановый объем продаж")
    : m("plannedVolume");
  const plannedVolumeValue = f.revenue.conversionApplied
    ? `${n(monthlySalesValue, locale)} ${convertedUnit}`
    : `${n(displayVolume, locale)} ${localizeUnitLabel(displayUnit, locale)}`;
  const plannedVolumeComment = f.revenue.conversionApplied
    ? (locale === "en"
      ? `Calculated from traffic, conversion and working days; source data is user-entered.`
      : locale === "uz"
        ? "Trafik, konversiya va ish kunlaridan hisoblangan; manba ma'lumotlar foydalanuvchi tomonidan kiritilgan."
        : "Рассчитано из потока, конверсии и рабочих дней; исходные данные введены пользователем.")
    : monthlyEquivalent && monthlyEquivalent !== displayVolume
      ? (locale === "en"
        ? `${c("userData")}; monthly equivalent for calculation: ${n(monthlyEquivalent, locale)} ${localizeUnitLabel(f.revenue.unitLabel ?? "units/month", locale)}`
        : locale === "uz"
          ? `${c("userData")}; hisob-kitob uchun oylik ekvivalent: ${n(monthlyEquivalent, locale)} ${localizeUnitLabel(f.revenue.unitLabel ?? "birlik/oy", locale)}`
          : `${c("userData")}; для расчёта в месяц: ${n(monthlyEquivalent, locale)} ${localizeUnitLabel(f.revenue.unitLabel ?? "ед./мес.", locale)}`)
      : c("userData");
  rows.push([plannedVolumeLabel, plannedVolumeValue, plannedVolumeComment]);
  const transparencyComment = locale === "en" ? "Revenue calculation transparency" : locale === "uz" ? "Tushum hisob-kitobi shaffofligi" : "Прозрачность расчёта выручки";
  const monthlyUnit = localizeUnitLabel(f.revenue.conversionApplied ? (f.revenue.monthlySalesUnitLabel ?? "продаж/мес.") : (f.revenue.unitLabel ?? (locale === "en" ? "units/month" : locale === "uz" ? "birlik/oy" : "ед./мес.")), locale);
  if (monthlyEquivalent && monthlyEquivalent !== displayVolume) {
    const workingDays = f.revenue.workingDaysForDisplay ?? Math.round(monthlyEquivalent / Math.max(displayVolume, 1));
    rows.push([locale === "en" ? "Customer traffic" : locale === "uz" ? "Mijozlar oqimi" : "Поток покупателей", `${n(displayVolume, locale)} ${localizeUnitLabel(displayUnit, locale)}`, transparencyComment]);
    if (Number.isFinite(workingDays) && workingDays > 0) {
      rows.push([locale === "en" ? "Working days per month" : locale === "uz" ? "Oyiga ish kunlari" : "Рабочих дней в месяц", `${workingDays}`, transparencyComment]);
    }
    if (f.revenue.conversionApplied && f.revenue.conversionPct !== undefined) {
      rows.push([locale === "en" ? "Conversion" : locale === "uz" ? "Konversiya" : "Конверсия", `${f.revenue.conversionPct}%`, transparencyComment]);
    }
    rows.push([locale === "en" ? "Potential monthly sales" : locale === "uz" ? "Oylik savdo salohiyati" : "Потенциальный объем продаж в месяц", `${n(monthlyEquivalent, locale)} ${monthlyUnit}`, transparencyComment]);
  }
  if (f.revenue.effectiveUnits > 0) {
    rows.push([locale === "en" ? "Calculated sales volume" : locale === "uz" ? "Hisoblangan savdo hajmi" : "Расчётный объем продаж", `${n(f.revenue.effectiveUnits, locale)} ${monthlyUnit}`, transparencyComment]);
  }
  rows.push([locale === "en" ? "Utilization" : locale === "uz" ? "Yuklama" : "Загрузка", `${f.revenue.expectedUtilizationPct}%`, transparencyComment]);
  if (f.revenue.averagePrice > 0) {
    rows.push([locale === "en" ? "Average ticket / price" : locale === "uz" ? "O'rtacha chek / narx" : "Средний чек / цена", formatCurrencyFull(f.revenue.averagePrice, "UZS", locale), transparencyComment]);
  }
  if (monthlyEquivalent && monthlyEquivalent !== displayVolume && f.revenue.averagePrice > 0) {
    const workingDays = f.revenue.workingDaysForDisplay ?? Math.round(monthlyEquivalent / Math.max(displayVolume, 1));
    const daysLabel = locale === "en" ? "days" : locale === "uz" ? "kun" : "дней";
    const formula = f.revenue.conversionApplied && f.revenue.conversionPct !== undefined
      ? `${n(displayVolume, locale)} ${localizeUnitLabel(displayUnit, locale)} × ${workingDays} ${daysLabel} × ${f.revenue.conversionPct}% ${locale === "en" ? "conversion" : locale === "uz" ? "konversiya" : "конверсия"} × ${f.revenue.expectedUtilizationPct}% × ${n(f.revenue.averagePrice, locale)} = ${formatCurrencyFull(f.revenue.monthlyRevenue, "UZS", locale)}`
      : `${n(displayVolume, locale)} ${localizeUnitLabel(displayUnit, locale)} × ${workingDays} ${daysLabel} × ${f.revenue.expectedUtilizationPct}% × ${n(f.revenue.averagePrice, locale)} = ${formatCurrencyFull(f.revenue.monthlyRevenue, "UZS", locale)}`;
    rows.push([locale === "en" ? "Revenue formula" : locale === "uz" ? "Tushum formulasi" : "Формула выручки", formula, transparencyComment]);
  }
  return rows;
}

export function buildLocalizedInvestmentBreakdown(financial: FinancialResult, locale: ReportLocale): Array<[string, string, string]> {
  const c = (key: keyof typeof reportMessages.comments) => tReport(reportMessages.comments[key], locale);
  const totalInvestment = financial.financing?.totalInvestmentNeed ?? (financial.capex.totalCapEx + financial.workingCapital.requiredWorkingCapital);
  return [
    ...financial.capex.lineItems.map((item) => [formatCapexLabel(item.key, item.label, locale), formatCurrencyFull(item.amount, "UZS", locale), reportSourceLabel(item.source, locale)] as [string, string, string]),
    [reportMetric("workingCapital", locale), formatCurrencyFull(financial.workingCapital.requiredWorkingCapital, "UZS", locale), c("workingCapitalFormula").replace("{months}", String(financial.workingCapital.bufferMonths))],
    [locale === "en" ? "Total investments" : locale === "uz" ? "Jami investitsiyalar" : "Итого инвестиций", formatCurrencyFull(totalInvestment, "UZS", locale), c("capexPlusWorkingCapital")]
  ];
}

const warningTitles: Record<string, Record<ReportLocale, string>> = {
  revenue_conflict: { ru: "Расхождение в выручке", en: "Revenue mismatch", uz: "Tushumda tafovut" },
  cogs_assumption: { ru: "Допущение по себестоимости", en: "COGS assumption", uz: "Tannarx farazi" },
  negative_contribution_margin: { ru: "Отрицательная маржа", en: "Negative contribution margin", uz: "Manfiy marjinal daromad" },
  loan_conflict: { ru: "Конфликт по кредиту", en: "Loan conflict", uz: "Kredit bo'yicha nomuvofiqlik" },
  leasing_conflict: { ru: "Конфликт по лизингу", en: "Leasing conflict", uz: "Lizing bo'yicha nomuvofiqlik" },
  leasing_terms_missing: { ru: "Неполные условия лизинга", en: "Incomplete leasing terms", uz: "Lizing shartlari to'liq emas" },
  low_daily_orders: { ru: "Слишком низкий дневной объем продаж", en: "Very low daily sales volume", uz: "Kunlik sotuv hajmi juda past" },
  suspicious_low_orders: { ru: "Подозрительно низкий объем продаж", en: "Suspiciously low sales volume", uz: "Sotuv hajmi shubhali darajada past" },
  average_ticket_unit_cost_conflict: { ru: "Конфликт среднего чека и себестоимости", en: "Average check and cost mismatch", uz: "O'rtacha chek va tannarx nomuvofiqligi" },
  district_region_mismatch: { ru: "Регион и район не совпадают", en: "Region and district mismatch", uz: "Viloyat va tuman mos emas" },
  finance_text_conflict: { ru: "Ориентировочные суммы в описании финансирования", en: "Approximate financing amounts in description", uz: "Moliyalashtirish tavsifidagi taxminiy summalar" },
  finance_text_fallback_used: { ru: "Сумма взята из текстового описания", en: "Amount taken from financing description", uz: "Summa matnli tavsifdan olindi" },
  zero_own_contribution: { ru: "Собственные средства не указаны", en: "Own contribution missing", uz: "O'z mablag'i kiritilmagan" },
  zero_payroll: { ru: "Нулевая зарплата", en: "Zero payroll", uz: "Ish haqi nol" },
  rent_missing: { ru: "Не указана аренда", en: "Rent missing", uz: "Ijara ko'rsatilmagan" },
  loan_terms_missing: { ru: "Неполные условия кредита", en: "Incomplete loan terms", uz: "Kredit shartlari to'liq emas" },
  loan_rate_assumption: { ru: "Ставка кредита указана как допущение", en: "Loan rate uses an assumption", uz: "Kredit stavkasi faraz sifatida ishlatilgan" },
  leasing_rate_assumption: { ru: "Ставка лизинга указана как допущение", en: "Leasing rate uses an assumption", uz: "Lizing stavkasi faraz sifatida ishlatilgan" },
  collateral_valuation_missing: { ru: "Оценка залога не подтверждена", en: "Collateral valuation not confirmed", uz: "Garov bahosi tasdiqlanmagan" },
  collateral_details_missing: { ru: "Детали залога требуют уточнения", en: "Collateral details need clarification", uz: "Garov tafsilotlarini aniqlashtirish kerak" },
  fx_buffer_missing: { ru: "Не уточнен валютный буфер", en: "FX buffer not specified", uz: "Valyuta buferi aniqlanmagan" },
  seasonality_buffer_missing: { ru: "Не задан сезонный буфер", en: "Seasonal buffer missing", uz: "Mavsumiy bufer kiritilmagan" },
  financing_gap: { ru: "Разрыв финансирования", en: "Financing gap", uz: "Moliyalashtirish bo'shlig'i" },
  low_ebitda_margin: { ru: "Низкая EBITDA-маржа", en: "Low EBITDA margin", uz: "EBITDA marjasi past" },
  low_dscr_bank_readiness: { ru: "Низкое покрытие долга", en: "Low DSCR bank readiness", uz: "DSCR bo'yicha bank tayyorligi past" },
  low_own_contribution: { ru: "Низкая доля собственных средств", en: "Low own contribution", uz: "O'z mablag'i ulushi past" },
  negative_financial_value: { ru: "Некорректное отрицательное значение", en: "Invalid negative value", uz: "Noto'g'ri manfiy qiymat" },
  absurd_monthly_volume: { ru: "Аномально высокий объём", en: "Abnormally high volume", uz: "Hajm noodatiy yuqori" },
  dscr_high_anomaly: { ru: "Аномально высокий DSCR", en: "Abnormally high DSCR", uz: "DSCR noodatiy yuqori" },
  zero_revenue_with_inputs: { ru: "Выручка не рассчиталась", en: "Revenue was not calculated", uz: "Tushum hisoblanmadi" },
  online_no_premises_capex: { ru: "Онлайн-формат без ремонта помещения", en: "Online format without premises renovation", uz: "Onlayn formatda joy ta'miri yo'q" },
  negative_margin: { ru: "Отрицательная маржа", en: "Negative margin", uz: "Manfiy marja" }
};

const warningMessages: Record<string, Record<ReportLocale, string>> = {
  revenue_conflict: { ru: "Указанная стабильная выручка отличается от расчета по объему, цене и загрузке.", en: "The stated stable revenue differs from the calculation based on volume, price and utilization.", uz: "Kiritilgan barqaror tushum hajm, narx va yuklama bo'yicha hisob-kitobdan farq qiladi." },
  cogs_assumption: { ru: "Себестоимость за единицу не указана; COGS и маржа рассчитаны по допущению.", en: "Unit COGS is not specified; COGS and margin are calculated using an assumption.", uz: "Bir birlik tannarxi kiritilmagan; COGS va marja faraz asosida hisoblangan." },
  negative_contribution_margin: { ru: "Себестоимость равна или выше цены продажи; точка безубыточности не рассчитывается корректно.", en: "Cost is equal to or higher than sales price; break-even cannot be calculated reliably.", uz: "Tannarx sotuv narxiga teng yoki undan yuqori; zararsizlik nuqtasi ishonchli hisoblanmaydi." },
  loan_conflict: { ru: "Выбран вариант без кредита, но указана сумма кредита.", en: "No-credit option is selected, but a loan amount is entered.", uz: "Kreditsiz variant tanlangan, lekin kredit summasi kiritilgan." },
  leasing_conflict: { ru: "Выбран вариант без лизинга, но указана сумма лизинга.", en: "No-leasing option is selected, but a leasing amount is entered.", uz: "Lizingsiz variant tanlangan, lekin lizing summasi kiritilgan." },
  leasing_terms_missing: { ru: "Лизинг выбран, но сумма, срок и/или объект лизинга не заполнены полностью.", en: "Leasing is selected, but amount, term and/or leased asset are incomplete.", uz: "Lizing tanlangan, ammo summa, muddat va/yoki obyekt to'liq kiritilmagan." },
  low_daily_orders: { ru: "Значение 1–2 заказа/день выглядит слишком низким для мини-пекарни или точки общепита.", en: "1–2 orders per day looks too low for a bakery or food-service point.", uz: "Kuniga 1–2 buyurtma novvoyxona yoki ovqatlanish nuqtasi uchun juda past ko'rinadi." },
  suspicious_low_orders: { ru: "План продаж выглядит низким для стационарной точки общепита. Проверьте, не введено ли месячное значение вместо дневного.", en: "Sales volume looks low for a fixed food-service location. Check whether a monthly value was entered instead of a daily value.", uz: "Statsionar ovqatlanish nuqtasi uchun sotuv hajmi past ko'rinadi. Oylik qiymat kunlik qiymat o'rniga kiritilmaganini tekshiring." },
  average_ticket_unit_cost_conflict: { ru: "Средний чек и себестоимость похожи на разные единицы расчета. Для пекарни лучше указать себестоимость среднего чека или процент себестоимости от выручки.", en: "Average check and cost seem to use different units. Use cost per average check or cost percentage for a bakery.", uz: "O'rtacha chek va tannarx turli hisob birliklariga o'xshaydi. Novvoyxona uchun o'rtacha chek tannarxi yoki tushumdan tannarx foizini kiriting." },
  district_region_mismatch: { ru: "Юнусабад относится к городу Ташкенту, а не к Ташкентской области. Проверьте регион и район.", en: "Yunusabad belongs to Tashkent city, not Tashkent region. Check the selected region and district.", uz: "Yunusobod Toshkent viloyatiga emas, Toshkent shahriga kiradi. Viloyat va tumanni tekshiring." },
  finance_text_conflict: { ru: "В текстовом описании финансирования есть ориентировочные суммы. Для расчётов использованы числовые поля формы.", en: "The financing description contains approximate amounts. The calculation used the structured numeric fields from the form.", uz: "Moliyalashtirish tavsifida taxminiy summalar ko‘rsatilgan. Hisob-kitoblar uchun shakldagi raqamli maydonlar ishlatildi." },
  finance_text_fallback_used: { ru: "Часть числовых полей финансирования не была заполнена. Для предварительного расчёта использована явно указанная сумма из текстового описания.", en: "Some structured financing fields were not filled in. The preliminary calculation used a clearly stated amount from the financing description.", uz: "Moliyalashtirish bo‘yicha ayrim raqamli maydonlar to‘ldirilmagan. Dastlabki hisob-kitob uchun matnli tavsifdagi aniq summa ishlatildi." },
  zero_own_contribution: { ru: "Собственные средства равны нулю при выбранном внешнем финансировании.", en: "Own contribution is zero while external financing is selected.", uz: "Tashqi moliyalashtirish tanlangan, lekin o'z mablag'i nol." },
  zero_payroll: { ru: "В плане персонала есть должность с нулевой или неуказанной зарплатой.", en: "The staff plan contains a role with zero or missing salary.", uz: "Xodimlar rejasida maoshi nol yoki kiritilmagan lavozim bor." },
  rent_missing: { ru: "Помещение отмечено как аренда/субаренда, но ежемесячная аренда не указана; аренда не подставлялась как факт. Для надежной EBITDA нужно ввести стоимость аренды.", en: "Premises are marked as rented, but monthly rent is missing; an assumption was used.", uz: "Joy ijara deb belgilangan, lekin oylik ijara kiritilmagan; faraz ishlatilgan." },
  loan_terms_missing: { ru: "Кредит указан, но сумма, срок и/или цель кредита не заполнены полностью.", en: "A loan is selected, but amount, term and/or purpose is incomplete.", uz: "Kredit tanlangan, ammo summa, muddat va/yoki maqsad to'liq kiritilmagan." },
  loan_rate_assumption: { ru: "Процентная ставка кредита не указана. Расчет платежа и DSCR выполнен по допущению.", en: "Loan interest rate is not specified. Payment and DSCR are calculated using an assumption.", uz: "Kredit foiz stavkasi kiritilmagan. To'lov va DSCR faraz asosida hisoblangan." },
  leasing_rate_assumption: { ru: "Ставка/удорожание лизинга не указаны. Расчет платежа выполнен по допущению.", en: "Leasing rate/markup is not specified. Payment is calculated using an assumption.", uz: "Lizing stavkasi/ustamasi kiritilmagan. To'lov faraz asosida hisoblangan." },
  collateral_valuation_missing: { ru: "Залог указан текстом, но надежная рыночная оценка не найдена или не введена.", en: "Collateral is described, but reliable market valuation is missing.", uz: "Garov ko'rsatilgan, ammo ishonchli bozor bahosi kiritilmagan yoki topilmagan." },
  collateral_details_missing: { ru: "Залог отмечен как доступный, но тип или оценочная стоимость не заполнены. Это предупреждение не блокирует расчёт, если условия кредита достаточны.", en: "Collateral is marked as available, but type or estimated value is missing. This warning does not block the calculation if loan terms are complete.", uz: "Garov mavjud deb belgilangan, lekin turi yoki bahosi kiritilmagan. Kredit shartlari to'liq bo'lsa, bu ogohlantirish hisobni bloklamaydi." },
  fx_buffer_missing: { ru: "Указаны импортные поставки, но валютный буфер/валюта закупок не уточнены.", en: "Imported supplies are indicated, but FX buffer or purchase currency is not specified.", uz: "Import ta'minoti ko'rsatilgan, lekin valyuta buferi yoki xarid valyutasi aniqlanmagan." },
  seasonality_buffer_missing: { ru: "Продажи сезонные, но сезонный запас/буфер не задан; в расчете оборотного капитала сезонный запас принят как 0 до уточнения пользователем.", en: "Sales are seasonal, but seasonal stock/buffer is missing; the seasonal stock buffer is treated as 0 until the user clarifies it.", uz: "Sotuvlar mavsumiy, ammo mavsumiy zaxira/bufer kiritilmagan; foydalanuvchi aniqlashtirmaguncha mavsumiy zaxira 0 deb olinadi." },
  financing_gap: { ru: "Есть разрыв финансирования. Нужно увеличить собственные средства, подтвердить кредит/лизинг или сократить стартовые вложения.", en: "There is a financing gap. Increase own funds, confirm loan/leasing, or reduce startup investments.", uz: "Moliyalashtirish bo'shlig'i bor. O'z mablag'ini oshirish, kredit/lizingni tasdiqlash yoki boshlang'ich xarajatlarni kamaytirish kerak." },
  low_own_contribution: { ru: "Доля собственных средств ниже 20%. Для финансирования стоит увеличить собственное участие или снизить стартовые вложения.", en: "Own contribution is below 20%. Increase own funds or reduce startup investments before applying for financing.", uz: "O'z mablag'i ulushi 20% dan past. Moliyalashtirish uchun o'z ulushingizni oshiring yoki boshlang'ich xarajatlarni kamaytiring." },
  negative_financial_value: { ru: "Выручка или себестоимость получились отрицательными. Проверьте объём, цену, себестоимость и единицы расчёта.", en: "Revenue or cost is negative. Check volume, price, cost and units.", uz: "Tushum yoki tannarx manfiy chiqdi. Hajm, narx, tannarx va birliklarni tekshiring." },
  absurd_monthly_volume: { ru: "Плановый месячный объём выглядит аномально высоким. Проверьте, не было ли месячное значение повторно умножено на рабочие дни.", en: "Planned monthly volume looks abnormally high. Check whether a monthly value was multiplied by working days again.", uz: "Rejalashtirilgan oylik hajm noodatiy yuqori. Oylik qiymat ish kunlariga qayta ko'paytirilmaganini tekshiring." },
  dscr_high_anomaly: { ru: "DSCR выше 10. Это возможно при малой долговой нагрузке, но требует пояснения и проверки выручки, EBITDA и платежей.", en: "DSCR is above 10. This can happen with very low debt service, but revenue, EBITDA and payments should be explained.", uz: "DSCR 10 dan yuqori. Bu qarz yuki juda kichik bo'lsa mumkin, lekin tushum, EBITDA va to'lovlarni izohlash kerak." },
  zero_revenue_with_inputs: { ru: "Объём и цена заполнены, но месячная выручка равна нулю. Проверьте загрузку, период объёма и единицу продаж.", en: "Volume and price are filled in, but monthly revenue is zero. Check utilization, volume period and sales unit.", uz: "Hajm va narx kiritilgan, lekin oylik tushum nol. Yuklama, hajm davri va sotuv birligini tekshiring." },
  online_no_premises_capex: { ru: "Бизнес отмечен как online only; ремонт помещения не включен в стартовые вложения, пока пользователь не указал его отдельно.", en: "The business is marked as online-only; premises renovation is not included unless entered separately.", uz: "Biznes faqat onlayn deb belgilangan; joy ta'miri alohida kiritilmaguncha boshlang'ich xarajatlarga qo'shilmaydi." },
  low_ebitda_margin: { ru: "EBITDA-маржа ниже 5%. Бизнес уязвим к снижению продаж, росту аренды, логистики или закупочной цены.", en: "EBITDA margin is below 5%. The business is vulnerable to lower sales or higher costs.", uz: "EBITDA marjasi 5% dan past. Biznes sotuv pasayishi yoki xarajatlar oshishiga sezgir." },
  low_dscr_bank_readiness: { ru: "DSCR ниже 1,2. Для банка источник погашения выглядит слабым без увеличения маржи, выручки или собственных средств.", en: "DSCR is below 1.2. Repayment source looks weak without higher margin, revenue or own funds.", uz: "DSCR 1,2 dan past. Marja, tushum yoki o'z mablag'i oshirilmasa, to'lov manbai zaif ko'rinadi." },
  negative_margin: { ru: "Себестоимость равна или выше цены продажи; точка безубыточности не рассчитывается корректно.", en: "Cost is equal to or higher than sales price; break-even cannot be calculated reliably.", uz: "Tannarx sotuv narxiga teng yoki undan yuqori; zararsizlik nuqtasi ishonchli hisoblanmaydi." }
};

export function formatWarningTitle(code: string, locale: ReportLocale): string {
  return warningTitles[code]?.[locale] ?? labelValue(code, locale);
}

export function formatWarningMessage(code: string, fallback: string, locale: ReportLocale): string {
  return warningMessages[code]?.[locale] ?? fallback;
}

export function formatWarningValueLabel(key: string, locale: ReportLocale): string {
  const map: Record<string, Record<ReportLocale, string>> = {
    financingGap: reportMessages.metrics.financingGap,
    assumedAnnualRatePct: { ru: "Допущенная годовая ставка", en: "Assumed annual rate", uz: "Faraz qilingan yillik stavka" },
    assumedLeasingAnnualRatePct: { ru: "Допущенная ставка лизинга", en: "Assumed leasing rate", uz: "Faraz qilingan lizing stavkasi" },
    loanRequired: reportMessages.metrics.loanAmount,
    requestedLoanAmount: reportMessages.metrics.loanAmount,
    requestedLeasingAmount: reportMessages.metrics.leasingAmount,
    leasingRequired: reportMessages.metrics.leasingAmount,
    collateralType: { ru: "Предмет залога", en: "Collateral item", uz: "Garov predmeti" },
    calculatedMonthlyRevenue: reportMessages.metrics.monthlyRevenue,
    stableMonthlyRevenue: { ru: "Стабильная выручка", en: "Stable revenue", uz: "Barqaror tushum" },
    differencePct: { ru: "Отклонение", en: "Difference", uz: "Tafovut" },
    assumedUnitCOGS: reportMessages.metrics.cogsPerUnit,
    ebitdaMarginPct: { ru: "EBITDA-маржа", en: "EBITDA margin", uz: "EBITDA marjasi" },
    dscr: { ru: "DSCR", en: "DSCR", uz: "DSCR" },
    fields: { ru: "Поля", en: "Fields", uz: "Maydonlar" },
    conflicts: { ru: "Расхождения", en: "Mismatches", uz: "Tafovutlar" },
    ownContributionPct: { ru: "Доля собственных средств", en: "Own contribution share", uz: "O'z mablag'i ulushi" },
    gapPct: { ru: "Отклонение, %", en: "Gap, %", uz: "Tafovut, %" },
    monthlyCapacity: { ru: "Плановый месячный объём", en: "Planned monthly volume", uz: "Rejalashtirilgan oylik hajm" },
    calculationPolicy: { ru: "Политика расчёта", en: "Calculation policy", uz: "Hisob-kitob siyosati" }
  };
  return map[key]?.[locale] ?? labelValue(key, locale);
}

export function formatWarningValue(key: string, value: unknown, locale: ReportLocale): string {
  if (value === "structured_fields_used") {
    return locale === "en" ? "Structured numeric fields used" : locale === "uz" ? "Shakldagi raqamli maydonlar ishlatildi" : "Использованы числовые поля формы";
  }
  if (value === "free_text_fallback_used") {
    return locale === "en" ? "Free-text fallback used" : locale === "uz" ? "Matnli tavsifdan zaxira qiymat ishlatildi" : "Использовано значение из текстового описания";
  }
  if (typeof value === "number") {
    if (/pct|rate/i.test(key)) return `${value}%`;
    if (/amount|gap|required|loan|leasing|funding|revenue|cogs/i.test(key)) return formatCurrencyFull(value, "UZS", locale);
  }
  return labelValue(value, locale);
}

const riskCopy: Record<string, Record<ReportLocale, { title: string; description: string; reason: string; mitigation: string }>> = {
  market_demand: {
    ru: { title: "Рыночный спрос", description: "Без подтвержденного спроса бизнес может не выйти на плановую выручку.", reason: "Каналы и спрос описаны, но их нужно подтвердить документами или тестовыми продажами.", mitigation: "Проверить цены конкурентов, собрать предварительные заказы, письма о намерениях или результаты тестовых продаж." },
    en: { title: "Market demand", description: "Without confirmed demand, the business may not reach planned revenue.", reason: "Channels and demand are described, but need confirmation through documents or test sales.", mitigation: "Check competitor prices and collect pre-orders, letters of intent, or test sales results." },
    uz: { title: "Bozor talabi", description: "Tasdiqlangan talab bo'lmasa, biznes rejalashtirilgan tushumga chiqa olmasligi mumkin.", reason: "Kanallar va talab tasvirlangan, lekin hujjatlar yoki test sotuvlar bilan tasdiqlash kerak.", mitigation: "Raqobatchilar narxini tekshirish, oldindan buyurtmalar, niyat xatlari yoki test sotuv natijalarini yig'ish." }
  },
  certification_risk: {
    ru: { title: "Документы и разрешения", description: "Для запуска бизнеса могут потребоваться регистрация, договоры, разрешения, санитарные или отраслевые документы.", reason: "План документов или консультант указан, но подтверждающие материалы нужно проверить.", mitigation: "Проверить отраслевые требования, получить консультацию, заложить бюджет и сроки оформления до запуска." },
    en: { title: "Documents and permits", description: "Business launch may require registration, contracts, permits, sanitary or industry documents.", reason: "A document plan or consultant is indicated, but supporting materials must be checked.", mitigation: "Check industry requirements, get consultation, and budget time and cost for formalization before launch." },
    uz: { title: "Hujjatlar va ruxsatnomalar", description: "Biznesni ishga tushirish uchun ro'yxatdan o'tish, shartnomalar, ruxsatnomalar, sanitariya yoki soha hujjatlari kerak bo'lishi mumkin.", reason: "Hujjatlar rejasi yoki konsultant ko'rsatilgan, lekin tasdiqlovchi materiallarni tekshirish kerak.", mitigation: "Soha talablarini tekshirish, maslahat olish, ishga tushirishdan oldin rasmiylashtirish xarajati va muddatini rejalashtirish." }
  },
  fx_risk: {
    ru: { title: "Валютный риск", description: "Сырье, оборудование и запасные части могут зависеть от курса валют, а продажи обычно идут в UZS.", reason: "Планируются импортные или смешанные поставки, валютный буфер не подтвержден.", mitigation: "Сравнить локальных и импортных поставщиков, предусмотреть валютный запас в цене и иметь 2-3 альтернативных поставщика." },
    en: { title: "FX risk", description: "Raw materials, equipment and spare parts may depend on exchange rates, while sales are usually in UZS.", reason: "Imported or mixed supplies are planned, and the FX buffer is not confirmed.", mitigation: "Compare local and imported suppliers, include an FX buffer in pricing, and keep 2-3 alternative suppliers." },
    uz: { title: "Valyuta riski", description: "Xomashyo, uskunalar va ehtiyot qismlar valyuta kursiga bog'liq bo'lishi mumkin, sotuvlar esa odatda UZSda bo'ladi.", reason: "Import yoki aralash ta'minot rejalashtirilgan, valyuta buferi tasdiqlanmagan.", mitigation: "Mahalliy va import yetkazib beruvchilarni solishtirish, narxda valyuta zaxirasini hisobga olish va 2-3 muqobil yetkazib beruvchi topish." }
  },
  infrastructure_risk: {
    ru: { title: "Помещение и инфраструктура", description: "Площадка или локация влияет на запуск, поток клиентов, коммунальные условия, склад и доступ к транспорту.", reason: "Помещение и инфраструктура заявлены, но параметры нужно проверить документально.", mitigation: "Проверить коммунальные условия, склад, договор аренды/собственности, трафик и ограничения по деятельности." },
    en: { title: "Premises and infrastructure", description: "Site and location affect launch, customer flow, utilities, storage and transport access.", reason: "Premises and infrastructure are stated, but parameters need documentary verification.", mitigation: "Check utilities, storage, lease/ownership agreement, traffic and activity restrictions." },
    uz: { title: "Joy va infratuzilma", description: "Joy yoki lokatsiya ishga tushirish, mijozlar oqimi, kommunal sharoit, ombor va transportga kirishga ta'sir qiladi.", reason: "Joy va infratuzilma ko'rsatilgan, lekin parametrlarni hujjatlar bilan tekshirish kerak.", mitigation: "Kommunal sharoit, ombor, ijara/mulk shartnomasi, trafik va faoliyat cheklovlarini tekshirish." }
  },
  working_capital_risk: {
    ru: { title: "Оборотный капитал", description: "Бизнесу нужны деньги на закупки, аренду, зарплату и период до оплаты от клиентов.", reason: "Резерв оборотного капитала выглядит ограниченным.", mitigation: "Отдельно рассчитать закупки, график оплат клиентов и минимум 3 месяца фиксированных расходов." },
    en: { title: "Working capital", description: "The business needs cash for purchases, rent, payroll and the period before customer payments.", reason: "The working capital reserve looks limited.", mitigation: "Separately calculate purchases, customer payment schedule and at least 3 months of fixed expenses." },
    uz: { title: "Aylanma kapital", description: "Biznesga xaridlar, ijara, ish haqi va mijozlardan to'lov kelguncha bo'lgan davr uchun mablag' kerak.", reason: "Aylanma kapital zaxirasi cheklangan ko'rinadi.", mitigation: "Xaridlar, mijoz to'lovlari jadvali va kamida 3 oylik doimiy xarajatlarni alohida hisoblash." }
  },
  equipment_risk: {
    ru: { title: "Оборудование и сервис", description: "Срыв поставки, монтаж или простой оборудования снижает продажи, выпуск или качество услуги.", reason: "Планируется оборудование, сервис и запасные части нужно подтвердить.", mitigation: "Получить КП, гарантию, условия сервиса, список запасных частей или альтернатив и план обучения персонала." },
    en: { title: "Equipment and service", description: "Delivery, installation or equipment downtime can reduce sales, output or service quality.", reason: "Equipment is planned; service and spare parts need confirmation.", mitigation: "Obtain commercial offers, warranty, service terms, spare-part or alternative lists, and staff training plan." },
    uz: { title: "Uskunalar va servis", description: "Yetkazib berish, montaj yoki uskunaning to'xtab qolishi sotuv, ishlab chiqarish yoki xizmat sifatini pasaytiradi.", reason: "Uskunalar rejalashtirilgan; servis va ehtiyot qismlarni tasdiqlash kerak.", mitigation: "Tijorat takliflari, kafolat, servis shartlari, ehtiyot qismlar yoki muqobillar ro'yxati va xodimlarni o'qitish rejasini olish." }
  },
  sales_channel_concentration: {
    ru: { title: "Продажи и концентрация каналов", description: "Зависимость от одного канала продаж повышает риск недозагрузки мощности и кассовых разрывов.", reason: "Подтвержденный спрос нужно усилить.", mitigation: "Собрать письма о намерениях, прайс-листы, предварительные заказы и план продаж минимум по 3 каналам." },
    en: { title: "Sales and channel concentration", description: "Dependence on one sales channel increases underutilization and cash-gap risk.", reason: "Confirmed demand needs to be strengthened.", mitigation: "Collect letters of intent, price lists, preliminary orders and a sales plan for at least 3 channels." },
    uz: { title: "Sotuvlar va kanallar konsentratsiyasi", description: "Bitta sotuv kanaliga bog'liqlik quvvatdan kam foydalanish va kassa uzilishi riskini oshiradi.", reason: "Tasdiqlangan talabni kuchaytirish kerak.", mitigation: "Niyat xatlari, narxlar ro'yxati, dastlabki buyurtmalar va kamida 3 kanal bo'yicha sotuv rejasini yig'ish." }
  },
  bankability_risk: {
    ru: { title: "Готовность к финансированию", description: "Для банка или лизинговой компании нужны продажи, финансовая модель, документы и понятный источник погашения.", reason: "Предварительные договоренности с покупателями пока не подтверждены.", mitigation: "Собрать КП, письма о намерениях, документы по помещению, план сертификации и управленческую финансовую модель." },
    en: { title: "Financing readiness", description: "A bank or leasing company needs sales evidence, a financial model, documents and a clear repayment source.", reason: "Preliminary buyer agreements are not yet confirmed.", mitigation: "Collect commercial offers, letters of intent, premises documents, certification plan and management financial model." },
    uz: { title: "Moliyalashtirishga tayyorlik", description: "Bank yoki lizing kompaniyasi uchun sotuv dalillari, moliyaviy model, hujjatlar va aniq to'lov manbai kerak.", reason: "Xaridorlar bilan dastlabki kelishuvlar hali tasdiqlanmagan.", mitigation: "Tijorat takliflari, niyat xatlari, joy bo'yicha hujjatlar, sertifikatlash rejasi va boshqaruv moliyaviy modelini yig'ish." }
  },
  collateral_risk: {
    ru: { title: "Залог и структура кредита", description: "При кредитном финансировании банк оценивает залог, денежные потоки и документы.", reason: "Залог указан, но оценку и приемлемость нужно подтвердить.", mitigation: "Рассмотреть лизинг оборудования, увеличение собственных средств, гарантию, поручительство или альтернативные источники финансирования." },
    en: { title: "Collateral and loan structure", description: "For loan financing, a bank assesses collateral, cash flows and documents.", reason: "Collateral is indicated, but valuation and acceptability must be confirmed.", mitigation: "Consider equipment leasing, higher own contribution, guarantees, surety or alternative financing sources." },
    uz: { title: "Garov va kredit tuzilmasi", description: "Kredit moliyalashtirishida bank garov, pul oqimlari va hujjatlarni baholaydi.", reason: "Garov ko'rsatilgan, lekin bahosi va maqbulligini tasdiqlash kerak.", mitigation: "Uskunalar lizingi, o'z mablag'ini oshirish, kafolat, kafil yoki muqobil moliyalashtirish manbalarini ko'rib chiqish." }
  },
  customer_acquisition_risk: {
    ru: { title: "Привлечение клиентов", description: "Недостаточный клиентский поток снижает загрузку мощности и выручку.", reason: "Каналы продаж указаны, но стоимость привлечения клиента, бюджет и конверсия требуют проверки.", mitigation: "Провести проверку рынка, собрать 20-30 интервью/заявок и подтвердить стоимость привлечения по каналам." },
    en: { title: "Customer acquisition", description: "Insufficient customer flow reduces capacity utilization and revenue.", reason: "Sales channels are listed, but acquisition cost, budget and conversion need verification.", mitigation: "Run a проверка рынка, collect 20-30 interviews/leads and confirm acquisition cost by channel." },
    uz: { title: "Mijozlarni jalb qilish", description: "Mijozlar oqimi yetarli bo'lmasa, quvvatdan foydalanish va tushum pasayadi.", reason: "Sotuv kanallari ko'rsatilgan, lekin mijoz jalb qilish qiymati, byudjet va konversiyani tekshirish kerak.", mitigation: "Bozor testini o'tkazish, 20-30 ta intervyu/ariza yig'ish va kanallar bo'yicha mijoz jalb qilish qiymatini tasdiqlash." }
  },
  pricing_margin_risk: {
    ru: { title: "Цена и маржа", description: "Слабая маржа или непроверенная цена может сделать проект неустойчивым к росту затрат.", reason: "Есть часть данных по цене/марже, но себестоимость и чувствительность нужно пересчитать.", mitigation: "Собрать прайс конкурентов, КП поставщиков и пересчитать экономику единицы продажи по базовому, стрессовому и оптимистичному сценарию." },
    en: { title: "Price and margin", description: "Weak margin or unverified pricing can make the project vulnerable to cost growth.", reason: "Some price/margin data exists, but cost and sensitivity need recalculation.", mitigation: "Collect competitor prices and supplier offers, then recalculate экономику единицы продажи for base, stress and upside scenarios." },
    uz: { title: "Narx va marja", description: "Zaif marja yoki tekshirilmagan narx xarajatlar oshganda loyihani barqaror qilmasligi mumkin.", reason: "Narx/marja bo'yicha ayrim ma'lumotlar bor, lekin tannarx va sezgirlikni qayta hisoblash kerak.", mitigation: "Raqobatchilar narxlari va yetkazib beruvchi takliflarini yig'ish, bazaviy, stress va optimistik ssenariy bo'yicha экономику единицы продажиni qayta hisoblash." }
  },
  supplier_concentration_risk: {
    ru: { title: "Поставщики", description: "Зависимость от одного поставщика повышает риск срыва закупок, роста цены и нехватки запасов.", reason: "Поставщик указан, но альтернативы и условия нужно подтвердить.", mitigation: "Получить 2-3 КП, сравнить сроки, валюту, предоплату и гарантию поставки." },
    en: { title: "Suppliers", description: "Dependence on one supplier increases purchase disruption, price growth and stockout risk.", reason: "A supplier is indicated, but alternatives and terms must be confirmed.", mitigation: "Obtain 2-3 offers and compare lead time, currency, prepayment and supply guarantees." },
    uz: { title: "Yetkazib beruvchilar", description: "Bitta yetkazib beruvchiga bog'liqlik xarid uzilishi, narx oshishi va zaxira yetishmasligi riskini oshiradi.", reason: "Yetkazib beruvchi ko'rsatilgan, lekin muqobil variantlar va shartlarni tasdiqlash kerak.", mitigation: "2-3 ta tijorat taklifini olish, muddat, valyuta, oldindan to'lov va yetkazib berish kafolatini solishtirish." }
  },
  inventory_risk: {
    ru: { title: "Запасы и оборачиваемость", description: "Запасы требуют оборотного капитала, места хранения и контроля списаний/устаревания.", reason: "Модель предполагает материалы, товары или расходники.", mitigation: "Рассчитать минимальный запас, срок хранения, списания и потребность в оборотном капитале." },
    en: { title: "Inventory and turnover", description: "Inventory requires working capital, storage space and write-off/obsolescence control.", reason: "The model includes goods, inputs or consumables.", mitigation: "Calculate minimum stock, storage period, write-offs and working capital need." },
    uz: { title: "Zaxira va aylanish", description: "Zaxiralar aylanma kapital, saqlash joyi va hisobdan chiqarish/eskirish nazoratini talab qiladi.", reason: "Modelda tovarlar, materiallar yoki sarf materiallari bor.", mitigation: "Minimal zaxira, saqlash muddati, hisobdan chiqarish va aylanma kapital ehtiyojini hisoblash." }
  },
  staff_skills_risk: {
    ru: { title: "Персонал и квалификация", description: "Квалификация и доступность персонала влияют на качество, мощность и соответствие требованиям.", reason: "План персонала есть, но зарплаты, квалификация и график требуют проверки.", mitigation: "Подготовить штатное расписание, требования к квалификации, фонд оплаты труда и план замещения." },
    en: { title: "Staff and skills", description: "Staff skills and availability affect quality, capacity and compliance with requirements.", reason: "The staffing plan exists, but salaries, qualifications and schedule need verification.", mitigation: "Prepare staffing schedule, qualification requirements, payroll budget and backup plan." },
    uz: { title: "Xodimlar va malaka", description: "Xodimlar malakasi va mavjudligi sifat, quvvat va talablarga muvofiqlikka ta'sir qiladi.", reason: "Xodimlar rejasi bor, lekin ish haqi, malaka va grafikni tekshirish kerak.", mitigation: "Shtat jadvali, malaka talablari, ish haqi fondi va almashtirish rejasini tayyorlash." }
  },
  compliance_licensing_risk: {
    ru: { title: "Требования и разрешения", description: "Отраслевые документы, разрешения и требования безопасности могут быть условием запуска.", reason: "Регистрационные, налоговые и отраслевые требования нужно проверить до запуска.", mitigation: "Проверить требования через license.gov.uz, lex.uz, профильный госорган и зафиксировать статус каждого документа." },
    en: { title: "Compliance and permits", description: "Industry documents, permits and safety requirements may be launch conditions.", reason: "Registration, tax and industry requirements need checking before launch.", mitigation: "Check requirements via license.gov.uz, lex.uz and the relevant authority, then record the status of each document." },
    uz: { title: "Talablar va ruxsatnomalar", description: "Soha hujjatlari, ruxsatnomalar va xavfsizlik talablari ishga tushirish sharti bo'lishi mumkin.", reason: "Ro'yxatdan o'tish, soliq va soha talablarini ishga tushirishdan oldin tekshirish kerak.", mitigation: "Talablarni license.gov.uz, lex.uz va profil davlat organi orqali tekshirish hamda har bir hujjat statusini qayd etish." }
  },
  data_quality_risk: {
    ru: { title: "Качество исходных данных", description: "Неточные исходные данные снижают надежность финансовой модели и выводов отчета.", reason: "Стартовые данные есть, но коммерческие показатели нужно подтвердить источниками.", mitigation: "Разделить факты, предположения, расчеты и статистику с источниками; непроверенные цифры оставить как допущения." },
    en: { title: "Input data quality", description: "Inaccurate inputs reduce the reliability of the financial model and report conclusions.", reason: "Initial data exists, but commercial indicators must be confirmed by sources.", mitigation: "Separate facts, assumptions, calculations and source-backed statistics; keep unverified figures as assumptions." },
    uz: { title: "Boshlang'ich ma'lumotlar sifati", description: "Noto'g'ri boshlang'ich ma'lumotlar moliyaviy model va hisobot xulosalari ishonchliligini pasaytiradi.", reason: "Boshlang'ich ma'lumotlar bor, lekin tijorat ko'rsatkichlarini manbalar bilan tasdiqlash kerak.", mitigation: "Faktlar, farazlar, hisob-kitoblar va manbali statistikani ajratish; tekshirilmagan raqamlarni faraz sifatida qoldirish." }
  },
  seasonality_risk: {
    ru: { title: "Сезонность", description: "Сезонность может создавать месяцы с низкой выручкой и повышенной потребностью в резерве.", reason: "Сильная сезонность не подтверждена.", mitigation: "Построить помесячный денежный поток, резерв и план продаж вне сезона." },
    en: { title: "Seasonality", description: "Seasonality can create months with low revenue and higher reserve needs.", reason: "Strong seasonality is not confirmed.", mitigation: "Build monthly cash flow, reserve and off-season sales plan." },
    uz: { title: "Mavsumiylik", description: "Mavsumiylik past tushumli oylar va yuqori zaxira ehtiyojini keltirib chiqarishi mumkin.", reason: "Kuchli mavsumiylik tasdiqlanmagan.", mitigation: "Oylik pul oqimi, zaxira va mavsumdan tashqari sotuv rejasini tuzish." }
  }
};

function fallbackRiskCopy(risk: RiskItem, locale: ReportLocale): Pick<RiskItem, "title" | "description" | "reason" | "mitigation"> {
  const categoryTitle = labelValue(risk.category ?? risk.code ?? risk.title, locale);
  if (locale === "en") {
    return {
      title: categoryTitle,
      description: "This risk should be checked before launch because it can affect revenue, costs, documents or operations.",
      reason: "The available project data is not enough to fully validate this risk.",
      mitigation: "Confirm the data with documents, supplier offers, test sales, contracts or a specialist consultation."
    };
  }
  if (locale === "uz") {
    return {
      title: categoryTitle,
      description: "Bu risk ishga tushirishdan oldin tekshirilishi kerak, chunki u tushum, xarajatlar, hujjatlar yoki operatsiyalarga ta'sir qilishi mumkin.",
      reason: "Mavjud loyiha ma'lumotlari bu riskni to'liq tasdiqlash uchun yetarli emas.",
      mitigation: "Ma'lumotlarni hujjatlar, yetkazib beruvchi takliflari, test sotuvlar, shartnomalar yoki mutaxassis konsultatsiyasi bilan tasdiqlash."
    };
  }
  return {
    title: categoryTitle,
    description: "Этот риск нужно проверить до запуска, так как он может повлиять на выручку, расходы, документы или операционную работу.",
    reason: "Данных проекта пока недостаточно для полной проверки риска.",
    mitigation: "Подтвердить данные документами, КП поставщиков, тестовыми продажами, договорами или консультацией специалиста."
  };
}

function isPlaceholderRiskText(value: unknown): boolean {
  const text = String(value ?? "").trim();
  return !text || /^(требуется проверка|risk|market|supplier|compliance)$/i.test(text);
}

export function localizeRisk(risk: RiskItem, locale: ReportLocale): RiskItem {
  const normalizedLevel = normalizeRiskLevel(risk.level, risk.score);
  const copy = riskCopy[risk.code]?.[locale];
  if (copy) return { ...risk, level: normalizedLevel, ...copy };
  const fallback = fallbackRiskCopy(risk, locale);
  return {
    ...risk,
    level: normalizedLevel,
    title: isPlaceholderRiskText(risk.title) ? fallback.title : risk.title,
    description: isPlaceholderRiskText(risk.description) ? fallback.description : risk.description,
    reason: isPlaceholderRiskText(risk.reason) ? fallback.reason : risk.reason,
    mitigation: isPlaceholderRiskText(risk.mitigation) ? fallback.mitigation : risk.mitigation
  };
}

export function localizeRisks(risks: RiskItem[], locale: ReportLocale): RiskItem[] {
  return risks.map((risk) => localizeRisk(risk, locale));
}

export function localizeRiskConclusion(conclusion: { level: string; reasons: string[]; actions: string[] } | undefined, locale: ReportLocale, localizedRisks: RiskItem[], actions: string[]) {
  if (!conclusion) return undefined;
  const highCount = localizedRisks.filter((risk) => risk.level === "high").length;
  const level = highCount >= 3 ? reportStatus("high", locale) : highCount ? reportStatus("medium", locale) : reportStatus("low", locale);
  return { level, reasons: localizedRisks.slice(0, 3).map((risk) => risk.reason), actions: actions.slice(0, 3) };
}
