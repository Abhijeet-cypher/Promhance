import type { ViralPromptJSON } from "./viral-prompts-types";
import rawData from "@/viral_prompts_structured.json";

export const allPrompts: ViralPromptJSON[] = rawData as ViralPromptJSON[];

// ── Derived unique value sets for filter UI ───────────────────────────────────

export const uniqueSections = Array.from(
  new Set(allPrompts.map((p) => p.section))
).sort();

export const uniqueTypes = Array.from(
  new Set(allPrompts.map((p) => p.type).filter(Boolean))
).sort();

export const uniqueTrendYears = [
  "CURRENT 2025\u20132026",
  "PEAK 2024\u20132025",
  "CLASSIC 2022\u20132023",
];

// ── Era normaliser (trend_year → 'current' | 'peak' | 'classic') ─────────────

export function getEra(trendYear: string): "current" | "peak" | "classic" {
  const u = trendYear?.toUpperCase() || "";
  if (u.includes("CURRENT")) return "current";
  if (u.includes("CLASSIC")) return "classic";
  if (u.includes("PEAK") || u.includes("STILL")) return "peak";
  // Fallback: year-based guess (only if no keyword match)
  if (u.includes("2026") || u.includes("2025–2026")) return "current";
  if (u.includes("2024") || u.includes("2024–2025")) return "peak";
  if (u.includes("2022") || u.includes("2023")) return "classic";
  return "peak";
}

// ── Type normaliser ────────────────────────────────────────────────────────────

const TYPE_MAP: Record<string, string> = {
  IMAGE: "Image",
  VIDEO: "Video",
  "AI VIDEO": "Video",
  MUSIC: "Music",
  LYRICS: "Music",
  INSTRUMENTAL: "Music",
  SOUND: "Music",
  SCRIPT: "Script",
  REEL: "Script",
  SHORTS: "Script",
  HOOK: "Script",
  STORYTIME: "Script",
  THREAD: "Text / Post",
  TWEET: "Text / Post",
  POST: "Text / Post",
  BIO: "Text / Post",
  LISTING: "Text / Post",
  TEXT: "Text / Post",
  CONCEPT: "Concept",
  FORMAT: "Concept",
  OUTLINE: "Concept",
  PROPOSAL: "Concept",
  AR: "Concept",
};

export function normaliseType(raw: string): string {
  const u = raw?.toUpperCase().trim();
  for (const [key, value] of Object.entries(TYPE_MAP)) {
    if (u?.includes(key)) return value;
  }
  return "Other";
}

// ── Platform display name from section ────────────────────────────────────────

export function platformFromSection(section: string): string {
  return section
    .replace(/\s*\(.*?\)\s*/g, "")
    .replace(/PROMPTS?/gi, "")
    .replace(/&/g, "·")
    .trim();
}
