import test from "node:test";
import assert from "node:assert/strict";
import { getMarketData, hasSourceBackedNumber, isValidMarketDataPoint } from "../src/lib/marketData/marketDataService.ts";

test("market data rows require sourceName and sourceType", () => {
  assert.equal(isValidMarketDataPoint({
    sector: "coffee",
    indicator: "companies",
    year: 2025,
    value: 10,
    sourceName: "",
    sourceType: "official_statistics"
  }), false);

  assert.equal(hasSourceBackedNumber({
    sector: "coffee",
    indicator: "companies",
    year: 2025,
    value: 10,
    sourceName: "Official source",
    sourceType: "official_statistics"
  }), true);
});

test("market data service does not invent numbers", async () => {
  const result = await getMarketData({ businessType: "Кофейня", region: "Ташкент город", locale: "ru" });
  if (result.dataPoints.length === 0) {
    assert.equal(result.messages[0], "Официальные числовые данные по этому показателю не найдены.");
  }
  for (const point of result.dataPoints) {
    assert.equal(isValidMarketDataPoint(point), true);
    assert.equal(hasSourceBackedNumber(point), true);
    assert.ok(point.sourceName.trim().length > 0);
    assert.ok(point.sourceType.trim().length > 0);
  }
});

test("bakery market data rejects unrelated macro import and export indicators", async () => {
  const result = await getMarketData({
    businessType: "Мини-пекарня",
    region: "Ташкент город",
    locale: "ru",
    uploadedPoints: [
      {
        sector: "macro",
        indicator: "Exports of goods and services",
        year: 2024,
        valueUsd: 1000,
        sourceName: "World Bank Open Data",
        sourceType: "official_statistics",
        matchQuality: "broad_proxy"
      },
      {
        sector: "macro",
        indicator: "Imports of goods and services",
        year: 2024,
        valueUsd: 2000,
        sourceName: "World Bank Open Data",
        sourceType: "official_statistics",
        matchQuality: "broad_proxy"
      },
      {
        sector: "food manufacturing",
        indicator: "Food manufacturing production volume",
        year: 2024,
        value: 3000,
        sourceName: "StatUz",
        sourceType: "official_statistics",
        matchQuality: "close_proxy",
        explanation: "Food manufacturing is a close proxy for bakery production when exact bread data is not available."
      }
    ]
  });

  assert.equal(result.dataPoints.some((point) => point.indicator === "Exports of goods and services"), false);
  assert.equal(result.dataPoints.some((point) => point.indicator === "Imports of goods and services"), false);
  assert.equal(result.dataPoints.some((point) => point.indicator === "Food manufacturing production volume"), true);
});
