import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { dirname } from "node:path";
import { extractPdfText } from "./helpers/pdfText.ts";

async function buildSmokePdf(text: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([360, 160]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 36, y: 100, size: 18, font });
  return pdf.save();
}

test("extractPdfText falls back to pure JS when pdftotext is unavailable", async () => {
  const originalPath = process.env.PATH;
  const originalPdfToTextPath = process.env.PDFTOTEXT_PATH;
  try {
    // Keep only the Node binary directory in PATH. This intentionally removes /usr/bin where
    // Linux pdftotext/which usually live and mirrors a Windows machine without Poppler in PATH.
    process.env.PATH = dirname(process.execPath);
    delete process.env.PDFTOTEXT_PATH;

    const text = await extractPdfText(await buildSmokePdf("PDF fallback smoke"));
    assert.match(text, /PDF fallback smoke/);
  } finally {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;

    if (originalPdfToTextPath === undefined) delete process.env.PDFTOTEXT_PATH;
    else process.env.PDFTOTEXT_PATH = originalPdfToTextPath;
  }
});
