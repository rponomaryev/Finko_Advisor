import test from "node:test";
import assert from "node:assert/strict";
import { formatLocation, normalizeLocation, resolveTashkentDistrictName } from "../src/lib/location/locationNormalizer.ts";

const districts = [
  { ru: "Алмазар", uz: "Olmazor", en: "Almazar", variants: ["Алмазар район", "Olmazor tumani", "Almazar district"] },
  { ru: "Бектемир", uz: "Bektemir", en: "Bektemir", variants: ["Бектемир р-н", "Bektemir tumani", "Bektemir district"] },
  { ru: "Чиланзар", uz: "Chilonzor", en: "Chilanzar", variants: ["Чиланзар район", "Chilonzor tumani", "Chilanzar district"] },
  { ru: "Мирабад", uz: "Mirobod", en: "Mirabad", variants: ["Мирабад", "Mirobod tumani", "Mirabad district"] },
  { ru: "Мирзо-Улугбек", uz: "Mirzo Ulug'bek", en: "Mirzo Ulugbek", variants: ["Мирзо-Улугбек район", "Mirzo Ulug‘bek tumani", "Mirzo-Ulugbek district"] },
  { ru: "Сергели", uz: "Sergeli", en: "Sergeli", variants: ["Сергели", "Sergeli tumani", "Sergeli district"] },
  { ru: "Шайхантахур", uz: "Shayxontohur", en: "Shaykhantahur", variants: ["Шайхантахур район", "Shayxontohur tumani", "Shaykhantahur district", "Shayhontohur tumani"] },
  { ru: "Учтепа", uz: "Uchtepa", en: "Uchtepa", variants: ["Учтепа", "Uchtepa tumani", "Uchtepa district"] },
  { ru: "Яккасарай", uz: "Yakkasaroy", en: "Yakkasaray", variants: ["Яккасарай", "Yakkasaroy tumani", "Yakkasaray district"] },
  { ru: "Янгихаёт", uz: "Yangihayot", en: "Yangikhayot", variants: ["Янгихаёт", "Yangihayot tumani", "Yangikhayot district"] },
  { ru: "Яшнабад", uz: "Yashnobod", en: "Yashnabad", variants: ["Яшнабад", "Yashnobod tumani", "Yashnabad district"] },
  { ru: "Юнусабад", uz: "Yunusobod", en: "Yunusabad", variants: ["Юнусабад район", "Yunusobod tumani", "Yunusabad district"] }
];

test("all Tashkent city districts normalize to Tashkent city across RU/UZ/EN aliases", () => {
  for (const district of districts) {
    for (const alias of [district.ru, district.uz, district.en, ...district.variants]) {
      const location = normalizeLocation({ region: "Ташкент", district: alias });
      assert.equal(location.regionCode, "tashkent_city", alias);
      assert.equal(location.regionName, "Ташкент город", alias);
      assert.equal(location.districtName, district.ru, alias);
      assert.equal(resolveTashkentDistrictName(alias, "ru"), district.ru, alias);
      assert.equal(resolveTashkentDistrictName(alias, "uz"), district.uz, alias);
      assert.equal(resolveTashkentDistrictName(alias, "en"), district.en, alias);
    }
  }
});

test("Tashkent city district formatting is localized and does not become Tashkent region", () => {
  assert.equal(formatLocation({ region: "Toshkent shahri", district: "Chilonzor" }, "uz"), "Toshkent shahri, Chilonzor tumani");
  assert.equal(formatLocation({ region: "Tashkent city", district: "Chilanzar" }, "en"), "Tashkent city, Chilanzar district");
  assert.equal(formatLocation({ region: "Ташкент", district: "Чиланзар" }, "ru"), "Ташкент, Чиланзар");
});

test("Tashkent region with Chirchiq remains region, not city", () => {
  const location = normalizeLocation({ region: "Ташкентская область", district: "Чирчик" });
  assert.equal(location.regionCode, "tashkent_region");
  assert.equal(location.regionName, "Ташкентская область");
  assert.equal(location.districtName, "Чирчик");
  assert.equal(formatLocation(location, "en"), "Tashkent region, Чирчик");
});
