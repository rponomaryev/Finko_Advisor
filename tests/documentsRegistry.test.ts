import test from "node:test";
import assert from "node:assert/strict";
import { getDocumentRequirements } from "../src/lib/compliance/documentsRegistry.ts";
import { autoServiceOneBox } from "./fixtures/autoServiceOneBox.ts";
import { healthcareClinic } from "./fixtures/healthcareClinic.ts";
import { documentsRegistry } from "../src/lib/compliance/documentsRegistry.ts";
import { sourceRegistry } from "../src/lib/data/sourceRegistry.ts";

test("documents registry returns industry-specific auto service requirements", () => {
  const docs = getDocumentRequirements(autoServiceOneBox);
  assert.ok(docs.some((doc) => doc.id === "business_registration"));
  assert.ok(docs.some((doc) => doc.id === "auto_service_waste_oil"));
  assert.ok(docs.some((doc) => doc.id === "auto_service_box_sublease"));
  assert.ok(docs.some((doc) => doc.id === "auto_service_allowed_works"));
  assert.ok(docs.some((doc) => doc.id === "auto_service_payment_cashier"));
  assert.ok(docs.some((doc) => doc.id === "auto_service_warranty_order"));
});

test("documents registry raises healthcare compliance requirements", () => {
  const docs = getDocumentRequirements(healthcareClinic);
  assert.ok(docs.some((doc) => doc.id === "healthcare_license"));
  assert.ok(docs.some((doc) => doc.confidence === "needs_verification"));
});


test("document registry source ids match managed source registry", () => {
  const sourceIds = new Set(sourceRegistry.map((source) => source.id));
  const missing = documentsRegistry
    .filter((doc) => doc.sourceId)
    .filter((doc) => !sourceIds.has(String(doc.sourceId)))
    .map((doc) => `${doc.id}:${doc.sourceId}`);

  assert.deepEqual(missing, []);
});
