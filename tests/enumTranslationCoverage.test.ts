import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { findUnexpectedLatinTokens } from "../src/lib/i18n/userFacingSanitizer.ts";
import { getCanonicalEnumLabel, missingCanonicalEnumLocales } from "../src/lib/utils/labels.ts";

const sourceDirs = ["src/lib/interview", "src/lib/data/sectorTemplates", "src/lib/business"];

function walk(dir: string, files: string[] = []): string[] {
  for (const item of readdirSync(dir)) {
    const path = join(dir, item);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, files);
    else if (/\.tsx?$/.test(path)) files.push(path);
  }
  return files;
}

function collectOptionIds(): string[] {
  const ids = new Set<string>();
  for (const file of sourceDirs.flatMap((dir) => walk(dir))) {
    const source = readFileSync(file, "utf8");
    const callPattern = /(?:select|multi)\([^\n]*?\[([^\]]+)\]/gs;
    let match: RegExpExecArray | null;
    while ((match = callPattern.exec(source))) {
      for (const option of match[1].matchAll(/["']([A-Za-z0-9_.$-]+)["']/g)) {
        ids.add(option[1]);
      }
    }
  }
  return [...ids].sort();
}

test("all static select and multiselect option ids have canonical translations", () => {
  const missing = collectOptionIds()
    .map((id) => ({ id, locales: missingCanonicalEnumLocales(id) }))
    .filter((item) => item.locales.length > 0);

  assert.deepEqual(missing, []);
});

test("russian enum labels do not fall back to accidental latin words", () => {
  const leaks = collectOptionIds()
    .map((id) => ({ id, label: getCanonicalEnumLabel(id, "ru") ?? "" }))
    .map((item) => ({ ...item, tokens: findUnexpectedLatinTokens(item.label, "ru") }))
    .filter((item) => item.tokens.length > 0);

  assert.deepEqual(leaks, []);
});
