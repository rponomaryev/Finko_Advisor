import assert from "node:assert/strict";
import test from "node:test";
import { businessSamples } from "../src/lib/data/businessSamples/businessSamples.ts";
import { approvedInterviewBlocks } from "../src/lib/business/businessClassifier.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { hasSampleSpecificSeed, sampleSpecificSeedCount } from "../src/lib/interview/sampleSpecificQuestionLibrary.ts";

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .replace(/\b(какая|какие|какой|сколько|будет|будут|нужно|нужны|для|под|по|как|what|which|how|will|is|are|the|and|for)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function removeSampleNames(value: string, sample: (typeof businessSamples)[number]) {
  let result = value;
  for (const phrase of [sample.label.ru, sample.label.en, sample.label.uz, ...sample.aliases]) {
    if (!phrase) continue;
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "gi"), " ");
  }
  return result;
}

test("every one of the 120 samples has an explicit sample-specific question seed", () => {
  assert.equal(sampleSpecificSeedCount(), businessSamples.length);
  for (const sample of businessSamples) {
    assert.equal(hasSampleSpecificSeed(sample.id), true, `Missing sample-specific seed for ${sample.id}`);
  }
});

test("sample-specific questions are unique after removing business names and keep approved block metadata", () => {
  const allowedBlocks = new Set<string>(approvedInterviewBlocks);
  const normalizedSets = new Map<string, string[]>();

  for (const sample of businessSamples) {
    const template = buildDynamicInterviewTemplate({
      businessType: sample.label.ru,
      businessIdea: "Тестовая идея содержит кафе, магазин, склад и онлайн как шум, но sample должен победить.",
      region: "Ташкент",
      userLanguage: "ru"
    });
    const sampleQuestions = template.interviewBlocks.flatMap((block) =>
      block.questions
        .filter((question) => question.key.startsWith(`sample_${sample.id}_`))
        .map((question) => ({ ...question, blockId: block.id }))
    );

    assert.ok(sampleQuestions.length >= 24, `${sample.id}: expected at least 24 sample-specific questions, got ${sampleQuestions.length}`);

    for (const blockId of approvedInterviewBlocks) {
      const countInBlock = sampleQuestions.filter((question) => question.blockId === blockId).length;
      assert.ok(countInBlock >= 3, `${sample.id}: expected at least 3 sample-specific questions in ${blockId}, got ${countInBlock}`);
    }
    assert.equal(sampleQuestions.some((question) => ["sampleBusinessFit", "sampleLocationInfrastructure", "sampleEquipmentLaunch", "sampleOperationsQuality", "sampleProcurementUnitEconomics", "sampleMarketValidation", "sampleFinancingReadiness", "sampleDocumentsCompliance"].includes(question.key)), false, `${sample.id}: old generic overlay key leaked`);

    const normalizedUnique = new Set<string>();
    for (const question of sampleQuestions) {
      assert.ok(allowedBlocks.has(question.blockId ?? ""), `${sample.id}: invalid block ${question.blockId}`);
      assert.ok(question.localizedCopy?.ru?.question, `${sample.id}: missing ru localizedCopy for ${question.key}`);
      assert.ok(question.localizedCopy?.en?.question, `${sample.id}: missing en localizedCopy for ${question.key}`);
      assert.ok(question.localizedCopy?.uz?.question, `${sample.id}: missing uz localizedCopy for ${question.key}`);
      assert.ok(question.semanticGroup?.startsWith(`sample_specific_${sample.id}_`), `${sample.id}: missing sample semanticGroup for ${question.key}`);
      assert.ok(Array.isArray(question.affects) && question.affects.length > 0, `${sample.id}: missing affects for ${question.key}`);
      assert.doesNotMatch(question.question, /Для «|для «|что нужно для запуска|What is required to launch|For “|for “/i, `${sample.id}: templated overlay text is not allowed`);
      assert.doesNotMatch(question.question, /формируют предложение по|для выполнения .*бригады|по уборка квартир/i, `${sample.id}: awkward seed-dump wording leaked`);
      normalizedUnique.add(normalize(removeSampleNames(`${question.label} ${question.question}`, sample)));
    }
    assert.ok(normalizedUnique.size >= 6, `${sample.id}: expected at least 6 unique sample-specific questions after removing business name, got ${normalizedUnique.size}`);

    const signature = [...normalizedUnique].sort().join(" || ");
    normalizedSets.set(signature, [...(normalizedSets.get(signature) ?? []), sample.id]);
  }

  const duplicateLargeGroups = [...normalizedSets.values()].filter((ids) => ids.length >= 3);
  assert.deepEqual(duplicateLargeGroups, [], `Large groups of samples share identical normalized question sets: ${JSON.stringify(duplicateLargeGroups)}`);
});
