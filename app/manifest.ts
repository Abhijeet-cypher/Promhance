import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Promhance — AI Prompt Enhancer",
    short_name: "Promhance",
    description:
      "Transform rough ideas into masterfully engineered AI prompts for ChatGPT, Claude, Gemini, Midjourney, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
