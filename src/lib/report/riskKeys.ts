import type { RiskItem } from "../types/project.ts";

export function riskKey(risk: RiskItem, index: number, context = "risk"): string {
  const record = risk as RiskItem & { sourceId?: string; source?: string; owner?: string; timing?: string };
  return [
    context,
    record.id,
    record.code,
    record.sourceId,
    record.category,
    record.probability,
    record.impact,
    record.score,
    record.source,
    record.owner,
    record.timing,
    index
  ]
    .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
    .map((value) => String(value).replace(/\s+/g, "_"))
    .join("__");
}
