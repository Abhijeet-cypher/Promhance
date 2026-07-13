import type { Metadata } from "next";
import Footer from "@/components/Footer";
import ViralPromptsClient from "./ViralPromptsClient";
import { allPrompts, uniqueSections, uniqueTypes } from "@/lib/viral-prompts-data";

/* ─────────────────────────────────────────────────────────────────────────────
   SEO METADATA
───────────────────────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "Viral AI Prompts Collection — 410+ Trending Prompts (2025–2026)",
  description:
    "Browse 410+ hand-curated viral AI prompts for Midjourney, ChatGPT, Suno, Sora, Instagram, TikTok, YouTube & more. Filter by platform, type, and trend era. Free to copy.",
  keywords: [
    "viral ai prompts 2025",
    "viral ai prompts 2026",
    "midjourney viral prompts",
    "chatgpt viral prompts",
    "instagram ai image prompts",
    "tiktok script prompts",
    "suno music prompts",
    "sora video prompts",
    "ai prompt library",
    "trending prompt collection",
    "best ai prompts",
    "free ai prompts",
  ],
  openGraph: {
    title: "Viral AI Prompts Collection — 410+ Trending Prompts | Promhance",
    description:
      "The largest curated collection of viral AI prompts. Image, video, music, scripts & text — spanning every major platform and AI tool.",
    url: "https://promhance.com/viral-prompts",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "410+ Viral AI Prompts — Free Collection | Promhance",
    description:
      "Filter, search & copy trending AI prompts for Midjourney, ChatGPT, Suno, TikTok, Instagram & more.",
  },
  alternates: {
    canonical: "https://promhance.com/viral-prompts",
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   JSON-LD STRUCTURED DATA
   Schemas used:
     1. CollectionPage   — marks this as a curated collection
     2. ItemList         — makes individual prompts parseable by search engines
     3. BreadcrumbList   — breadcrumb for SERP display
───────────────────────────────────────────────────────────────────────────── */
function buildStructuredData(prompts: typeof allPrompts) {
  const baseUrl = "https://promhance.com";

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${baseUrl}/viral-prompts#collection`,
    name: "Viral AI Prompts Collection — Promhance",
    description:
      "410+ hand-curated viral AI prompts spanning image generation, video, music, scripts, and social media content — covering Midjourney, ChatGPT, Suno, Sora, TikTok, Instagram and more.",
    url: `${baseUrl}/viral-prompts`,
    publisher: {
      "@type": "Organization",
      name: "Promhance",
      url: baseUrl,
      sameAs: ["https://github.com/Abhijeet-cypher/Promhance"],
    },
    keywords: [
      "viral prompts",
      "ai prompts 2025",
      "midjourney prompts",
      "chatgpt prompts",
      "suno prompts",
      "tiktok prompts",
      "instagram prompts",
    ].join(", "),
    datePublished: "2026-06-01",
    dateModified: "2026-06-25",
    numberOfItems: prompts.length,
  };

  // ItemList — first 100 prompts (avoid bloat; Google indexes the rest via crawl)
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${baseUrl}/viral-prompts#list`,
    name: "Viral AI Prompts",
    description: "Curated viral prompts for AI image, video, music, and content creation.",
    numberOfItems: prompts.length,
    itemListElement: prompts.slice(0, 100).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "CreativeWork",
        "@id": `${baseUrl}/viral-prompts#prompt-${p.id}`,
        name: p.style ? `${p.style} — ${p.type} Prompt` : `${p.type} Prompt #${p.id}`,
        description: p.prompt_text,
        keywords: [p.type, p.section, p.style, p.trend_year]
          .filter(Boolean)
          .join(", "),
        genre: p.section,
        datePublished: "2026-06-01",
        isPartOf: { "@id": `${baseUrl}/viral-prompts#collection` },
      },
    })),
  };

  // BreadcrumbList
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Viral Prompts Collection",
        item: `${baseUrl}/viral-prompts`,
      },
    ],
  };

  return [collectionPage, itemList, breadcrumb];
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE (Server Component)
───────────────────────────────────────────────────────────────────────────── */
export default function ViralPromptsPage() {
  const structuredData = buildStructuredData(allPrompts);

  return (
    <>
      {/* JSON-LD — injected server-side, invisible to user, read by crawlers */}
      {structuredData.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}

      {/*
        Semantic wrapper — gives crawlers a landmark for this collection.
        The <h1> and <p> below are ALWAYS rendered (server-side, never client-gated)
        so they appear in the raw HTML that Googlebot indexes.
      */}
      <main id="viral-prompts-collection">
        {/* Invisible but crawlable semantic content */}
        <div className="sr-only">
          <h1>Viral AI Prompts Collection — {allPrompts.length}+ Trending Prompts (2025–2026)</h1>
          <p>
            Promhance's curated library of {allPrompts.length} viral AI prompts across{" "}
            {uniqueSections.length} platforms including Midjourney, ChatGPT, Suno, Sora,
            Instagram, TikTok, YouTube, LinkedIn and more. Each prompt is tagged by type (
            {uniqueTypes.join(", ")}) and trend era.
          </p>
          {/* Section index for crawlers */}
          <nav aria-label="Prompt sections">
            <ul>
              {uniqueSections.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </nav>
        </div>

        {/* All interactive UI is client-side */}
        <ViralPromptsClient prompts={allPrompts} />
      </main>

      <Footer />
    </>
  );
}
