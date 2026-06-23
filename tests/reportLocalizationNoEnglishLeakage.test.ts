import test from "node:test";
import assert from "node:assert/strict";
import { assertNoRawTechnicalLabelsInReport } from "../src/lib/report/reportLanguageValidator.ts";
import { localizeBusinessProfileValue } from "../src/lib/i18n/businessProfileLabels.ts";

const forbidden = /Tailoring|Customer acquisition|Sewing equipment|Tax cash register|Rent dependency|[a-z]+_[a-z0-9_]+/i;

test("Russian localized tailoring profile contains no English or snake_case leakage", () => {
  const report = {
    businessModelRows: [
      ["Подкатегория", localizeBusinessProfileValue("tailoring_alteration", "ru", { failOnUnknown: true }), "Профиль бизнеса"],
      ["Единица продажи", localizeBusinessProfileValue("tailoring_order", "ru", { failOnUnknown: true }), "Профиль бизнеса"],
      ["От чего зависит выручка", localizeBusinessProfileValue(["mall_or_partner_traffic", "orders_per_month", "average_ticket", "repeat_clients"], "ru", { failOnUnknown: true }), "Профиль бизнеса"]
    ]
  };
  const reportText = JSON.stringify(report);

  assert.doesNotMatch(reportText, forbidden);
  assert.doesNotThrow(() => assertNoRawTechnicalLabelsInReport({ report, locale: "ru" }));
});

test("Russian validator rejects known English leakage phrases", () => {
  assert.throws(
    () => assertNoRawTechnicalLabelsInReport({ report: { text: "Tailoring order, Sewing equipment, tax_cash_register" }, locale: "ru" }),
    /leaked/
  );
});
