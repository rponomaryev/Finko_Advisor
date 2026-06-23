import test from "node:test";
import assert from "node:assert/strict";
import { riskKey } from "../src/lib/report/riskKeys.ts";
import type { RiskItem } from "../src/lib/types/project.ts";

test("RiskMatrix keys stay unique for duplicate localized titles", () => {
  const risks = Array.from({ length: 20 }, (_, index) => ({
    id: undefined,
    code: "requires_review",
    title: "требуется проверка",
    category: "market",
    probability: 3,
    impact: 3,
    score: 9,
    level: "high",
    description: "Повторяющееся название для регрессионного теста.",
    reason: "Причина риска повторяется, чтобы проверить ключи React.",
    mitigation: "Митигация повторяется, чтобы проверить ключи React."
  })) as RiskItem[];

  const listKeys = risks.map((risk, index) => riskKey(risk, index, "list"));
  const cellKeys = risks.map((risk, index) => riskKey(risk, index, "cell-3-3"));
  assert.equal(new Set(listKeys).size, risks.length);
  assert.equal(new Set(cellKeys).size, risks.length);
  assert.notEqual(listKeys[0], cellKeys[0]);
});
