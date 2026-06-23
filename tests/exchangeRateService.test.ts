import test from "node:test";
import assert from "node:assert/strict";
import {
  cbuUsdRateUrl,
  clearExchangeRateCache,
  ExchangeRateUnavailableError,
  getUsdUzsExchangeRate,
  parseCbuUsdRatePayload
} from "../src/lib/services/exchangeRateService.ts";

const originalFetch = globalThis.fetch;

function mockFetch(handler: (url: string) => Promise<unknown> | unknown) {
  (globalThis as unknown as { fetch: typeof fetch }).fetch = (async (input: RequestInfo | URL) => {
    const body = await handler(String(input));
    return {
      ok: true,
      status: 200,
      json: async () => body
    } as Response;
  }) as typeof fetch;
}

test.afterEach(() => {
  clearExchangeRateCache();
  (globalThis as unknown as { fetch: typeof fetch }).fetch = originalFetch;
});

test("CBU URL is date-specific official USD endpoint", () => {
  assert.equal(cbuUsdRateUrl("2026-06-08"), "https://cbu.uz/ru/arkhiv-kursov-valyut/json/USD/2026-06-08/");
});

test("parses CBU USD rate payload with requested and returned rate dates", () => {
  const snapshot = parseCbuUsdRatePayload([{ Ccy: "USD", Rate: "11970.68", Date: "07.06.2026" }], "2026-06-08");
  assert.deepEqual(
    {
      sourceCurrency: snapshot.sourceCurrency,
      targetCurrency: snapshot.targetCurrency,
      rate: snapshot.rate,
      requestedDate: snapshot.requestedDate,
      rateDate: snapshot.rateDate,
      source: snapshot.source,
      sourceUrl: snapshot.sourceUrl
    },
    {
      sourceCurrency: "USD",
      targetCurrency: "UZS",
      rate: 11970.68,
      requestedDate: "2026-06-08",
      rateDate: "2026-06-07",
      source: "CBU",
      sourceUrl: "https://cbu.uz/ru/arkhiv-kursov-valyut/json/USD/2026-06-08/"
    }
  );
  assert.ok(Date.parse(snapshot.fetchedAt));
});

test("fetches USD/UZS from official CBU endpoint for the application date", async () => {
  let requestedUrl = "";
  mockFetch((url) => {
    requestedUrl = url;
    return [{ Ccy: "USD", Rate: "11970,68", Date: "08.06.2026" }];
  });

  const snapshot = await getUsdUzsExchangeRate("2026-06-08");
  assert.equal(requestedUrl, "https://cbu.uz/ru/arkhiv-kursov-valyut/json/USD/2026-06-08/");
  assert.equal(snapshot.rate, 11970.68);
  assert.equal(snapshot.requestedDate, "2026-06-08");
  assert.equal(snapshot.rateDate, "2026-06-08");
  assert.equal(snapshot.source, "CBU");
});

test("cache key includes requested date", async () => {
  const urls: string[] = [];
  mockFetch((url) => {
    urls.push(url);
    const date = url.includes("2026-06-09") ? "09.06.2026" : "08.06.2026";
    return [{ Ccy: "USD", Rate: "11970.68", Date: date }];
  });

  await getUsdUzsExchangeRate("2026-06-08");
  await getUsdUzsExchangeRate("2026-06-08");
  await getUsdUzsExchangeRate("2026-06-09");

  assert.equal(urls.length, 2);
  assert.equal(urls[0], "https://cbu.uz/ru/arkhiv-kursov-valyut/json/USD/2026-06-08/");
  assert.equal(urls[1], "https://cbu.uz/ru/arkhiv-kursov-valyut/json/USD/2026-06-09/");
});

test("CBU unavailable returns controlled exchange-rate error", async () => {
  (globalThis as unknown as { fetch: typeof fetch }).fetch = (async () => {
    throw new Error("network down");
  }) as typeof fetch;

  await assert.rejects(
    () => getUsdUzsExchangeRate("2030-01-17"),
    (error) => error instanceof ExchangeRateUnavailableError && error.message.includes("2030-01-17")
  );
});
