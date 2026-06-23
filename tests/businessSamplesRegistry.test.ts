import assert from "node:assert/strict";
import test from "node:test";
import { businessSamples } from "../src/lib/data/businessSamples/businessSamples.ts";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";
import { hasBusinessProfileLabel } from "../src/lib/i18n/businessProfileLabels.ts";

test("business sample registry contains 120 ordinary Uzbekistan business samples", () => {
  assert.equal(businessSamples.length, 120);
  assert.equal(new Set(businessSamples.map((sample) => sample.id)).size, 120);
  assert.ok(businessSamples.every((sample) => sample.aliases.length >= 1));
});

test("sample registry classifies computer club without falling to generic", () => {
  const profile = classifyBusiness({
    businessType: "компьютерный клуб и игровая зона",
    businessIdea: "Почасовая аренда игровых компьютеров, PlayStation-зона, турниры, напитки и снеки."
  });
  assert.equal(profile.category, "entertainment");
  assert.equal(profile.subcategory, "computer_club");
  assert.ok(profile.confidence >= 0.8);
  assert.notEqual(profile.businessModel, "generic");
  assert.ok(profile.rentsAssets);
  assert.ok(profile.hasEquipment);
});

test("sample registry classifies shoe repair and key duplication as service samples", () => {
  const profile = classifyBusiness({
    businessType: "мастерская по ремонту обуви и изготовлению ключей",
    businessIdea: "Ремонт обуви, замена подошвы, набойки, дубликаты ключей и продажа средств ухода."
  });
  assert.equal(profile.category, "services");
  assert.equal(profile.subcategory, "shoe_repair_workshop");
  assert.ok(profile.providesServices);
  assert.ok(profile.hasEquipment);
  assert.ok(profile.hasInventory);
});

test("unknown businesses still require dynamic AI classification instead of sample lock-in", () => {
  const profile = classifyBusiness({
    businessType: "мастерская по изготовлению кастомных аквариумных декораций",
    businessIdea: "Нестандартный бизнес, которого нет в sample registry."
  });
  assert.equal(profile._requiresAIClassification, true);
  assert.equal(profile.category, "generic");
});

test("sample profile technical values have localization labels", () => {
  for (const sample of businessSamples) {
    assert.ok(hasBusinessProfileLabel(sample.subcategory), `Missing label for ${sample.subcategory}`);
  }
});

test("business type sample registry has priority over description words", () => {
  const profile = classifyBusiness({
    businessType: "установка видеонаблюдения",
    businessIdea: "Планирую оказывать услуги по установке IP-камер и систем видеонаблюдения для магазинов, офисов, кафе, складов и частных домов.",
    region: "Ташкент город",
    language: "ru"
  });

  assert.equal(profile.category, "services");
  assert.equal(profile.subcategory, "cctv_installation");
  assert.equal((profile.aiClassification as { source?: string } | undefined)?.source, "business_type_sample_registry");
  assert.equal(profile.operationalModel, "mobile_service");
});

test("cctv morphology aliases match услуги видеонаблюдения without AI fallback", () => {
  const profile = classifyBusiness({
    businessType: "услуги видеонаблюдения",
    businessIdea: "Выездная установка камер для офисов и складов.",
    region: "Ташкент",
    language: "ru"
  });

  assert.equal(profile.category, "services");
  assert.equal(profile.subcategory, "cctv_installation");
  assert.equal((profile.aiClassification as { source?: string } | undefined)?.source, "business_type_sample_registry");
  assert.equal(profile._requiresAIClassification, false);
});
