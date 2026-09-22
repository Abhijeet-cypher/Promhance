export type QuickAction = {
  id: string;
  label: string;
  /** Directive appended to the system instruction when refining. */
  instruction: string;
};

const LLM_ACTIONS: QuickAction[] = [
  {
    id: "more_detail",
    label: "More detail",
    instruction:
      "Elaborate on the current prompt. Add specificity, useful context, and concrete constraints while preserving the original intent. Do not change the subject.",
  },
  {
    id: "shorten",
    label: "Shorter",
    instruction:
      "Shorten the current prompt. Remove redundancy and keep only what is essential to the intent. Make it tighter and punchier without losing meaning.",
  },
  {
    id: "formal",
    label: "More formal",
    instruction:
      "Rewrite the current prompt in a formal, professional, and precise tone. Avoid slang and casual phrasing while keeping the same intent.",
  },
  {
    id: "simpler",
    label: "Simpler",
    instruction:
      "Simplify the current prompt. Use plain, direct language that is easy to understand, and drop unnecessary jargon while keeping the intent.",
  },
];

const IMAGE_ACTIONS: QuickAction[] = [
  {
    id: "more_detail",
    label: "More detail",
    instruction:
      "Add richer visual detail to the current image prompt: composition, lighting, textures, mood, and camera or rendering hints. Output only the final image prompt.",
  },
  {
    id: "simpler",
    label: "Simpler",
    instruction:
      "Simplify the current image prompt to a clean, minimal description of the core subject. Output only the final image prompt.",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    instruction:
      "Rewrite the current image prompt with a cinematic style: dramatic lighting, film-like composition, depth of field, and a specific lens or film reference. Output only the final image prompt.",
  },
  {
    id: "photorealistic",
    label: "Photorealistic",
    instruction:
      "Rewrite the current image prompt to be photorealistic: realistic lighting, accurate materials, fine detail, and a photographic camera style. Output only the final image prompt.",
  },
];

const WRITING_ACTIONS: QuickAction[] = [
  {
    id: "more_vivid",
    label: "More vivid",
    instruction:
      "Make the current writing prompt more vivid and evocative with sensory detail and stronger imagery, while preserving the plot and intent.",
  },
  {
    id: "shorten",
    label: "Shorter",
    instruction:
      "Shorten the current writing prompt. Keep the essential narrative and tone, and cut anything unnecessary.",
  },
  {
    id: "formal",
    label: "More formal",
    instruction:
      "Rewrite the current writing prompt in a formal, literary tone. Keep the same intent and constraints.",
  },
  {
    id: "casual",
    label: "Casual",
    instruction:
      "Rewrite the current writing prompt in a casual, conversational tone while keeping the same intent.",
  },
];

const CODE_ACTIONS: QuickAction[] = [
  {
    id: "more_detail",
    label: "More detail",
    instruction:
      "Expand the current coding prompt with clearer requirements, interfaces, and expected inputs/outputs. Keep the same tech stack.",
  },
  {
    id: "simpler",
    label: "Simpler",
    instruction:
      "Simplify the current coding prompt to the essential task and expected result. Remove optional extras while keeping it actionable.",
  },
  {
    id: "edge_cases",
    label: "Add edge cases",
    instruction:
      "Extend the current coding prompt to explicitly cover edge cases, error handling, validation, and failure modes.",
  },
  {
    id: "step_by_step",
    label: "Step-by-step",
    instruction:
      "Rewrite the current coding prompt so it asks for a clear step-by-step implementation plan or breakdown of the solution.",
  },
];

const MARKETING_ACTIONS: QuickAction[] = [
  {
    id: "more_persuasive",
    label: "More persuasive",
    instruction:
      "Make the current marketing prompt more persuasive: sharpen the value proposition, add a clear hook, and strengthen the call to action. Keep the audience and channel.",
  },
  {
    id: "shorten",
    label: "Shorter",
    instruction:
      "Shorten the current marketing prompt while keeping the core message, audience, and call to action.",
  },
  {
    id: "casual",
    label: "Casual",
    instruction:
      "Rewrite the current marketing prompt in a casual, friendly, conversational tone while keeping the intent.",
  },
  {
    id: "formal",
    label: "More formal",
    instruction:
      "Rewrite the current marketing prompt in a polished, professional tone while keeping the intent.",
  },
];

const QUICK_ACTIONS: Record<string, QuickAction[]> = {
  "LLM Prompt": LLM_ACTIONS,
  General: LLM_ACTIONS,
  "Image Generation": IMAGE_ACTIONS,
  "Creative Writing": WRITING_ACTIONS,
  "Technical/Code": CODE_ACTIONS,
  Marketing: MARKETING_ACTIONS,
};

/** Returns the quick actions for a mode, falling back to the General set. */
export function getQuickActions(mode: string | null | undefined): QuickAction[] {
  return QUICK_ACTIONS[mode ?? "General"] ?? LLM_ACTIONS;
}

/** Finds a quick action by id within a mode, or null when unknown. */
export function findQuickAction(
  mode: string | null | undefined,
  actionId: string | null | undefined
): QuickAction | null {
  if (!actionId) return null;
  return getQuickActions(mode).find((a) => a.id === actionId) ?? null;
}
