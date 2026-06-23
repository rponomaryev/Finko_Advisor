import test from "node:test";
import assert from "node:assert/strict";
import { assertNoForbiddenLocaleText } from "../src/lib/report/reportLanguageValidator.ts";
import { findUnexpectedLatinTokens, replaceForbiddenUserFacingTerms } from "../src/lib/i18n/userFacingSanitizer.ts";

const englishLeaks = [
  "Food manufacturing production volume",
  "Market services / vehicle repair",
  "Currency exposure for imported parts",
  "CBU / supplier quotation",
  "Project evidence",
  "Currency snapshot",
  "Monthly операционные расходы",
  "gapPct",
  "100 index"
];

test("strict Russian locale validator rejects arbitrary Latin user-facing phrases", () => {
  for (const leak of englishLeaks) {
    assert.throws(
      () => assertNoForbiddenLocaleText({ text: leak, locale: "ru", artifactName: "strict-locale-regression" }),
      /leaked|Unexpected Latin token/,
      `Expected strict validator to reject: ${leak}`
    );
  }

  assert.doesNotThrow(() =>
    assertNoForbiddenLocaleText({
      text: "EBITDA и DSCR указаны в отчёте FINKO. Валюта: UZS, USD, EUR. Источник: URL.",
      locale: "ru",
      artifactName: "strict-locale-whitelist"
    })
  );
});

test("sanitizer localizes final blocker phrases before export", () => {
  const source = englishLeaks.join(" | ");
  const sanitized = replaceForbiddenUserFacingTerms(source, "ru");
  assert.match(sanitized, /Объём производства пищевой продукции/);
  assert.match(sanitized, /Рыночные услуги \/ ремонт автомобилей/);
  assert.match(sanitized, /Валютный риск по импортным запчастям/);
  assert.match(sanitized, /Курс ЦБ \/ коммерческое предложение поставщика/);
  assert.match(sanitized, /Подтверждения по проекту/);
  assert.match(sanitized, /Снимок курса валюты/);
  assert.match(sanitized, /Ежемесячные операционные расходы/);
  assert.match(sanitized, /Отклонение, %/);
  assert.match(sanitized, /Индекс 100/);
  assert.deepEqual(findUnexpectedLatinTokens(sanitized, "ru"), []);
});
