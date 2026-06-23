import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classifyBusiness } from "../../src/lib/business/businessClassifier.ts";
import { buildDynamicInterviewTemplate } from "../../src/lib/interview/dynamicInterviewEngine.ts";
import { createExcelReportResponse, createPdfReportResponse } from "../../src/lib/export/reportExportRouteHandlers.ts";
import { autoServiceOneBox } from "../fixtures/autoServiceOneBox.ts";
import { foodServiceCafe } from "../fixtures/foodServiceCafe.ts";
import { manufacturingFurniture } from "../fixtures/manufacturingFurniture.ts";
import { createExportProject } from "../reportFixtures.ts";

test("advisor entry form asks universal business type and idea questions", () => {
  const source = readFileSync("src/components/advisor/NewProjectForm.tsx", "utf8");
  assert.match(source, /businessType/);
  assert.match(source, /businessIdea/);
  assert.match(source, /businessType\.trim\(\)\.length >= 2/);
  assert.match(source, /businessIdea\.trim\(\)\.length >= 5/);
});

test("dynamic advisor flow generates different interviews for different businesses", () => {
  const autoTemplate = buildDynamicInterviewTemplate(autoServiceOneBox);
  const cafeTemplate = buildDynamicInterviewTemplate(foodServiceCafe);
  const manufacturingTemplate = buildDynamicInterviewTemplate(manufacturingFurniture);

  const autoQuestionKeys = new Set(autoTemplate.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key)));
  const cafeQuestionKeys = new Set(cafeTemplate.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key)));
  const manufacturingQuestionKeys = new Set(manufacturingTemplate.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key)));

  assert.equal(classifyBusiness(autoServiceOneBox).subcategory, "auto_service");
  assert.ok(autoQuestionKeys.has("wasteOilHandling"));
  assert.ok(autoQuestionKeys.has("boxLeaseTerms"));
  assert.ok(autoQuestionKeys.has("clientPaymentFlow"));
  assert.ok(autoQuestionKeys.has("parentServiceCustomerFlow"));
  assert.ok(autoQuestionKeys.has("equipmentServiceSupport"));
  assert.ok(autoQuestionKeys.has("wasteOilHandlingPlan"));
  assert.ok(!autoQuestionKeys.has("skuCount"));
  assert.ok(!autoQuestionKeys.has("productionLine"));

  assert.ok(cafeQuestionKeys.has("menuCategories"));
  assert.ok(!cafeQuestionKeys.has("boxLeaseTerms"));

  assert.ok(manufacturingQuestionKeys.has("productionStages"));
  assert.ok(!manufacturingQuestionKeys.has("menuCategories"));
});

test("report download endpoints produce PDF and Excel files after calculation", async () => {
  const project = createExportProject();
  const pdf = await createPdfReportResponse("e2e-project", project);
  const excel = await createExcelReportResponse("e2e-project", project);

  assert.equal(pdf.status, 200);
  assert.equal(pdf.headers["Content-Type"], "application/pdf");
  assert.ok(Buffer.isBuffer(pdf.body));
  assert.equal((pdf.body as Buffer).subarray(0, 4).toString("utf8"), "%PDF");

  assert.equal(excel.status, 200);
  assert.equal(excel.headers["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  assert.ok(Buffer.isBuffer(excel.body));
});

test("report preview exposes risk matrix, sources and download actions", () => {
  const previewSource = readFileSync("src/components/advisor/ReportPreview.tsx", "utf8");
  const buttonSource = readFileSync("src/components/advisor/ReportPrintButton.tsx", "utf8");
  assert.match(previewSource, /RiskMatrix/);
  assert.match(buttonSource, /report\/\$\{kind\}/);
  assert.match(buttonSource, /downloadPdf/);
  assert.match(buttonSource, /downloadExcel/);
  assert.match(previewSource, /marketEvidence|Market/);
  assert.match(previewSource, /documentsRows|Documents|Документ/);
});
