import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';


const postsDirectory = path.join(process.cwd(), 'content/blog');

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  description: string;
  author: string;
  tags: string[];
  image?: string;
  content: string;
  faqSchema?: any;
};

export function getPostSlugs() {
  if (!fs.existsSync(postsDirectory)) return [];
  return fs.readdirSync(postsDirectory);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = path.join(postsDirectory, `${realSlug}.md`);

  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);



  return {
    slug: realSlug,
    title: data.title || '',
    date: data.date || '',
    description: data.description || '',
    author: data.author || '',
    tags: data.tags || [],
    image: data.image || '',
    content: content || '',
    faqSchema: data.faqSchema || null,
  };
}

export async function getAllPosts(): Promise<Omit<BlogPost, 'content'>[]> {
  const slugs = getPostSlugs();
  const posts = await Promise.all(
    slugs.map(async (slug) => {
      const post = await getPostBySlug(slug);
      return post;
    })
  );

  // Filter out nulls and map out content for the index list
  const validPosts = posts.filter((post): post is BlogPost => post !== null);
  
  return validPosts
    .map(post => {
      const { content, ...rest } = post;
      return rest;
    })
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
}
