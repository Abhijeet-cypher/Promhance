import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.promhance.com'),
  title: {
    default: "Promhance — Free AI Prompt Enhancer for ChatGPT, Claude & Gemini",
    template: "%s | Promhance"
  },
  description: "Free AI prompt enhancer: turn a rough idea into a structured prompt for ChatGPT, Claude, Gemini and Midjourney. Adds role, context, constraints and format. No account needed.",
  keywords: ["ai prompt enhancer", "prompt improver", "prompt optimizer", "prompt generator", "chatgpt prompt enhancer", "claude prompt improver", "gemini prompt enhancer", "midjourney prompt generator", "prompt engineering tool", "PromptOps"],
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
  authors: [{ name: "Promhance" }],
  creator: "Promhance",
  alternates: {
    canonical: "https://www.promhance.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.promhance.com",
    title: "Promhance — Free AI Prompt Enhancer for ChatGPT, Claude & Gemini",
    description: "Turn a rough idea into a structured prompt for ChatGPT, Claude, Gemini and Midjourney. Free, no account needed.",
    siteName: "Promhance",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "Promhance — Free AI Prompt Enhancer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Promhance — Free AI Prompt Enhancer for ChatGPT, Claude & Gemini",
    description: "Turn a rough idea into a structured prompt for any AI model. Free, no account needed.",
    creator: "@promhance",
    images: ["/og"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import Header from "@/components/Header";
import CursorSpotlight from "@/components/CursorSpotlight";
import { AuthProvider } from "@/components/AuthProvider";
import FeatureAnnouncementModal from "@/components/FeatureAnnouncementModal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <link
          rel="search"
          type="application/opensearchdescription+xml"
          title="Promhance Prompt Search"
          href="/opensearch.xml"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Promhance Blog RSS"
          href="/blog/rss.xml"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-CV5SK9CN9S"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          
            gtag('config', 'G-CV5SK9CN9S');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "@id": "https://www.promhance.com/#organization",
                "name": "Promhance",
                "url": "https://www.promhance.com",
                "foundingDate": "2026",
                "logo": {
                  "@type": "ImageObject",
                  "@id": "https://www.promhance.com/#logo",
                  "url": "https://www.promhance.com/logo.svg"
                },
                "description": "Promhance is a free AI prompt enhancer that turns rough ideas into structured prompts for ChatGPT, Claude, Gemini and Midjourney.",
                "sameAs": ["https://github.com/Abhijeet-cypher/Promhance"]
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": "https://www.promhance.com/#website",
                "name": "Promhance",
                "url": "https://www.promhance.com",
                "inLanguage": "en-US",
                "publisher": { "@id": "https://www.promhance.com/#organization" },
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": "https://www.promhance.com/viral-prompts?q={search_term_string}"
                  },
                  "query-input": "required name=search_term_string"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "Promhance",
                "applicationCategory": "DeveloperApplication",
                "operatingSystem": "Any",
                "url": "https://www.promhance.com",
                "description": "Free AI prompt enhancer that turns rough ideas into structured prompts for ChatGPT, Claude, Gemini and Midjourney.",
                "featureList": [
                  "Prompt enhancement with adjustable intensity",
                  "Modes for general, writing, code, marketing and image prompts",
                  "One-click refinements with version history",
                  "PromAI assistant to test prompts"
                ],
                "inLanguage": "en-US",
                "publisher": { "@id": "https://www.promhance.com/#organization" },
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                }
              }
            ])
          }}
        />
        <CursorSpotlight />
        <AuthProvider>
          <Header />
          {children}
          <FeatureAnnouncementModal />
        </AuthProvider>
      </body>
    </html>
  );
}

