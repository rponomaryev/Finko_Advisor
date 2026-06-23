import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const trackedFiles = () => {
  try {
    return execSync("git ls-files", { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
};

test("repository does not include local secrets or database artifacts", () => {
  const tracked = trackedFiles();
  assert.doesNotMatch(tracked, /^\.env$/m, ".env must not be committed or shipped");
  assert.doesNotMatch(tracked, /(^|\/)(dev\.db|.*\.sqlite3?|.*\.db)$/m, "local database files must not be committed or shipped");
  assert.match(read(".gitignore"), /^\.env$/m);
  assert.match(read(".gitignore"), /^\*\.sqlite$/m);
  assert.match(read(".gitignore"), /^\*\.db$/m);
  assert.equal(existsSync(join(root, ".env.example")), true, ".env.example must exist");
});

test("Next config has security headers and disables X-Powered-By", () => {
  const config = read("next.config.ts");
  assert.match(config, /poweredByHeader:\s*false/);
  for (const header of ["Content-Security-Policy", "X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy"]) {
    assert.match(config, new RegExp(header));
  }
  assert.doesNotMatch(config, /isProduction \? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"/);
});

test("demo auth uses HttpOnly cookie and no localStorage token storage", () => {
  const auth = read("src/lib/server/auth.ts");
  assert.match(auth, /finko_demo_session/);
  assert.match(auth, /httpOnly:\s*true/);
  assert.match(auth, /DEMO_SESSION_SECRET/);
  const code = read("src/app/demo-login/page.tsx") + read("src/components/layout/FinkoHeader.tsx");
  assert.doesNotMatch(code, /localStorage\.setItem\([^)]*TOKEN/i);
  assert.doesNotMatch(code, /DEMO_USER_TOKEN|DEMO_ADMIN_TOKEN|DEMO_SESSION_SECRET/);
});

test("ordinary demo auto-login is separate from protected admin login", () => {
  const middleware = read("src/middleware.ts");
  const loginPage = read("src/app/demo-login/page.tsx");
  const userRoute = read("src/app/api/auth/demo-login/route.ts");

  assert.match(middleware, /url\.pathname\s*=\s*"\/api\/auth\/demo-login"/);
  assert.match(middleware, /url\.searchParams\.set\("admin",\s*"1"\)/);
  assert.match(loginPage, /window\.location\.assign\(`\/api\/auth\/demo-login\?next=/);
  assert.match(loginPage, /isAdmin\s*\?\s*messages\.authLogin\.adminTitle/);
  assert.match(userRoute, /export async function GET/);
  assert.match(userRoute, /createSignedSession\("user"/);
  assert.doesNotMatch(userRoute, /createSignedSession\("admin"/);
});

test("AI requests have minute limit, daily quota and max output tokens", () => {
  assert.match(read("src/lib/server/security.ts"), /checkDailyAIQuota/);
  assert.match(read("src/app/api/interview/extract/route.ts"), /checkDailyAIQuota/);
  assert.match(read("src/app/api/projects/route.ts"), /checkDailyAIQuota/);
  assert.match(read("src/lib/ai/aiService.ts"), /max_output_tokens/);
});

test("Uzbek localization has no Cyrillic and no Cyrillic locale variants", () => {
  const uz = read("src/lib/i18n/uz.ts");
  assert.doesNotMatch(uz, /[а-яёА-ЯЁ]/);
  const all = [
    "src/lib/i18n/uz.ts",
    "src/lib/i18n/ru.ts",
    "src/lib/i18n/en.ts",
    "src/components/layout/FinkoHeader.tsx"
  ].map(read).join("\n");
  assert.doesNotMatch(all, /Ўзбекча|uz-cyrl|uz_Cyrl/);
});

test("exchange-rate service uses official date-specific CBU endpoint and no hardcoded production rate", () => {
  const service = read("src/lib/services/exchangeRateService.ts");
  assert.match(service, /cbu\.uz\/ru\/arkhiv-kursov-valyut\//);
  assert.match(service, /json\/USD/);
  assert.match(service, /cbuUsdRateUrl\(requestedDate\)/);
  assert.match(service, /source:\s*"CBU"/);
  assert.match(service, /requestedDate/);
  assert.match(service, /rateDate/);
  for (const forbidden of [["FALLBACK", "RATE"].join("_"), ["hardcoded", "fallback"].join("-"), ["database", "fallback"].join("-")]) {
    assert.equal(service.includes(forbidden), false);
  }
  assert.match(read("src/app/api/exchange-rate/route.ts"), /NextResponse\.json\(snapshot\)/);
});
