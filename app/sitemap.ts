import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/markdown'

// Regenerate the sitemap at most once a day so new/updated posts appear without a redeploy.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.promhance.com';

  // Get all blog posts — use the last-updated date when available for freshness.
  const posts = await getAllPosts();

  // /blog index changes whenever any post is added or updated.
  const latestPostDate = posts.reduce((latest, post) => {
    const d = new Date(post.updated || post.date);
    return !isNaN(d.getTime()) && d > latest ? d : latest;
  }, new Date('2026-09-22'));
  const blogUrls = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated || post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date('2026-09-22'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/chatgpt-prompt-enhancer`,
      lastModified: new Date('2026-09-22'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/midjourney-prompt-generator`,
      lastModified: new Date('2026-09-22'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/youtube-prompt-generator`,
      lastModified: new Date('2026-09-22'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/claude-prompt-improver`,
      lastModified: new Date('2026-09-25'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/gemini-prompt-enhancer`,
      lastModified: new Date('2026-09-25'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/promai`,
      lastModified: new Date('2026-09-22'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/viral-prompts`,
      lastModified: new Date('2026-09-22'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: latestPostDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-09-17'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-09-17'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...blogUrls,
  ];
}
