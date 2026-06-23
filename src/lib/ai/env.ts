export type AIEnvStatus = {
  provider: string;
  openaiConfigured: boolean;
  model: string;
  enableWebResearch: boolean;
  warnings: string[];
};

function boolEnv(value: string | undefined, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function validateAIEnvironment(): AIEnvStatus {
  const provider = process.env.AI_PROVIDER || (process.env.OPENAI_API_KEY ? "openai" : "fallback");
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const warnings: string[] = [];

  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    const message = "AI_PROVIDER=openai, but OPENAI_API_KEY is missing. AI features will use fallback.";
    warnings.push(message);
    console.error(message);
  }

  for (const key of [
    "OPENAI_MAX_OUTPUT_TOKENS",
    "OPENAI_REPORT_MAX_TOKENS",
    "OPENAI_RESEARCH_MAX_TOKENS",
    "OPENAI_RESEARCH_TIMEOUT_MS",
    "OPENAI_REPORT_TIMEOUT_MS"
  ]) {
    const raw = process.env[key];
    if (raw && !Number.isFinite(Number(raw))) {
      warnings.push(`${key} must be numeric; received ${raw}.`);
    }
  }

  return {
    provider,
    openaiConfigured: provider === "openai" && Boolean(process.env.OPENAI_API_KEY),
    model,
    enableWebResearch: boolEnv(process.env.ENABLE_WEB_RESEARCH, false),
    warnings
  };
}

void validateAIEnvironment();
