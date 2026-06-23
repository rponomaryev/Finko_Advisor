import type { StructuredProjectData } from "../types/project.ts";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeArrays(key: string, current: unknown[], patch: unknown[]) {
  if (key === "completedBlockIds") return Array.from(new Set([...current, ...patch].map(String)));
  return patch;
}

export function safeDeepMerge<T>(current: T, patch: unknown, key = ""): T {
  if (patch === undefined) return current;
  if (Array.isArray(patch)) {
    return (Array.isArray(current) ? mergeArrays(key, current, patch) : patch) as T;
  }
  if (!isPlainObject(patch)) return patch as T;

  const base = isPlainObject(current) ? current : {};
  const next: Record<string, unknown> = { ...base };
  for (const [childKey, childValue] of Object.entries(patch)) {
    if (childValue === undefined) continue;
    next[childKey] = safeDeepMerge(next[childKey], childValue, childKey);
  }
  return next as T;
}

export function applyDottedKeyPatch(target: StructuredProjectData, key: string, value: unknown) {
  const parts = key.split(".").filter(Boolean);
  if (parts.length <= 1) {
    (target as Record<string, unknown>)[key] = value;
    return target;
  }

  let node = target as Record<string, unknown>;
  for (const part of parts.slice(0, -1)) {
    if (!isPlainObject(node[part])) node[part] = {};
    node = node[part] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = key.startsWith("otherDetails.") ? String(value ?? "") : value;
  return target;
}

function expandDottedPatch(patch: Record<string, unknown>): StructuredProjectData {
  const expanded: StructuredProjectData = {};
  for (const [key, value] of Object.entries(patch)) {
    applyDottedKeyPatch(expanded, key, value);
  }
  return expanded;
}

export function mergeStructuredData(current: StructuredProjectData, patch: Record<string, unknown>): StructuredProjectData {
  return safeDeepMerge(current, expandDottedPatch(patch));
}
