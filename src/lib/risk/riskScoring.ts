import type { RiskLevel } from "../types/project.ts";
import type { ReportLocale } from "../i18n/reportMessages.ts";

const LOCALIZED_LEVELS: Record<string, RiskLevel> = {
  high: "high",
  h: "high",
  "высокий": "high",
  "высокая": "high",
  "высокое": "high",
  "юқори": "high",
  "юкори": "high",
  "yuqori": "high",
  medium: "medium",
  med: "medium",
  m: "medium",
  "средний": "medium",
  "средняя": "medium",
  "среднее": "medium",
  "ўрта": "medium",
  "урта": "medium",
  "o'rta": "medium",
  "o‘rta": "medium",
  "orta": "medium",
  "oʻrta": "medium",
  low: "low",
  l: "low",
  "низкий": "low",
  "низкая": "low",
  "низкое": "low",
  "паст": "low",
  "past": "low"
};

function normalizeLevelToken(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, " ");
}

export function riskLevelFromScore(score: unknown): RiskLevel {
  const numericScore = Number(score ?? 0);
  if (!Number.isFinite(numericScore)) return "low";
  if (numericScore >= 7) return "high";
  if (numericScore >= 3) return "medium";
  return "low";
}

export function normalizeRiskLevel(input: string | number | undefined | null, score?: number): RiskLevel {
  if (typeof input === "number" && Number.isFinite(input)) return riskLevelFromScore(input);
  const token = normalizeLevelToken(input);
  if (token && LOCALIZED_LEVELS[token]) return LOCALIZED_LEVELS[token];
  if (token.includes("высок") || token.includes("yuqori") || token.includes("юқори")) return "high";
  if (token.includes("сред") || token.includes("o'rta") || token.includes("o‘rta") || token.includes("ўрта")) return "medium";
  if (token.includes("низк") || token.includes("past") || token.includes("паст")) return "low";
  return riskLevelFromScore(score);
}

export function formatRiskLevel(input: string | number | undefined | null, locale: ReportLocale = "ru", score?: number): string {
  const level = normalizeRiskLevel(input, score);
  if (locale === "en") return level === "high" ? "High" : level === "medium" ? "Medium" : "Low";
  if (locale === "uz") return level === "high" ? "Yuqori" : level === "medium" ? "O'rta" : "Past";
  return level === "high" ? "Высокий" : level === "medium" ? "Средний" : "Низкий";
}

export function riskMatrixHeaderLabels(locale: ReportLocale): string[] {
  if (locale === "en") return ["Risk", "Probability", "Impact", "Score", "Level"];
  if (locale === "uz") return ["Risk", "Ehtimollik", "Ta'sir", "Ball", "Daraja"];
  return ["Риск", "Вероятность", "Влияние", "Балл", "Уровень"];
}
