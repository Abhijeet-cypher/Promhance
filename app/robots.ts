import { MetadataRoute } from 'next'

// Search engine crawlers — index the site normally.
const SEARCH_BOTS = [
  'Googlebot',
  'Googlebot-Image',
  'Bingbot',
  'DuckDuckBot',
  'Applebot',
  'Slurp',
  'YandexBot',
  'Baiduspider',
  'Naverbot',
];

// AI / LLM crawlers and answer engines — explicitly allowed so Promhance can be
// surfaced in ChatGPT, Claude, Perplexity, Gemini, and other AI products.
const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'Claude-User',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Amazonbot',
  'cohere-ai',
  'Bytespider',
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'YouBot',
  'TavilyBot',
  'Diffbot',
  'ImagesiftBot',
  'AI2Bot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: SEARCH_BOTS,
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: AI_BOTS,
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: 'https://www.promhance.com/sitemap.xml',
  }
}
