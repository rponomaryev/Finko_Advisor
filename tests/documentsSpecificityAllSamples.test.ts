import test from "node:test";
import assert from "node:assert/strict";
import { getDocumentRequirements } from "../src/lib/compliance/documentsRegistry.ts";
import { businessSamples } from "../src/lib/data/businessSamples/businessSamples.ts";

test("document registry returns non-empty deduped documents for all samples", () => {
  for (const sample of businessSamples) {
    const docs = getDocumentRequirements({ businessType: sample.label.ru, businessIdea: sample.aliases.join(" "), userLanguage: "ru" } as never);
    assert.ok(docs.length > 0, sample.label.ru);
    assert.equal(new Set(docs.map((doc) => doc.id)).size, docs.length, sample.label.ru);
  }
});
