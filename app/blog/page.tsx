import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { getAllPosts } from "@/lib/markdown";
import { Metadata } from "next";
import { Calendar, User, Tag } from "lucide-react";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Blog | Promhance",
  description: "Read the latest tips, guides, and tutorials on AI prompt engineering, ChatGPT, Midjourney, and more.",
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <>
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden bg-zinc-950 text-zinc-50 selection:bg-purple-500/30 pt-32 pb-24">
      {/* Background decorations */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <div className="relative z-10 w-[92%] max-w-[1200px] mx-auto flex flex-col flex-grow">
        
        {/* Header */}
        <div className="mb-16 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Promhance <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Blog</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Master the art of AI communication. Discover prompt engineering tips, tutorials, and strategy guides to supercharge your AI workflows.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link 
              key={post.slug} 
              href={`/blog/${post.slug}`}
              className="group flex flex-col bg-zinc-900/40 rounded-3xl border border-zinc-800/60 overflow-hidden hover:bg-zinc-900/80 hover:border-purple-500/50 transition-all duration-300 shadow-lg"
            >
              {/* Image Header */}
              {post.image && (
                <div className="relative w-full h-48 overflow-hidden bg-zinc-800">
                  <div className="absolute inset-0 bg-zinc-900/20 group-hover:bg-transparent transition-colors z-10" />
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6 flex flex-col flex-grow">
                {/* Meta */}
                <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <time dateTime={post.date}>
                      {format(new Date(post.date), 'MMMM d, yyyy')}
                    </time>
                  </div>
                </div>

                {/* Title & Desc */}
                <h3 className="text-xl font-bold text-zinc-100 mb-3 group-hover:text-purple-400 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
                  {post.description}
                </p>

                {/* Tags Footer */}
                <div className="flex items-center gap-2 flex-wrap mt-auto pt-4 border-t border-zinc-800/60">
                  {post.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {tag}
                    </span>
                  ))}
                  {post.tags && post.tags.length > 3 && (
                     <span className="text-xs font-medium px-2 py-1 text-zinc-500">
                        +{post.tags.length - 3}
                     </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-3xl">
            No blog posts found. Stay tuned for updates!
          </div>
        )}

      </div>
    </main>
    <Footer />
    </>
  );
}
