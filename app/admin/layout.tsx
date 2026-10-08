import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { getAdmin } from "@/lib/admin";

// The allowlist can change between requests and the guard must run per
// request, so never prerender the admin area into static HTML.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const check = await getAdmin();
  if (!check.admin) {
    redirect("/");
  }

  return (
    <main className="relative min-h-screen bg-[#0a0a0a] pb-24 pt-24 text-[#f5f5f5] sm:pt-28">
      <div className="fixed inset-0 bg-grid-overlay pointer-events-none z-0" />
      <div className="relative z-10 mx-auto flex w-[94%] max-w-[1400px] flex-col gap-6 lg:flex-row lg:gap-8">
        <AdminNav email={check.email} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}
