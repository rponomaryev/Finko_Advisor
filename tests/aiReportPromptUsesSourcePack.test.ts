import test from "node:test";
import assert from "node:assert/strict";
import { buildReportUserPrompt } from "../src/lib/report/aiReportGenerator.ts";
import { calculateAll } from "../src/lib/calculator/financialCalculator.ts";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import { childrenClothingProfile } from "./helpers/systemicFixtures.ts";

test("AI report prompt contains a curated source pack and sourceId instructions", () => {
  const profile = childrenClothingProfile();
  const financial = calculateAll(profile, resolveTemplateForData(profile).assumptions);
  const risks = generateRiskMatrix({ ...profile, financialResult: financial } as any);
  const prompt = buildReportUserPrompt({ project: { ...profile, structuredData: profile } as any, financial, risks, feasibilityScore: 52, bankReadinessScore: 45, webResearch: null, locale: "ru" });
  assert.match(prompt, /SOURCE PACK|РАЗРЕШЁННЫЕ ИСТОЧНИКИ/i);
  assert.match(prompt, /source ids|sourceIds|source id/i);
  assert.match(prompt, /stat_uz|cbu_uz|tax_uz|my_gov_uz|lex_uz/);
  assert.match(prompt, /Statistics|Central Bank|Tax Committee|Single Portal|Legislation/i);
  const sourceLineCount = (prompt.match(/^-\s+id=[a-z0-9_]+;/gmi) ?? []).length;
  assert.ok(sourceLineCount > 5, "prompt should include selected sources");
  assert.ok(sourceLineCount < 80, "prompt must not dump all 1000 registry entries");
});
