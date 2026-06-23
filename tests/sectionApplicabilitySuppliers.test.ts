import test from "node:test";
import assert from "node:assert/strict";
import { calculateInterviewProgress } from "../src/lib/interview/interviewProgress.ts";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import type { StructuredProjectData } from "../src/lib/types/project.ts";

function scenario(businessType: string, overrides: Record<string, unknown> = {}): StructuredProjectData & Record<string, unknown> {
  return {
    userLanguage: "ru",
    businessType,
    businessIdea: `${businessType} в Ташкенте`,
    region: "Ташкент город",
    district: "Юнусабад",
    creditNeeded: "no",
    ownContributionAmount: 100_000_000,
    ownContributionCurrency: "UZS",
    ...overrides
  } as StructuredProjectData & Record<string, unknown>;
}

const applicable = [
  "Автосервис / СТО",
  "Шиномонтаж",
  "Ремонт телефонов",
  "Кофейня",
  "Пекарня",
  "Салон красоты",
  "Мебельная мастерская"
];

for (const businessType of applicable) {
  test(`suppliers/procurement is applicable for ${businessType}`, () => {
    const data = scenario(businessType);
    const template = resolveTemplateForData(data);
    const suppliers = template.interviewBlocks.find((block) => block.id === "suppliers_procurement");
    assert.ok(suppliers, template.interviewBlocks.map((block) => block.id).join(", "));
    assert.ok(suppliers.questions.length > 0);
    const progress = calculateInterviewProgress({ data, template, currentBlockId: "suppliers_procurement", locale: "ru" });
    const metric = progress.blocks.find((block) => block.blockId === "suppliers_procurement");
    assert.notEqual(metric?.status, "not_applicable");
  });
}

for (const businessType of ["SMM-агентство", "Юридические услуги", "Бухгалтерская фирма"]) {
  test(`suppliers/procurement is not falsely required as inventory block for pure professional service: ${businessType}`, () => {
    const data = scenario(businessType);
    const template = resolveTemplateForData(data);
    const suppliers = template.interviewBlocks.find((block) => block.id === "suppliers_procurement");
    if (!suppliers) return;
    assert.ok(suppliers.questions.every((question) => !/товарные остатки|сырье для производства/i.test(`${question.label} ${question.question}`)));
  });
}
