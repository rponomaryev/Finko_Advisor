import test from "node:test";
import assert from "node:assert/strict";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { businessSamples } from "../src/lib/data/businessSamples/businessSamples.ts";
import { translateQuestion } from "../src/lib/i18n/interviewLabels.ts";

const scenarios = [
  { businessType: "Мобильный груминг животных", businessIdea: "Выездной груминг собак и кошек" },
  { businessType: "Аренда строительного инструмента", businessIdea: "Прокат инструмента с залогом и доставкой" },
  { businessType: "Автомойка", businessIdea: "Ручная автомойка с водой, сливом и фильтрацией" }
];

const stopWords = new Set([
  "проект", "проекта", "бизнес", "направление", "укажите", "какие", "какой", "какая", "какое", "кто", "почему", "как", "для", "под", "или", "и", "в", "на", "по", "с", "со", "вы", "будете", "будет", "нужно", "нужна", "нужны", "есть", "основной", "данные", "детали"
]);

function removeSampleNames(value: string, sample: (typeof businessSamples)[number]) {
  let result = value;
  for (const phrase of [sample.label.ru, sample.label.en, sample.label.uz, ...sample.aliases]) {
    if (!phrase) continue;
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "gi"), " ");
  }
  return result;
}

function semanticTokens(value: string, sample: (typeof businessSamples)[number]) {
  const normalized = removeSampleNames(value, sample)
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[«»“”\"'`.,:;!?()\[\]{}\\/\-–—]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return new Set(normalized.split(" ").filter((token) => token.length > 2 && !stopWords.has(token)));
}

function jaccard(left: Set<string>, right: Set<string>) {
  if (left.size === 0 && right.size === 0) return 1;
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

test("questions are semantically deduplicated within every rendered block", () => {
  for (const data of scenarios) {
    const template = buildDynamicInterviewTemplate({ ...data, region: "Ташкент город" });
    for (const block of template.interviewBlocks) {
      const groups = block.questions.map((q) => q.semanticGroup).filter(Boolean);
      assert.equal(groups.length, new Set(groups).size, `${template.code}/${block.id} repeats a semanticGroup`);
    }
    const allVisibleQuestionKeys = template.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key));
    for (const requiredKey of template.requiredInputs) assert.ok(allVisibleQuestionKeys.includes(requiredKey), `${template.code}: hidden required ${requiredKey}`);
  }
});

test("all 120 samples have zero semantic duplicate sample-specific questions inside each block", () => {
  const duplicateGroups: string[] = [];

  for (const sample of businessSamples) {
    const template = buildDynamicInterviewTemplate({
      businessType: sample.label.ru,
      businessIdea: "Проверка смысловых дублей в sample-specific вопросах.",
      region: "Ташкент город",
      userLanguage: "ru"
    });

    for (const block of template.interviewBlocks) {
      const questions = block.questions
        .filter((question) => question.key.startsWith(`sample_${sample.id}_`))
        .map((question) => translateQuestion("ru", question));

      for (let i = 0; i < questions.length; i += 1) {
        for (let j = i + 1; j < questions.length; j += 1) {
          const firstTokens = semanticTokens(questions[i].question, sample);
          const secondTokens = semanticTokens(questions[j].question, sample);
          const similarity = jaccard(firstTokens, secondTokens);
          if (similarity >= 0.82) {
            duplicateGroups.push(`${sample.id}/${block.id}: ${questions[i].label} <-> ${questions[j].label} (${similarity.toFixed(2)})`);
          }
        }
      }
    }
  }

  assert.deepEqual(duplicateGroups, [], `semantic duplicate groups = ${duplicateGroups.length}: ${duplicateGroups.slice(0, 20).join("; ")}`);
});
