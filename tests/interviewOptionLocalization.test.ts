import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { findUnexpectedLatinTokens } from "../src/lib/i18n/userFacingSanitizer.ts";
import { getCanonicalEnumLabel, labelValue, missingCanonicalEnumLocales } from "../src/lib/utils/labels.ts";

function walk(dir: string, files: string[] = []): string[] {
  for (const item of readdirSync(dir)) {
    const path = join(dir, item);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, files);
    else if (/\.tsx?$/.test(path)) files.push(path);
  }
  return files;
}

function collectStaticOptions(): string[] {
  const ids = new Set<string>();
  for (const file of ["src/lib/interview", "src/lib/data/sectorTemplates", "src/lib/business"].flatMap((dir) => walk(dir))) {
    const source = readFileSync(file, "utf8");
    const callPattern = /(?:select|multi)\([^\n]*?\[([^\]]+)\]/gs;
    let match: RegExpExecArray | null;
    while ((match = callPattern.exec(source))) {
      for (const option of match[1].matchAll(/["']([A-Za-z0-9_.$-]+)["']/g)) {
        ids.add(option[1]);
      }
    }
  }
  return [...ids].sort();
}

test("dynamic option enum values are translated by the canonical dictionary", () => {
  const missing = collectStaticOptions()
    .map((value) => ({ value, locales: missingCanonicalEnumLocales(value) }))
    .filter((item) => item.locales.length > 0);
  assert.deepEqual(missing, []);
});

test("russian option labels are not raw ids or mechanical english fallbacks", () => {
  const leaks = collectStaticOptions()
    .map((value) => ({ value, label: getCanonicalEnumLabel(value, "ru") ?? labelValue(value, "ru") }))
    .filter((item) => (item.value.includes("_") && item.label === item.value) || findUnexpectedLatinTokens(item.label, "ru").length > 0);
  assert.deepEqual(leaks, []);
});

test("reported children clothing option labels are localized", () => {
  assert.equal(labelValue("everyday_clothing", "ru"), "Повседневная одежда");
  assert.equal(labelValue("outerwear", "ru"), "Верхняя одежда");
  assert.equal(labelValue("school_uniform", "ru"), "Школьная форма");
  assert.equal(labelValue("mall_point", "ru"), "Точка в ТЦ");
  assert.equal(labelValue("street_retail_rent", "ru"), "Аренда стрит-ритейла");
  assert.equal(labelValue("hybrid_offline_online", "ru"), "Офлайн + онлайн-продажи");
  assert.equal(labelValue("children_clothing_store", "ru"), "Магазин детской одежды");
});


test("reported residual enum warning keys are localized in all supported locales", () => {
  const expected = {
    car_shampoo: { ru: "Автошампунь", uz: "Avtoshampun", en: "Car shampoo" },
    interior_cleaner: { ru: "Средство для чистки салона", uz: "Salon tozalash vositasi", en: "Interior cleaner" },
    warranty_30_days: { ru: "Гарантия 30 дней", uz: "30 kunlik kafolat", en: "30-day warranty" },
    written_intake_act: { ru: "Письменный акт приёмки", uz: "Yozma qabul qilish dalolatnomasi", en: "Written intake act" },
    dscr_high_anomaly: { ru: "Аномально высокий DSCR", uz: "DSCR ko'rsatkichi noodatiy yuqori", en: "Abnormally high DSCR" }
  } as const;

  for (const [key, labels] of Object.entries(expected)) {
    assert.equal(labelValue(key, "ru"), labels.ru);
    assert.equal(labelValue(key, "uz"), labels.uz);
    assert.equal(labelValue(key, "en"), labels.en);
  }
});

test("missing enum translations fail during test runs instead of logging a warning", () => {
  assert.throws(
    () => labelValue("unlisted_test_enum_key", "ru"),
    /Missing enum translation for unlisted_test_enum_key \(ru\)/
  );
});
