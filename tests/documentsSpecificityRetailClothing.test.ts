import test from "node:test";
import assert from "node:assert/strict";
import { getDocumentRequirements } from "../src/lib/compliance/documentsRegistry.ts";
import { childrenClothingProfile } from "./helpers/systemicFixtures.ts";

test("children clothing documents are retail-specific and deduplicated", () => {
  const docs = getDocumentRequirements(childrenClothingProfile());
  const titles = docs.map((doc) => doc.title);
  const text = docs.map((doc) => `${doc.title} ${doc.reportText} ${doc.note_ru ?? ""}`).join("\n");
  assert.ok(titles.includes("Регистрация ИП или ООО"));
  assert.ok(titles.includes("Онлайн-касса / фискальный модуль / POS"));
  assert.ok(titles.includes("Товарные накладные и документы поставщика"));
  assert.ok(titles.includes("Правила обмена и возврата для розничной торговли"));
  assert.ok(titles.includes("Пожарная безопасность, электрика и эвакуация"));
  assert.equal(titles.filter((title) => /Регистрация ИП$|Регистрация ООО$|Регистрация бизнеса$/.test(title)).length, 0);
  assert.doesNotMatch(text, /обычных сервисных услуг|Специальная лицензия/i);
  assert.equal(new Set(titles).size, titles.length);
});
