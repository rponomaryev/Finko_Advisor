import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { NextActionsPanel } from "@/components/advisor/NextActionsPanel";
import { MarketDataPanel } from "@/components/advisor/MarketDataPanel";
import { RiskMatrix } from "@/components/advisor/RiskMatrix";
import { getTranslations, type AppLocale } from "@/lib/i18n";
import { getLocalizedDisclaimer } from "@/lib/report/disclaimer";
import { reportMessages, tReport } from "@/lib/i18n/reportMessages";
import {
  formatWarningMessage,
  formatWarningTitle,
  formatWarningValue,
  formatWarningValueLabel,
  reportMetric,
  reportSourceLabel
} from "@/lib/report/reportFormatters";
import { getGlossaryRows } from "@/lib/report/glossary";
import type { MarketDataResult } from "@/lib/marketData/types";
import type { FinancialResult, RiskItem } from "@/lib/types/project";
import { labelValue } from "@/lib/utils/labels";
import { formatCurrencyFull } from "@/lib/utils/formatCurrency";

type TableRow = [string, string, string];
type FourColumnRow = [string, string, string, string];
type FiveColumnRow = [string, string, string, string, string];

type ReportData = {
  title: string;
  executiveSummary: string[] | string;
  projectProfile: Record<string, unknown>;
  financialModel: FinancialResult;
  riskMatrix: RiskItem[];
  riskConclusion?: { level: string; reasons: string[]; actions: string[] };
  keyFigures?: TableRow[];
  investmentBreakdown?: TableRow[];
  financingRecommendation?: string;
  detailedConclusion?: string[];
  feasibilityScore: number;
  bankReadinessScore: number;
  nextActions: string[];
  disclaimer: string;
  generatedAt?: string;
  marketData?: MarketDataResult;
  businessProfile?: Record<string, unknown>;
  businessModelRows?: string[][];
  marketEvidenceRows?: string[][];
  documentsRows?: string[][];
  dataGapsAndAssumptions?: string[];
  warnings?: FinancialResult["warnings"];
  formulaRows?: FinancialResult["formulaRows"];
  capexBreakdown?: FinancialResult["capex"]["lineItems"];
  opexBreakdown?: FinancialResult["opex"]["lineItems"];
  workingCapitalBreakdown?: FinancialResult["workingCapital"];
  financingBreakdown?: FinancialResult["financing"];
};

