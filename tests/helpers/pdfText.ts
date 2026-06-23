import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { buildPdfReportBuffer } from "../../src/lib/export/pdfReportExporter.ts";
import { buildCalculatedProject, childrenClothingProfile } from "./systemicFixtures.ts";

type PdfInput = Buffer | Uint8Array | string;

function normalizeExtractedPdfText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\r\n/g, "\n")
    .trim();
}

function commandExists(command: string): boolean {
  const checker = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(checker, [command], { stdio: "ignore", shell: false });
  return result.status === 0;
}

function getPdftotextCommand(): string | null {
  const configuredPath = process.env.PDFTOTEXT_PATH?.trim();
  if (configuredPath && existsSync(configuredPath)) return configuredPath;

  if (commandExists("pdftotext")) return "pdftotext";

  if (process.platform === "win32") {
    const pathCandidates = (process.env.PATH ?? "")
      .split(delimiter)
      .filter(Boolean)
      .flatMap((entry) => [join(entry, "pdftotext.exe"), join(entry, "pdftotext")]);
    const candidates = [
      "C:\\Program Files\\poppler\\Library\\bin\\pdftotext.exe",
      "C:\\Program Files\\poppler\\bin\\pdftotext.exe",
      "C:\\Program Files (x86)\\poppler\\Library\\bin\\pdftotext.exe",
      "C:\\Program Files (x86)\\poppler\\bin\\pdftotext.exe",
      "C:\\tools\\poppler\\Library\\bin\\pdftotext.exe",
      "C:\\tools\\poppler\\bin\\pdftotext.exe",
      "C:\\poppler\\Library\\bin\\pdftotext.exe",
      "C:\\poppler\\bin\\pdftotext.exe",
      ...pathCandidates
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) return candidate;
    }
  }

  return null;
}

function withPdfFile<T>(input: PdfInput, fn: (pdfPath: string, tempDir: string) => T): T {
  if (typeof input === "string") return fn(input, "");

  const dir = mkdtempSync(join(tmpdir(), "finko-pdf-text-"));
  const pdfPath = join(dir, "report.pdf");
  try {
    writeFileSync(pdfPath, Buffer.from(input));
    return fn(pdfPath, dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function extractWithPdftotext(command: string, input: PdfInput): string {
  return withPdfFile(input, (pdfPath, existingTempDir) => {
    const tempDir = existingTempDir || mkdtempSync(join(tmpdir(), "finko-pdf-text-"));
    const textPath = join(tempDir, "report.txt");
    try {
      try {
        execFileSync(command, ["-layout", pdfPath, textPath], { stdio: "pipe", timeout: 10_000 });
      } catch (layoutError) {
        if (existsSync(textPath)) return normalizeExtractedPdfText(readFileSync(textPath, "utf8"));
        execFileSync(command, [pdfPath, textPath], { stdio: "pipe", timeout: 10_000 });
      }
      return normalizeExtractedPdfText(readFileSync(textPath, "utf8"));
    } finally {
      if (!existingTempDir) rmSync(tempDir, { recursive: true, force: true });
    }
  });
}


function ensurePdfJsNodePolyfills() {
  const target = globalThis as Record<string, unknown>;

  if (!target.DOMMatrix) {
    target.DOMMatrix = class MinimalDOMMatrix {
      a = 1;
      b = 0;
      c = 0;
      d = 1;
      e = 0;
      f = 0;
      is2D = true;
      isIdentity = true;

      constructor(init?: unknown) {
        if (Array.isArray(init)) {
          const values = init.map(Number);
          [this.a, this.b, this.c, this.d, this.e, this.f] = [
            values[0] ?? 1,
            values[1] ?? 0,
            values[2] ?? 0,
            values[3] ?? 1,
            values[4] ?? 0,
            values[5] ?? 0
          ];
          this.isIdentity = this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
        }
      }

      multiplySelf() { return this; }
      preMultiplySelf() { return this; }
      translateSelf() { return this; }
      scaleSelf() { return this; }
      rotateSelf() { return this; }
      invertSelf() { return this; }
      transformPoint(point?: { x?: number; y?: number }) { return { x: point?.x ?? 0, y: point?.y ?? 0, z: 0, w: 1 }; }
    };
  }

  if (!target.ImageData) {
    target.ImageData = class MinimalImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;

      constructor(dataOrWidth: Uint8ClampedArray | number, width?: number, height?: number) {
        if (typeof dataOrWidth === "number") {
          this.width = dataOrWidth;
          this.height = Number(width ?? 0);
          this.data = new Uint8ClampedArray(this.width * this.height * 4);
        } else {
          this.data = dataOrWidth;
          this.width = Number(width ?? 0);
          this.height = Number(height ?? 0);
        }
      }
    };
  }

  if (!target.Path2D) {
    target.Path2D = class MinimalPath2D {};
  }
}

async function extractWithJsFallback(input: PdfInput): Promise<string> {
  const buffer = typeof input === "string" ? readFileSync(input) : Buffer.from(input);

  try {
    ensurePdfJsNodePolyfills();
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return normalizeExtractedPdfText(result.text || "");
    } finally {
      await parser.destroy();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error([
      "Unable to extract text from actual PDF.",
      "Tried system pdftotext, but no usable executable was found, and the JS fallback failed.",
      "Fix options:",
      "- run `npm ci` so the pdf-parse dev dependency is installed; or",
      "- install Poppler and put pdftotext in PATH; or",
      "- set PDFTOTEXT_PATH to the full pdftotext executable path.",
      `JS fallback error: ${message}`
    ].join("\n"));
  }
}

export function getPdfTextExtractorDiagnostics(): {
  pdfToTextPathEnvSet: boolean;
  pdfToTextPathEnvUsable: boolean;
  pdftotextCommand: string | null;
  jsFallbackPackageAvailable: boolean;
} {
  const configuredPath = process.env.PDFTOTEXT_PATH?.trim();
  const command = getPdftotextCommand();
  let jsFallbackPackageAvailable = false;
  try {
    // Importing dynamically is async; require.resolve is enough for the preflight diagnostic.
    import.meta.resolve("pdf-parse");
    jsFallbackPackageAvailable = true;
  } catch {
    jsFallbackPackageAvailable = false;
  }

  return {
    pdfToTextPathEnvSet: Boolean(configuredPath),
    pdfToTextPathEnvUsable: Boolean(configuredPath && existsSync(configuredPath)),
    pdftotextCommand: command,
    jsFallbackPackageAvailable
  };
}

export async function extractPdfText(pdfBufferOrPath: PdfInput): Promise<string> {
  const pdftotext = getPdftotextCommand();
  if (pdftotext) return extractWithPdftotext(pdftotext, pdfBufferOrPath);
  return extractWithJsFallback(pdfBufferOrPath);
}

let childrenClothingPdfTextPromise: Promise<string> | null = null;

export async function buildChildrenClothingActualPdfText(): Promise<string> {
  childrenClothingPdfTextPromise ??= (async () => {
    const project = buildCalculatedProject(childrenClothingProfile({
      collateralType: "Cobalt",
      collateralEstimatedValue: 157_112_280,
      moneyValues: {
        collateralEstimatedValue: {
          sourceAmount: 13_000,
          sourceCurrency: "USD",
          amountUZS: 157_112_280
        }
      }
    }));
    const pdfBuffer = await buildPdfReportBuffer(project, "ru");
    return extractPdfText(pdfBuffer);
  })();
  return childrenClothingPdfTextPromise;
}
