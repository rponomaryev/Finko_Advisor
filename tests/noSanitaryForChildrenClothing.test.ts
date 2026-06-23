import test from "node:test";
import assert from "node:assert/strict";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";

test("children clothing store has supplier documents instead of sanitary question", () => {
  const template = buildDynamicInterviewTemplate({ businessType: "магазин детской одежды" });
  const docs = template.interviewBlocks.find((block) => block.id === "documents_experience");
  assert.ok(docs);
  assert.ok(docs!.questions.some((q) => /Документы поставщика/.test(q.label)));
  assert.ok(!docs!.questions.some((q) => /Санитар/.test(q.label + q.question)));
});
