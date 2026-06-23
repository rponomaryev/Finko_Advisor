import test from "node:test";
import assert from "node:assert/strict";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import { childrenClothingProfile, genericProfile } from "./helpers/systemicFixtures.ts";

function normalized(text: string) {
  return text.toLowerCase().replace(/[.,:;!?()]/g, " ").replace(/\s+/g, " ").trim();
}

test("generated interview questions are semantically distinct inside each block", () => {
  const scenarios = [
    childrenClothingProfile(),
    genericProfile({ businessType: "Сервис ремонта кофемашин", category: "services" }),
    genericProfile({ businessType: "Аренда строительных инструментов", category: "rental" })
  ];
  for (const profile of scenarios) {
    const template = resolveTemplateForData(profile);
    for (const block of template.interviewBlocks) {
      const labels = block.questions.map((q: any) => normalized(`${q.label} ${q.description ?? ""}`)).filter(Boolean);
      assert.equal(new Set(labels).size, labels.length, `${profile.businessType} / ${block.id}`);
      const answersByKey = new Map(block.questions.map((q: any) => [q.key, q.label]));
      assert.equal(answersByKey.size, block.questions.length, `${profile.businessType} / duplicate question keys in ${block.id}`);
    }
  }
});
