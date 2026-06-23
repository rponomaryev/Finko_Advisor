import test from "node:test";
import assert from "node:assert/strict";
import { buildGenericBusinessTemplate } from "../src/lib/data/sectorTemplates/genericBusinessTemplate.ts";

test("coffee and sewing templates do not reuse toy-specific interview keys", () => {
  const coffee = buildGenericBusinessTemplate("Кофейня");
  const sewing = buildGenericBusinessTemplate("Швейный цех");
  const coffeeKeys = coffee.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key));
  const sewingKeys = sewing.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key));

  assert.equal(coffee.code, "coffee_shop");
  assert.equal(sewing.code, "sewing_workshop");
  assert.equal(coffeeKeys.includes("toyType"), false);
  assert.equal(sewingKeys.includes("toyType"), false);
  assert.ok(coffee.interviewBlocks.some((block) => block.questions.some((question) => question.label.includes("Средний чек"))));
  assert.ok(sewing.interviewBlocks.some((block) => block.questions.some((question) => question.unit === "изделий/мес.")));
});
