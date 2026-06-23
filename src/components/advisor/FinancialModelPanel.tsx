"use client";

import { Banknote, Factory, LineChart, Users, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { MetricCard } from "@/components/advisor/MetricCard";
import { InvestmentBreakdownChart, RevenueCostChart } from "@/components/advisor/FinancialProjectionChart";
import { useLocale } from "@/lib/i18n/client";
import type { FinancialResult } from "@/lib/types/project";
import { formatCurrencyCompact, formatCurrencyFull, formatCurrencyWithOriginal } from "@/lib/utils/formatCurrency";
import { formatPercent } from "@/lib/utils/formatPercent";
import { formatWarningMessage, reportStatus } from "@/lib/report/reportFormatters";
import { glossaryText, type GlossaryTermKey } from "@/lib/report/glossary";
import { labelValue, localizeUnitLabel } from "@/lib/utils/labels";

export function FinancialModelPanel({ financial }: { financial: FinancialResult }) {
  const { locale, messages } = useLocale();
  const m = messages.financePanel;
  const payroll = financial.payroll ?? { totalMonthlyPayrollUZS: 0 };
  const numberLocale = locale === "en" ? "en-US" : locale === "uz" ? "uz-UZ" : "ru-RU";
  const exchangeRateSnapshot = financial.payroll?.exchangeRateSnapshot ?? financial.financing.exchangeRateSnapshot;
  const rateDate = exchangeRateSnapshot?.rateDate ?? exchangeRateSnapshot?.date;
  const usesUsd = financial.financing.ownContributionCurrency === "USD" || financial.financing.loanCurrency === "USD" || financial.financing.leasingCurrency === "USD" || financial.payroll?.roles?.some((role) => role.monthlySalaryCurrency === "USD");
  const exchangeRate = Number(financial.financing.exchangeRateUZSPerUSD ?? exchangeRateSnapshot?.rate ?? 0);
  const cbuSource = locale === "en" ? "Central Bank of Uzbekistan" : locale === "uz" ? "O'zbekiston Respublikasi Markaziy banki" : "Центральный банк Республики Узбекистан";
  const term = (key: GlossaryTermKey) => <InfoTooltip text={glossaryText(key, locale)} />;
  const repaymentTerm = financial.financing.loanRepaymentType === "equal_principal" ? "differentiatedMethod" : "annuityMethod";

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard title={m.startupInvestment} value={formatCurrencyCompact(financial.capex.totalCapEx, "UZS", locale)} caption={formatCurrencyFull(financial.capex.totalCapEx, "UZS", locale)} icon={<Factory className="h-5 w-5" />} />
        <MetricCard title={m.workingCapital} value={formatCurrencyCompact(financial.workingCapital.requiredWorkingCapital, "UZS", locale)} caption={formatCurrencyFull(financial.workingCapital.requiredWorkingCapital, "UZS", locale)} icon={<WalletCards className="h-5 w-5" />} />
        <MetricCard title={m.payroll} value={formatCurrencyCompact(payroll.totalMonthlyPayrollUZS, "UZS", locale)} caption={formatCurrencyFull(payroll.totalMonthlyPayrollUZS, "UZS", locale)} icon={<Users className="h-5 w-5" />} />
        <MetricCard title={m.monthlyRevenue} value={formatCurrencyCompact(financial.revenue.monthlyRevenue, "UZS", locale)} caption={formatCurrencyFull(financial.revenue.monthlyRevenue, "UZS", locale)} icon={<LineChart className="h-5 w-5" />} />
        <MetricCard title="DSCR" value={financial.financing.dscr === null ? reportStatus("notApplicable", locale) : financial.financing.dscrLabel} caption={m.noBankGuarantee} icon={<Banknote className="h-5 w-5" />} />
      </div>

      {usesUsd || exchangeRate > 0 ? (
        <div className="rounded-2xl border border-finko-border bg-slate-50 p-4 text-sm leading-6 text-finko-muted">
          USD/UZS {term("cbuRate")}: {exchangeRate > 0 ? exchangeRate.toLocaleString(numberLocale) : m.notApplicable}. {rateDate ? `${cbuSource}, ${rateDate}.` : m.exchangeRateNote}
        </div>
      ) : null}

      {financial.warnings?.length ? (
        <div className="grid gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {financial.warnings.map((warning, index) => <p key={`${warning.code}-${warning.message ?? ""}-${index}`}>{formatWarningMessage(warning.code, warning.message, locale)}</p>)}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader><h2 className="text-xl font-bold">{m.investmentStructure} {term("capex")}</h2></CardHeader><CardContent><InvestmentBreakdownChart financial={financial} /></CardContent></Card>
        <Card><CardHeader><h2 className="text-xl font-bold">{m.revenueProfitability} {term("grossMargin")}</h2></CardHeader><CardContent><RevenueCostChart financial={financial} /></CardContent></Card>
      </div>

      <Card>
        <CardHeader><h2 className="text-xl font-bold">{m.calculationTransparency}</h2></CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <p>{locale === "ru" ? (financial.revenue.volumeLabel ?? m.plannedVolume) : m.plannedVolume}: {financial.revenue.monthlyCapacity.toLocaleString(numberLocale)} {localizeUnitLabel(financial.revenue.unitLabel ?? m.unitPerMonth, locale)}</p>
          <p>{m.averagePrice}: {formatCurrencyFull(financial.revenue.averagePrice, "UZS", locale)}</p>
          <p>{m.utilization} {term("utilizationRate")}: {formatPercent(financial.revenue.expectedUtilizationPct)}</p>
          <p>{m.grossMargin} {term("grossMargin")}: {formatPercent(financial.profitability.grossMarginPct)}</p>
          <p>{m.payroll}: {formatCurrencyFull(payroll.totalMonthlyPayrollUZS, "UZS", locale)}</p>
          <p>EBITDA {term("ebitda")}: {formatCurrencyFull(financial.profitability.monthlyEBITDA, "UZS", locale)}</p>
          <p>{m.ebitdaMargin}: {formatPercent(financial.profitability.ebitdaMarginPct)}</p>
          <p>{m.breakeven} {term("breakEven")}: {financial.profitability.breakEvenRevenue === null ? m.notApplicable : formatCurrencyFull(financial.profitability.breakEvenRevenue, "UZS", locale)}</p>
          <p>{locale === "ru" ? "Метод погашения" : locale === "uz" ? "To'lov usuli" : "Repayment method"} {term(repaymentTerm)}: {labelValue(financial.financing.loanRepaymentType, locale)}</p>
          <p>{m.loanPayment}: {financial.financing.estimatedMonthlyLoanPayment ? formatCurrencyFull(financial.financing.estimatedMonthlyLoanPayment, "UZS", locale) : m.notApplicable}</p>
          {financial.financing.loanRepaymentType === "equal_principal" && financial.financing.loanRequired > 0 ? (
            <p>{locale === "ru" ? "Первый / последний / средний платеж" : locale === "uz" ? "Birinchi / oxirgi / o'rtacha to'lov" : "First / last / average payment"}: {formatCurrencyFull(financial.financing.loanFirstPayment, "UZS", locale)} / {formatCurrencyFull(financial.financing.loanLastPayment, "UZS", locale)} / {formatCurrencyFull(financial.financing.loanAveragePayment, "UZS", locale)}</p>
          ) : null}
          <p>{m.leasingPayment}: {financial.financing.estimatedMonthlyLeasingPayment ? formatCurrencyFull(financial.financing.estimatedMonthlyLeasingPayment, "UZS", locale) : m.notApplicable}</p>
          <p>{m.ownContribution}: {formatCurrencyWithOriginal(financial.financing.ownContributionUZS, financial.financing.ownContributionAmount, financial.financing.ownContributionCurrency, locale)}</p>
          <p>{m.ownContributionShare}: {formatPercent(financial.financing.ownContributionPct)}</p>
          <p>{m.financingGap}: {financial.financing.financingGap > 0 ? formatCurrencyFull(financial.financing.financingGap, "UZS", locale) : m.notApplicable}</p>
          <p>DSCR {term("dscr")}: {financial.financing.dscr === null ? reportStatus("notApplicable", locale) : financial.financing.dscrLabel}</p>
        </CardContent>
      </Card>
    </div>
  );
}
