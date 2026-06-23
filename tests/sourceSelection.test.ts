import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";
import { selectSourcesForBusiness } from "../src/lib/data/sourceRegistry.ts";

test("cleaning source selection does not select auto-service-only sources", () => {
  const profile = classifyBusiness({
    businessType: "Клининговые услуги",
    businessIdea: "Уборка квартир, офисов и коммерческих помещений в Ташкенте",
    region: "Ташкент город"
  });
  const sources = selectSourcesForBusiness(profile.subcategory ?? profile.category, profile.recommendedSourceCategories, 20);

  assert.equal(profile.subcategory, "cleaning_service");
  assert.equal(sources.some((source) => source.applicableCategories.includes("auto_service") && !source.applicableCategories.includes("cleaning_service")), false);
});
