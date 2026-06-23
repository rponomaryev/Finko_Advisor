import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hasBusinessProfileLabel } from "../src/lib/i18n/businessProfileLabels.ts";

const source = readFileSync(new URL("../src/lib/business/businessClassifier.ts", import.meta.url), "utf8");
const fields = [
  "category",
  "subcategory",
  "businessModel",
  "operationalModel",
  "revenueUnit",
  "keyRevenueDrivers",
  "keyCostDrivers",
  "requiredDataForAnalysis",
  "keyRisks",
  "documentCategories"
];

function valuesForField(field: string): string[] {
  const values = new Set<string>();
  for (const match of source.matchAll(new RegExp(`${field}\\s*:\\s*"([^"]+)"`, "g"))) values.add(match[1]);
  for (const match of source.matchAll(new RegExp(`${field}\\s*:\\s*\\[([\\s\\S]*?)\\]`, "g"))) {
    for (const item of match[1].matchAll(/"([^"]+)"/g)) values.add(item[1]);
  }
  return Array.from(values).filter((value) => !value.includes("${"));
}

test("business classifier user-facing enum values have ru/uz/en labels", () => {
  const missing = fields.flatMap((field) => valuesForField(field).filter((value) => !hasBusinessProfileLabel(value)).map((value) => `${field}:${value}`));
  assert.deepEqual(missing, []);
});
