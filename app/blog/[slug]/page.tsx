import { getPostBySlug, getAllPosts, BlogPost } from "@/lib/markdown";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Calendar, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import Footer from "@/components/Footer";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);
  
  if (!post) {
    return { title: 'Post Not Found | Promhance' };
  }

  return {
    title: `${post.title} | Promhance Blog`,
    description: post.description,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      images: post.image ? [post.image] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : [],
    }
  };
}

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: post.image ? [post.image] : [],
    datePublished: post.date,
    dateModified: post.date,
    author: [{
      '@type': 'Organization',
      name: post.author,
      url: 'https://promhance.com',
    }],
    publisher: {
      '@type': 'Organization',
      name: 'Promhance',
      logo: {
        '@type': 'ImageObject',
        url: 'https://promhance.com/logo.png',
      },
    },
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden bg-[#0a0a0a] text-[#f5f5f5] pt-28 pb-24 selection:bg-white/20">
      
      {/* Monochrome grid overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <article className="relative z-10 w-[92%] max-w-[1000px] mx-auto">
        
        {/* Back Button */}
        <Link 
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#a1a1a1] hover:text-white transition-colors mb-10 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Blog
        </Link>
        
        {/* Post Header */}
        <header className="mb-10">
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {post.tags.map(tag => (
                <span key={tag} className="text-xs font-semibold px-3 py-1 bg-white/5 border border-white/10 text-[#a1a1a1] rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            {post.title}
          </h1>

          <p className="text-[#a1a1a1] text-base sm:text-lg leading-relaxed mb-6">
            {post.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-[#525252] border-t border-[#2a2a2a] pt-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <time dateTime={post.date}>
                {format(new Date(post.date), 'MMMM d, yyyy')}
              </time>
            </div>
          </div>
        </header>

        {/* Hero Image */}
        {post.image && (
          <div className="relative w-full h-[350px] sm:h-[450px] rounded-2xl overflow-hidden border border-[#2a2a2a] shadow-xl mb-12">
            <img 
              src={post.image} 
              alt={post.title} 
              className="object-cover w-full h-full"
            />
          </div>
        )}

        {/* Markdown Content */}
        <div 
          className="
            prose prose-invert max-w-none
            prose-p:text-[#a1a1a1] prose-p:leading-relaxed prose-p:text-base
            prose-headings:text-white prose-headings:font-bold
            prose-h1:text-3xl prose-h1:mt-12 prose-h1:mb-6
            prose-h2:text-2xl prose-h2:mt-14 prose-h2:mb-5 prose-h2:border-b prose-h2:border-[#2a2a2a] prose-h2:pb-3
            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
            prose-a:text-white prose-a:no-underline hover:prose-a:underline prose-a:opacity-80 hover:prose-a:opacity-100
            prose-strong:text-white
            prose-blockquote:border-l-2 prose-blockquote:border-l-white/20 prose-blockquote:bg-[#111111] prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-xl prose-blockquote:text-[#a1a1a1] prose-blockquote:not-italic prose-blockquote:text-sm prose-blockquote:leading-relaxed prose-blockquote:my-4
            prose-code:text-white prose-code:bg-[#1a1a1a] prose-code:border prose-code:border-[#2a2a2a] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
            prose-img:rounded-2xl prose-img:border prose-img:border-[#2a2a2a] prose-img:shadow-lg prose-img:w-full prose-img:object-cover prose-img:my-8
            prose-hr:border-[#2a2a2a] prose-hr:my-10
            prose-ul:text-[#a1a1a1] prose-ol:text-[#a1a1a1]
            prose-em:text-[#d4d4d4]
          "
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />
        
      </article>
    </main>
    <Footer />
    </>
  );
}
