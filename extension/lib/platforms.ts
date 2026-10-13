/**
 * Supported platforms and the DOM specifics needed to inject the widget into
 * each one's prompt input.
 *
 * Each platform can expose multiple `inputs` selectors because sites change
 * markup (and A/B test it). The first selector that resolves wins.
 */

export type PromptMode = "LLM Prompt" | "Image Generation" | "General";

export type PlatformInput = {
  /** CSS selector for the prompt box (textarea or contenteditable). */
  selector: string;
  /** true when the element is a contenteditable rich-text editor. */
  contentEditable?: boolean;
};

export type Platform = {
  id: string;
  name: string;
  /** URL match patterns used by the content script. */
  matches: string[];
  /** Ordered input selectors, best first. */
  inputs: PlatformInput[];
  /** Default Promhance mode for this platform. */
  mode: PromptMode;
};

export const PLATFORMS: Platform[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    matches: ["https://chatgpt.com/*", "https://chat.openai.com/*"],
    inputs: [
      { selector: "#prompt-textarea", contentEditable: true },
      { selector: 'textarea[data-id="root"]' },
      { selector: 'div[contenteditable="true"][id="prompt-textarea"]', contentEditable: true },
    ],
    mode: "LLM Prompt",
  },
  {
    id: "claude",
    name: "Claude",
    matches: ["https://claude.ai/*"],
    inputs: [
      { selector: 'div.ProseMirror[contenteditable="true"]', contentEditable: true },
      { selector: 'div[contenteditable="true"]', contentEditable: true },
    ],
    mode: "LLM Prompt",
  },
  {
    id: "gemini",
    name: "Gemini",
    matches: ["https://gemini.google.com/*"],
    inputs: [
      { selector: "div.ql-editor[contenteditable='true']", contentEditable: true },
      { selector: 'rich-textarea div[contenteditable="true"]', contentEditable: true },
      { selector: 'div[contenteditable="true"]', contentEditable: true },
    ],
    mode: "LLM Prompt",
  },
  {
    id: "midjourney",
    name: "Midjourney",
    matches: ["https://www.midjourney.com/*"],
    inputs: [
      { selector: 'textarea[placeholder*="/imagine" i]' },
      { selector: 'textarea[placeholder*="imagine" i]' },
      { selector: "textarea" },
    ],
    mode: "Image Generation",
  },
  {
    id: "copilot",
    name: "Copilot",
    matches: ["https://copilot.microsoft.com/*", "https://www.bing.com/*"],
    inputs: [
      { selector: "textarea#userInput" },
      { selector: 'textarea[placeholder*="Ask me anything" i]' },
      { selector: 'textarea[placeholder*="message" i]' },
      { selector: 'div[contenteditable="true"]', contentEditable: true },
    ],
    mode: "LLM Prompt",
  },
];

/** Returns the platform whose `matches` include the current page URL. */
export function findPlatformForUrl(url: string): Platform | null {
  for (const platform of PLATFORMS) {
    for (const pattern of platform.matches) {
      if (matchPattern(url, pattern)) return platform;
    }
  }
  return null;
}

/** Minimal glob matcher for `scheme://host/path*` style patterns (subdomains included). */
function matchPattern(url: string, pattern: string): boolean {
  const [patternOrigin, patternPath = "/*"] = splitScheme(pattern);
  const [urlOrigin, urlPath] = splitScheme(url);
  if (!urlOrigin.startsWith(patternOrigin)) return false;

  const pathRegex = new RegExp(
    "^" + patternPath.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"
  );
  return pathRegex.test(urlPath || "/");
}

function splitScheme(value: string): [string, string] {
  const idx = value.indexOf("/", value.indexOf("://") + 3);
  if (idx === -1) return [value, ""];
  return [value.slice(0, idx), value.slice(idx)];
}
