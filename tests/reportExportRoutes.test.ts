import test from "node:test";
import assert from "node:assert/strict";
import { createExcelReportResponse, createPdfReportResponse } from "../src/lib/export/reportExportRouteHandlers.ts";
import { createExportProject } from "./reportFixtures.ts";

test("pdf route returns application/pdf with attachment filename", async () => {
  const response = await createPdfReportResponse("project-export-test", createExportProject());

  assert.equal(response.status, 200);
  assert.equal(response.headers["Content-Type"], "application/pdf");
  assert.equal(response.headers["Content-Disposition"], 'attachment; filename="finko-business-report-ru-project-export-test.pdf"');
});

test("excel route returns xlsx with attachment filename", async () => {
  const response = await createExcelReportResponse("project-export-test", createExportProject());

  assert.equal(response.status, 200);
  assert.equal(response.headers["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  assert.equal(response.headers["Content-Disposition"], 'attachment; filename="finko-business-report-ru-project-export-test.xlsx"');
});

test("export routes reject requests before calculation", async () => {
  const response = await createPdfReportResponse("project-export-test", {
    id: "project-export-test",
    title: "Draft project",
    userLanguage: "ru"
  });

  assert.equal(response.status, 409);
  assert.deepEqual(response.body, {
    error: "Сначала рассчитайте оценку проекта."
  });
});
