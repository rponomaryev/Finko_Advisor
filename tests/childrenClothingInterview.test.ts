import test from "node:test";
import assert from "node:assert/strict";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { getNextFallbackQuestions } from "../src/lib/ai/fallbackInterview.ts";

test("children clothing interview separates buyers, channels and inventory", () => {
  const template = buildDynamicInterviewTemplate({ businessType: "Магазин детской одежды", businessIdea: "Instagram Telegram и офлайн точка" });
  const blocks = template.interviewBlocks.map((block) => block.id);
  assert.deepEqual(blocks, [
    "business_idea",
    "location",
    "equipment_launch",
    "operations",
    "suppliers_procurement",
    "sales",
    "financing",
    "documents_experience"
  ]);

  const allQuestions = template.interviewBlocks.flatMap((block) => block.questions);
  assert.ok(allQuestions.some((q) => q.key === "targetCustomerSegments"));
  assert.ok(allQuestions.some((q) => q.key === "salesChannels"));
  assert.ok(allQuestions.some((q) => q.key === "averagePurchaseCost"));
  assert.ok(allQuestions.every((q) => q.key !== "sanitaryRequirementsKnown"));
});

test("interview state machine locks future blocks and completes only saved blocks", () => {
  const state = getNextFallbackQuestions({
    businessType: "Магазин детской одежды",
    businessIdea: "Офлайн и Instagram продажи",
    region: "Ташкент",
    completedBlockIds: ["business_idea"],
    interviewCursorBlockId: "location"
  });
  const statuses = state.blockStatuses ?? [];
  assert.equal(statuses.find((block) => block.blockId === "business_idea")?.status, "completed");
  assert.equal(statuses.find((block) => block.blockId === "location")?.status, "current");
  assert.equal(statuses.find((block) => block.blockId === "suppliers_procurement")?.status, "locked");
});
