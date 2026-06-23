import test from "node:test";
import assert from "node:assert/strict";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import { childrenClothingProfile } from "./helpers/systemicFixtures.ts";

const forbidden = /требуется проверка|Данных проекта пока недостаточно для полной проверки риска/i;

test("children clothing risk register is specific, localized and non-duplicate", () => {
  const risks = generateRiskMatrix(childrenClothingProfile());
  assert.ok(risks.length >= 10);
  const titles = risks.map((risk) => risk.title);
  assert.equal(new Set(titles).size, titles.length);
  assert.ok(titles.some((title) => /DSCR/i.test(title)));
  assert.ok(titles.some((title) => /размерн/i.test(title)));
  assert.ok(titles.some((title) => /сезон/i.test(title)));
  assert.ok(titles.some((title) => /возврат/i.test(title)));
  for (const risk of risks) {
    assert.doesNotMatch(`${risk.title} ${risk.reason} ${risk.mitigation}`, forbidden);
    assert.ok(risk.reason.length > 50);
    assert.ok(risk.mitigation.length > 50);
    if (risk.score === 9) assert.equal(risk.level, "high");
    if (risk.score >= 6) assert.notEqual(risk.level, "low");
  }
});
