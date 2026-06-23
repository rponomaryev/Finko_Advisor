import assert from "node:assert/strict";
import test from "node:test";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { translateQuestion } from "../src/lib/i18n/interviewLabels.ts";

const approvedBlocks = [
  "business_idea",
  "location",
  "equipment_launch",
  "operations",
  "suppliers_procurement",
  "sales",
  "financing",
  "documents_experience"
];

test("sample businesses receive real sample-specific questions inside the approved eight blocks", () => {
  const template = buildDynamicInterviewTemplate({
    businessType: "компьютерный клуб и игровая зона",
    businessIdea: "Почасовая аренда игровых компьютеров, PlayStation-зона, турниры и снеки.",
    region: "Ташкент город",
    userLanguage: "ru"
  });
  assert.equal(template.code, "entertainment_computer_club");
  assert.deepEqual(template.interviewBlocks.map((item) => item.id), approvedBlocks);
  for (const blockId of approvedBlocks) {
    const block = template.interviewBlocks.find((item) => item.id === blockId);
    assert.ok(block, `Missing block ${blockId}`);
    const blockQuestions = block.questions.filter((item) => item.key.startsWith(`sample_computer_club_${blockId}_`));
    assert.ok(blockQuestions.length >= 3, `Missing sample-specific questions for ${blockId}`);
    for (const question of blockQuestions) {
      assert.equal(question.blockId, blockId);
      assert.ok(question.localizedCopy?.ru?.question);
      assert.ok(question.localizedCopy?.en?.question);
      assert.ok(question.localizedCopy?.uz?.question);
      assert.ok(question.semanticGroup?.startsWith("sample_specific_computer_club_"));
      assert.ok(Array.isArray(question.affects) && question.affects.length >= 2);
      assert.ok(question.question.length <= 220);
      assert.ok((question.helpText ?? "").length <= 700);
    }
  }
  const sampleQuestions = template.interviewBlocks.flatMap((block) => block.questions.filter((question) => question.key.startsWith("sample_computer_club_")));
  assert.ok(sampleQuestions.length >= 24);
  assert.ok(sampleQuestions.some((question) => /игровые ПК|турниры|периферия|снеки/.test(`${question.question} ${question.helpText ?? ""}`)));
  assert.ok(sampleQuestions.every((question) => !/Для «|что нужно для запуска/i.test(question.question)));
});

test("sample-specific questions localize by selected interface language", () => {
  const template = buildDynamicInterviewTemplate({
    businessType: "Kompyuter klubi",
    businessIdea: "Gaming klub va PlayStation zona.",
    region: "Toshkent",
    userLanguage: "uz"
  });
  const question = template.interviewBlocks
    .find((item) => item.id === "sales")
    ?.questions.find((item) => item.key.startsWith("sample_computer_club_sales_"));
  assert.ok(question);
  const translated = translateQuestion("uz", question);
  assert.match(translated.question, /Kompyuter klubi/);
  assert.doesNotMatch(translated.question, /Компьютерный клуб|Demand validation|For /);
});

test("unknown businesses are not locked to samples and still get universal adaptive questions", () => {
  const template = buildDynamicInterviewTemplate({
    businessType: "мастерская по изготовлению кастомных аквариумных декораций",
    businessIdea: "Нестандартный бизнес, которого нет в sample registry.",
    region: "Ташкент город",
    userLanguage: "ru"
  });
  assert.match(template.code, /^generic_/);
  assert.deepEqual(template.interviewBlocks.map((item) => item.id), approvedBlocks);
  const keys = template.interviewBlocks.flatMap((item) => item.questions.map((question) => question.key));
  assert.ok(keys.includes("primaryRevenueSource"));
  assert.ok(keys.includes("otherDetails.researchPlan"));
  assert.equal(keys.some((key) => key.startsWith("sample_")), false);
});
