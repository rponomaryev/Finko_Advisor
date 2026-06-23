import test from "node:test";
import assert from "node:assert/strict";
import { sourceRegistry } from "../src/lib/data/sourceRegistry.ts";

test("source registry has production-grade metadata at 1000+ scale", () => {
  assert.ok(sourceRegistry.length >= 1000, `expected >=1000 sources, got ${sourceRegistry.length}`);
  const ids = new Set<string>();
  let officialLike = 0;
  let uzOfficialLike = 0;
  for (const source of sourceRegistry as Array<Record<string, unknown>>) {
    assert.equal(typeof source.id, "string");
    assert.ok(String(source.id).trim());
    assert.ok(!ids.has(String(source.id)), `duplicate source id ${String(source.id)}`);
    ids.add(String(source.id));
    for (const field of ["title", "organization", "url", "topics", "sectors", "reliabilityScore", "citationTemplate"]) {
      assert.ok(source[field] !== undefined && source[field] !== null && String(source[field]).length > 0, `missing ${field} for ${source.id}`);
    }
    assert.ok(/^https?:\/\//.test(String(source.url)), `bad URL for ${source.id}`);
    assert.ok(Array.isArray(source.topics) && (source.topics as unknown[]).length > 0, `missing topics for ${source.id}`);
    assert.ok(Array.isArray(source.sectors) && (source.sectors as unknown[]).length > 0, `missing sectors for ${source.id}`);
    assert.ok(Number(source.reliabilityScore) > 0, `bad reliability for ${source.id}`);
    assert.doesNotMatch(`${source.id} ${source.title} ${source.organization}`, /placeholder|fake|synthetic|контрольный|тестовая сборка/i);
    const type = String(source.reportSourceType ?? source.sourceType);
    if (/official|statistics|law|tax|license/i.test(type)) officialLike += 1;
    const country = String(source.country ?? source.countryScope ?? "");
    const url = String(source.url ?? "");
    if (/(UZ|Uzbekistan|Узбекистан)/i.test(country) && /official|statistics|law|tax|license/i.test(type) && /\.uz\b|\.uz\//i.test(url)) uzOfficialLike += 1;
  }
  assert.ok(officialLike >= 300, `official/statistics/law/tax/license sources: ${officialLike}`);
  assert.ok(uzOfficialLike >= 100, `Uzbekistan official/stat/legal sources: ${uzOfficialLike}`);
});
