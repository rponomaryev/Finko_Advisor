import test from "node:test";
import assert from "node:assert/strict";
import { getReportLocale } from "../src/lib/i18n/reportMessages.ts";

test("explicit export locale overrides stored project.userLanguage", () => {
  const project = { userLanguage: "en", structuredData: { userLanguage: "uz" }, reportData: { locale: "en" } };
  assert.equal(getReportLocale(project, "ru"), "ru");
  assert.equal(getReportLocale(project, "uz"), "uz");
  assert.equal(getReportLocale(project, "en"), "en");
});

test("export locale fallback order uses project, structuredData, reportData and ru default", () => {
  assert.equal(getReportLocale({ userLanguage: "uz" }), "uz");
  assert.equal(getReportLocale({ structuredData: { userLanguage: "en" } }), "en");
  assert.equal(getReportLocale({ reportData: { locale: "uz" } }), "uz");
  assert.equal(getReportLocale({}), "ru");
});
