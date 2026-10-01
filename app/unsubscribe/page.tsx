import type { Metadata } from "next";
import Footer from "@/components/Footer";
import UnsubscribeForm from "@/components/UnsubscribeForm";

export const metadata: Metadata = {
  title: "Unsubscribe from the Promhance newsletter",
  description:
    "Opt out of Promhance newsletter emails at any time. Enter your email to unsubscribe in one click.",
  robots: {
    index: false,
    follow: false,
  },
};

type Props = {
  searchParams: Promise<{ email?: string; token?: string }>;
};

export default async function UnsubscribePage({ searchParams }: Props) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <>
      <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#0a0a0a] pt-28 pb-24 text-[#f5f5f5] selection:bg-white/20">
        <div className="fixed inset-0 bg-grid-overlay pointer-events-none z-0" />

        <div className="relative z-10 mx-auto w-[92%] max-w-lg">
          <header className="mb-10 text-center">
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
              Newsletter
            </span>
            <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Unsubscribe
            </h1>
            <p className="mx-auto max-w-md text-base leading-relaxed text-[#a1a1a1]">
              We&apos;re sorry to see you go. Confirm your email below and
              you&apos;ll stop receiving the Promhance newsletter.
            </p>
          </header>

          <UnsubscribeForm initialEmail={email} token={token} />
        </div>
      </main>
      <Footer />
    </>
  );
}
