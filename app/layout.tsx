import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL('https://promhance.com'), // Replace with actual domain later if different
  title: {
    default: "Promhance - AI Prompt Enhancer & Generator",
    template: "%s | Promhance"
  },
  description: "Elevate your raw ideas into masterfully engineered prompts for ChatGPT, Midjourney, Claude, and more using AI.",
  keywords: ["prompt engineering", "ai prompt generator", "chatgpt prompt builder", "midjourney prompt maker", "llm optimization"],
  authors: [{ name: "Promhance" }],
  creator: "Promhance",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://promhance.com",
    title: "Promhance - AI Prompt Enhancer & Generator",
    description: "Elevate your raw ideas into masterfully engineered prompts for ChatGPT, Midjourney, Claude, and more using AI.",
    siteName: "Promhance",
  },
  twitter: {
    card: "summary_large_image",
    title: "Promhance - AI Prompt Enhancer & Generator",
    description: "Transform your rough ideas into powerful, optimized AI prompts.",
    creator: "@promhance",
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
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Promhance",
              "url": "https://www.promhance.com"
            })
          }}
        />
        <CursorSpotlight />
        <Header />
        {children}
      </body>
    </html>
  );
}

