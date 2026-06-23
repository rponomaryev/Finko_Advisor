import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import { riskKey } from "../src/lib/report/riskKeys.ts";
import type { RiskItem, StructuredProjectData } from "../src/lib/types/project.ts";

const duplicateRisks: RiskItem[] = [
  { id: "risk-a", code: "показатель", title: "Слабая подтверждённость спроса", category: "market", probability: 2, impact: 3, score: 6, level: "high", description: "Проверить спрос.", reason: "Недостаточно подтверждений.", mitigation: "Провести тестовые продажи." },
  { id: "risk-b", code: "показатель", title: "Риск среднего чека", category: "market", probability: 2, impact: 3, score: 6, level: "high", description: "Проверить средний чек.", reason: "Чек не подтверждён.", mitigation: "Собрать чеки конкурентов." }
];

function renderKeys(risks: RiskItem[]) {
  return risks.map((risk, index) => riskKey(risk, index, "test"));
}

test("RiskMatrix source does not use duplicate-prone risk.code as the sole React key", () => {
  const source = readFileSync("src/components/advisor/RiskMatrix.tsx", "utf8");
  assert.doesNotMatch(source, /key=\{risk\.code\}/);
  assert.match(source, /riskKey\(risk,\s*index,\s*/);
  assert.equal(new Set(renderKeys(duplicateRisks)).size, duplicateRisks.length);
});

test("risk engine returns stable unique ids and non-placeholder titles", () => {
  const project: StructuredProjectData = { businessType: "Пекарня", businessIdea: "мини-пекарня", userLanguage: "ru", dailyCovers: 120, averageTicket: 35_000 };
  const risks = generateRiskMatrix(project);
  const ids = risks.map((risk) => risk.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(risks.every((risk) => risk.title && !/^показатель$/i.test(risk.title)));
});
