"use client";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n/client";
import { getTranslations, type AppLocale } from "@/lib/i18n";
import { localizeRisk } from "@/lib/report/reportFormatters";
import { riskKey } from "@/lib/report/riskKeys";
import type { RiskItem } from "@/lib/types/project";

const levelVariant = { low: "neutral", medium: "amber", high: "red" } as const;
const axisValues = [3, 2, 1] as const;

export { riskKey };

const categoryLabels = {
  ru: { market: "Рынок", financial: "Финансы", operational: "Операции", legal: "Право", compliance: "Соответствие требованиям", infrastructure: "Инфраструктура", bankability: "Финансируемость", environmental: "Экология", currency: "Валюта", supplier: "Поставщики", staff: "Персонал", technology: "Технологии", seasonality: "Сезонность" },
  uz: { market: "Bozor", financial: "Moliya", operational: "Operatsiyalar", legal: "Huquq", compliance: "Talablarga muvofiqlik", infrastructure: "Infratuzilma", bankability: "Moliyalashtirish", environmental: "Ekologiya", currency: "Valyuta", supplier: "Yetkazib beruvchilar", staff: "Xodimlar", technology: "Texnologiya", seasonality: "Mavsumiylik" },
  en: { market: "Market", financial: "Finance", operational: "Operations", legal: "Legal", compliance: "Compliance", infrastructure: "Infrastructure", bankability: "Bankability", environmental: "Environmental", currency: "Currency", supplier: "Supplier", staff: "Staff", technology: "Technology", seasonality: "Seasonality" }
} as const;

export function RiskMatrix({ risks, conclusion, localeOverride }: { risks: RiskItem[]; conclusion?: { level: string; reasons: string[]; actions: string[] }; localeOverride?: AppLocale }) {
  const context = useLocale();
  const locale = localeOverride ?? context.locale;
  const messages = localeOverride ? getTranslations(locale) : context.messages;
  const localizedRisks = risks.map((risk) => localizeRisk(risk, locale));
  const m = messages.riskPanel;
  const levelLabel = { low: m.low, medium: m.medium, high: m.high };
  const impactLabel = { 3: m.highImpact, 2: m.mediumImpact, 1: m.lowImpact } as const;
  const categoryLabel = (category: RiskItem["category"]) => categoryLabels[locale][category] ?? category;
  const cellClass = (impact: number, probability: number) => {
    const score = impact * probability;
    if (score >= 6) return "border-finko-primary/40 bg-finko-primaryLight";
    if (score >= 3) return "border-amber-200 bg-amber-50";
    return "border-slate-200 bg-slate-50";
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">{m.title}</h2>
        <p className="mt-1 text-sm text-finko-muted">{m.description}</p>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="overflow-x-auto">
          <div className="min-w-[720px] rounded-2xl border border-finko-border p-4">
            <div className="mb-3 grid grid-cols-[100px_repeat(3,1fr)] gap-2 text-center text-xs font-semibold text-finko-muted">
              <div>{m.impact}</div>
              <div>{m.lowProbability}</div>
              <div>{m.mediumProbability}</div>
              <div>{m.highProbability}</div>
            </div>
            {axisValues.map((impact) => (
              <div key={impact} className="grid grid-cols-[100px_repeat(3,1fr)] gap-2 pb-2 last:pb-0">
                <div className="flex items-center justify-center rounded-xl bg-white text-xs font-semibold text-finko-muted">{impactLabel[impact]}</div>
                {[1, 2, 3].map((probability) => {
                  const cellRisks = localizedRisks.filter((risk) => risk.impact === impact && risk.probability === probability);
                  return (
                    <div key={`${impact}-${probability}`} className={`min-h-24 rounded-xl border p-3 ${cellClass(impact, probability)}`}>
                      <p className="text-xs font-semibold text-finko-muted">{cellRisks.length} {m.risksCount}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {cellRisks.slice(0, 4).map((risk, index) => <span key={riskKey(risk, index, `cell-${impact}-${probability}`)} className="rounded-full bg-white/75 px-2 py-1 text-xs font-medium">{risk.title}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <p className="mt-2 text-center text-xs font-semibold text-finko-muted">{m.probability}</p>
          </div>
        </div>

        <div className="grid gap-3">
          {localizedRisks.map((risk, index) => (
            <div key={riskKey(risk, index, "list")} className="rounded-2xl border border-finko-border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold">{risk.title}</h3>
                  <p className="mt-1 text-sm text-finko-muted">{risk.description}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Badge variant="neutral">{categoryLabel(risk.category)}</Badge>
                  <Badge variant={levelVariant[risk.level]}>{levelLabel[risk.level]}</Badge>
                </div>
              </div>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <p><span className="font-semibold">{m.probability}: </span><span className="text-finko-muted">{risk.probability}/3</span></p>
                <p><span className="font-semibold">{m.impact}: </span><span className="text-finko-muted">{risk.impact}/3</span></p>
                <p><span className="font-semibold">{m.reason}: </span><span className="text-finko-muted">{risk.reason}</span></p>
                <p><span className="font-semibold">{m.mitigation}: </span><span className="text-finko-muted">{risk.mitigation}</span></p>
              </div>
            </div>
          ))}
        </div>

        {conclusion ? (
          <div className="rounded-2xl border border-finko-border bg-slate-50 p-4">
            <h3 className="font-bold">{m.overallRisk}: {conclusion.level}</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <p className="font-semibold">{m.mainReasons}:</p>
                <ol className="mt-2 list-decimal pl-5 text-sm leading-6 text-finko-muted">{conclusion.reasons.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ol>
              </div>
              <div>
                <p className="font-semibold">{m.beforeApplication}:</p>
                <ol className="mt-2 list-decimal pl-5 text-sm leading-6 text-finko-muted">{conclusion.actions.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ol>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
