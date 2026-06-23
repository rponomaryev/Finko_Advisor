import test from "node:test";
import assert from "node:assert/strict";
import { calculateInterviewProgress } from "../src/lib/interview/interviewProgress.ts";
import { detectInterviewDataQualityWarnings } from "../src/lib/interview/dataQuality.ts";
import { resolveReportReadiness } from "../src/lib/report/reportReadiness.ts";
import { toStructuredProjectData } from "../src/lib/services/projectService.ts";
import { resolveTemplateForData } from "../src/lib/services/templateService.ts";
import { childrenClothingProfile } from "./helpers/systemicFixtures.ts";

test("structured financing values override stale top-level zero values", () => {
  const structured = childrenClothingProfile({ ownContributionAmount: 220_000_000, ownContributionUZS: 220_000_000 });
  const project = { ...structured, ownContributionAmount: 0, ownContributionUZS: 0, structuredData: structured };
  const merged = toStructuredProjectData(project as never);
  assert.equal(merged.ownContributionAmount, 220_000_000);
  assert.equal(merged.ownContributionUZS, 220_000_000);
  const warnings = detectInterviewDataQualityWarnings(merged);
  assert.equal(warnings.some((warning) => warning.code === "zero_own_contribution"), false);
  assert.equal(resolveReportReadiness(merged).ready, true);
});

test("filled loan terms do not create blocking financing warnings", () => {
  const profile = childrenClothingProfile();
  const warnings = detectInterviewDataQualityWarnings(profile);
  assert.equal(warnings.some((warning) => warning.code === "loan_terms_missing"), false);
  const readiness = resolveReportReadiness(profile);
  assert.equal(readiness.ready, true, readiness.blockingIssues.map((issue) => issue.message).join("; "));
  const progress = calculateInterviewProgress({ data: profile, template: resolveTemplateForData(profile), currentBlockId: "financing", locale: "ru" });
  const financing = progress.blocks.find((block) => block.blockId === "financing");
  assert.notEqual(financing?.status, "has_warnings");
});

test("missing collateral detail is nonblocking and visible as warning detail", () => {
  const profile = childrenClothingProfile({ collateralType: "", collateralEstimatedValue: 0 });
  const warnings = detectInterviewDataQualityWarnings(profile).filter((warning) => warning.blockId === "financing");
  assert.ok(warnings.some((warning) => warning.code === "collateral_details_missing" && warning.severity === "medium"));
  const readiness = resolveReportReadiness(profile);
  assert.equal(readiness.ready, true, readiness.blockingIssues.map((issue) => issue.message).join("; "));
  assert.ok(readiness.nonBlockingWarnings.some((issue) => issue.code === "collateral_details_missing" && /Залог/.test(issue.message)));
});
