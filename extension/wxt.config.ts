import { defineConfig } from "wxt";

// Promhance extension config.
//
// `manifest_version` defaults to 3 (Chrome). Firefox builds use MV2/MV3 per
// WXT's defaults and share the same source. API calls go to the hosted
// Promhance app, so both the platforms and the app origin are declared below.
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: ".",
  manifest: {
    name: "Promhance",
    description:
      "Enhance rough prompts into engineered prompts, right inside ChatGPT, Claude, Gemini, Midjourney and Copilot.",
    version: "0.1.0",
    permissions: ["storage"],
    host_permissions: [
      "https://chatgpt.com/*",
      "https://chat.openai.com/*",
      "https://claude.ai/*",
      "https://gemini.google.com/*",
      "https://www.midjourney.com/*",
      "https://www.bing.com/*",
      "https://copilot.microsoft.com/*",
      "https://www.promhance.com/*",
      "http://localhost:3000/*",
      "http://localhost:3001/*",
    ],
    action: {
      default_title: "Promhance settings",
    },
  },
});
