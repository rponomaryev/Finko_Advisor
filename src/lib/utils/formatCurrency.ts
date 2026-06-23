import type { AppLocale } from "../i18n/index.ts";
import type { CurrencyCode } from "../types/project";

function normalize(value: number | null | undefined): number {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function intlLocale(locale: AppLocale = "ru") {
  return locale === "en" ? "en-US" : locale === "uz" ? "uz-UZ" : "ru-RU";
}

function currencyLabel(currency: CurrencyCode | "сум" = "UZS", locale: AppLocale = "ru"): string {
  if (currency === "UZS" || currency === "сум") return locale === "ru" ? "сум" : "UZS";
  return currency;
}

export function formatNumber(value: number | null | undefined, locale: AppLocale = "ru"): string {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 0 }).format(normalize(value));
}

export function formatCurrencyFull(value: number | null | undefined, currency: CurrencyCode | "сум" = "UZS", locale: AppLocale = "ru"): string {
  return `${formatNumber(value, locale)} ${currencyLabel(currency, locale)}`;
}

export function formatCurrencyCompact(value: number | null | undefined, currency: CurrencyCode | "сум" = "UZS", locale: AppLocale = "ru"): string {
  const amount = normalize(value);
  const label = currencyLabel(currency, locale);
  const abs = Math.abs(amount);
  const number = (n: number, digits = 1) => new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: digits }).format(n);
  if (currency === "USD") return `${number(amount)} USD`;
  if (abs >= 1_000_000_000) {
    const unit = locale === "en" ? "bn" : locale === "uz" ? "mlrd" : "млрд";
    return `${number(amount / 1_000_000_000, 2)} ${unit} ${label}`;
  }
  if (abs >= 1_000_000) {
    const unit = locale === "en" ? "m" : locale === "uz" ? "mln" : "млн";
    return `${number(amount / 1_000_000)} ${unit} ${label}`;
  }
  return formatCurrencyFull(amount, currency, locale);
}

export function formatCurrencyWithOriginal(valueUZS: number | null | undefined, originalAmount?: number | null, originalCurrency?: CurrencyCode | null, locale: AppLocale = "ru"): string {
  if (originalCurrency === "USD" && originalAmount) {
    return `${formatCurrencyFull(originalAmount, "USD", locale)} ≈ ${formatCurrencyFull(valueUZS, "UZS", locale)}`;
  }
  return formatCurrencyFull(valueUZS, "UZS", locale);
}

export function formatCurrency(value: number | null | undefined, locale: AppLocale = "ru"): string {
  return formatCurrencyFull(value, "UZS", locale);
}
