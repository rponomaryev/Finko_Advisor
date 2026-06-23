"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import type { SectorAssumptions } from "@/lib/types/project";

const editableFields: Array<[keyof SectorAssumptions, string]> = [
  ["defaultLoanTermMonths", "Срок кредита, мес."],
  ["defaultLeasingTermMonths", "Срок лизинга, мес."],
  ["defaultWorkingCapitalMonths", "Месяцы оборотного капитала"],
  ["defaultGrossMarginPct", "Валовая маржа, %"],
  ["defaultEquipmentCostUZS", "Оборудование"],
  ["defaultMoldCostUZS", "Оснастка/спецподготовка"],
  ["defaultCertificationCostUZS", "Сертификация"],
  ["defaultMonthlyFixedCostsUZS", "Фиксированные расходы"]
];

export function SectorTemplateAdmin({ template }: { template: any }) {
  const [assumptions, setAssumptions] = useState<SectorAssumptions>(template.assumptions);
  const [status, setStatus] = useState<string | null>(null);

  async function save() {
    const response = await fetch(`/api/sector-templates/${template.code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assumptions })
    });
    setStatus(response.ok ? "Допущения сохранены в базе данных." : "Не удалось сохранить допущения.");
  }

  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold uppercase tracking-wide text-finko-primaryDark">{template.code}</p>
        <h1 className="mt-2 text-3xl font-bold">{template.name}</h1>
        <p className="mt-2 text-sm text-finko-muted">{template.description}</p>
        <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          Эти значения являются расчетными бизнес-допущениями. Курс валют не задается в шаблоне и берется только из официального сервиса ЦБ РУз на дату заявки.
        </p>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {editableFields.map(([key, label]) => (
            <label key={key} className="grid gap-2">
              <span className="text-sm font-semibold">{label}</span>
              <Input
                type="number"
                value={String(assumptions[key])}
                onChange={(event) => setAssumptions((current) => ({ ...current, [key]: Number(event.target.value) }))}
              />
            </label>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-finko-muted">Количество вопросов</p><p className="mt-1 text-2xl font-bold">{template.questions?.flatMap?.((block: any) => block.questions ?? []).length ?? 0}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-finko-muted">Правила рисков</p><p className="mt-1 text-2xl font-bold">{Object.keys(template.riskRules ?? {}).length}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-finko-muted">Статус</p><p className="mt-1 text-2xl font-bold">{template.isActive ? "Активен" : "Неактивен"}</p></div>
        </div>
        {status ? <p className="rounded-2xl bg-finko-primaryLight p-3 text-sm text-finko-primaryDark">{status}</p> : null}
        <Button onClick={save}><Save className="h-4 w-4" />Сохранить допущения</Button>
      </CardContent>
    </Card>
  );
}
