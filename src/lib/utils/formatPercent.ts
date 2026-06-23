export function formatPercent(value: number | null | undefined): string {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value ?? 0)}%`;
}
