import test from "node:test";
import assert from "node:assert/strict";
import { detectFinanceTextConflicts } from "../src/lib/interview/dataQuality.ts";
import type { StructuredProjectData } from "../src/lib/types/project.ts";

test("finance validator compares loan only with loan-labeled amount", () => {
  const project: StructuredProjectData = {
    userLanguage: "ru",
    businessType: "Пекарня",
    ownContributionAmount: 260_000_000,
    requestedLoanAmount: 100_000_000,
    sectionNotes: {
      finance: "Общая сумма запуска 360 000 000 UZS. Из них 260 000 000 UZS — собственные средства, 100 000 000 UZS — кредит."
    }
  };
  const warnings = detectFinanceTextConflicts(project);
  assert.equal(warnings.length, 0);
});

test("finance validator still detects explicit loan mismatch", () => {
  const project: StructuredProjectData = {
    userLanguage: "ru",
    businessType: "Пекарня",
    ownContributionAmount: 260_000_000,
    requestedLoanAmount: 100_000_000,
    sectionNotes: { finance: "Собственные средства 260 000 000 UZS, кредит 360 000 000 UZS." }
  };
  const warnings = detectFinanceTextConflicts(project);
  assert.ok(warnings.some((warning) => warning.code === "finance_text_conflict" && warning.severity === "medium" && warning.calculationPolicy === "structured_fields_used"));
});
