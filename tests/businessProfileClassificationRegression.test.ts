import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";
import { localizeBusinessProfileValue } from "../src/lib/i18n/businessProfileLabels.ts";

const retailLeakage = [
  "retail_goods_store",
  "children_clothing_store",
  "retail_sales",
  "inventory_turnover",
  "size_mix",
  "unsold_inventory"
];

function assertAtelierServiceProfile(profile: ReturnType<typeof classifyBusiness>) {
  assert.equal(profile.category, "services");
  assert.equal(profile.subcategory, "tailoring_alteration");
  assert.equal(profile.businessModel, "tailoring_repair_service");
  assert.equal(profile.providesServices, true);
  assert.equal(profile.sellsGoods, false);
  assert.equal(profile.producesGoods, false);
  assert.ok(profile.excludedInterviewBlocks.includes("retail_sku"));
  assert.ok(profile.keyRevenueDrivers.includes("orders_per_month"));
  assert.ok(profile.keyCostDrivers.includes("sewing_equipment"));
  assert.ok(profile.keyCostDrivers.includes("consumables"));
  const serialized = JSON.stringify(profile);
  for (const term of retailLeakage) assert.doesNotMatch(serialized, new RegExp(term, "i"));
}

test("sample atelier uses canonical service profile and not retail clothing shop", () => {
  const profile = classifyBusiness({
    businessType: "Ателье по ремонту одежды",
    businessIdea: "ремонт, подгонка, подшив, замена молний, примерки, срочные заказы"
  });
  assertAtelierServiceProfile(profile);
  assert.equal(localizeBusinessProfileValue(profile.category, "ru", { failOnUnknown: true }), "Услуги");
  assert.equal(localizeBusinessProfileValue(profile.subcategory, "ru", { failOnUnknown: true }), "Ремонт и подгонка одежды");
  assert.equal(localizeBusinessProfileValue(profile.businessModel, "ru", { failOnUnknown: true }), "Сервис ремонта и подгонки одежды");
});

test("generic atelier with clothing repair keywords is classified as service", () => {
  const profile = classifyBusiness({
    businessType: "Ателье",
    businessIdea: "ремонт и подгонка одежды, подшив брюк, замена молний"
  });
  assertAtelierServiceProfile(profile);
});

test("true clothing shop remains retail", () => {
  const profile = classifyBusiness({
    businessType: "Магазин одежды",
    businessIdea: "продажа одежды, склад, ассортимент, размерный ряд, поставщики одежды, остатки товара"
  });
  assert.equal(profile.category, "retail");
  assert.notEqual(profile.subcategory, "tailoring_alteration");
  assert.equal(profile.sellsGoods, true);
  assert.equal(profile.providesServices, false);
});

test("mobile clothing repair and tailoring service is service/mobile, not generic technical repair", () => {
  const profile = classifyBusiness({
    businessType: "Мобильное ателье",
    businessIdea: "выездной ремонт одежды, подгонка одежды на дому, подшив и примерки"
  });
  assertAtelierServiceProfile(profile);
  assert.equal(profile.operationalModel, "mobile_service");
  assert.equal(profile.usesMobileService, true);
  assert.notEqual(profile.subcategory, "mobile_technical_service");
});
