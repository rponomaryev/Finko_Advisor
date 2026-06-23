"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import type { MarketDataPoint, MarketDataResult } from "@/lib/marketData/types";
import { useLocale } from "@/lib/i18n/client";
import { getTranslations, type AppLocale } from "@/lib/i18n";
import { labelValue } from "@/lib/utils/labels";
import { formatCurrencyCompact, formatNumber } from "@/lib/utils/formatCurrency";

function pointNumber(point: MarketDataPoint) {
  if (typeof point.value === "number" && Number.isFinite(point.value)) return point.value;
  if (typeof point.valueUsd === "number" && Number.isFinite(point.valueUsd)) return point.valueUsd;
  if (typeof point.volume === "number" && Number.isFinite(point.volume)) return point.volume;
  return null;
}

function pointValueLabel(point: MarketDataPoint, emptyLabel: string, locale: AppLocale) {
  const value = pointNumber(point);
  if (value === null) return emptyLabel;
  if (point.valueUsd !== null && point.valueUsd !== undefined) return formatCurrencyCompact(value, "USD", locale);
  return `${formatNumber(value, locale)} ${point.unit ?? point.currency ?? ""}`.trim();
}

function shortIndicator(value: string) {
  return value.length > 34 ? `${value.slice(0, 31)}...` : value;
}

function qualityLabel(value: MarketDataPoint["matchQuality"] | undefined, locale: AppLocale) {
  return labelValue(value ?? "not_found", locale);
}

function marketMessage(message: string, locale: AppLocale) {
  if (message.includes("Официальные числовые") || message.toLowerCase().includes("official numeric")) {
    if (locale === "en") return "No official numeric data was found for this indicator.";
    if (locale === "uz") return "Bu ko'rsatkich bo'yicha rasmiy raqamli ma'lumotlar topilmadi.";
  }
  return message;
}

export function MarketDataPanel({ data, localeOverride }: { data?: MarketDataResult | null; localeOverride?: AppLocale }) {
  const context = useLocale();
  const locale = localeOverride ?? context.locale;
  const messages = localeOverride ? getTranslations(locale) : context.messages;
  const title = messages.report.marketData;
  const numericPoints = (data?.dataPoints ?? []).filter((point) => pointNumber(point) !== null && point.matchQuality !== "broad_proxy" && point.matchQuality !== "not_found");
  const chartData = numericPoints.slice(0, 8).map((point) => ({
    name: shortIndicator(point.indicator),
    value: pointNumber(point) ?? 0,
    label: pointValueLabel(point, messages.report.officialDataNotFound, locale),
    year: point.year
  }));

  if (!data || data.dataPoints.length === 0) {
    return (
      <Card>
        <CardHeader><h2 className="text-xl font-bold">{title}</h2></CardHeader>
        <CardContent>
          <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-finko-muted">
            {data?.messages[0] ? marketMessage(data.messages[0], locale) : messages.report.officialDataNotFound}
          </p>
          {data?.sources?.length ? (
            <div className="mt-4 grid gap-2 text-sm">
              <p className="font-semibold text-finko-text">{messages.report.sources}</p>
              {data.sources.map((source) => (
                <p key={`${source.sourceName}-${source.year ?? ""}`} className="text-finko-muted">
                  {source.sourceUrl ? <a className="font-semibold text-finko-primary" href={source.sourceUrl} target="_blank" rel="noreferrer">{source.sourceName}</a> : source.sourceName}
                  {source.notes ? ` — ${source.notes}` : ""}
                </p>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-finko-muted">{data.mapping.normalizedSector}</p>
      </CardHeader>
      <CardContent className="grid gap-5">
        {chartData.length ? (
          <div className="rounded-2xl border border-finko-border bg-white p-4">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-semibold text-finko-text">{messages.report.marketData}</p>
                <p className="text-xs text-finko-muted">{messages.report.sources}: {data.sources.length}. {locale === "ru" ? "Широкие proxy-индикаторы не строятся как продуктовые данные." : locale === "uz" ? "Keng proxy ko'rsatkichlar mahsulotga xos ma'lumot sifatida grafikda ko'rsatilmaydi." : "Broad proxy indicators are not charted as product-specific data."}</p>
              </div>
              <p className="text-xs text-finko-muted">{messages.report.year}: {Math.max(...chartData.map((item) => item.year))}</p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 10, left: 4, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} height={64} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => formatNumber(Number(value), locale)} width={84} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(_, __, item) => item.payload.label} labelFormatter={(label) => String(label)} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-2xl border border-finko-border">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-finko-muted">
              <tr>
                <th className="px-4 py-3">{messages.report.indicator}</th>
                <th className="px-4 py-3">{messages.report.year}</th>
                <th className="px-4 py-3">{messages.report.region}</th>
                <th className="px-4 py-3">{messages.report.value}</th>
                <th className="px-4 py-3">{messages.report.source}</th>
                <th className="px-4 py-3">{locale === "ru" ? "Качество совпадения" : locale === "uz" ? "Moslik sifati" : "Match quality"}</th>
                <th className="px-4 py-3">{locale === "ru" ? "Релевантность" : locale === "uz" ? "Dolzarblik" : "Relevance"}</th>
              </tr>
            </thead>
            <tbody>
              {data.dataPoints.map((point) => (
                <tr key={`${point.indicator}-${point.year}-${point.region ?? ""}-${point.sourceName}`} className="border-t border-finko-border">
                  <td className="px-4 py-3 font-semibold">{point.indicator}</td>
                  <td className="px-4 py-3">{point.year}</td>
                  <td className="px-4 py-3">{point.region ?? data.region ?? ""}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{pointValueLabel(point, messages.report.officialDataNotFound, locale)}</td>
                  <td className="px-4 py-3">
                    {point.sourceUrl ? <a className="font-semibold text-finko-primary" href={point.sourceUrl} target="_blank" rel="noreferrer">{point.sourceName}</a> : point.sourceName}
                  </td>
                  <td className="px-4 py-3">{qualityLabel(point.matchQuality, locale)}</td>
                  <td className="px-4 py-3 text-finko-muted">{point.explanation ? marketMessage(point.explanation, locale) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.messages.length ? (
          <div className="grid gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
            {data.messages.map((item) => <p key={item}>{marketMessage(item, locale)}</p>)}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
