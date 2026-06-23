import test from "node:test";
import assert from "node:assert/strict";
import { generateRiskMatrix } from "../src/lib/scoring/riskEngine.ts";

test("risk engine returns at least eight contextual risks", () => {
  const risks = generateRiskMatrix({
    certificationAwareness: "not_aware",
    rawMaterialSource: "import",
    creditNeeded: "yes",
    collateralAvailable: false,
    equipmentCondition: "used",
    experienceLevel: "low",
    targetCustomers: ["bazaars"]
  });

  assert.ok(risks.length >= 8);
  assert.equal(risks.find((risk) => risk.code === "certification_risk")?.level, "high");
  assert.equal(risks.find((risk) => risk.code === "fx_risk")?.level, "high");
  assert.equal(risks.find((risk) => risk.code === "collateral_risk")?.level, "high");
  assert.ok(risks.every((risk) => risk.probability >= 1 && risk.impact >= 1 && risk.score === risk.probability * risk.impact));
});


test("mixed suppliers without foreign currency exposure create moderate, not high, FX risk", () => {
  const risks = generateRiskMatrix({
    rawMaterialSource: "mixed",
    foreignCurrencyPurchases: false,
    creditNeeded: "no",
    collateralAvailable: true,
    equipmentCondition: "new",
    experienceLevel: "medium",
    targetCustomers: ["walk_in"]
  });

  assert.equal(risks.find((risk) => risk.code === "fx_risk")?.level, "medium");
});

test("auto-service one-box scenario adds lease, infrastructure, waste and payment risks", async () => {
  const { autoServiceOneBox } = await import("./fixtures/autoServiceOneBox.ts");
  const risks = generateRiskMatrix(autoServiceOneBox);
  const codes = new Set(risks.map((risk) => risk.code));

  assert.ok(codes.has("auto_service_box_lease_risk"));
  assert.ok(codes.has("auto_service_infrastructure_risk"));
  assert.ok(codes.has("auto_service_waste_oil_risk"));
  assert.ok(codes.has("auto_service_payment_flow_risk"));
  assert.equal(risks.find((risk) => risk.code === "fx_risk")?.level, "high");
  assert.equal(risks.find((risk) => risk.code === "auto_service_waste_oil_risk")?.level, "high");
});
