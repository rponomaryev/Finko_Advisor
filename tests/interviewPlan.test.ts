import test from "node:test";
import assert from "node:assert/strict";
import { getStableQuestions } from "../src/lib/services/interviewService.ts";
import { mergeStructuredData } from "../src/lib/utils/structuredDataPatch.ts";
import type { StructuredProjectData } from "../src/lib/types/project.ts";

const baseProfile: StructuredProjectData = {
  userLanguage: "ru",
  businessType: "Кофейня",
  businessIdea: "Кофейня у университета",
  region: "Ташкент город",
  productOrService: "Кофе и десерты навынос",
  premisesStatus: "rent",
  equipmentCondition: "new"
};

test("stable interview plan returns the same question set for a repeated block open", () => {
  const first = getStableQuestions(baseProfile, "equipment_launch");
  assert.ok(first.planPatch?.interviewPlan?.blocks.equipment_launch);

  const profileWithPlan = mergeStructuredData(baseProfile, first.planPatch as Record<string, unknown>);
  const second = getStableQuestions(profileWithPlan, "equipment_launch");

  assert.equal(second.planPatch, undefined);
  assert.deepEqual(second.response.questions, first.response.questions);
});

test("persisted question set is reused when reopening a previous block", () => {
  const firstBusinessBlock = getStableQuestions(baseProfile, "business_idea");
  const withBusinessPlan = mergeStructuredData(baseProfile, firstBusinessBlock.planPatch as Record<string, unknown>);
  const equipmentBlock = getStableQuestions(withBusinessPlan, "equipment_launch");
  const withBothPlans = mergeStructuredData(withBusinessPlan, equipmentBlock.planPatch as Record<string, unknown>);
  const reopenedBusinessBlock = getStableQuestions(withBothPlans, "business_idea");

  assert.deepEqual(reopenedBusinessBlock.response.questions, firstBusinessBlock.response.questions);
});

test("deep merge preserves section notes and interview plan blocks", () => {
  const current: StructuredProjectData = {
    sectionNotes: { businessIdea: "A" },
    interviewPlan: {
      version: "1.0",
      generatedAt: "2026-01-01T00:00:00.000Z",
      blocks: {
        business_idea: {
          blockId: "business_idea",
          generatedBy: "template",
          generatedAt: "2026-01-01T00:00:00.000Z",
          questions: [
            { key: "businessIdea", label: "Idea", question: "Idea?", type: "textarea" }
          ],
          requiredQuestionKeys: ["businessIdea"],
          optionalQuestionKeys: []
        }
      }
    },
    completedBlockIds: ["business_idea"]
  };

  const next = mergeStructuredData(current, {
    sectionNotes: { equipment: "B" },
    interviewPlan: {
      version: "1.0",
      generatedAt: "2026-01-01T00:00:00.000Z",
      blocks: {
        equipment_launch: {
          blockId: "equipment_launch",
          generatedBy: "template",
          generatedAt: "2026-01-01T00:00:00.000Z",
          questions: [
            { key: "equipmentCondition", label: "Equipment", question: "Equipment?", type: "select" }
          ],
          requiredQuestionKeys: ["equipmentCondition"],
          optionalQuestionKeys: []
        }
      }
    },
    completedBlockIds: ["equipment_launch"]
  });

  assert.equal(next.sectionNotes?.businessIdea, "A");
  assert.equal(next.sectionNotes?.equipment, "B");
  assert.ok(next.interviewPlan?.blocks.business_idea);
  assert.ok(next.interviewPlan?.blocks.equipment_launch);
  assert.deepEqual(next.completedBlockIds, ["business_idea", "equipment_launch"]);
});

test("persisted finance block reveals credit and collateral follow-up questions after credit is selected", () => {
  const financeStart: StructuredProjectData = {
    userLanguage: "ru",
    businessType: "Ветеринарная клиника",
    businessIdea: "Ветклиника с приемом и выездом",
    region: "Ферганская область",
    productOrService: "Ветеринарные услуги",
    premisesStatus: "rent",
    equipmentCondition: "new",
    monthlyCapacity: 420,
    averagePrice: 95000,
    targetCustomers: ["retail", "instagram"],
    rawMaterialSource: "mixed",
    staffPlan: {
      roles: [{ role: "Ветеринар", count: 2, monthlySalaryAmount: 7500000, monthlySalaryCurrency: "UZS" }]
    },
    ownContributionAmount: 130000000,
    ownContributionCurrency: "UZS"
  };

  const first = getStableQuestions(financeStart, "financing");
  const withPlan = mergeStructuredData(financeStart, first.planPatch as Record<string, unknown>);
  assert.ok(first.response.questions.some((question) => question.key === "requestedLoanAmount"));
  assert.ok(!first.response.requiredVisibleQuestions?.some((question) => question.key === "requestedLoanAmount"));

  const withCredit = mergeStructuredData(withPlan, { creditNeeded: "yes", collateralAvailable: true });
  const reopened = getStableQuestions(withCredit, "financing");
  const keys = reopened.response.questions.map((question) => question.key);

  assert.ok(keys.includes("requestedLoanAmount"));
  assert.ok(keys.includes("requestedLoanCurrency"));
  assert.ok(keys.includes("loanTermMonths"));
  assert.ok(keys.includes("loanAnnualRatePct"));
  assert.ok(keys.includes("loanRepaymentType"));
  assert.ok(keys.includes("loanPurpose"));
  assert.ok(keys.includes("collateralType"));
  assert.equal(reopened.response.canAdvance, true);
});
