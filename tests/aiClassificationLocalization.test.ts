import assert from "node:assert/strict";
import test from "node:test";
import { buildAIClassificationPrompt, classifierCacheKey } from "../src/lib/business/businessClassifier.ts";

test("AI classification prompt explicitly requires Uzbek Latin localization", () => {
  const prompt = buildAIClassificationPrompt({
    businessType: "mobile water quality laboratory",
    businessIdea: "On-site sample collection for cafes and farms",
    language: "uz"
  });

  assert.match(prompt, /Interface language: "uz"/);
  assert.match(prompt, /Uzbek in Latin script/);
  assert.match(prompt, /All human-readable string values/);
});

test("AI classification cache key is language-sensitive", () => {
  const ruKey = classifierCacheKey({ businessType: "мобильная лаборатория воды", businessIdea: "анализ воды", region: "Самарканд", language: "ru" });
  const uzKey = classifierCacheKey({ businessType: "мобильная лаборатория воды", businessIdea: "анализ воды", region: "Самарканд", language: "uz" });
  const enKey = classifierCacheKey({ businessType: "мобильная лаборатория воды", businessIdea: "анализ воды", region: "Самарканд", language: "en" });

  assert.notEqual(ruKey, uzKey);
  assert.notEqual(uzKey, enKey);
  assert.notEqual(ruKey, enKey);
});
