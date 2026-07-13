import fs from "fs";
import path from "path";

export interface ViralPrompt {
  id: number;
  number: number;
  text: string;
  type: string;        // normalised: Image | Video | Music | Script | Text/Post | Concept
  rawType: string;     // original TYPE: value
  style?: string;
  platform: string;    // derived from section
  era: "current" | "peak" | "classic";
  section: string;
}

const SECTION_PLATFORMS: Record<string, string> = {
  "SECTION 1":  "Instagram",
  "SECTION 2":  "TikTok",
  "SECTION 3":  "YouTube",
  "SECTION 4":  "Pinterest",
  "SECTION 5":  "Twitter / X",
  "SECTION 6":  "Midjourney",
  "SECTION 7":  "Stable Diffusion",
  "SECTION 8":  "Music (Suno/Udio)",
  "SECTION 9":  "AI Video (Sora)",
  "SECTION 10": "ChatGPT / Gemini",
  "SECTION 11": "LinkedIn",
  "SECTION 12": "Reddit",
  "SECTION 13": "Facebook",
  "SECTION 14": "DALL-E / Gemini",
  "SECTION 15": "Cross-Platform",
  "SECTION 16": "Gemini",
  "SECTION 17": "Runway / Pika / Kling",
  "SECTION 18": "Discord / Gaming",
  "SECTION 19": "Snapchat / Threads",
  "SECTION 20": "Mixed Platforms",
  "SECTION 21": "Artistic / Niche",
};

function normaliseType(raw: string): string {
  const u = raw.toUpperCase();
  if (u.includes("IMAGE"))                                      return "Image";
  if (u.includes("VIDEO") || u.includes("AI VIDEO"))           return "Video";
  if (u.includes("MUSIC") || u.includes("LYRICS") || u.includes("INSTRUMENTAL") || u.includes("SOUND")) return "Music";
  if (u.includes("SCRIPT") || u.includes("REEL") || u.includes("SHORTS") || u.includes("HOOK") || u.includes("STORYTIME")) return "Script";
  if (u.includes("THREAD") || u.includes("TWEET") || u.includes("POST") || u.includes("BIO") || u.includes("LISTING") || u.includes("TEXT")) return "Text / Post";
  if (u.includes("CONCEPT") || u.includes("FORMAT") || u.includes("OUTLINE") || u.includes("PROPOSAL") || u.includes("AR")) return "Concept";
  return "General";
}

export function parseViralPrompts(): ViralPrompt[] {
  const filePath = path.join(process.cwd(), "VIRAL_PROMPTS_PROMHANCE_COLLECTION.txt");
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split(/\r?\n/);

  const prompts: ViralPrompt[] = [];
  let currentSection   = "Mixed Platforms";
  let currentEra: ViralPrompt["era"] = "current";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // ── Section heading ──────────────────────────────────────────────
    const secMatch = trimmed.match(/SECTION\s+(\d+)/);
    if (secMatch) {
      const key = `SECTION ${secMatch[1]}`;
      currentSection = SECTION_PLATFORMS[key] ?? key;
    }

    // ── Era marker ───────────────────────────────────────────────────
    if (/CURRENT\s+202[5-9]/i.test(trimmed)) {
      currentEra = "current";
    } else if (/PEAK\s+202[3-5]/i.test(trimmed)) {
      currentEra = "peak";
    } else if (/CLASSIC\s+202[2-3]/i.test(trimmed)) {
      currentEra = "classic";
    } else if (/STILL EFFECTIVE|STILL TRENDING|EVERGREEN/i.test(trimmed)) {
      currentEra = "peak";
    }

    // ── Numbered prompt ──────────────────────────────────────────────
    const promptMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (!promptMatch) continue;

    const number = parseInt(promptMatch[1], 10);
    let text = promptMatch[2];

    // Collect continuation lines (indented, not TYPE:, not blank, not next number)
    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j].trim();
      if (!next) break;
      if (/^TYPE:/i.test(next)) break;
      if (/^\d+\./.test(next)) break;
      if (/^[═━─]/.test(next)) break;
      text += " " + next;
      j++;
    }

    // Parse TYPE line
    let rawType = "General";
    let style: string | undefined;

    if (j < lines.length) {
      const typeLine = lines[j].trim();
      if (/^TYPE:/i.test(typeLine)) {
        rawType = typeLine.replace(/^TYPE:\s*/i, "").trim();
        // Style: ... extraction
        const styleMatch = rawType.match(/Style:\s*([^|]+)/i);
        if (styleMatch) {
          style = styleMatch[1].trim();
        }
      }
    }

    prompts.push({
      id:       prompts.length + 1,
      number,
      text:     text.trim(),
      type:     normaliseType(rawType),
      rawType,
      style,
      platform: currentSection,
      era:      currentEra,
      section:  currentSection,
    });
  }

  return prompts;
}
