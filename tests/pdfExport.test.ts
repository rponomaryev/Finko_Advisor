import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { buildPdfReportBuffer } from "../src/lib/export/pdfReportExporter.ts";
import { prepareReportExport } from "../src/lib/export/reportExportTypes.ts";
import { createExportProject } from "./reportFixtures.ts";

test("prepared export data includes project, financial, risk and source sections", () => {
  const project = createExportProject();
  const data = prepareReportExport(project);

  assert.equal(data.title, "Кофейня — Ташкент город");
  assert.ok(data.summary.some((row) => row.label.includes("Название") && row.value.includes("Кофейня")));
  assert.ok(data.financialRows.some((row) => row.indicator.includes("Общий объем инвестиций")));
  assert.ok(data.marketEvidenceRows.some((row) => row.source.includes("Очень высокая") || row.comment.includes("провер") || row.amount.includes("Официальная")));
  assert.ok(data.glossaryRows.some((row) => row.term === "EBITDA"));
  assert.ok(data.risks.length > 0);
  assert.ok(data.sources[0].notes.length > 0);
});

test("pdf exporter returns a valid multipage PDF buffer", async () => {
  const project = createExportProject();
  const buffer = await buildPdfReportBuffer(project);
  const pdf = await PDFDocument.load(buffer);

  assert.equal(buffer.subarray(0, 4).toString("utf8"), "%PDF");
  assert.ok(pdf.getPageCount() >= 2);
  assert.equal(pdf.getTitle(), "Кофейня — Ташкент город");
  assert.equal(pdf.getAuthor(), "FINKO Business Advisor");
});
