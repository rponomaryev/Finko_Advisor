import test from "node:test";
import assert from "node:assert/strict";
import { getTranslations, normalizeLocale } from "../src/lib/i18n/index.ts";
import { getRegions } from "../src/lib/data/regions.ts";
import { labelValue } from "../src/lib/utils/labels.ts";
import { getGlossaryRows } from "../src/lib/report/glossary.ts";

test("i18n supports ru, uz latin and en", () => {
  assert.equal(normalizeLocale("uz"), "uz");
  assert.equal(normalizeLocale("en"), "en");
  assert.equal(normalizeLocale("xx"), "ru");
  assert.equal(getTranslations("ru").newProject.businessType, "Тип бизнеса / предприятия");
  assert.equal(getTranslations("uz").report.downloadPdf, "PDF yuklab olish");
  assert.equal(getTranslations("en").report.downloadExcel, "Download Excel");
  assert.equal(/[А-Яа-яЁё]/.test(getTranslations("uz").newProject.title), false);
});

test("regions are complete and localized", () => {
  assert.equal(getRegions("ru").length, 14);
  assert.equal(getRegions("uz").some((region) => region.label.includes("Toshkent shahri")), true);
  assert.equal(getRegions("en").some((region) => region.label.includes("Tashkent City")), true);
});


test("raw enum values are localized for UI and exports", () => {
  assert.equal(labelValue("calculated", "ru"), "Использовать расчетную выручку");
  assert.equal(labelValue("stable", "ru"), "Использовать указанную стабильную выручку");
  assert.equal(labelValue("financing_gap", "ru"), "Разрыв финансирования");
  assert.equal(labelValue("annuity", "ru"), "Аннуитетный метод");
  assert.equal(labelValue("equal_principal", "ru"), "Дифференцированный метод");
  assert.equal(labelValue("annuity", "en"), "Annuity method");
  assert.equal(labelValue("equal_principal", "en"), "Differentiated method");
  assert.equal(labelValue("yes", "en"), "Yes");
  assert.equal(labelValue("no", "uz"), "Yo'q");
  assert.equal(labelValue("store", "ru"), "Магазин / розничная точка");
  assert.equal(labelValue("device_repair", "ru"), "Сервис ремонта техники");
  assert.equal(labelValue("standalone_location", "ru"), "Отдельная точка");
  assert.equal(labelValue("device_repair", "uz"), "Texnika ta'mirlash servisi");
});

test("privacy, glossary and branding strings are localized", () => {
  assert.match(getTranslations("ru").privacy.lead, /МСБ \(малый и средний бизнес\)/);
  assert.ok(getGlossaryRows("ru").some((row) => row.term === "Дифференцированный метод"));
  assert.ok(getGlossaryRows("en").some((row) => row.term === "Currency snapshot"));

  const serializedTranslations = JSON.stringify([
    getTranslations("ru"),
    getTranslations("uz"),
    getTranslations("en")
  ]);
  const oldProductName = ["FINKO", "SME", "Business", "Advisor"].join(" ");
  assert.equal(serializedTranslations.includes(oldProductName), false);
});
