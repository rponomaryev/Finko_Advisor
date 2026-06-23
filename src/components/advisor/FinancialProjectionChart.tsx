"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLocale } from "@/lib/i18n/client";
import type { FinancialResult, RiskItem } from "@/lib/types/project";

function numberLocale(locale: "ru" | "uz" | "en") {
  return locale === "en" ? "en-US" : locale === "uz" ? "uz-UZ" : "ru-RU";
}

export function InvestmentBreakdownChart({ financial }: { financial: FinancialResult }) {
  const { locale, messages } = useLocale();
  const m = messages.financePanel;
  const data = [
    { name: m.equipment, value: financial.capex.equipmentCost },
    { name: m.molds, value: financial.capex.moldCost },
    { name: m.premises, value: financial.capex.premisesSetupCost },
    { name: m.certification, value: financial.capex.certificationCost },
    { name: m.inventory, value: financial.capex.initialInventoryCost },
    { name: m.reserve, value: financial.capex.reserveCost },
    { name: m.workingCapital, value: financial.workingCapital.requiredWorkingCapital }
  ];
  const colors = ["#E11446", "#B80F36", "#111827", "#F59E0B", "#6B7280", "#2563EB", "#0F766E"];
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
            {data.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
          </Pie>
          <Tooltip formatter={(value: unknown) => new Intl.NumberFormat(numberLocale(locale)).format(Number(value))} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueCostChart({ financial }: { financial: FinancialResult }) {
  const { locale, messages } = useLocale();
  const m = messages.financePanel;
  const data = [{ name: m.month, [m.revenue]: financial.revenue.monthlyRevenue, [m.grossProfit]: financial.profitability.monthlyGrossProfit, EBITDA: financial.profitability.monthlyEBITDA }];
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000000)} ${m.million}`} />
          <Tooltip formatter={(value: unknown) => new Intl.NumberFormat(numberLocale(locale)).format(Number(value))} />
          <Legend />
          <Bar dataKey={m.revenue} fill="#E11446" radius={[6, 6, 0, 0]} />
          <Bar dataKey={m.grossProfit} fill="#111827" radius={[6, 6, 0, 0]} />
          <Bar dataKey="EBITDA" fill="#2563EB" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RiskDistributionChart({ risks }: { risks: RiskItem[] }) {
  const { messages } = useLocale();
  const m = messages.financePanel;
  const data = ["high", "medium", "low"].map((level) => ({
    name: level === "high" ? m.high : level === "medium" ? m.medium : m.low,
    value: risks.filter((risk) => risk.level === level).length
  }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" fill="#E11446" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
