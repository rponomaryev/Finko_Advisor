"use client";

import { CheckCircle2, Clock3, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { useLocale } from "@/lib/i18n/client";
import { translateOptionValue, translateQuestion } from "@/lib/i18n/interviewLabels";
import { sanitizeUserFacingTextareaValue } from "@/lib/i18n/userFacingSanitizer";
import type { CurrencyCode, ExchangeRateSnapshot, InterviewQuestion, MoneyValueSnapshot, StaffPlan } from "@/lib/types/project";
import { labelValue, localizeUnitLabel } from "@/lib/utils/labels";

const laterValue = "__later__";
const otherPrefix = "other:";
const moneyFieldKeys = new Set([
  "ownContributionAmount",
  "requestedLoanAmount",
  "requestedLeasingAmount",
  "averagePrice",
  "firstMonthRawMaterialStockUZS",
  "stableMonthlyRevenue",
  "rawMaterialCostPerUnit",
  "packagingCostPerUnit",
  "directLogisticsCostPerUnit",
  "marketplaceCommissionPerUnit",
  "otherVariableCostPerUnit",
  "monthlyRent",
  "monthlyUtilities",
  "monthlyMarketing",
  "monthlyMaintenance",
  "monthlyTaxes",
  "monthlyLogistics",
  "monthlySoftware",
  "monthlyInsurance",
  "monthlyAccounting",
  "monthlyOtherOpex",
  "equipmentCapex",
  "premisesSetupCapex",
  "furnitureFixturesCapex",
  "itPosWebsiteCapex",
  "registrationCertificationCapex",
  "initialInventoryCapex",
  "deliveryInstallationCapex",
  "trainingLaunchCapex",
  "capexReserve",
  "otherCapex",
  "accountsReceivableBufferUZS",
  "accountsPayableBufferUZS",
  "seasonalStockBufferUZS",
  "collateralEstimatedValue",
  "leasingAdvancePayment",
  "leasingMonthlyPayment",
  "grants",
  "otherFunding"
]);

function otherText(value: unknown): string {
  const text = String(value ?? "");
  return text.startsWith(otherPrefix) ? text.slice(otherPrefix.length) : "";
}

function normalizeStaffPlan(value: unknown): StaffPlan {
  if (value && typeof value === "object" && Array.isArray((value as StaffPlan).roles)) {
    return value as StaffPlan;
  }
  return { roles: [] };
}

function isMoneyQuestion(question: InterviewQuestion) {
  return question.type === "number" && (moneyFieldKeys.has(question.key) || question.unit === "UZS" || question.unit === "сум");
}

function isMoneyValue(value: unknown): value is MoneyValueSnapshot & { __money?: true } {
  return value !== null && typeof value === "object" && "sourceAmount" in value && "sourceCurrency" in value;
}

function normalizeMoneyValue(value: unknown): MoneyValueSnapshot {
  if (isMoneyValue(value)) return value;
  const amount = Number(value ?? 0);
  return {
    sourceAmount: Number.isFinite(amount) ? amount : 0,
    sourceCurrency: "UZS",
    amountUZS: Number.isFinite(amount) ? Math.round(amount) : 0
  };
}

function rateDate(snapshot: ExchangeRateSnapshot) {
  return snapshot.rateDate ?? snapshot.date ?? snapshot.requestedDate;
}

function selectedLaterText(locale: "ru" | "uz" | "en") {
  if (locale === "en") return "Selected: will fill later";
  if (locale === "uz") return "Tanlandi: keyin to'ldiraman";
  return "Выбрано: заполню позже";
}

function shouldShowOptionalAffordance(question: InterviewQuestion) {
  // Do not invite users to skip numeric/select/boolean business inputs.
  // Keep the visible optional affordance only for open descriptive notes.
  return Boolean(question.optional && question.type === "textarea" && question.key.startsWith("sectionNotes."));
}

function inputNumberValue(value: unknown, selectedLater = false) {
  if (selectedLater || value === undefined || value === null || value === "") return "";
  return String(value);
}

function OptionalLaterButton({ selected, label, locale, onClick }: { selected: boolean; label: string; locale: "ru" | "uz" | "en"; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        selected
          ? "border-finko-primary bg-finko-primaryLight text-finko-primaryDark"
          : "border-finko-border bg-white text-finko-muted hover:border-finko-primary hover:text-finko-primary"
      }`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {selected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
      {selected ? selectedLaterText(locale) : label}
    </button>
  );
}

function emptyStaffRole() {
  return {
    id: crypto.randomUUID(),
    role: "",
    count: 1,
    monthlySalaryAmount: 0,
    monthlySalaryCurrency: "UZS" as const
  };
}

export function AnswerInput({ question, value, onChange }: { question: InterviewQuestion; value: unknown; onChange: (value: unknown) => void }) {
  const { locale, messages } = useLocale();
  const displayQuestion = translateQuestion(locale, question);
  const [rate, setRate] = useState<ExchangeRateSnapshot | null>(null);
  const isOther = String(value ?? "") === "other" || String(value ?? "").startsWith(otherPrefix);
  const answerMessages = messages.answerInput;
  const chooseLabel = answerMessages.select;
  const laterLabel = answerMessages.later;
  const otherLabel = answerMessages.other;
  const staffPlan = useMemo(() => normalizeStaffPlan(value), [value]);
  const shouldFetchRate = question.type === "staffPlan" || isMoneyQuestion(question);

  useEffect(() => {
    if (!shouldFetchRate) return;
    let cancelled = false;
    fetch("/api/exchange-rate")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && typeof data.rate === "number" && data.source === "CBU") {
          setRate(data as ExchangeRateSnapshot);
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [shouldFetchRate]);

  function updateStaffPlan(next: StaffPlan) {
    onChange({
      ...next,
      exchangeRateSnapshot: rate ?? next.exchangeRateSnapshot
    });
  }

  if (question.type === "staffPlan") {
    const roleLabel = answerMessages.role;
    const countLabel = answerMessages.count;
    const salaryLabel = answerMessages.salary;
    const currencyLabel = answerMessages.currency;
    const addLabel = answerMessages.addRole;
    const rateLabel = rate
      ? `USD/UZS: ${rate.rate.toLocaleString(locale === "ru" ? "ru-RU" : locale === "uz" ? "uz-UZ" : "en-US")} (${rateDate(rate)})`
      : answerMessages.loadingRate;
    const usdHint = (amount: number) => {
      if (!rate) return null;
      const converted = Math.round(amount * rate.rate).toLocaleString(locale === "ru" ? "ru-RU" : locale === "uz" ? "uz-UZ" : "en-US");
      return answerMessages.usdHint.replace("{amount}", converted).replace("{date}", rateDate(rate));
    };
    const roles = staffPlan.roles.length ? staffPlan.roles : [emptyStaffRole()];

    return (
      <div className="grid gap-3">
        <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-finko-muted">{rateLabel}</div>
        {roles.map((role, index) => (
          <div key={role.id ?? index} className="grid gap-2 rounded-2xl border border-finko-border bg-white p-3 sm:grid-cols-[minmax(0,1.2fr)_90px_minmax(0,1fr)_92px_40px]">
            <label className="grid gap-1 text-xs font-semibold text-finko-muted">
              {roleLabel}
              <Input
                value={role.role}
                onChange={(event) => {
                  const nextRoles = [...roles];
                  nextRoles[index] = { ...role, role: event.target.value };
                  updateStaffPlan({ ...staffPlan, roles: nextRoles });
                }}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-finko-muted">
              {countLabel}
              <Input
                type="number"
                min={1}
                value={String(role.count ?? 1)}
                onChange={(event) => {
                  const nextRoles = [...roles];
                  nextRoles[index] = { ...role, count: Number(event.target.value) };
                  updateStaffPlan({ ...staffPlan, roles: nextRoles });
                }}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-finko-muted">
              {salaryLabel}
              <Input
                type="number"
                min={0}
                value={String(role.monthlySalaryAmount ?? 0)}
                onChange={(event) => {
                  const nextRoles = [...roles];
                  nextRoles[index] = { ...role, monthlySalaryAmount: Number(event.target.value) };
                  updateStaffPlan({ ...staffPlan, roles: nextRoles });
                }}
              />
              {role.monthlySalaryCurrency === "USD" ? <span className="text-[11px] font-medium text-finko-muted">{usdHint(Number(role.monthlySalaryAmount ?? 0))}</span> : null}
            </label>
            <label className="grid gap-1 text-xs font-semibold text-finko-muted">
              {currencyLabel}
              <Select
                value={role.monthlySalaryCurrency ?? "UZS"}
                onChange={(event) => {
                  const nextRoles = [...roles];
                  nextRoles[index] = { ...role, monthlySalaryCurrency: event.target.value as "UZS" | "USD" };
                  updateStaffPlan({ ...staffPlan, roles: nextRoles });
                }}
              >
                <option value="UZS">UZS</option>
                <option value="USD">USD</option>
              </Select>
            </label>
            <Button
              type="button"
              variant="ghost"
              className="self-end"
              onClick={() => updateStaffPlan({ ...staffPlan, roles: roles.filter((_, roleIndex) => roleIndex !== index) })}
              disabled={roles.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => updateStaffPlan({ ...staffPlan, roles: [...roles, emptyStaffRole()] })}>
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
      </div>
    );
  }

  if (question.type === "textarea") {
    const selectedLater = value === laterValue;
    return (
      <div className="grid gap-2">
        <Textarea value={sanitizeUserFacingTextareaValue(selectedLater ? "" : value ?? "", { fieldKey: question.key, locale })} onChange={(event) => onChange(event.target.value)} placeholder={displayQuestion.placeholder} />
        {shouldShowOptionalAffordance(question) ? <OptionalLaterButton selected={selectedLater} label={laterLabel} locale={locale} onClick={() => onChange(laterValue)} /> : null}
      </div>
    );
  }

  if (question.type === "number") {
    if (isMoneyQuestion(question)) {
      const selectedLater = value === laterValue;
      const money = normalizeMoneyValue(selectedLater ? undefined : value);
      const currentCurrency = money.sourceCurrency ?? "UZS";
      const currentAmountValue = isMoneyValue(value) ? inputNumberValue(value.sourceAmount, selectedLater) : inputNumberValue(value, selectedLater);
      const buildValue = (amount: number, currency: CurrencyCode) => {
        const safeAmount = Number.isFinite(amount) ? amount : 0;
        const amountUZS = currency === "USD" && rate ? Math.round(safeAmount * rate.rate) : Math.round(safeAmount);
        onChange({
          __money: true,
          sourceAmount: safeAmount,
          sourceCurrency: currency,
          amountUZS,
          exchangeRateSnapshot: currency === "USD" ? rate ?? money.exchangeRateSnapshot : undefined
        });
      };
      const usdHint = currentCurrency === "USD" && rate
        ? answerMessages.usdHint
            .replace("{amount}", Math.round(money.sourceAmount * rate.rate).toLocaleString(locale === "ru" ? "ru-RU" : locale === "uz" ? "uz-UZ" : "en-US"))
            .replace("{date}", rateDate(rate))
        : null;
      return (
        <div className="grid gap-2">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_104px]">
            <Input
              type="number"
              min={0}
              value={currentAmountValue}
              onChange={(event) => {
                const raw = event.target.value;
                if (raw === "") onChange("");
                else buildValue(Number(raw), currentCurrency);
              }}
            />
            <Select value={currentCurrency} onChange={(event) => buildValue(Number(currentAmountValue || 0), event.target.value as CurrencyCode)}>
              <option value="UZS">UZS</option>
              <option value="USD">USD</option>
            </Select>
          </div>
          {currentCurrency === "USD" ? (
            <span className="text-xs font-medium text-finko-muted">
              {usdHint ?? answerMessages.loadingRate}
            </span>
          ) : null}
          {shouldShowOptionalAffordance(question) ? <OptionalLaterButton selected={selectedLater} label={laterLabel} locale={locale} onClick={() => onChange(laterValue)} /> : null}
        </div>
      );
    }
    const selectedLater = value === laterValue;
    return (
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <Input type="number" min={0} value={inputNumberValue(value, selectedLater)} onChange={(event) => onChange(event.target.value === "" ? "" : Number(event.target.value))} />
        {displayQuestion.unit ? <span className="text-sm text-finko-muted">{localizeUnitLabel(displayQuestion.unit, locale)}</span> : null}
        {shouldShowOptionalAffordance(question) ? <OptionalLaterButton selected={selectedLater} label={laterLabel} locale={locale} onClick={() => onChange(laterValue)} /> : null}
      </div>
    );
  }

  if (question.type === "select") {
    const selectedLater = value === laterValue;
    const selectValue = selectedLater ? "" : isOther ? "other" : String(value ?? "");
    return (
      <div className="grid gap-3">
        <Select value={selectValue} onChange={(event) => onChange(event.target.value)}>
          <option value="">{chooseLabel}</option>
          {(question.options ?? []).map((option) => <option key={option} value={option}>{translateOptionValue(locale, option)}</option>)}
        </Select>
        {isOther ? <Textarea value={otherText(value)} onChange={(event) => onChange(`${otherPrefix}${event.target.value}`)} placeholder={otherLabel} /> : null}
        {shouldShowOptionalAffordance(question) ? <OptionalLaterButton selected={selectedLater} label={laterLabel} locale={locale} onClick={() => onChange(laterValue)} /> : null}
      </div>
    );
  }

  if (question.type === "multiselect") {
    const values = Array.isArray(value) ? value.map(String) : [];
    const selected = new Set(values.map((item) => item.startsWith(otherPrefix) ? "other" : item));
    const existingOtherText = values.find((item) => item.startsWith(otherPrefix))?.slice(otherPrefix.length) ?? "";
    return (
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {(question.options ?? []).map((option) => (
            <label key={option} className="flex items-center gap-2 rounded-xl border border-finko-border bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={selected.has(option)}
                onChange={(event) => {
                  const next = new Set(selected);
                  if (event.target.checked) next.add(option);
                  else next.delete(option);
                  const normalized = [...next].filter((item) => item !== "other");
                  if (next.has("other")) normalized.push(`${otherPrefix}${existingOtherText}`);
                  onChange(normalized);
                }}
              />
              {translateOptionValue(locale, option)}
            </label>
          ))}
        </div>
        {selected.has("other") ? <Textarea value={existingOtherText} placeholder={otherLabel} onChange={(event) => onChange([...selected].filter((item) => item !== "other").concat(`${otherPrefix}${event.target.value}`))} /> : null}
      </div>
    );
  }

  if (question.type === "boolean") {
    return (
      <Select value={value === undefined ? "" : String(value)} onChange={(event) => onChange(event.target.value === laterValue ? laterValue : event.target.value === "true")}>
        <option value="">{chooseLabel}</option>
        <option value="true">{labelValue(true, locale)}</option>
        <option value="false">{labelValue(false, locale)}</option>
        {shouldShowOptionalAffordance(question) ? <option value={laterValue}>{laterLabel}</option> : null}
      </Select>
    );
  }

  const selectedLater = value === laterValue;
  return (
    <div className="grid gap-2">
      <Input value={String(selectedLater ? "" : value ?? "")} onChange={(event) => onChange(event.target.value)} placeholder={displayQuestion.placeholder} />
      {shouldShowOptionalAffordance(question) ? <OptionalLaterButton selected={selectedLater} label={laterLabel} locale={locale} onClick={() => onChange(laterValue)} /> : null}
    </div>
  );
}
