import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { getAllPosts } from "@/lib/markdown";
import { Metadata } from "next";
import { Calendar, Zap } from "lucide-react";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Blog",
  description: "Read the latest tips, guides, and tutorials on AI prompt engineering, ChatGPT, Midjourney, and more.",
  alternates: {
    canonical: "https://www.promhance.com/blog",
  },
  openGraph: {
    title: "Promhance Blog — AI Prompt Engineering Guides",
    description: "Read the latest tips, guides, and tutorials on AI prompt engineering, ChatGPT, Midjourney, and more.",
    url: "https://www.promhance.com/blog",
    type: "website",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "Promhance Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Promhance Blog — AI Prompt Engineering Guides",
    description: "Read the latest tips, guides, and tutorials on AI prompt engineering, ChatGPT, Midjourney, and more.",
    images: ["/og"],
  },
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": "https://www.promhance.com/blog#blog",
    name: "Promhance Blog",
    description: "Tips, guides, and tutorials on AI prompt engineering, ChatGPT, Midjourney, and more.",
    url: "https://www.promhance.com/blog",
    publisher: { "@id": "https://www.promhance.com/#organization" },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      url: `https://www.promhance.com/blog/${post.slug}`,
      author: { "@type": "Organization", name: post.author },
    })),
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(blogLd) }}
    />
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden bg-[#0a0a0a] text-[#f5f5f5] selection:bg-white/20 pt-32 pb-24">
      {/* Monochrome grid overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <div className="relative z-10 w-[92%] max-w-[1200px] mx-auto flex flex-col flex-grow">
        
        {/* Header */}
        <div className="mb-16 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Promhance <span className="text-[#a1a1a1] font-light">Blog</span>
          </h1>
          <p className="text-[#a1a1a1] text-lg max-w-2xl">
            Master the art of AI communication. Discover prompt engineering tips, tutorials, and strategy guides to supercharge your AI workflows.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link 
              key={post.slug} 
              href={`/blog/${post.slug}`}
              className="group flex flex-col bg-[#111111] rounded-3xl border border-[#2a2a2a] overflow-hidden hover:bg-[#1a1a1a] hover:border-[#3a3a3a] transition-all duration-300 shadow-lg no-underline"
            >
              {/* Image Header */}
              {post.image && (
                <div className="relative w-full h-48 overflow-hidden bg-[#1a1a1a]">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-[#0a0a0a]/20 group-hover:bg-transparent transition-colors z-10" />
                </div>
              )}

              {/* Content */}
              <div className="p-6 flex flex-col flex-grow">
                {/* Meta */}
                <div className="flex items-center gap-4 text-xs font-medium text-[#525252] mb-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <time dateTime={post.date}>
                      {post.date && !isNaN(new Date(post.date).getTime()) 
                        ? format(new Date(post.date), 'MMMM d, yyyy') 
                        : (post.date || 'Unknown date')}
                    </time>
                  </div>
                </div>

                {/* Title & Desc */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#f5f5f5] transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-[#a1a1a1] text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
                  {post.description}
                </p>

                {/* Tags Footer */}
                <div className="flex items-center gap-2 flex-wrap mt-auto pt-4 border-t border-[#2a2a2a]">
                  {post.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 text-[#a1a1a1] border border-white/10">
                      {tag}
                    </span>
                  ))}
                  {post.tags && post.tags.length > 3 && (
                     <span className="text-xs font-medium px-2 py-1 text-[#525252]">
                        +{post.tags.length - 3}
                     </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-20 text-[#525252] border border-dashed border-[#2a2a2a] rounded-3xl">
            No blog posts found. Stay tuned for updates!
          </div>
        )}

        {/* ─── CTA Banner ─── */}
        <div className="mt-20 rounded-2xl border border-[#2a2a2a] bg-gradient-to-br from-[#111111] via-[#0f1724] to-[#111111] p-8 sm:p-12 text-center shadow-xl relative overflow-hidden">
          {/* Subtle blue glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_100%,rgba(59,130,246,0.07),transparent)] pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.25)] text-[#60a5fa] mb-5">
              <Zap className="w-3 h-3" />
              Free · No sign-up required
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
              Ready to write better prompts?
            </h2>
            <p className="text-[#a1a1a1] text-base sm:text-lg max-w-xl mx-auto mb-7">
              Put what you&apos;ve learned into practice. Promhance turns any rough idea into a perfectly structured, expert-level prompt — for any AI — in seconds.
            </p>
            <a
              href="https://www.promhance.com/chatgpt-prompt-enhancer"
              className="btn-cta inline-flex items-center gap-2 bg-white text-[#0a0a0a] font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-[#f5f5f5] transition-colors shadow-lg no-underline"
              style={{ textDecoration: 'none' }}
            >
              <Zap className="w-4 h-4" />
              Try Promhance Free →
            </a>
          </div>
        </div>

      </div>
    </main>
    <Footer />
    </>
  );
}
