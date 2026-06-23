import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { selectSourcesForBusiness, sourceRegistry } from "../src/lib/data/sourceRegistry.ts";

test("source registry contains at least 250 managed credible sources", () => {
  assert.ok(sourceRegistry.length >= 250);
  assert.ok(sourceRegistry.some((source) => source.sourceType === "official_statistics" && source.countryScope === "UZ"));
  assert.ok(sourceRegistry.some((source) => source.id === "cbu_uz"));
});

test("source selection prioritizes category-relevant sources", () => {
  const foodSources = selectSourcesForBusiness("food_service", ["sanitary", "prices"], 30);
  assert.ok(foodSources.length >= 5);
  assert.ok(foodSources.some((source) => source.indicators.join(" ").toLowerCase().includes("sanitary") || source.useCases.join(" ").toLowerCase().includes("sanitary")));
});


test("source registry has strong Uzbekistan-specific coverage for documents, permits and statistics", () => {
  const uzSources = sourceRegistry.filter((source) => source.countryScope === "UZ");
  assert.ok(uzSources.length >= 190);
  assert.ok(sourceRegistry.some((source) => source.id === "license_gov_uz"));
  assert.ok(sourceRegistry.some((source) => source.id === "lex_uz"));
  assert.ok(sourceRegistry.some((source) => source.id === "sanepid_uz"));
  assert.ok(sourceRegistry.some((source) => source.id === "ecology_uz"));
  assert.ok(sourceRegistry.some((source) => source.applicableCategories.includes("auto_service")));
});

test("source selection can prioritize compliance and permit sources", () => {
  const permitSources = selectSourcesForBusiness("healthcare", ["documents", "permits", "license"], 20);
  assert.ok(permitSources.some((source) => source.id === "license_gov_uz" || source.id === "licenses_medical_uz"));
  assert.ok(permitSources.some((source) => source.id === "health_ministry_uz"));
});


test("source registry documentation is synchronized with runtime source count and usage classes", () => {
  const doc = readFileSync("SOURCE_REGISTRY_303_UPDATE.md", "utf8");
  assert.ok(doc.includes(`runtime registry: **${sourceRegistry.length} источников**`));
  for (const label of ["реально используемые в расчёте", "используемые в отчёте как контекст", "рекомендованные для ручной проверки", "шаблонные расширенные источники", "устаревшие или отключённые источники"]) {
    assert.match(doc, new RegExp(label));
  }
});
