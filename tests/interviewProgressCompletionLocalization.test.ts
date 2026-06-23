import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateInterviewProgress,
  calculateScreenProgress,
  getBlockProgressStatusLabel,
  progressText
} from "../src/lib/interview/interviewProgress.ts";
import type { InterviewBlock, InterviewQuestion, StructuredProjectData } from "../src/lib/types/project.ts";
import type { SectorTemplate } from "../src/lib/types/sector.ts";

function q(key: string, blockId: string, extra: Partial<InterviewQuestion> = {}): InterviewQuestion {
  return {
    key,
    blockId,
    label: key,
    question: `Question ${key}`,
    type: "text",
    ...extra
  };
}

const blocks: InterviewBlock[] = [
  { id: "business_idea", name: "Бизнес-идея", description: "", questions: [q("businessType", "business_idea"), q("businessIdea", "business_idea")] },
  { id: "location", name: "Помещение и локация", description: "", questions: [q("locRequired1", "location", { type: "select", options: ["rent", "owned"] }), q("locRequired2", "location"), q("locRequired3", "location", { type: "number" }), q("locRequired4", "location", { type: "boolean" }), q("locRequired5", "location", { type: "number" }), q("locRequired6", "location", { type: "textarea" })] },
  { id: "equipment_launch", name: "Оборудование и запуск", description: "", questions: [q("equipmentList", "equipment_launch")] },
  { id: "operations", name: "Операционная модель", description: "", questions: [q("staffPlan", "operations", { type: "staffPlan" })] },
  { id: "suppliers_procurement", name: "Поставщики и закупки", description: "", questions: [q("supplierSelected", "suppliers_procurement", { type: "boolean" })] },
  { id: "sales", name: "Продажи", description: "", questions: [q("dailyCovers", "sales", { type: "number" })] },
  { id: "financing", name: "Финансирование", description: "", questions: [q("creditNeeded", "financing", { type: "select", options: ["yes", "no"] })] },
  { id: "documents_experience", name: "Документы и опыт", description: "", questions: [q("experienceLevel", "documents_experience")] }
];

const template = {
  code: "progress_test",
  name: "Progress test",
  businessType: "Progress test",
  description: "",
  assumptions: {},
  requiredInputs: [],
  mainEquipment: [],
  mainRawMaterials: [],
  mainRisks: [],
  riskRules: {},
  scoringRules: {},
  interviewBlocks: blocks
} as unknown as SectorTemplate;

test("current newly opened block is not automatically completed", () => {
  const data: StructuredProjectData = {
    userLanguage: "ru",
    businessType: "Мини-пекарня",
    businessIdea: "Пекарня у дома",
    completedBlockIds: ["business_idea"],
    interviewCursorBlockId: "location"
  };
  const progress = calculateInterviewProgress({ data, template, currentBlockId: "location", locale: "ru" });
  const businessIdea = progress.blocks.find((block) => block.blockId === "business_idea");
  const location = progress.blocks.find((block) => block.blockId === "location");
  assert.equal(businessIdea?.pct, 100);
  assert.equal(businessIdea?.status, "filled");
  assert.equal(location?.pct, 0);
  assert.equal(location?.status, "not_started");
  assert.equal(location?.label, "Не начат");
  assert.equal(progress.project.pct, 13);
  assert.notEqual(progress.project.pct, 73);
});

test("saved incomplete block remains in progress and is not fully completed", () => {
  const data = {
    userLanguage: "ru",
    businessType: "Мини-пекарня",
    businessIdea: "Пекарня у дома",
    locRequired1: "rent",
    locRequired2: "Поток жителей рядом",
    locRequired3: 10_000_000,
    completedBlockIds: ["business_idea", "location"],
    interviewCursorBlockId: "location"
  } as unknown as StructuredProjectData;
  const progress = calculateInterviewProgress({ data, template, currentBlockId: "location", locale: "ru" });
  const location = progress.blocks.find((block) => block.blockId === "location");
  assert.equal(location?.required, 6);
  assert.equal(location?.answered, 3);
  assert.equal(location?.pct, 50);
  assert.equal(location?.status, "in_progress");
  assert.notEqual(location?.label, "Заполнен");
  assert.match(progressText("ru").requiredAnsweredCount(location!.answered, location!.required), /Заполнено 3 из 6 обязательных вопросов/);
});

