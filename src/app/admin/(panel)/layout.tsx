import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session";
import { AdminSidebar } from "@/components/admin/sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { Flash } from "@/components/ui/flash";

export const metadata: Metadata = {
  title: { default: "Yönetim", template: "%s · Kalkan Digital Yönetim" },
  robots: { index: false, follow: false },
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <ToastProvider>
      <div className="min-h-dvh bg-surface">
        <AdminSidebar user={{ name: admin.name, email: admin.email }} />
        <div className="lg:pl-60">
          <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 has-[[data-wide]]:max-w-none">{children}</main>
        </div>
      </div>
      <Suspense fallback={null}>
        <Flash />
      </Suspense>
    </ToastProvider>
  );
}
