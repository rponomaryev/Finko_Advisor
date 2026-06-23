import test from "node:test";
import assert from "node:assert/strict";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";
import { genericProfile } from "./helpers/systemicFixtures.ts";

const scenarios = [
  genericProfile({ businessType: "Выездной сервис ремонта кофемашин", category: "services", volumeKey: "ordersPerDay", priceKey: "servicePrice" }),
  genericProfile({ businessType: "Аренда строительных инструментов", category: "rental", volumeKey: "rentalOrdersPerMonth", priceKey: "rentalPrice" }),
  genericProfile({ businessType: "Мини-производство мебели", category: "manufacturing", volumeKey: "productionUnitsPerMonth", priceKey: "pricePerUnit" })
];

for (const profile of scenarios) {
  test(`generic risk matrix has meaningful levels and no placeholders: ${profile.businessType}`, () => {
    const risks = generateRiskMatrix(profile);
    assert.ok(risks.length >= 8);
    for (const risk of risks) {
      assert.doesNotMatch(`${risk.title} ${risk.reason} ${risk.mitigation}`, /требуется проверка|risk-risk|undefined|null/i);
      if (risk.score >= 6) assert.notEqual(risk.level, "low");
      if (risk.score === 9) assert.equal(risk.level, "high");
    }
  });
}
