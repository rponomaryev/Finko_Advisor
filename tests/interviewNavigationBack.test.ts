import test from "node:test";
import assert from "node:assert/strict";
import { getNextFallbackQuestions } from "../src/lib/ai/fallbackInterview.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import type { InterviewBlockReviewStatus, StructuredProjectData } from "../src/lib/types/project.ts";

function markDownstreamNeedsReview(data: StructuredProjectData, changedBlockId: string): InterviewBlockReviewStatus[] {
  const template = buildDynamicInterviewTemplate(data);
  const changedIndex = template.interviewBlocks.findIndex((block) => block.id === changedBlockId);
  const completed = new Set(data.completedBlockIds ?? []);
  return template.interviewBlocks.slice(changedIndex + 1)
    .filter((block) => completed.has(block.id))
    .map((block) => ({ blockId: block.id, status: "needs_review" as const, reason: "Изменился формат бизнеса, часть вопросов могла стать нерелевантной." }));
}

test("completed previous block remains accessible while future blocks stay locked", () => {
  const data: StructuredProjectData = {
    businessType: "Автосервис",
    businessIdea: "Отдельный автосервис",
    region: "Ташкент",
    autoServiceFormat: "standalone_service",
    productOrService: "Ремонт авто",
    completedBlockIds: ["business_idea"],
    interviewCursorBlockId: "sales"
  } as StructuredProjectData;
  const response = getNextFallbackQuestions(data, { blockId: "sales", includeAnswered: true });
  const statuses = new Map(response.blockStatuses.map((item: any) => [item.blockId, item.status]));

  assert.equal(statuses.get("business_idea"), "completed");
  assert.equal(statuses.get("sales"), "current");
  assert.equal(statuses.get("equipment_launch"), "locked");
  assert.equal(statuses.get("operations"), "locked");
  assert.equal(statuses.get("financing"), "locked");
});

test("changing business format marks completed downstream blocks as needs_review", () => {
  const edited: StructuredProjectData = {
    businessType: "Автосервис",
    businessIdea: "Один бокс внутри большого автосервиса",
    region: "Ташкент",
    autoServiceFormat: "one_box_inside_large_service",
    completedBlockIds: ["business_idea", "sales"]
  } as StructuredProjectData;
  const reviews = markDownstreamNeedsReview(edited, "business_idea");
  assert.deepEqual(reviews.map((item) => item.blockId), ["sales"]);
  assert.equal(reviews[0].status, "needs_review");
});