test("locked future blocks contribute zero to whole project completion", () => {
  const data: StructuredProjectData = {
    userLanguage: "ru",
    businessType: "Мини-пекарня",
    businessIdea: "Пекарня у дома",
    completedBlockIds: ["business_idea"],
    interviewCursorBlockId: "location"
  };
  const progress = calculateInterviewProgress({ data, template, currentBlockId: "location", locale: "ru" });
  assert.equal(progress.blocks.find((block) => block.blockId === "equipment_launch")?.status, "locked");
  assert.equal(progress.blocks.find((block) => block.blockId === "equipment_launch")?.pct, 0);
  assert.equal(progress.project.pct, 13);
});

test("dropdown placeholder/default absence is not counted as an answer", () => {
  const selectQuestion = q("premisesStatus", "location", { type: "select", options: ["rent", "owned"] });
  const empty = calculateScreenProgress({ questions: [selectQuestion], data: {}, requiredQuestionKeys: ["premisesStatus"] });
  const answered = calculateScreenProgress({ questions: [selectQuestion], data: { premisesStatus: "rent" }, requiredQuestionKeys: ["premisesStatus"] });
  assert.equal(empty.pct, 0);
  assert.equal(empty.missing, 1);
  assert.equal(answered.pct, 100);
});

test("optional fields do not block 100% and hidden required questions are excluded", () => {
  const questions = [
    q("visibleRequired", "sales"),
    q("optionalNote", "sales", { optional: true }),
    q("hiddenRequired", "sales", { showIf: { creditNeeded: "yes" } })
  ];
  const progress = calculateScreenProgress({ questions, data: { visibleRequired: "yes", creditNeeded: "no" } as unknown as StructuredProjectData });
  assert.equal(progress.required, 1);
  assert.equal(progress.answered, 1);
  assert.equal(progress.pct, 100);
});

test("progress status and save texts are localized without raw enum values", () => {
  assert.equal(getBlockProgressStatusLabel("not_started", "ru"), "Не начат");
  assert.equal(getBlockProgressStatusLabel("in_progress", "ru"), "В процессе");
  assert.equal(getBlockProgressStatusLabel("filled", "ru"), "Заполнен");
  assert.equal(getBlockProgressStatusLabel("locked", "ru"), "Заблокирован");
  assert.equal(getBlockProgressStatusLabel("needs_review", "ru"), "Требует проверки");
  assert.equal(getBlockProgressStatusLabel("not_started", "uz"), "Boshlanmagan");
  assert.equal(getBlockProgressStatusLabel("in_progress", "uz"), "Jarayonda");
  assert.equal(getBlockProgressStatusLabel("filled", "uz"), "To‘ldirilgan");
  assert.equal(getBlockProgressStatusLabel("locked", "uz"), "Bloklangan");
  assert.equal(getBlockProgressStatusLabel("needs_review", "uz"), "Tekshirish kerak");
  assert.equal(getBlockProgressStatusLabel("not_started", "en"), "Not started");
  assert.equal(getBlockProgressStatusLabel("in_progress", "en"), "In progress");
  assert.equal(getBlockProgressStatusLabel("filled", "en"), "Completed");
  assert.equal(getBlockProgressStatusLabel("locked", "en"), "Locked");
  assert.equal(getBlockProgressStatusLabel("needs_review", "en"), "Needs review");

  const ruText = Object.values(progressText("ru")).filter((value) => typeof value === "string").join(" ");
  const uzText = Object.values(progressText("uz")).filter((value) => typeof value === "string").join(" ");
  const enText = Object.values(progressText("en")).filter((value) => typeof value === "string").join(" ");
  assert.doesNotMatch(ruText, /completed|in_progress|locked|needs_review|Not started|Completed|Bloklangan/);
  assert.doesNotMatch(uzText, /Не начат|Заполнен|Заблокирован|completed|in_progress|needs_review/);
  assert.doesNotMatch(enText, /Не начат|Заполнен|Заблокирован|Boshlanmagan|To‘ldirilgan|Bloklangan/);
});