function ReportTable({ rows, headers }: { rows: TableRow[]; headers: TableRow }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-finko-border">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead className="bg-slate-50 text-left text-finko-muted">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${index}-${row.join("-")}`} className="border-t border-finko-border">
              <td className="px-4 py-3 font-semibold text-finko-text">{row[0]}</td>
              <td className="px-4 py-3 font-semibold tabular-nums">{row[1]}</td>
              <td className="px-4 py-3 text-finko-muted">{row[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function ReportTable4({ rows, headers }: { rows: FourColumnRow[]; headers: FourColumnRow }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-finko-border">
      <table className="w-full min-w-[860px] border-collapse text-sm">
        <thead className="bg-slate-50 text-left text-finko-muted">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${index}-${row.join("-")}`} className="border-t border-finko-border">
              <td className="px-4 py-3 font-semibold text-finko-text">{row[0]}</td>
              <td className="px-4 py-3 text-finko-muted">{row[1]}</td>
              <td className="px-4 py-3 tabular-nums">{row[2]}</td>
              <td className="px-4 py-3 text-finko-muted">{row[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function ReportTable5({ rows, headers }: { rows: FiveColumnRow[]; headers: FiveColumnRow }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-finko-border">
      <table className="w-full min-w-[980px] border-collapse text-sm">
        <thead className="bg-slate-50 text-left text-finko-muted">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${index}-${row.join("-")}`} className="border-t border-finko-border">
              <td className="px-4 py-3 font-semibold text-finko-text">{row[0]}</td>
              <td className="px-4 py-3 text-finko-muted">{row[1]}</td>
              <td className="px-4 py-3 text-finko-muted">{row[2]}</td>
              <td className="px-4 py-3 text-finko-muted">{row[3]}</td>
              <td className="px-4 py-3 text-finko-muted">{row[4]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function ReportTableAny({ rows, headers }: { rows: string[][]; headers: string[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-finko-border">
      <table className="w-full min-w-[1180px] border-collapse text-sm">
        <thead className="bg-slate-50 text-left text-finko-muted">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${index}-${row.join("-")}`} className="border-t border-finko-border">
              {headers.map((_, cellIndex) => (
                <td key={`${index}-${cellIndex}`} className={cellIndex === 0 ? "px-4 py-3 font-semibold text-finko-text" : "px-4 py-3 text-finko-muted"}>{row[cellIndex] ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function sourceLabel(source: unknown, locale: AppLocale) {
  return reportSourceLabel(source, locale);
}

function breakdownRows(rows: Array<{ label: string; amount: number; source: unknown }>, locale: AppLocale, comment: string): TableRow[] {
  return rows.map((row) => [row.label, formatCurrencyFull(row.amount, "UZS", locale), `${sourceLabel(row.source, locale)} · ${comment}`]);
}

function warningValues(values: Record<string, unknown> | undefined, locale: AppLocale) {
  if (!values) return "";
  return Object.entries(values).map(([key, value]) => `${formatWarningValueLabel(key, locale)} - ${formatWarningValue(key, value, locale)}`).join("; ");
}

function technicalComment(label: "fixed" | "buffer" | "inventory" | "calculated" | "need" | "available" | "gap" | "surplus" | "dscr", locale: AppLocale) {
  const map: Record<typeof label, Record<AppLocale, string>> = {
    fixed: { ru: "Ежемесячные фиксированные операционные расходы", en: "Monthly fixed operating costs", uz: "Oylik doimiy operatsion xarajatlar" },
    buffer: { ru: "Количество месяцев запаса", en: "Months covered by the buffer", uz: "Bufer oylar soni" },
    inventory: { ru: "Увеличивает потребность в оборотном капитале", en: "Adds to working capital need", uz: "Aylanma kapital ehtiyojini oshiradi" },
    calculated: { ru: "Расчет", en: "Calculated", uz: "Hisoblangan" },
    need: { ru: "Стартовые вложения плюс оборотный капитал", en: "CapEx plus working capital", uz: "Boshlang'ich investitsiyalar va aylanma kapital" },
    available: { ru: "Собственные средства и подтвержденное финансирование", en: "Own funds and confirmed financing", uz: "O'z mablag'i va tasdiqlangan moliyalashtirish" },
    gap: { ru: "Непокрытая потребность в инвестициях", en: "Uncovered investment need", uz: "Qoplanmagan investitsiya ehtiyoji" },
    surplus: { ru: "Финансирование сверх потребности", en: "Funding above the investment need", uz: "Ehtiyojdan ortiq moliyalashtirish" },
    dscr: { ru: "EBITDA / платежи по долгу", en: "EBITDA divided by debt service", uz: "EBITDA qarz to'lovi bo'yicha bo'lingan" }
  };
  return map[label][locale];
}

export function ReportPreview({ report, locale = "ru" }: { report: ReportData; locale?: AppLocale }) {
  const messages = getTranslations(locale).report;
  const summary = Array.isArray(report.executiveSummary) ? report.executiveSummary : [report.executiveSummary];
  const glossaryRows = getGlossaryRows(locale);
  return (
    <div className="print-page grid gap-5 rounded-finko border border-finko-border bg-white p-5 shadow-finko">
      <div className="flex flex-col gap-4 border-b border-finko-border pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Badge variant="red">{messages.label}</Badge>
          <h1 className="mt-3 overflow-safe text-3xl font-bold">{report.title}</h1>
          <div className="mt-3 grid gap-3 text-sm leading-6 text-finko-muted">
            {summary.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl bg-finko-primaryLight p-4">
            <p className="text-3xl font-bold text-finko-primaryDark">{report.feasibilityScore}</p>
            <p className="text-xs text-finko-muted">{messages.scoreFeasibility}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-3xl font-bold text-finko-text">{report.bankReadinessScore}</p>
            <p className="text-xs text-finko-muted">{messages.scoreBank}</p>
          </div>
        </div>
      </div>

      <Card className="shadow-none">
        <CardHeader><h2 className="text-xl font-bold">{locale === "ru" ? "Бизнес-модель" : locale === "uz" ? "Biznes modeli" : "Business model"}</h2></CardHeader>
        <CardContent>
          {report.businessModelRows?.length ? (
            <ReportTable rows={report.businessModelRows as TableRow[]} headers={[messages.indicator, messages.value, messages.comment]} />
          ) : (
            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {([
                [messages.businessType, report.projectProfile.businessType],
                [messages.businessIdea, report.projectProfile.businessIdea],
                [messages.region, report.projectProfile.region],
                [messages.premises, report.projectProfile.premisesStatus],
                [messages.equipment, report.projectProfile.equipmentCondition],
                [messages.credit, report.projectProfile.creditNeeded]
              ] as Array<[string, unknown]>).map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-finko-muted">{label}</p>
                  <p className="mt-1 overflow-safe font-semibold">{labelValue(value, locale)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {report.keyFigures ? (
        <Card className="shadow-none">
          <CardHeader><h2 className="text-xl font-bold">{messages.financialOverview}</h2></CardHeader>
          <CardContent><ReportTable rows={report.keyFigures} headers={[messages.indicator, messages.value, messages.comment]} /></CardContent>
        </Card>
      ) : null}

      {report.investmentBreakdown ? (
        <Card className="shadow-none">
          <CardHeader><h2 className="text-xl font-bold">{messages.investmentBreakdown ?? "Investment breakdown"}</h2></CardHeader>
          <CardContent><ReportTable rows={report.investmentBreakdown} headers={[messages.indicator, messages.value, messages.comment]} /></CardContent>
        </Card>
      ) : null}

      {report.warnings?.length ? (
        <Card className="shadow-none border-amber-200 bg-amber-50">
          <CardHeader><h2 className="text-xl font-bold text-amber-900">{locale === "ru" ? "Предупреждения по данным" : locale === "uz" ? "Ma'lumotlar ogohlantirishlari" : "Data warnings"}</h2></CardHeader>
          <CardContent className="grid gap-2 text-sm leading-6 text-amber-900">
            {report.warnings.map((warning, index) => (
              <p key={`${warning.code}-${warning.message ?? ""}-${index}`}>
                <span className="font-semibold">{formatWarningTitle(warning.code, locale)}: </span>{formatWarningMessage(warning.code, warning.message, locale)}
                {warning.values ? <span className="block text-amber-800">{warningValues(warning.values, locale)}</span> : null}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {report.formulaRows?.length ? (
        <Card className="shadow-none">
          <CardHeader><h2 className="text-xl font-bold">{locale === "ru" ? "Формулы" : locale === "uz" ? "Formulalar" : "Formulas"}</h2></CardHeader>
          <CardContent>
            <ReportTable4
              rows={report.formulaRows.map((row) => [row.indicator, row.formula, row.substitution, `${row.result} · ${sourceLabel(row.source, locale)}`])}
              headers={[messages.indicator, locale === "ru" ? "Формула" : locale === "uz" ? "Formula" : "Formula", locale === "ru" ? "Подстановка" : locale === "uz" ? "Qiymatlar" : "Substitution", messages.value]}
            />
          </CardContent>
        </Card>
      ) : null}

      {report.capexBreakdown?.length ? (
        <Card className="shadow-none">
          <CardHeader><h2 className="text-xl font-bold">{locale === "ru" ? "Стартовые вложения" : locale === "uz" ? "Boshlang'ich investitsiyalar" : "CapEx"}</h2></CardHeader>
          <CardContent><ReportTable rows={breakdownRows(report.capexBreakdown, locale, locale === "ru" ? "Стартовые вложения" : locale === "uz" ? "Boshlang'ich investitsiyalar" : "CapEx")} headers={[messages.indicator, messages.value, messages.comment]} /></CardContent>
        </Card>
      ) : null}

      {report.opexBreakdown?.length ? (
        <Card className="shadow-none">
          <CardHeader><h2 className="text-xl font-bold">{locale === "ru" ? "Ежемесячные операционные расходы" : locale === "uz" ? "Oylik operatsion xarajatlar" : "OpEx"}</h2></CardHeader>
          <CardContent><ReportTable rows={breakdownRows(report.opexBreakdown, locale, locale === "en" ? "Monthly OpEx" : locale === "uz" ? "Oylik operatsion xarajatlar" : "Ежемесячные операционные расходы")} headers={[messages.indicator, messages.value, messages.comment]} /></CardContent>
        </Card>
      ) : null}

      {report.workingCapitalBreakdown ? (
        <Card className="shadow-none">
          <CardHeader><h2 className="text-xl font-bold">{locale === "ru" ? "Оборотный капитал" : locale === "uz" ? "Aylanma kapital" : "Working capital"}</h2></CardHeader>
          <CardContent>
            <ReportTable rows={[
              [locale === "ru" ? "Формула" : locale === "uz" ? "Formula" : "Formula", tReport(reportMessages.formulas.workingCapital.formula, locale), ""],
              [locale === "ru" ? "Фиксированные расходы" : locale === "uz" ? "Doimiy xarajatlar" : "Fixed OpEx", formatCurrencyFull(report.workingCapitalBreakdown.monthlyFixedCosts, "UZS", locale), technicalComment("fixed", locale)],
              [locale === "ru" ? "Месяцы буфера" : locale === "uz" ? "Bufer oylari" : "Buffer months", String(report.workingCapitalBreakdown.bufferMonths), technicalComment("buffer", locale)],
              [locale === "ru" ? "Первоначальный запас" : locale === "uz" ? "Boshlang'ich zaxira" : "Initial inventory", formatCurrencyFull(report.workingCapitalBreakdown.initialInventory, "UZS", locale), technicalComment("inventory", locale)],
              [locale === "ru" ? "Итого" : locale === "uz" ? "Jami" : "Total", formatCurrencyFull(report.workingCapitalBreakdown.requiredWorkingCapital, "UZS", locale), technicalComment("calculated", locale)]
            ]} headers={[messages.indicator, messages.value, messages.comment]} />
          </CardContent>
        </Card>
      ) : null}

      {report.financingBreakdown ? (
        <Card className="shadow-none">
          <CardHeader><h2 className="text-xl font-bold">{locale === "ru" ? "Финансирование" : locale === "uz" ? "Moliyalashtirish" : "Financing"}</h2></CardHeader>
          <CardContent>
            <ReportTable rows={[
              [reportMetric("totalInvestmentNeed", locale), formatCurrencyFull(report.financingBreakdown.totalInvestmentNeed, "UZS", locale), technicalComment("need", locale)],
              [reportMetric("availableFunding", locale), formatCurrencyFull(report.financingBreakdown.availableFunding, "UZS", locale), technicalComment("available", locale)],
              [reportMetric("financingGap", locale), formatCurrencyFull(report.financingBreakdown.financingGap, "UZS", locale), technicalComment("gap", locale)],
              [reportMetric("fundingSurplus", locale), formatCurrencyFull(report.financingBreakdown.fundingSurplus, "UZS", locale), technicalComment("surplus", locale)],
              ["DSCR", report.financingBreakdown.dscrLabel, technicalComment("dscr", locale)]
            ]} headers={[messages.indicator, messages.value, messages.comment]} />
          </CardContent>
        </Card>
      ) : null}

      {report.financingRecommendation ? (
        <Card className="shadow-none">
          <CardHeader><h2 className="text-xl font-bold">{messages.recommendations}</h2></CardHeader>
          <CardContent><p className="text-sm leading-6 text-finko-muted">{report.financingRecommendation}</p></CardContent>
        </Card>
      ) : null}

      <RiskMatrix risks={report.riskMatrix} conclusion={report.riskConclusion} localeOverride={locale} />

      <MarketDataPanel data={report.marketData} localeOverride={locale} />

      {report.marketEvidenceRows?.length ? (
        <Card className="shadow-none">
          <CardHeader><h2 className="text-xl font-bold">{locale === "ru" ? "Рыночные данные и статистика" : locale === "uz" ? "Bozor dalillari va statistika" : "Market evidence and statistics"}</h2></CardHeader>
          <CardContent><ReportTable5 rows={report.marketEvidenceRows as FiveColumnRow[]} headers={[locale === "ru" ? "Показатель" : locale === "uz" ? "Ko'rsatkich" : "Indicator", locale === "ru" ? "Значение и период" : locale === "uz" ? "Qiymat va davr" : "Value and period", locale === "ru" ? "Источник" : locale === "uz" ? "Manba" : "Source", locale === "ru" ? "География" : locale === "uz" ? "Geografiya" : "Geography", locale === "ru" ? "Как использовать в анализе" : locale === "uz" ? "Tahlilda qanday ishlatish" : "How to use in the analysis"]} /></CardContent>
        </Card>
      ) : null}

      {report.documentsRows?.length ? (
        <Card className="shadow-none">
          <CardHeader><h2 className="text-xl font-bold">{locale === "ru" ? "Документы и разрешения" : locale === "uz" ? "Hujjatlar va ruxsatlar" : "Documents and permits"}</h2></CardHeader>
          <CardContent><ReportTableAny rows={report.documentsRows} headers={[locale === "ru" ? "Документ / действие" : locale === "uz" ? "Hujjat / amal" : "Document / action", locale === "ru" ? "Зачем нужен" : locale === "uz" ? "Nima uchun kerak" : "Why needed", locale === "ru" ? "Когда оформить" : locale === "uz" ? "Qachon rasmiylashtirish" : "When to arrange", locale === "ru" ? "Где проверить или получить" : locale === "uz" ? "Qayerda tekshirish yoki olish" : "Where to check or obtain", locale === "ru" ? "Источник" : locale === "uz" ? "Manba" : "Source", locale === "ru" ? "Уверенность" : locale === "uz" ? "Ishonchlilik" : "Confidence", locale === "ru" ? "Что уточнить вручную" : locale === "uz" ? "Qo'lda nimani aniqlashtirish" : "Manual clarification"]} /></CardContent>
        </Card>
      ) : null}

      {report.detailedConclusion ? (
        <Card className="shadow-none">
          <CardHeader><h2 className="text-xl font-bold">{messages.detailedConclusion}</h2></CardHeader>
          <CardContent>
            <ol className="grid list-decimal gap-2 pl-5 text-sm leading-6 text-finko-muted">
              {report.detailedConclusion.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      <NextActionsPanel actions={report.nextActions} localeOverride={locale} />

      <Card className="shadow-none">
        <CardHeader><h2 className="text-xl font-bold">{locale === "ru" ? "Глоссарий финансовых терминов" : locale === "uz" ? "Moliyaviy atamalar glossariysi" : "Financial Terms Glossary"}</h2></CardHeader>
        <CardContent><ReportTable rows={glossaryRows.map((row) => [row.term, row.definition, ""])} headers={[messages.indicator, messages.comment, ""]} /></CardContent>
      </Card>

      <div className="grid gap-3 rounded-2xl border border-finko-border bg-slate-50 p-4 text-sm">
        {report.generatedAt ? (
          <p className="text-finko-muted">
            <span className="font-semibold text-finko-text">{messages.generatedAt}: </span>
            {new Date(report.generatedAt).toLocaleString(locale)}
          </p>
        ) : null}
        <div>
          <p className="font-semibold text-finko-text">{messages.disclaimer}</p>
          <p className="mt-1 leading-6 text-amber-900">{report.disclaimer ?? getLocalizedDisclaimer(locale)}</p>
        </div>
      </div>
    </div>
  );
}
