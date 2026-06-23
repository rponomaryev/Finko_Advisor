import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function extractProjectModelFields(schema: string): Set<string> {
  const match = schema.match(/model\s+Project\s+\{([\s\S]*?)\n\}/);
  assert.ok(match, "Project model should exist in prisma/schema.prisma");
  return new Set(
    match[1]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("@@") && !line.startsWith("//"))
      .map((line) => line.split(/\s+/)[0])
  );
}

function extractProjectDbFieldKeys(source: string): string[] {
  const match = source.match(/const\s+projectDbFieldKeys:[\s\S]*?=\s*\[([\s\S]*?)\];/);
  assert.ok(match, "projectDbFieldKeys should exist in projectService.ts");
  return Array.from(match[1].matchAll(/"([A-Za-z0-9_]+)"/g)).map((item) => item[1]);
}

test("project DB patch whitelist contains only real Prisma Project columns", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const source = readFileSync("src/lib/services/projectService.ts", "utf8");
  const projectFields = extractProjectModelFields(schema);
  const patchKeys = extractProjectDbFieldKeys(source);
  const invalid = patchKeys.filter((key) => !projectFields.has(key));

  assert.deepEqual(invalid, []);
  assert.equal(patchKeys.includes("customerAcquisitionChannels"), false);
  assert.equal(patchKeys.includes("salesChannels"), false);
  assert.equal(patchKeys.includes("averageTicket"), false);
});
