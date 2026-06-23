import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

test("Prisma datasource and environment template are PostgreSQL-only", () => {
  const schema = read("prisma/schema.prisma");
  assert.match(schema, /datasource db\s*{[^}]*provider\s*=\s*"postgresql"[^}]*url\s*=\s*env\("DATABASE_URL"\)[^}]*}/s);
  assert.doesNotMatch(schema, /provider\s*=\s*"sqlite"/);
  assert.match(read(".env.example"), /DATABASE_URL="postgresql:\/\/postgres:postgres@localhost:5432\/advisor_dev"/);
  const envExample = read(".env.example");
  assert.doesNotMatch(envExample, /file:\.\/dev\.db/);
  assert.doesNotMatch(envExample, /OPENAI_API_KEY="[^"]+"/);
  assert.doesNotMatch(envExample, /DATABASE_URL="postgresql:\/\/(?!postgres:postgres@localhost:5432\/advisor_dev)/);
  assert.doesNotMatch(envExample, /DEMO_ADMIN_TOKEN="(?!change-me)/);
});

test("PostgreSQL init migration uses JSONB, Decimal money fields and exchange rate snapshot columns", () => {
  const migration = read("prisma/migrations/20260605000000_init/migration.sql");
  assert.match(migration, /"structuredData" JSONB/);
  assert.match(migration, /"reportData" JSONB/);
  assert.match(migration, /"exchangeRateSnapshot" JSONB/);
  assert.match(migration, /"averagePrice" DECIMAL\(18,2\)/);
  assert.match(migration, /"exchangeRateUZSPerUSD" DECIMAL\(18,6\)/);
  assert.match(migration, /"rate" DECIMAL\(18,6\) NOT NULL/);
  assert.match(migration, /"requestedDate" TEXT NOT NULL/);
  assert.match(migration, /"rateDate" TEXT NOT NULL/);
  assert.match(migration, /"ExchangeRate_currency_base_requestedDate_key"/);
  assert.doesNotMatch(migration, /DATETIME|AUTOINCREMENT|file:\.\/dev\.db/);
});

test("local SQLite artifacts and bootstrap script are absent", () => {
  assert.equal(existsSync(join(root, "prisma/dev.db")), false);
  assert.equal(existsSync(join(root, "scripts/bootstrap-db.ts")), false);
  assert.match(read("package.json"), /"db:deploy":\s*"prisma migrate deploy"/);
  assert.doesNotMatch(read("package.json"), /db:bootstrap|bootstrap-db/);
});
