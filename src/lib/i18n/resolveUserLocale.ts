import { normalizeLocale, type AppLocale } from "./index.ts";

type LocaleInput = {
  requestLocale?: unknown;
  project?: Record<string, unknown> | null;
  structuredData?: Record<string, unknown> | null;
  reportData?: Record<string, unknown> | null;
};

function strictLocale(value: unknown): AppLocale | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (["en", "english"].includes(normalized)) return "en";
  if (["uz", "uz-latn", "uz_latn", "uzbek", "o'zbekcha", "uz-cyrl", "uz_cyrl"].includes(normalized)) return "uz";
  if (["ru", "russian", "русский"].includes(normalized)) return "ru";
  return null;
}

function objectValue(input: Record<string, unknown> | null | undefined, key: string): unknown {
  return input && typeof input === "object" ? input[key] : undefined;
}

export function resolveUserLocale(input: LocaleInput): AppLocale {
  const project = input.project ?? undefined;
  const structuredData = input.structuredData
    ?? (objectValue(project, "structuredData") && typeof objectValue(project, "structuredData") === "object"
      ? objectValue(project, "structuredData") as Record<string, unknown>
      : undefined);
  const reportData = input.reportData
    ?? (objectValue(project, "reportData") && typeof objectValue(project, "reportData") === "object"
      ? objectValue(project, "reportData") as Record<string, unknown>
      : undefined);
  const reportProfile = objectValue(reportData, "projectProfile") && typeof objectValue(reportData, "projectProfile") === "object"
    ? objectValue(reportData, "projectProfile") as Record<string, unknown>
    : undefined;

  const candidates = [
    input.requestLocale,
    objectValue(project, "requestLocale"),
    objectValue(project, "uiLocale"),
    objectValue(project, "locale"),
    objectValue(project, "reportLanguage"),
    objectValue(project, "userLanguage"),
    objectValue(structuredData, "userLanguage"),
    objectValue(structuredData, "locale"),
    objectValue(structuredData, "reportLanguage"),
    objectValue(reportData, "locale"),
    objectValue(reportData, "reportLanguage"),
    objectValue(reportProfile, "locale"),
    objectValue(reportProfile, "userLanguage"),
    objectValue(reportProfile, "reportLanguage")
  ];

  for (const candidate of candidates) {
    const locale = strictLocale(candidate);
    if (locale) return locale;
  }

  return normalizeLocale("ru");
}
