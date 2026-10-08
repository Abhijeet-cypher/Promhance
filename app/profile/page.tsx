import type { Metadata } from "next";
import ProfilePage from "@/components/ProfilePage";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "Manage your Promhance account details, country and newsletter preferences.",
  alternates: {
    canonical: "https://www.promhance.com/profile",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ProfileRoute() {
  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden bg-[#0a0a0a] text-[#f5f5f5] pt-28">
      <div className="fixed inset-0 bg-grid-overlay pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-xl mx-auto px-6 sm:px-10 flex-grow pb-24">
        <ProfilePage />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Promhance Profile",
            url: "https://www.promhance.com/profile",
            description:
              "Manage your Promhance account details, country and newsletter preferences.",
          }),
        }}
      />

      <Footer />
    </main>
  );
}
