export function safeText(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  if (Array.isArray(value)) return value.map((item) => safeText(item)).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map((item) => safeText(item)).filter(Boolean).join(", ");
  }
  return "";
}

export function hasTextDetails(value: unknown, minLength = 40): boolean {
  return safeText(value).length >= minLength;
}
