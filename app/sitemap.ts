import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/markdown'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.promhance.com';

  // Get all blog posts
  const posts = await getAllPosts();
  const blogUrls = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date('2026-09-22'),
    },
    {
      url: `${baseUrl}/chatgpt-prompt-enhancer`,
      lastModified: new Date('2026-09-22'),
    },
    {
      url: `${baseUrl}/midjourney-prompt-generator`,
      lastModified: new Date('2026-09-22'),
    },
    {
      url: `${baseUrl}/youtube-prompt-generator`,
      lastModified: new Date('2026-09-22'),
    },
    {
      url: `${baseUrl}/promai`,
      lastModified: new Date('2026-09-22'),
    },
    {
      url: `${baseUrl}/viral-prompts`,
      lastModified: new Date('2026-09-22'),
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date('2026-09-22'),
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-09-17'),
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-09-17'),
    },
    ...blogUrls,
  ];
}
