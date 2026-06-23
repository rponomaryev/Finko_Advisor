const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  const title = await page.title();
  const heroVisible = await page.getByRole("heading", { name: "FINKO Business Advisor" }).isVisible();
  const startVisible = await page.getByRole("button", { name: /Начать консультацию/ }).first().isVisible();
  await page.screenshot({ path: ".tools/home-smoke.png", fullPage: true });

  await page.goto("http://localhost:3000/advisor/new", { waitUntil: "networkidle" });
  const formVisible = await page.getByRole("heading", { name: "Опишите бизнес-идею" }).isVisible();

  await browser.close();
  console.log(JSON.stringify({ title, heroVisible, startVisible, formVisible }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
